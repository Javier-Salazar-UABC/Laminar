import { useState } from 'react';
import { X, CheckCircle, GitBranch } from 'lucide-react';
import { FileMetadata } from '../data/mockData';
import { Button } from './Button';

interface GitPushModalProps {
  files: FileMetadata[];
  onClose: () => void;
  onConfirm: () => void;
}

export function GitPushModal({ files, onClose, onConfirm }: GitPushModalProps) {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(
    files.map(f => f.id)
  );
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleToggleFile = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };
  
  const handleConfirm = async () => {
    if (!commitMessage.trim() || selectedFileIds.length === 0) return;
    
    setIsLoading(true);
    
    // Simular push
    setTimeout(() => {
      setIsLoading(false);
      onConfirm();
    }, 2000);
  };
  
  const charCount = commitMessage.length;
  const maxChars = 200;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[640px] rounded-[var(--radius-card)] overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            fontFamily: 'var(--font-family-base)',
            maxHeight: '90vh'
          }}
        >
          {/* Top stripe */}
          <div 
            className="h-1 flex-shrink-0"
            style={{ backgroundColor: 'var(--purple-dark)' }}
          />
          
          {/* Header */}
          <div 
            className="p-4 border-b flex items-center justify-between flex-shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <h2 
              className="text-lg"
              style={{ 
                color: 'var(--text-main)',
                fontWeight: 600
              }}
            >
              Confirmar Push a GitHub
            </h2>
            <button
              onClick={onClose}
              className="hover:opacity-70 transition-opacity"
              disabled={isLoading}
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
          
          {/* File list */}
          <div 
            className="p-4 space-y-2 overflow-y-auto flex-1"
            style={{ maxHeight: '320px' }}
          >
            <p 
              className="text-sm mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              Archivos seleccionados ({selectedFileIds.length} de {files.length})
            </p>
            
            {files.map(file => {
              const isSelected = selectedFileIds.includes(file.id);
              
              return (
                <label
                  key={file.id}
                  className="flex items-start gap-3 p-3 rounded-[var(--radius-card)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--green)' : 'var(--border-color)'}`
                  }}
                >
                  <div className="flex items-center h-5">
                    {isSelected ? (
                      <CheckCircle 
                        className="w-5 h-5" 
                        style={{ color: 'var(--green)' }} 
                      />
                    ) : (
                      <div 
                        className="w-5 h-5 rounded border-2"
                        style={{ borderColor: 'var(--border-color)' }}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p 
                      className="truncate mb-0.5 text-sm"
                      style={{ 
                        color: 'var(--text-main)',
                        fontWeight: 600
                      }}
                    >
                      {file.name}
                    </p>
                    <p 
                      className="text-xs truncate"
                      style={{ 
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-family-mono)'
                      }}
                    >
                      {file.path}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleFile(file.id);
                    }}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </label>
              );
            })}
          </div>
          
          {/* Commit message */}
          <div 
            className="p-4 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <label 
              className="block mb-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Mensaje del commit <span style={{ color: 'var(--amber)' }}>*</span>
            </label>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe los cambios que estás enviando..."
              rows={3}
              maxLength={maxChars}
              className="w-full px-3 py-2 rounded-[var(--radius-input)] outline-none resize-none text-sm mb-1"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)'
              }}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--text-disabled)' }}>
                {charCount}/{maxChars} caracteres
              </span>
              {commitMessage.length === 0 && (
                <span style={{ color: 'var(--amber)' }}>
                  Campo obligatorio
                </span>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="p-4 border-t flex items-center justify-between flex-shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <span 
                className="text-sm"
                style={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-family-mono)'
                }}
              >
                main
              </span>
            </div>
            
            <Button
              variant="green"
              onClick={handleConfirm}
              disabled={!commitMessage.trim() || selectedFileIds.length === 0}
              isLoading={isLoading}
            >
              {isLoading ? 'Subiendo...' : 'Confirmar y Subir a GitHub'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
