/**
 * Socrates Session Authentication & Student Authorization Helper
 * File: src/lib/socrates/socratesAuth.ts
 *
 * Rules:
 * 1. Checks req.headers Authorization (Bearer <jwt>).
 * 2. Checks req.cookies (class_royale_session).
 * 3. Checks next/headers cookies() (class_royale_session).
 * 4. If token is present:
 *    - Strictly verified via verifySessionToken.
 *    - Invalid/expired -> HTTP 401 { error: "...", code: "INVALID_TOKEN" }.
 *    - User not in DB -> HTTP 401 { error: "...", code: "USER_NOT_FOUND" }.
 * 5. If token is absent:
 *    - If x-test-unauthenticated header is "true" or STRICT_AUTH=true -> HTTP 401 { error: "...", code: "UNAUTHORIZED" }.
 *    - In non-production, falls back to getCurrentUser() ("anurag").
 *    - If no user resolved -> HTTP 401 { error: "...", code: "UNAUTHORIZED" }.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySessionToken, AUTH_COOKIE_NAME, getCurrentUser } from "@/lib/auth";

export interface SocratesUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface SocratesAuthSuccess {
  user: SocratesUser;
  errorResponse?: never;
}

export interface SocratesAuthFailure {
  user?: never;
  errorResponse: NextResponse;
}

export type SocratesAuthResult = SocratesAuthSuccess | SocratesAuthFailure;

export async function getAuthenticatedSocratesUser(req?: NextRequest): Promise<SocratesAuthResult> {
  // 1. Explicit unauthenticated testing flag
  if (req?.headers.get("x-test-unauthenticated") === "true") {
    return {
      errorResponse: NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  // 2. Extract token from Authorization header
  let token: string | undefined;
  const authHeader = req?.headers.get("authorization");
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  // 3. Extract token from NextRequest cookies
  if (!token && req?.cookies) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  }

  // 4. Extract token from next/headers cookies()
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Out of Next.js context
    }
  }

  // 5. If token is provided, strictly verify
  if (token) {
    const payload = verifySessionToken(token);
    if (!payload || !payload.userId) {
      return {
        errorResponse: NextResponse.json(
          { error: "Invalid or expired session token", code: "INVALID_TOKEN" },
          { status: 401 }
        ),
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!dbUser) {
      return {
        errorResponse: NextResponse.json(
          { error: "User account not found", code: "USER_NOT_FOUND" },
          { status: 401 }
        ),
      };
    }

    return { user: dbUser };
  }

  // 6. Strict Auth environment check
  const isStrict =
    process.env.STRICT_AUTH === "true" ||
    process.env.NODE_ENV === "production" ||
    req?.headers.get("x-strict-auth") === "true";

  if (isStrict) {
    return {
      errorResponse: NextResponse.json(
        { error: "Authentication required. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  // 7. Dev seamless fallback
  try {
    const fallbackUser = await getCurrentUser();
    if (fallbackUser) {
      return {
        user: {
          id: fallbackUser.id,
          username: fallbackUser.username,
          email: fallbackUser.email,
          role: fallbackUser.role,
        },
      };
    }
  } catch {}

  // If running in test or script environment where cookies() threw
  if (process.env.NODE_ENV !== "production") {
    try {
      const demoUser = await prisma.user.findFirst({
        where: { username: "anurag" },
        select: { id: true, username: true, email: true, role: true },
      });
      if (demoUser) {
        return { user: demoUser };
      }
    } catch {}
  }

  return {
    errorResponse: NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    ),
  };
}
