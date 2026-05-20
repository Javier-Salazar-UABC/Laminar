import { X, Code2, Trash2 } from 'lucide-react';
import { FileMetadata } from '../data/mockData';
import { Pill } from './Pill';
import { Button } from './Button';
import { Checkbox } from './ui/checkbox';

interface ContextPanelProps {
  file: FileMetadata;
  onClose: () => void;
  onEdit: () => void;
  onToggleSelection: (fileId: string) => void;
  onOpenInVSCode?: () => void;
  isSelectedForPush?: boolean;
}

export function ContextPanel({ file, onClose, onEdit, onToggleSelection, onOpenInVSCode, isSelectedForPush }: ContextPanelProps) {
  const isChecked = !!isSelectedForPush;
  const isDeleted = file.status === 'deleted';
  const canSync = file.status !== 'uptodate' && file.status !== 'normal' && file.status !== 'deprecated';
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
        style={{
          width: '380px',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-panel)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'var(--font-family-base)'
        }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 p-4 border-b flex items-start justify-between"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)'
          }}
        >
          <h2 style={{ color: 'var(--text-main)' }}>
            Detalles del archivo
          </h2>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-6">
          {/* File name */}
          <div>
            <h1 
              className="mb-2 flex items-center gap-2"
              style={{ 
                fontSize: '24px',
                color: isDeleted ? '#EF4444' : 'var(--text-main)',
                fontWeight: 600,
                textDecoration: isDeleted ? 'line-through' : 'none'
              }}
            >
              {isDeleted && <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />}
              {file.name}
            </h1>
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-family-mono)'
              }}
            >
              {file.path}
            </p>
          </div>
          
          {/* Tags */}
          <div>
            <label 
              className="block mb-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {file.tags.map((tag, idx) => (
                <Pill key={idx}>{tag}</Pill>
              ))}
            </div>
          </div>
          
          {/* Extended description */}
          <div>
            <label 
              className="block mb-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Descripción
            </label>
            <div 
              className="p-3 rounded-[var(--radius-card)] text-sm border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)',
                lineHeight: '1.6'
              }}
            >
              {file.description}
            </div>
          </div>
          
          {/* Edit button */}
          <Button variant="outline" fullWidth onClick={onEdit}>
            Modificar Contexto
          </Button>
          
          {/* Open in VS Code button - oculto para archivos eliminados */}
          {onOpenInVSCode && !isDeleted && (
            <button
              onClick={onOpenInVSCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-card)] hover:bg-[var(--bg-tertiary)] transition-colors"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)'
              }}
            >
              <img src="/assets/VSCodeLogo.png" className="w-4 h-4 object-contain" alt="VS Code" />
              <span>Abrir en VS Code</span>
            </button>
          )}
          
          {/* Metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Autor</span>
              <span style={{ color: 'var(--text-main)' }}>{file.author}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Modificado</span>
              <span style={{ color: 'var(--text-main)' }}>
                {new Date(file.dateModified).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Tamaño</span>
              <span style={{ color: 'var(--text-main)' }}>{file.size}</span>
            </div>
          </div>
        </div>
        
        {/* Footer - Git selection */}
        {canSync && (
          <div 
            className="sticky bottom-0 p-6 border-t transition-colors"
            style={{ 
              backgroundColor: isChecked 
                ? isDeleted ? 'rgba(239,68,68,0.12)' : 'var(--purple-dark)'
                : 'var(--bg-secondary)',
              borderColor: isChecked 
                ? isDeleted ? '#EF4444' : 'var(--violet)'
                : 'var(--border-color)',
              borderWidth: isChecked ? '2px' : '1px'
            }}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleSelection(file.id)}
                className="mt-0.5"
                style={{
                  borderColor: isChecked 
                    ? isDeleted ? '#EF4444' : 'var(--violet)'
                    : 'var(--border-color)',
                  backgroundColor: isChecked 
                    ? isDeleted ? '#EF4444' : 'var(--violet)'
                    : 'transparent'
                }}
              />
              <div className="flex-1">
                <p 
                  className="mb-1"
                  style={{ 
                    color: isDeleted ? '#EF4444' : 'var(--text-main)',
                    fontWeight: 600
                  }}
                >
                  {isDeleted ? 'Confirmar eliminación en GitHub' : 'Seleccionar para enviar a GitHub'}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {isDeleted 
                    ? 'Este archivo será eliminado del repositorio remoto en el próximo commit'
                    : 'Este archivo será incluido en el próximo commit'
                  }
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </>
  );
}