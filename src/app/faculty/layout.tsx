import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FacultySidebar } from "@/components/faculty/FacultySidebar";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/faculty/dashboard");
  }

  // Check role authorization
  if (user.role === "STUDENT") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-200">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white">Faculty Access Only</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your university identity is registered as <strong className="text-pink-400">{user.username} (STUDENT)</strong>.
            The Faculty Command Center is restricted to authorized teaching and administrative personnel.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded bg-[#de1659] text-white text-xs font-semibold hover:bg-[#c2134d] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Student Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentUserData = {
    username: user.username,
    name: user.profile?.name || user.username,
    department: user.profile?.department || "Computer Applications",
    facultyId: user.profile?.facultyId || undefined,
    role: user.role,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <FacultySidebar currentUser={currentUserData} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
