/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Faculty Role Authorization Security Helper
 * Target: src/lib/questions/facultyAuthHelper.ts
 *
 * Enforces strict role checks: only FACULTY, ADMIN, or SUPER_ADMIN users can access.
 * Rejects unauthenticated callers with 401 Unauthorized.
 * Rejects students and unauthorized roles with 403 Forbidden.
 * =============================================================================
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const ALLOWED_FACULTY_ROLES = ["FACULTY", "ADMIN", "SUPER_ADMIN"] as const;

export type AuthenticatedFacultyUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export interface AuthSuccess {
  user: AuthenticatedFacultyUser;
  errorResponse?: never;
}

export interface AuthFailure {
  user?: never;
  errorResponse: NextResponse;
}

export type FacultyAuthResult = AuthSuccess | AuthFailure;

/**
 * Validates that the current request has an active session with FACULTY or ADMIN role.
 */
export async function requireFacultyOrAdminUser(): Promise<FacultyAuthResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            error: "Authentication required. Please log in with a valid faculty or administrator account.",
          },
          { status: 401 }
        ),
      };
    }

    if (!ALLOWED_FACULTY_ROLES.includes(user.role as any)) {
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Forbidden: User role '${user.role}' is not authorized to access Faculty Content Management tools.`,
          },
          { status: 403 }
        ),
      };
    }

    return { user };
  } catch (err: any) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Internal authentication error during authorization verification",
        },
        { status: 500 }
      ),
    };
  }
}
