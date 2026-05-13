import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'blue' | 'green' | 'outline' | 'gray';
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  variant = 'blue', 
  children, 
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = `
    px-6 py-3 rounded-[var(--radius-card)] font-medium transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
  `;
  
  const variants = {
    blue: `bg-[var(--accent-blue)] hover:bg-[#006ac1] text-white`,
    green: `bg-[var(--green)] hover:bg-[#256028] text-white`,
    outline: `border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]`,
    gray: `bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]`
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      style={{ 
        color: variant === 'outline' || variant === 'gray' ? 'var(--text-main)' : undefined,
        fontFamily: 'var(--font-family-base)'
      }}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
