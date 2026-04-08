"use client";

import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-acento bg-acento/20 text-slate-100 hover:bg-acento/30",
  secondary: "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700",
  danger: "border-red-500/40 bg-red-500/20 text-red-100 hover:bg-red-500/30",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-slate-800/60",
};

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  icon,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
