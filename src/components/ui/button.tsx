"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#0b1a35] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#05152b] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daisy-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#fffad7] via-[#ffd78d] to-[#ffb460] text-[#381c00] shadow-[0_6px_0_#ba752a] hover:-translate-y-0.5",
        outline:
          "border-2 border-white/70 bg-white/20 text-[#0b1230] drop-shadow-[0_6px_0_rgba(5,21,43,0.2)] hover:bg-white/40",
        ghost:
          "border-transparent bg-white/20 text-[#05152b] hover:bg-white/40 hover:-translate-y-0.5",
        lagoon:
          "border-[#08203f] bg-gradient-to-b from-[#7ef2ff] via-[#54cbff] to-[#3292ff] text-[#061330] shadow-[0_6px_0_#1d58a7]",
        meadow:
          "border-[#0a301e] bg-gradient-to-b from-[#c7ffd6] via-[#6fea89] to-[#22c56b] text-[#042a1a] shadow-[0_6px_0_#168a4b]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
