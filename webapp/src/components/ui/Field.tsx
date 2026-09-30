import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const inputClass = 'edit-field-input';

export function Input({ className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
}

export function TextArea({ className, ref, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn(inputClass, 'resize-y', className)} {...props} />;
}

export function Select({ className, ref, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select ref={ref} className={cn(inputClass, className)} {...props} />;
}

export interface FieldProps {
  label: ReactNode;
  /** Render-prop receives the generated id so the control is labelled correctly. */
  children: (id: string) => ReactNode;
  hint?: ReactNode;
  className?: string;
}

/** Label + control pair with proper `htmlFor` wiring. */
export function Field({ label, children, hint, className }: FieldProps) {
  const id = useId();
  return (
    <div className={cn('edit-field-group', className)}>
      <label htmlFor={id} className="edit-field-label">{label}</label>
      {children(id)}
      {hint && <p className="ml-1 text-caption text-label-tertiary">{hint}</p>}
    </div>
  );
}
