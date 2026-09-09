import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-mint font-semibold text-abyss hover:brightness-110 active:scale-[0.98]",
        outline: "border border-edge text-fog hover:border-fog/60 hover:text-paper",
        ghost: "text-fog hover:bg-raised hover:text-paper",
        dangerOutline: "border border-danger/40 text-danger hover:bg-danger/10",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "px-3.5 py-1.5",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
