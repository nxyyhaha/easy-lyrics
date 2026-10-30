import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "rounded-lg border border-edge bg-abyss px-3.5 py-2.5 text-sm text-paper placeholder:text-fog/50 transition-colors focus:border-mint focus:outline-none";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClasses, className)} {...props} />;
}

export function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm font-medium", className)}>
      <span className="text-fog">{label}</span>
      {children}
    </label>
  );
}
