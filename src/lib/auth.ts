import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "class-royale-secret-key-8bit-retro-game-session-2026";
export const AUTH_COOKIE_NAME = "class_royale_session";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            profile: true,
            teachingClasses: {
              include: { class: true },
            },
            enrolledClasses: {
              include: { class: true },
            },
          },
        });
        if (user) return user;
      }
    }

    // Seamless fallback for local development or demo play if cookie not set
    const demoUser =
      (await prisma.user.findFirst({
        where: { username: "anurag" },
        include: {
          profile: true,
          teachingClasses: { include: { class: true } },
          enrolledClasses: { include: { class: true } },
        },
      })) ||
      (await prisma.user.findFirst({
        include: {
          profile: true,
          teachingClasses: { include: { class: true } },
          enrolledClasses: { include: { class: true } },
        },
      }));

    return demoUser;
  } catch {
    return null;
  }
}

/**
 * Strict role-based authorization helper for API routes
 */
export async function requireUserWithRole(allowedRoles: string[]) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) return null;
  return user;
}

/**
 * Ensures a faculty member can only access classes they teach (or Admins)
 */
export async function checkClassAccess(facultyUserId: string, classId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: facultyUserId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;

  const assignment = await prisma.classFaculty.findFirst({
    where: { classId, facultyId: facultyUserId },
  });
  return !!assignment;
}

/**
 * Ensures a faculty member can only view students enrolled in their classes
 */
export async function checkStudentAccess(facultyUserId: string, studentUserId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: facultyUserId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;

  const sharedClass = await prisma.classMember.findFirst({
    where: {
      studentId: studentUserId,
      class: {
        faculty: {
          some: { facultyId: facultyUserId },
        },
      },
    },
  });
  return !!sharedClass;
}