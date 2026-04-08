"use client";

import { Input } from "@/components/atoms/Input";

interface PropertyInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  errorMessage?: string;
}

export function PropertyInput({ label, value, onChange, type = "number", errorMessage }: PropertyInputProps) {
  return <Input label={label} value={value} onChange={onChange} type={type} errorMessage={errorMessage} />;
}
