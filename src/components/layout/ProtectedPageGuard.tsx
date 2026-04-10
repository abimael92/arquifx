"use client";

import { ReactNode } from "react";

import { useRequireAuth } from "@/hooks/useRequireAuth";

interface ProtectedPageGuardProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
}

export function ProtectedPageGuard({
  children,
  loadingFallback = (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">Loading...</main>
  ),
}: ProtectedPageGuardProps) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
