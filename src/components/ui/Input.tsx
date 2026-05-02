import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn("input", error && "border-[var(--color-danger)]", className)}
          {...props}
        />
        {hint && !error ? <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p> : null}
        {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn("input", error && "border-[var(--color-danger)]", className)}
          {...props}
        />
        {hint && !error ? <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p> : null}
        {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={inputId}
          className={cn("input bg-white", error && "border-[var(--color-danger)]", className)}
          {...props}
        >
          {children}
        </select>
        {hint && !error ? <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p> : null}
        {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      </div>
    );
  }
);
Select.displayName = "Select";
