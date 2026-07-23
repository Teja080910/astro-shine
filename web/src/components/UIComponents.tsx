'use client';

import React from 'react';
import { Users, Star, DollarSign, Phone, MessageSquare, AlertTriangle, Bell, Settings, Key, Link2, Globe, FileText, Newspaper, LayoutDashboard, Receipt, ArrowDownUp, Percent, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const iconMap: Record<string, any> = {
  Users, Star, DollarSign, Phone, MessageSquare, AlertTriangle, Bell, Settings, Key, Link2, Globe, FileText, Newspaper, LayoutDashboard, Receipt, ArrowDownUp, Percent,
};

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

export function StatCard({ label, value, iconName, color }: { label: string; value: string; iconName: string; color: string }) {
  const Icon = iconMap[iconName];
  if (!Icon) return null;
  return (
    <div className="stat-card">
      <Icon size={28} color={color} />
      <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

export function Table({ headers, children, emptyMessage, sortIndex, sortDir, onSort }: { headers: string[]; children: React.ReactNode; emptyMessage?: string; sortIndex?: number; sortDir?: 'asc' | 'desc'; onSort?: (index: number) => void }) {
  const hasRows = React.Children.toArray(children).filter(Boolean).length > 0;
  return (
    <div className="overflow-x-auto glass-card-solid p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-divider">
            {headers.map((h, i) => (
              <th key={h} className={`text-left text-sm font-medium px-4 py-3 ${onSort ? 'cursor-pointer select-none hover:text-text-primary transition-colors' : ''} ${sortIndex === i ? 'text-text-primary' : 'text-text-secondary'}`} onClick={() => onSort?.(i)}>
                <span className="inline-flex items-center gap-1">
                  {h}
                  {onSort && sortIndex === i && (
                    <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? children : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-text-muted text-sm font-medium">
                {emptyMessage || 'No records found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ variant, children }: { variant: 'success' | 'warning' | 'danger' | 'info'; children: React.ReactNode }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function GradientButton({ children, onClick, variant, disabled, className }: { children: React.ReactNode; onClick?: () => void; variant?: 'gold' | 'danger'; disabled?: boolean; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`gradient-btn ${variant === 'gold' ? 'btn-gold' : ''} ${variant === 'danger' ? 'btn-danger' : ''} ${className || ''}`}>
      {children}
    </button>
  );
}

export function DatePicker({ value, onChange, placeholder = 'Select Date' }: { value: string; onChange: (date: string) => void; placeholder?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [year, setYear] = React.useState(isNaN(initial.getTime()) ? today.getFullYear() : initial.getFullYear());
  const [month, setMonth] = React.useState(isNaN(initial.getTime()) ? today.getMonth() : initial.getMonth());
  const [day, setDay] = React.useState(isNaN(initial.getTime()) ? today.getDate() : initial.getDate());
  const [view, setView] = React.useState<'calendar' | 'years'>('calendar');

  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setYear(d.getFullYear());
        setMonth(d.getMonth());
        setDay(d.getDate());
      }
    }
  }, [value]);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const yearsList = React.useMemo(() => {
    const arr = [];
    for (let y = today.getFullYear(); y >= 1950; y--) arr.push(y);
    return arr;
  }, []);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleConfirm = () => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const displayDate = React.useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const dDay = String(d.getDate()).padStart(2, '0');
    return `${dDay}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
  }, [value]);

  return (
    <>
      <div 
        onClick={() => {
          setView('calendar');
          setIsOpen(true);
        }} 
        className="input-field text-sm w-full pr-10 flex items-center justify-between cursor-pointer select-none h-11"
      >
        <span className={displayDate ? 'text-text-primary' : 'text-text-muted'}>
          {displayDate || placeholder}
        </span>
        <Calendar size={16} className="text-text-secondary" />
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content max-w-sm w-full p-5 bg-surface border border-card-border rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#D97706] dark:text-[#F59E0B] text-center mb-3">Select Date of Birth</h2>

            {view === 'years' ? (
              <>
                <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  <div className="flex flex-wrap gap-2 justify-center py-2">
                    {yearsList.map(y => (
                      <button
                        key={y}
                        onClick={() => {
                          setYear(y);
                          setView('calendar');
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          y === year 
                            ? 'bg-primary text-white border-primary-light' 
                            : 'bg-surface-light text-text-primary border-card-border hover:bg-surface-light/80'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setView('calendar')} 
                  className="mt-3 mx-auto block text-xs font-bold text-primary-light hover:underline"
                >
                  Back to Calendar
                </button>
              </>
            ) : (
              <>
                <div className="p-3 bg-surface-light rounded-xl text-center mb-4">
                  <span className="text-sm font-bold text-text-primary">
                    {day} {MONTHS[month]} {year}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-surface-light rounded-lg transition-colors">
                    <ChevronLeft size={20} className="text-text-primary" />
                  </button>
                  <button onClick={() => setView('years')} className="text-sm font-bold text-text-primary hover:text-primary-light transition-colors">
                    {MONTHS[month]} {year}
                  </button>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-surface-light rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-text-primary" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_SHORT.map(d => (
                    <span key={d} className="text-xs font-semibold text-text-muted py-1">{d}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center max-h-52 overflow-y-auto scrollbar-thin">
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}
                  {days.map(d => {
                    const isSelected = d === day;
                    return (
                      <button
                        key={d}
                        onClick={() => setDay(d)}
                        className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                          isSelected 
                            ? 'bg-primary text-white font-bold' 
                            : 'text-text-primary hover:bg-surface-light'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-3 border-t border-divider">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="py-2 border border-card-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="py-2 bg-[#D97706] dark:bg-[#F59E0B] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-orange-950/20"
                  >
                    Select Date
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function TimePicker({ value, onChange, placeholder = 'Select Time' }: { value: string; onChange: (time: string) => void; placeholder?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const parsedTime = React.useMemo(() => {
    if (!value) return { hour24: 9, minute: 0 };
    const parts = value.split(':');
    const h24 = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return { hour24: h24, minute: m };
  }, [value]);

  const [selectedHour24, setSelectedHour24] = React.useState(parsedTime.hour24);
  const [selectedMin, setSelectedMin] = React.useState(parsedTime.minute);

  React.useEffect(() => {
    if (value) {
      const parts = value.split(':');
      const h24 = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      setSelectedHour24(h24);
      setSelectedMin(m);
    }
  }, [value]);

  const hoursList = React.useMemo(() => {
    const list = [];
    for (let h = 0; h < 24; h++) {
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h >= 12 ? 'PM' : 'AM';
      list.push({ value: h, label: `${displayH} ${period}` });
    }
    return list;
  }, []);

  const minutesList = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i);
  }, []);

  const handleConfirm = () => {
    const formatted = `${String(selectedHour24).padStart(2, '0')}:${String(selectedMin).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const displayTime = React.useMemo(() => {
    if (!value) return '';
    const parts = value.split(':');
    const h24 = parseInt(parts[0]);
    const m = parts[1] || '00';
    if (isNaN(h24)) return '';
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m} ${period}`;
  }, [value]);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)} 
        className="input-field text-sm w-full pr-10 flex items-center justify-between cursor-pointer select-none h-11"
      >
        <span className={displayTime ? 'text-text-primary' : 'text-text-muted'}>
          {displayTime || placeholder}
        </span>
        <Clock size={16} className="text-text-secondary" />
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="modal-content max-w-[320px] w-full p-5 bg-surface border border-card-border rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-text-primary text-center mb-3">Select Time</h2>
            
            <div className="flex items-center h-48 mb-4">
              {/* Hour Column */}
              <div className="flex-1 flex flex-col h-full">
                <span className="text-[10px] text-text-muted text-center font-semibold mb-1">Hour</span>
                <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                  {hoursList.map(h => {
                    const isSelected = selectedHour24 === h.value;
                    return (
                      <button
                        key={h.value}
                        onClick={() => setSelectedHour24(h.value)}
                        className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected 
                            ? 'bg-primary/20 text-primary-light border border-primary/40' 
                            : 'text-text-primary hover:bg-surface-light/40'
                        }`}
                      >
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="px-2 self-center pt-4">
                <span className="text-text-primary text-lg font-bold">:</span>
              </div>

              {/* Minute Column */}
              <div className="flex-1 flex flex-col h-full">
                <span className="text-[10px] text-text-muted text-center font-semibold mb-1">Min</span>
                <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                  {minutesList.map(m => {
                    const isSelected = selectedMin === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setSelectedMin(m)}
                        className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected 
                            ? 'bg-primary/20 text-primary-light border border-primary/40' 
                            : 'text-text-primary hover:bg-surface-light/40'
                        }`}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-3 border-t border-divider">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 border border-card-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-purple-950/20"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
