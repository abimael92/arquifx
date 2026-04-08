"use client";

import { useEffect, useRef } from "react";

import { saveProject as saveProjectQuery } from "@/lib/supabase/queries";
import { useAppStore } from "@/store";

interface UseProjectAutoSaveOptions {
  onSaved?: () => void;
  intervalMs?: number;
}

export function useProjectAutoSave({ onSaved, intervalMs = 30000 }: UseProjectAutoSaveOptions = {}) {
  const saveProject = useAppStore((state) => state.saveProject);
  const walls = useAppStore((state) => state.walls);
  const floors = useAppStore((state) => state.floors);
  const openings = useAppStore((state) => state.openings);
  const currentProject = useAppStore((state) => state.currentProject);

  const lastSavedHashRef = useRef<string>("");

  useEffect(() => {
    const tick = async () => {
      const currentHash = JSON.stringify({
        walls,
        floors,
        openings,
        projectId: currentProject?.id ?? null,
        projectName: currentProject?.name ?? null,
      });

      if (currentHash === lastSavedHashRef.current) {
        return;
      }

      try {
        const project = saveProject();
        await saveProjectQuery(project);
        lastSavedHashRef.current = currentHash;
        onSaved?.();
      } catch {
        // No-op: auto-save failures are non-blocking for local editing.
      }
    };

    const timer = window.setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [currentProject?.id, currentProject?.name, floors, intervalMs, onSaved, openings, saveProject, walls]);
}
