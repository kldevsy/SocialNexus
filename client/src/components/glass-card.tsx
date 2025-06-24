import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export function GlassCard({ children, className, variant = "light" }: GlassCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-lg border rounded-xl",
        variant === "light" 
          ? "bg-white/10 border-white/20" 
          : "bg-gray-800/80 border-gray-600/30",
        className
      )}
    >
      {children}
    </div>
  );
}
