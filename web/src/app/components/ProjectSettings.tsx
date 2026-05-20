import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Settings, GitBranch, ExternalLink, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ProjectSettingsProps {
  projectPath: string | null;
  isRepo: boolean;
  onClose: () => void;
  onRepoChanged: (isRepo: boolean) => void;
}

export function ProjectSettings({ projectPath, isRepo, onClose, onRepoChanged }: ProjectSettingsProps) {
  const [hasGit, setHasGit] = useState(isRepo);
  const [hasGitHub, setHasGitHub] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const projectName = projectPath ? projectPath.split('/').pop() : 'Sin proyecto';

  useEffect(() => {
    const fetchRemote = async () => {
      if (!projectPath) return;
      const backend = (window as any).backend;
      if (backend && backend.git_get_remote) {
        setIsLoading(true);
        try {
          const url = await backend.git_get_remote(projectPath);
          if (url) {
            setGithubUrl(url);
            setHasGitHub(true);
          }
        } catch (e) {
          console.error("Error al obtener la URL remota:", e);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRemote();
  }, [projectPath]);

  const handleGitInit = async () => {
    if (!projectPath) return;
    const backend = (window as any).backend;
    if (backend && backend.git_init) {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const success = await backend.git_init(projectPath);
        if (success) {
          setHasGit(true);
          onRepoChanged(true);
        } else {
          setErrorMessage('No se pudo inicializar el repositorio Git.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al ejecutar git init.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setHasGit(true);
    }
  };

  const handleLinkGitHub = async () => {
    if (!githubUrl.trim() || !projectPath) return;
    const backend = (window as any).backend;
    if (backend && backend.git_set_remote) {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const success = await backend.git_set_remote(projectPath, githubUrl.trim());
        if (success) {
          setHasGitHub(true);
        } else {
          setErrorMessage('No se pudo vincular la URL del repositorio remoto.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al guardar el remoto.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setHasGitHub(true);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--modal-bg)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            <h2 
              style={{ 
                color: 'var(--text-main)',
                fontSize: '18px',
                fontWeight: 600
              }}
            >
              Configuración del Proyecto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[var(--radius-card)] flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div>
            <h3 
              className="mb-3"
              style={{ 
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              INFORMACIÓN DEL PROYECTO
            </h3>
            <div 
              className="p-4 rounded-[var(--radius-card)]"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nombre
                  </p>
                  <p style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                    {projectName}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Ruta
                  </p>
                  <p 
                    className="text-sm truncate"
                    style={{ 
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-family-mono)'
                    }}
                    title={projectPath || ''}
                  >
                    {projectPath || 'No definido'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Git Configuration */}
          <div>
            <h3 
              className="mb-3"
              style={{ 
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              CONTROL DE VERSIONES
            </h3>
            
            {errorMessage && (
              <div 
                className="p-3 mb-4 rounded-[var(--radius-input)] text-xs border"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#f87171'
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Estado: Sin Git */}
            {!hasGit && (
              <div
                className="p-4 border-2 border-dashed rounded-[var(--radius-card)]"
                style={{ borderColor: 'var(--amber)' }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
                  <div className="flex-1">
                    <p className="mb-1" style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      No se detectó un repositorio Git
                    </p>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Esta carpeta no está vinculada a un repositorio Git. Inicializa uno para habilitar la función de sincronización.
                    </p>
                    <Button variant="outline" onClick={handleGitInit} disabled={isLoading}>
                      <GitBranch className="w-4 h-4" />
                      {isLoading ? 'Inicializando...' : 'Inicializar Git (git init)'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Estado: Sin GitHub */}
            {hasGit && !hasGitHub && (
              <div
                className="p-4 rounded-[var(--radius-card)] border"
                style={{ 
                  borderColor: 'var(--accent-blue)',
                  backgroundColor: 'var(--bg-secondary)'
                }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
                  <div className="flex-1">
                    <p className="mb-1" style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      Repositorio Git inicializado
                    </p>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Vincula tu repositorio a GitHub para sincronizar tus cambios.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://github.com/usuario/repositorio.git"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-[var(--radius-input)] outline-none text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-family-mono)'
                        }}
                        disabled={isLoading}
                      />
                      <Button variant="outline" onClick={handleLinkGitHub} disabled={isLoading || !githubUrl.trim()}>
                        <ExternalLink className="w-4 h-4" />
                        {isLoading ? 'Vinculando...' : 'Vincular'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Estado: Todo configurado */}
            {hasGit && hasGitHub && (
              <div
                className="p-4 rounded-[var(--radius-card)] border"
                style={{ 
                  borderColor: 'var(--green)',
                  backgroundColor: 'var(--bg-secondary)'
                }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--green)' }} />
                  <div className="flex-1">
                    <p className="mb-1" style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      Repositorio configurado correctamente
                    </p>
                    <p 
                      className="text-sm mb-3"
                      style={{ 
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-family-mono)'
                      }}
                    >
                      {githubUrl}
                    </p>
                    <button
                      onClick={() => setHasGitHub(false)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      disabled={isLoading}
                    >
                      Cambiar URL del repositorio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div 
          className="flex justify-end gap-2 px-6 py-4 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </>
  );
}
