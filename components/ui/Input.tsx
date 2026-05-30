import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`h-7 w-full px-2.5 text-sm rounded border transition-colors duration-100
        bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)]
        focus:outline-none focus:ring-1
        ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
            : "border-[var(--border)] focus:border-coral focus:ring-coral/20"
        } ${className}`}
      {...props}
    />
  )
);

Input.displayName = "Input";
