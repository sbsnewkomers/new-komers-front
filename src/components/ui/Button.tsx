import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "icon" | "sm" | "lg";
};

const variants = {
  default:
    "bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold) text-white nebula-glow hover:nebula-glow-soft transition-transform",
  ghost:
    "bg-linear border border-white/10 hover:bg-white/10 text-white",
  outline:
    "text-primary border-primary! border-[0.2px]! nebula-glow hover:nebula-glow-soft transition-transform",
  destructive:
    "bg-linear-to-r from-(--nebula-gold) to-(--nebula-gold-deep) text-white nebula-glow hover:nebula-glow-soft transition-transform",
};

const sizes = {
  default: "h-10 px-6 py-3.5 rounded-2xl text-[13px] font-semibold",
  sm: "h-9 rounded-xl px-4 text-[12px] font-semibold",
  lg: "h-11 rounded-2xl px-8 text-[13px] font-semibold",
  icon: "h-9 w-9 rounded-xl",
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 shadow-lg whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
      {...props}
    />
  );
}
