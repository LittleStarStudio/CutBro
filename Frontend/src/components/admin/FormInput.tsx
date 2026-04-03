import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export default function FormInput({
  label,
  required = false,
  error,
  helperText,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <div>
      <label
        htmlFor={props.id || props.name}
        className="block text-sm font-medium text-white mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {helperText && !error && (
        <p className="text-xs text-[#B8B8B8] mb-2">{helperText}</p>
      )}
      <input
        className={`w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder:text-[#B8B8B8] focus:outline-none focus:border-[#D4AF37] transition-colors ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}