import { useState } from 'react';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
