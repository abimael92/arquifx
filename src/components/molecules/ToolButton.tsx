"use client";

import { ReactNode } from "react";

import { Button } from "@/components/atoms/Button";

interface ToolButtonProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function ToolButton({ icon, label, active = false, onClick }: ToolButtonProps) {
  return (
    <Button onClick={onClick} variant={active ? "primary" : "ghost"} icon={icon}>
      {label}
    </Button>
  );
}
