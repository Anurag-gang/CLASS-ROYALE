import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, checkClassAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

interface ParsedStudentRow {
  student_id: string;
  name: string;
  email: string;
  program?: string;
  department?: string;
  semester?: string | number;
  section?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action = "preview", classId, records = [], csvText = "", fileName = "students.csv" } = body;

    if (classId) {
      const hasAccess = await checkClassAccess(user.id, classId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to target class" }, { status: 403 });
      }
    }

    // 1. Parse raw CSV text if passed instead of parsed array
    let rawRows: ParsedStudentRow[] = records;
    if (csvText && rawRows.length === 0) {
      const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase().replace(/['"]/g, ""));
        const idIdx = headers.findIndex((h: string) => h.includes("student_id") || h.includes("id") || h.includes("roll"));
        const nameIdx = headers.findIndex((h: string) => h.includes("name"));
        const emailIdx = headers.findIndex((h: string) => h.includes("email"));
        const progIdx = headers.findIndex((h: string) => h.includes("program"));
        const semIdx = headers.findIndex((h: string) => h.includes("semester") || h.includes("sem"));
        const secIdx = headers.findIndex((h: string) => h.includes("section") || h.includes("sec"));

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c: string) => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length >= 3) {
            rawRows.push({
              student_id: cols[idIdx >= 0 ? idIdx : 0] || "",
              name: cols[nameIdx >= 0 ? nameIdx : 1] || "",
              email: cols[emailIdx >= 0 ? emailIdx : 2] || "",
              program: progIdx >= 0 ? cols[progIdx] : "BCA",
              semester: semIdx >= 0 ? cols[semIdx] : 5,
              section: secIdx >= 0 ? cols[secIdx] : "A",
            });
          }
        }
      }
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "No student records detected in submission" }, { status: 400 });
    }

    // 2. Validate records
    const seenIdsInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();

    // Fetch existing students from database to detect duplicates
    const existingUsers = await prisma.user.findMany({
      select: { email: true, username: true, profile: { select: { studentId: true } } },
    });
    const existingEmailsDb = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingStudentIdsDb = new Set(
      existingUsers.map((u) => u.profile?.studentId).filter(Boolean) as string[]
    );

    const validRows: any[] = [];
    const duplicateRows: any[] = [];
    const invalidRows: any[] = [];

    rawRows.forEach((row, index) => {
      const studentId = (row.student_id || "").trim();
      const name = (row.name || "").trim();
      const email = (row.email || "").trim().toLowerCase();
      const program = (row.program || "BCA").trim();
      const semester = Number(row.semester) || 1;
      const section = (row.section || "A").trim().toUpperCase();

      // Check required
      if (!studentId || !name || !email) {
        invalidRows.push({
          rowNumber: index + 1,
          studentId,
          name: name || "[Missing Name]",
          email: email || "[Missing Email]",
          error: "Missing required fields (student_id, name, or email)",
        });
        return;
      }

      // Check email format
      if (!EMAIL_REGEX.test(email)) {
        invalidRows.push({
          rowNumber: index + 1,
          studentId,
          name,
          email,
          error: "Malformed email address format",
        });
        return;
      }

      // Check batch duplicates
      if (seenIdsInBatch.has(studentId)) {
        duplicateRows.push({
          rowNumber: index + 1,
          studentId,
          name,
          email,
          error: `Duplicate student ID '${studentId}' within CSV batch`,
        });
        return;
      }
      if (seenEmailsInBatch.has(email)) {
        duplicateRows.push({
          rowNumber: index + 1,
          studentId,
          name,
          email,
          error: `Duplicate email '${email}' within CSV batch`,
        });
        return;
      }

      // Check database duplicates
      if (existingStudentIdsDb.has(studentId)) {
        duplicateRows.push({
          rowNumber: index + 1,
          studentId,
          name,
          email,
          error: `Student ID '${studentId}' already exists in University records`,
        });
        return;
      }
      if (existingEmailsDb.has(email)) {
        duplicateRows.push({
          rowNumber: index + 1,
          studentId,
          name,
          email,
          error: `Email '${email}' is already registered to another user`,
        });
        return;
      }

      seenIdsInBatch.add(studentId);
      seenEmailsInBatch.add(email);

      validRows.push({
        rowNumber: index + 1,
        studentId,
        name,
        email,
        program,
        semester,
        section,
        username: email.split("@")[0] || studentId,
      });
    });

    // 3. Handle PREVIEW action
    if (action === "preview") {
      return NextResponse.json({
        success: true,
        action: "preview",
        totalCount: rawRows.length,
        validCount: validRows.length,
        duplicateCount: duplicateRows.length,
        invalidCount: invalidRows.length,
        validRows,
        duplicateRows,
        invalidRows,
      });
    }

    // 4. Handle COMMIT action
    if (action === "commit") {
      if (!classId) {
        return NextResponse.json({ error: "Target classId is required to commit import" }, { status: 400 });
      }

      const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
      let importedCount = 0;
      const failureList: any[] = [];

      for (const item of validRows) {
        try {
          const newUser = await prisma.user.create({
            data: {
              username: item.username,
              email: item.email,
              passwordHash: defaultPasswordHash,
              role: "STUDENT",
              profile: {
                create: {
                  name: item.name,
                  studentId: item.studentId,
                  program: item.program,
                  semester: item.semester,
                  section: item.section,
                  level: 1,
                  xp: 100,
                  rank: "Novice Initiate",
                  avatar: "⚔️",
                  title: "Enrolled Scholar",
                },
              },
            },
          });

          await prisma.classMember.create({
            data: {
              classId,
              studentId: newUser.id,
              status: "ACTIVE",
            },
          });

          importedCount++;
        } catch (err: any) {
          failureList.push({ studentId: item.studentId, error: err.message });
        }
      }

      // Record to Import History
      const importLog = await prisma.importHistory.create({
        data: {
          classId,
          facultyId: user.id,
          fileName,
          totalRecords: rawRows.length,
          successfulRecords: importedCount,
          failedRecords: duplicateRows.length + invalidRows.length + failureList.length,
          status: importedCount === rawRows.length ? "COMPLETED" : importedCount > 0 ? "PARTIAL" : "FAILED",
          reportJson: JSON.stringify({
            validCount: validRows.length,
            duplicateCount: duplicateRows.length,
            invalidCount: invalidRows.length,
            duplicateRows,
            invalidRows,
            commitFailures: failureList,
          }),
        },
      });

      // Record Audit Log
      await recordAuditLog({
        actorId: user.id,
        action: "STUDENT_IMPORTED",
        targetType: "Class",
        targetId: classId,
        metadata: {
          importLogId: importLog.id,
          importedCount,
          fileName,
          totalRecords: rawRows.length,
        },
      });

      return NextResponse.json({
        success: true,
        action: "commit",
        message: `Successfully imported and provisioned ${importedCount} students.`,
        importedCount,
        failedCount: duplicateRows.length + invalidRows.length + failureList.length,
        importLog,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Import API error:", error);
    return NextResponse.json({ error: "Failed processing import: " + error.message }, { status: 500 });
  }
}

// GET: List import history logs
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const history = await prisma.importHistory.findMany({
      where: user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? {} : { facultyId: user.id },
      include: {
        class: { select: { name: true, code: true } },
        faculty: { select: { username: true, profile: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
