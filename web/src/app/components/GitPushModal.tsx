import { useState, useEffect } from 'react';
import { X, CheckCircle, GitBranch } from 'lucide-react';
import { FileMetadata } from '../data/mockData';
import { Button } from './Button';

interface GitPushModalProps {
  files: FileMetadata[];
  projectPath: string;
  onClose: () => void;
  onConfirm: () => void;
}

type SyncStatus = 'idle' | 'started' | 'added' | 'committed' | 'success' | 'error';

export function GitPushModal({ files, projectPath, onClose, onConfirm }: GitPushModalProps) {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(
    files.map(f => f.id)
  );
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const backend = (window as any).backend;
    if (backend && backend.git_sync_progress) {
      const handleProgress = (progressJson: string) => {
        try {
          const data = JSON.parse(progressJson);
          if (data.status === 'started') {
            setSyncStatus('started');
          } else if (data.status === 'added') {
            setSyncStatus('added');
          } else if (data.status === 'committed') {
            setSyncStatus('committed');
          } else if (data.status === 'success') {
            setSyncStatus('success');
            setIsLoading(false);
            setTimeout(() => {
              onConfirm();
            }, 1200);
          } else if (data.status === 'error') {
            setSyncStatus('error');
            setErrorMessage(data.message || 'Error desconocido al sincronizar.');
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Error al procesar JSON de progreso:", e);
        }
      };

      backend.git_sync_progress.connect(handleProgress);
      return () => {
        try {
          backend.git_sync_progress.disconnect(handleProgress);
        } catch (err) {
          // ignore disconnect error if channel was already destroyed
        }
      };
    }
  }, [onConfirm]);

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
    setErrorMessage('');
    setSyncStatus('idle');

    const pywebview = (window as any).pywebview;
    if (pywebview && pywebview.api && pywebview.api.sincronizar_github_python) {
      try {
        await pywebview.api.sincronizar_github_python(projectPath, commitMessage.trim(), selectedFileIds);
      } catch (err: any) {
        setSyncStatus('error');
        setErrorMessage(err.message || 'Error al invocar la sincronización del backend.');
        setIsLoading(false);
      }
    } else {
      // Fallback para testing sin backend
      setSyncStatus('started');
      setTimeout(() => setSyncStatus('added'), 600);
      setTimeout(() => setSyncStatus('committed'), 1200);
      setTimeout(() => {
        setSyncStatus('success');
        setIsLoading(false);
        setTimeout(onConfirm, 1000);
      }, 1800);
    }
  };

  const charCount = commitMessage.length;
  const maxChars = 200;

  const renderProgressSteps = () => {
    if (syncStatus === 'idle') return null;

    const steps = [
      { id: 'added', label: '1. Agregando archivos a Git (git add)', checked: syncStatus !== 'started' && syncStatus !== 'error' },
      { id: 'committed', label: '2. Confirmando cambios localmente (git commit)', checked: ['committed', 'success'].includes(syncStatus) },
      { id: 'push', label: '3. Transfiriendo a repositorio remoto (git push)', checked: syncStatus === 'success' }
    ];

    return (
      <div className="p-4 bg-[var(--bg-secondary)] border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
          Progreso de la Sincronización:
        </p>
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const isActive = (idx === 0 && syncStatus === 'started') ||
                             (idx === 1 && syncStatus === 'added') ||
                             (idx === 2 && syncStatus === 'committed');
            return (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {step.checked ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : isActive ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border" style={{ borderColor: 'var(--border-color)' }} />
                )}
                <span style={{ 
                  color: step.checked ? 'var(--text-main)' : isActive ? 'var(--accent-blue)' : 'var(--text-disabled)',
                  fontWeight: isActive ? 600 : 400
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
              Confirmar Sincronización con GitHub
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
            style={{ maxHeight: '240px' }}
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
                  className="flex items-start gap-3 p-3 rounded-[var(--radius-card)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors animate-fade-in"
                  style={{
                    backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.05)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--green)' : 'var(--border-color)'}`
                  }}
                >
                  <div className="flex items-center h-5">
                    {isSelected ? (
                      <CheckCircle 
                        className="w-5 h-5 animate-scale-in" 
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
                    disabled={isLoading}
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

          {/* Error Message */}
          {syncStatus === 'error' && (
            <div className="px-4 pb-2 flex-shrink-0">
              <div 
                className="p-3 rounded-[var(--radius-input)] text-xs border"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#f87171'
                }}
              >
                <strong className="block mb-1">Error de sincronización:</strong>
                <div className="max-h-24 overflow-y-auto font-mono text-[10px] whitespace-pre-wrap">
                  {errorMessage}
                </div>
              </div>
            </div>
          )}

          {/* Progress Section */}
          {renderProgressSteps()}
          
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
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="green"
                onClick={handleConfirm}
                disabled={!commitMessage.trim() || selectedFileIds.length === 0 || isLoading}
                isLoading={isLoading}
              >
                {isLoading ? 'Sincronizando...' : 'Sincronizar ahora'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
