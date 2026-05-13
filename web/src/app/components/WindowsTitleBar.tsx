import { Minus, Square, X } from 'lucide-react';

export function WindowsTitleBar() {
  const handleMinimize = () => {
    if ((window as any).pywebview) (window as any).pywebview.api.minimize_window();
  };
  
  const handleMaximize = () => {
    if ((window as any).pywebview) {
      (window as any).pywebview.api.maximize_window();
    }
  };

  const handleClose = () => {
    if ((window as any).pywebview) (window as any).pywebview.api.close_window();
  };

  return (
    <div 
      className="pywebview-drag-region h-10 flex items-center justify-between px-4 select-none border-b"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 overflow-hidden">
          <img src="/assets/logo.png" className="w-full h-full object-contain" alt="Laminar Logo" />
        </div>
        <span 
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-main)', opacity: 0.6 }}
        >
          Laminar
        </span>
      </div>
      
      {/* We add "no-drag" to buttons so you can actually click them without dragging the window */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={handleMinimize}
          className="h-8 w-11 hover:bg-white/10 flex items-center justify-center transition-colors"
          aria-label="Minimizar"
        >
          <Minus className="w-3 h-3" style={{ color: 'var(--text-main)' }} />
        </button>
        <button 
          onClick={handleMaximize}
          className="h-8 w-11 hover:bg-white/10 flex items-center justify-center transition-colors"
          aria-label="Maximizar"
        >
          <Square className="w-3 h-3" style={{ color: 'var(--text-main)' }} />
        </button>
        <button 
          onClick={handleClose}
          className="h-8 w-11 hover:bg-red-600 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-main)' }} />
        </button>
      </div>
    </div>
  );
}
