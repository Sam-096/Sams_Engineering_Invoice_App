import type { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from 'react';

type FieldValue = string | number;

interface BaseProps {
  label: string;
  fullWidth?: boolean;
  htmlFor?: string;
  error?: string;
}

interface InputFieldProps extends BaseProps {
  type?: HTMLInputTypeAttribute;
  value: FieldValue;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Single-line labelled input. */
export function Field({ label, type = 'text', value, onChange, placeholder, fullWidth, htmlFor, error }: InputFieldProps) {
  return (
    <FieldShell label={label} fullWidth={fullWidth} htmlFor={htmlFor} error={error}>
      <input
        id={htmlFor}
        type={type}
        className={`sw-input${error ? ' sw-input--error' : ''}`}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FieldShell>
  );
}

interface TextareaFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

/** Multi-line labelled textarea. */
export function TextareaField({ label, value, onChange, rows = 3, placeholder, fullWidth, htmlFor, error }: TextareaFieldProps) {
  return (
    <FieldShell label={label} fullWidth={fullWidth} htmlFor={htmlFor} error={error}>
      <textarea
        id={htmlFor}
        className={`sw-input${error ? ' sw-input--error' : ''}`}
        rows={rows}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FieldShell>
  );
}

interface SelectFieldProps<T extends string> extends BaseProps {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}

/** Labelled select with typed option list. */
export function SelectField<T extends string>({ label, value, onChange, options, fullWidth, htmlFor, error }: SelectFieldProps<T>) {
  return (
    <FieldShell label={label} fullWidth={fullWidth} htmlFor={htmlFor} error={error}>
      <select
        id={htmlFor}
        className={`sw-select${error ? ' sw-input--error' : ''}`}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ShellProps extends BaseProps {
  children: ReactNode;
}

function FieldShell({ label, fullWidth, htmlFor, error, children }: ShellProps) {
  return (
    <div className={`sw-field${fullWidth ? ' sw-col-2' : ''}`}>
      <label className="sw-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <span className="sw-field__error">{error}</span>}
    </div>
  );
}
