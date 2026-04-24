import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  className,
  value,
  onValueChange,
  children,
  placeholder,
  options,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options?: SelectOption[];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  // Handle both traditional children and options prop
  const renderOptions = () => {
    if (options) {
      return options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ));
    }
    return children;
  };

  return (
    <div className="relative">
      <select
        ref={selectRef}
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`
          flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm
          text-slate-900 placeholder:text-slate-500 shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:border-slate-300 transition-all duration-200 ease-in-out
          appearance-none cursor-pointer
          disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50
          ${className || ""}
        `}
        {...props}
      >
        {placeholder != null && (
          <option value="" disabled className="text-slate-500">
            {placeholder}
          </option>
        )}
        {renderOptions()}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </div>

      {/* Focus ring effect */}
      <div
        className={`
          absolute inset-0 rounded-lg pointer-events-none
          ${isOpen ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
      />
    </div>
  );
}

// Export the original interface for backward compatibility
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options?: SelectOption[];
}