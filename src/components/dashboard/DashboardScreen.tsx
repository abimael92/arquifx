"use client";

import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ProtectedPageGuard } from "@/components/layout/ProtectedPageGuard";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { useAuth } from "@/hooks/useAuth";
import { deleteProject, listUserProjects } from "@/lib/queries";
import { useAppStore } from "@/store";

interface ProjectRow {
  id: string;
  name: string;
  updated_at: string;
}

export function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const newProject = useAppStore((state) => state.newProject);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectCountLabel = useMemo(() => `${projects.length} ${projects.length === 1 ? "project" : "projects"}`, [projects.length]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const run = async () => {
      setIsBusy(true);
      setError(null);
      try {
        const data = await listUserProjects();
        setProjects(data.map((item) => ({ id: item.id, name: item.name, updated_at: item.updated_at })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load projects");
      } finally {
        setIsBusy(false);
      }
    };

    void run();
  }, [user]);

  return (
    <ProtectedPageGuard>
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#12233f_0%,#0b1220_35%,#070d18_100%)] text-slate-100">
      <MarketingHeader />

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">Your Projects</h1>
            <p className="mt-1 text-sm text-slate-400">{projectCountLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              newProject();
              router.push("/editor");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-100">{error}</div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">{project.name}</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsBusy(true);
                      await deleteProject(project.id);
                      setProjects((prev) => prev.filter((item) => item.id !== project.id));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unable to delete project");
                    } finally {
                      setIsBusy(false);
                    }
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
                  aria-label={`Delete ${project.name}`}
                  disabled={isBusy}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-400">Project ready for editor session</div>
            </article>
          ))}
        </div>

        {!isBusy && projects.length === 0 ? (
          <div className="mt-10 rounded-xl border border-slate-700/80 bg-slate-900/60 p-8 text-center text-sm text-slate-300">
            No projects yet. Create your first one to start designing in ArquiFX.
          </div>
        ) : null}

        {!user ? (
          <div className="mt-8 text-sm text-slate-400">
            Need to authenticate? <Link href="/login" className="text-cyan-300 hover:underline">Login</Link>
          </div>
        ) : null}
      </section>
    </main>
    </ProtectedPageGuard>
  );
}
