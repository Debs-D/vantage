interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "coral" | "success" | "warning" | "error";
  className?: string;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]",
  coral:
    "bg-coral/10 text-coral border border-coral/20",
  success:
    "bg-green-500/10 text-green-600 border border-green-500/20",
  warning:
    "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  error:
    "bg-red-500/10 text-red-500 border border-red-500/20",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-none ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
