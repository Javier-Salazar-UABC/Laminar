import { FileMetadata } from '../data/mockData';
import { Pill } from './Pill';
import { FileCode, FileJson, FileText, FileType, CheckCircle2, Edit3, Clock, AlertCircle, Sparkles, Archive } from 'lucide-react';

interface FileCardProps {
  file: FileMetadata;
  onSelect?: (id: string) => void;
  onClick?: () => void;
  onToggleSelection?: (id: string) => void;
  hideBadge?: boolean;
  isSelectedForPush?: boolean;
}

const fileTypeColors: Record<string, string> = {
  js: 'var(--file-js)',
  py: 'var(--file-py)',
  css: 'var(--file-css)',
  json: 'var(--file-json)',
  md: 'var(--file-md)',
  ts: 'var(--file-js)',
  tsx: 'var(--file-js)',
  html: 'var(--amber)'
};

const FileIcon = ({ type }: { type: string }) => {
  const color = fileTypeColors[type] || 'var(--text-secondary)';
  
  const icons = {
    json: FileJson,
    md: FileText,
    default: FileCode
  };
  
  const Icon = icons[type as keyof typeof icons] || icons.default;
  
  return <Icon className="w-8 h-8" style={{ color }} />;
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'modified') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(245, 166, 35, 0.15)',
          border: '1px solid var(--amber)',
          color: 'var(--amber)'
        }}
      >
        <Edit3 className="w-3 h-3" />
        <span>Modificado</span>
      </div>
    );
  }
  
  if (status === 'selected') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(123, 47, 190, 0.15)',
          border: '1px solid var(--violet)',
          color: 'var(--violet)'
        }}
      >
        <CheckCircle2 className="w-3 h-3" />
        <span>Seleccionado</span>
      </div>
    );
  }
  
  if (status === 'uptodate') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(46, 125, 50, 0.15)',
          border: '1px solid var(--green)',
          color: 'var(--green)'
        }}
      >
        <CheckCircle2 className="w-3 h-3" />
        <span>Al día</span>
      </div>
    );
  }
  
  if (status === 'pending') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(245, 166, 35, 0.15)',
          border: '1px solid var(--amber)',
          color: 'var(--amber)'
        }}
      >
        <Clock className="w-3 h-3" />
        <span>Pendiente</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(211, 47, 47, 0.15)',
          border: '1px solid #D32F2F',
          color: '#D32F2F'
        }}
      >
        <AlertCircle className="w-3 h-3" />
        <span>Error</span>
      </div>
    );
  }
  
  if (status === 'new') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(0, 120, 212, 0.15)',
          border: '1px solid var(--accent-blue)',
          color: 'var(--accent-blue)'
        }}
      >
        <Sparkles className="w-3 h-3" />
        <span>Nuevo</span>
      </div>
    );
  }
  
  if (status === 'deprecated') {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{ 
          backgroundColor: 'rgba(90, 90, 90, 0.15)',
          border: '1px solid var(--text-disabled)',
          color: 'var(--text-disabled)'
        }}
      >
        <Archive className="w-3 h-3" />
        <span>Obsoleto</span>
      </div>
    );
  }
  
  return null;
};

export function FileCard({ file, onSelect, onClick, onToggleSelection, hideBadge, isSelectedForPush }: FileCardProps) {
  const isModified = file.status === 'modified';
  const isSelected = !!isSelectedForPush;
  const isError = file.status === 'error';
  const hasStatus = file.status !== 'normal' && !hideBadge;
  
  const canSelect = file.status !== 'uptodate' && !hideBadge;
  
  const borderStyle = isSelected 
    ? `2px solid var(--violet)`
    : isError
    ? `1px solid #D32F2F`
    : isModified 
    ? `1px solid var(--border-color)`
    : `1px solid var(--border-color)`;
  
  const leftBorder = isModified && !isSelected && !isError ? '3px solid var(--amber)' 
    : isError && !isSelected ? '3px solid #D32F2F'
    : 'none';
  
  const backgroundColor = isSelected 
    ? 'rgba(45, 27, 78, 0.5)' 
    : isError
    ? 'rgba(211, 47, 47, 0.05)'
    : 'var(--bg-secondary)';
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection?.(file.id);
  };
  
  return (
    <div
      onClick={onClick}
      className="p-5 cursor-pointer transition-all duration-300 relative group border hover:shadow-premium"
      style={{
        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--glass-border)',
        borderRadius: 'var(--radius-card)',
        backgroundColor: isSelected ? 'var(--accent-blue-glow)' : 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        transform: 'translateY(0)',
        fontFamily: 'var(--font-family-base)'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Checkbox for selection */}
      {canSelect && (
        <div 
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ opacity: isSelected ? 1 : undefined }}
        >
          <div
            onClick={handleCheckboxClick}
            className="w-5 h-5 rounded flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: isSelected ? 'var(--violet)' : 'var(--bg-primary)',
              border: `1.5px solid ${isSelected ? 'var(--violet)' : 'var(--border-color)'}`
            }}
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-3 mb-3">
        <FileIcon type={file.type} />
        <div className="flex-1 min-w-0">
          <h3 
            className="truncate mb-1"
            style={{ 
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            {file.name}
          </h3>
          {hasStatus && (
            <StatusBadge status={file.status} />
          )}
        </div>
      </div>
      
      <p 
        className="text-sm mb-3 line-clamp-3"
        style={{ 
          color: 'var(--text-secondary)',
          lineHeight: '1.4'
        }}
      >
        {file.description}
      </p>
      
      <div className="flex flex-wrap gap-1.5">
        {file.tags.slice(0, 3).map((tag, idx) => (
          <Pill key={idx}>{tag}</Pill>
        ))}
        {file.tags.length > 3 && (
          <Pill>+{file.tags.length - 3}</Pill>
        )}
      </div>
    </div>
  );
}