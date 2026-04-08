import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "icon" | "sm" | "lg";
};

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  ghost: "hover:bg-slate-100 hover:text-slate-900",
  outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-lg px-3 text-xs",
  lg: "h-11 rounded-lg px-8",
  icon: "h-10 w-10",
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
      {...props}
    />
  );
}
