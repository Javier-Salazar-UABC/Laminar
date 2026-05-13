import { X } from 'lucide-react';

interface PillProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'removable';
}

export function Pill({ children, onRemove, variant = 'default' }: PillProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-family-base)'
      }}
    >
      {children}
      {variant === 'removable' && onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label="Eliminar etiqueta"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
