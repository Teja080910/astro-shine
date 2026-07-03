'use client';

import React from 'react';

export function CustomModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="stat-card">
      <Icon size={28} color={color} />
      <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto glass-card-solid p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-divider">
            {headers.map(h => <th key={h} className="text-left text-sm text-text-secondary font-medium px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Badge({ variant, children }: { variant: 'success' | 'warning' | 'danger' | 'info'; children: React.ReactNode }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function GradientButton({ children, onClick, variant, disabled, className }: { children: React.ReactNode; onClick?: () => void; variant?: 'gold' | 'danger'; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`gradient-btn ${variant === 'gold' ? 'btn-gold' : ''} ${variant === 'danger' ? 'btn-danger' : ''} ${className || ''}`}
    >
      {children}
    </button>
  );
}
