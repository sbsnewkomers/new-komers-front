import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        type={type}
        ref={ref}
        className={
          "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-(--nebula-muted) " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light) " +
          (className ?? "")
        }
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
