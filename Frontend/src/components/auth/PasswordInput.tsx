import { forwardRef, type InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div>
        <label className="text-sm text-neutral-300 font-medium">
          {label}
        </label>
        <div className="relative mt-2">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`
              w-full pl-10 pr-12 py-3 rounded-xl bg-neutral-950 border text-white 
              placeholder:text-neutral-600
              focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 
              transition-colors
              ${error ? "border-red-500" : "border-neutral-800"}
            `}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
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

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;