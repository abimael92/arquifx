"use client";

interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number" | "email" | "password";
  errorMessage?: string;
}

export function Input({ label, value, onChange, type = "text", errorMessage }: InputProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border bg-slate-900/40 px-3 py-2 text-slate-100 outline-none transition-colors ${
          errorMessage ? "border-red-500" : "border-panelBorde focus:border-acento"
        }`}
      />
      {errorMessage ? <span className="mt-1 block text-xs text-red-400">{errorMessage}</span> : null}
    </label>
  );
}
