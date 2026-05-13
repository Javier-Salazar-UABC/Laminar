import { CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  variant?: 'success' | 'error' | 'info';
}

export function Toast({ message, visible, onClose, variant = 'success' }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);
  
  useEffect(() => {
    if (visible) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);
  
  if (!visible && !isShowing) return null;
  
  const borderColors = {
    success: '#4CAF50',
    error: '#f44336',
    info: 'var(--accent-blue)'
  };
  
  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className="px-4 py-3 rounded-[var(--radius-card)] flex items-center gap-3 min-w-[320px] shadow-lg"
        style={{
          backgroundColor: '#1A1A2E',
          borderLeft: `4px solid ${borderColors[variant]}`,
          fontFamily: 'var(--font-family-base)'
        }}
      >
        <CheckCircle 
          className="w-5 h-5 flex-shrink-0" 
          style={{ color: borderColors[variant] }} 
        />
        <p 
          className="flex-1 text-sm"
          style={{ color: 'var(--text-main)' }}
        >
          {message}
        </p>
        <button
          onClick={() => {
            setIsShowing(false);
            setTimeout(onClose, 300);
          }}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </div>
  );
}
