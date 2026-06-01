import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`h-7 px-2 text-sm rounded border transition-colors duration-100 cursor-pointer appearance-none
        bg-[var(--surface)] text-[var(--text)]
        focus:outline-none focus:ring-1
        ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
            : "border-[var(--border)] focus:border-coral focus:ring-coral/20"
        } ${className}`}
      style={{
        paddingRight: "28px",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = "Select";
