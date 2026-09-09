import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs",
  {
    variants: {
      variant: {
        accent: "border-mint/50 bg-mint/10 text-mint",
        muted: "border-edge bg-raised text-fog",
        plain: "border-edge bg-raised text-paper",
        danger: "border-danger/40 bg-danger/10 text-danger",
      },
    },
    defaultVariants: { variant: "muted" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-xl border border-edge bg-panel", className)}
      {...props}
    />
  );
}
