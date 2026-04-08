"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store";

export function GlobalShortcuts() {
  const undo = useAppStore((state) => state.undo);
  const redo = useAppStore((state) => state.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mainMod = isMac ? event.metaKey : event.ctrlKey;

      if (!mainMod || event.key.toLowerCase() !== "z") {
        return;
      }

      event.preventDefault();
      if (event.shiftKey) {
        redo();
        return;
      }

      undo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  return null;
}
