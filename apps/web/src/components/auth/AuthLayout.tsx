import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import '../../styles/auth.css';

type AuthLayoutProps = {
  title: string;
  lead: string;
  children: ReactNode;
};

export function AuthLayout({ title, lead, children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link to="/" className="auth-brand" aria-label="Bandie home">
          <span className="auth-brand-mark">B</span>
          <span>Bandie</span>
        </Link>
        <h1>{title}</h1>
        <p className="auth-lead">{lead}</p>
        {children}
      </div>
    </div>
  );
}

export function AuthMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return <div className={`auth-message auth-message-${tone}`}>{children}</div>;
}
