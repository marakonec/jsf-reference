import { useId, type ReactNode } from 'react';

export interface FieldControl {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: true;
}

// Підпис пов'язано з полем через for і id, підказку й текст помилки через
// aria-describedby, а поле з помилкою позначено aria-invalid (WCAG 2.2, 1.3.1,
// 3.3.1 і 4.1.2). Атрибути з control розгортаються на самому елементі поля.
export function FormField({ label, hint, error, children }: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: (control: FieldControl) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const control: FieldControl = {
    id,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(error ? { 'aria-invalid': true as const } : {}),
  };
  return (
    <p>
      <label htmlFor={id}>{label}</label> {children(control)}
      {hint && <small id={hintId}> {hint}</small>}
      {error && <strong id={errorId}> {error}</strong>}
    </p>
  );
}
