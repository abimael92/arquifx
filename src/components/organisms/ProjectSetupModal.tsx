"use client";

import { useState } from "react";

import { useAppStore } from "@/store";

export function ProjectSetupModal() {
  const initializeProjectSetup = useAppStore((state) => state.initializeProjectSetup);
  const projectSettings = useAppStore((state) => state.projectSettings);

  const [name, setName] = useState(projectSettings.name || "");
  const [terrainWidth, setTerrainWidth] = useState(projectSettings.terrainWidth || 20);
  const [terrainLength, setTerrainLength] = useState(projectSettings.terrainLength || 20);
  const [address, setAddress] = useState(projectSettings.address || "");
  const [landValue, setLandValue] = useState<number | "">(projectSettings.landValue ?? "");
  const [maxHeight, setMaxHeight] = useState(9);
  const [maxFloors, setMaxFloors] = useState(3);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[linear-gradient(180deg,#0f1a2e_0%,#0b1424_100%)] p-6 shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200/80">Inicio del proyecto</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-100">Configura tu terreno antes de construir</h2>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedName = name.trim();
            if (!trimmedName) {
              return;
            }

            initializeProjectSetup({
              name: trimmedName,
              terrainWidth: Math.max(4, terrainWidth),
              terrainLength: Math.max(4, terrainLength),
              address: address.trim() || "",
              landValue: typeof landValue === "number" ? Math.max(0, landValue) : undefined,
              maxHeight: Math.max(3, maxHeight),
              maxFloors: Math.max(1, Math.floor(maxFloors)),
            });
          }}
        >
          <label className="grid gap-1.5 text-sm text-slate-300">
            Nombre del proyecto
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Casa familiar en parcela"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-300">
              Ancho del terreno (m)
              <input
                type="number"
                min={4}
                step={1}
                value={terrainWidth}
                onChange={(event) => setTerrainWidth(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm text-slate-300">
              Largo del terreno (m)
              <input
                type="number"
                min={4}
                step={1}
                value={terrainLength}
                onChange={(event) => setTerrainLength(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-300">
              Dirección <span className="text-xs text-slate-500">Opcional</span>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Av. Siempre Viva 123"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
              />
            </label>

            <label className="grid gap-1.5 text-sm text-slate-300">
              Valor del terreno <span className="text-xs text-slate-500">Opcional</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={landValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setLandValue(value === "" ? "" : Number(value));
                }}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-300">
              Altura máxima (m) <span className="text-xs text-slate-500">Opcional</span>
              <input
                type="number"
                min={3}
                step={0.5}
                value={maxHeight}
                onChange={(event) => setMaxHeight(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
              />
            </label>

            <label className="grid gap-1.5 text-sm text-slate-300">
              Máx. plantas <span className="text-xs text-slate-500">Opcional</span>
              <input
                type="number"
                min={1}
                step={1}
                value={maxFloors}
                onChange={(event) => setMaxFloors(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400/80"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
          >
            Entrar al editor
          </button>
        </form>
      </div>
    </div>
  );
}
