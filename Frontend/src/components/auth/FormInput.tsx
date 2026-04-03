import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, error, className = "", ...props }, ref) => {
    return (
      <div>
        <label className="text-sm text-neutral-300 font-medium">
          {label}
        </label>
        <div className="relative mt-2">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            ref={ref}
            className={`
              w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border text-white 
              placeholder:text-neutral-600 
              focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 
              transition-colors
              ${error ? "border-red-500" : "border-neutral-800"}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;