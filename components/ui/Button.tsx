import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-coral text-white border border-transparent hover:bg-coral-light",
  ghost:
    "border border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]",
  outline:
    "border border-[var(--border)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]",
  danger:
    "border border-transparent text-red-500 hover:bg-red-500/10",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-6 px-2 text-xs gap-1",
  md: "h-7 px-2.5 text-sm gap-1.5",
  lg: "h-8 px-3 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "outline", size = "md", className = "", children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded font-medium transition-colors duration-100 select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";
