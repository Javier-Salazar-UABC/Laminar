import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { WindowsTitleBar } from '../components/WindowsTitleBar';
import { Button } from '../components/Button';
import { FolderGit2, Clock, Trash2 } from 'lucide-react';

export function Onboarding() {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchRecent = async () => {
      const backend = (window as any).backend;
      if (backend && backend.get_recent_projects) {
        const projects = await backend.get_recent_projects();
        setRecentProjects(projects);
      }
    };
    fetchRecent();
  }, []);

  const handleOpenFolder = async () => {
    const backend = (window as any).backend;
    if (backend) {
      const path = await backend.select_folder();
      if (path) {
        navigate('/main', { state: { projectPath: path } });
      }
    }
  };

  const handleOpenRecent = (path: string) => {
    navigate('/main', { state: { projectPath: path } });
  };
  
  return (
    <div 
      className="h-screen flex flex-col"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-family-base)'
      }}
    >
      <WindowsTitleBar />
      
      <div className="flex-1 flex flex-col items-center justify-start px-8 pt-32 pb-24 overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex flex-col items-center mb-16 text-center">
          <div 
            className="w-28 h-28 flex items-center justify-center mb-8 overflow-visible"
            style={{ backgroundColor: 'transparent' }}
          >
            <img 
              src="/assets/logo.png" 
              alt="Laminar Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h1 
            className="mb-2"
            style={{ 
              fontSize: '48px',
              fontWeight: 900,
              color: 'var(--text-main)',
              letterSpacing: '-0.05em',
              textTransform: 'uppercase'
            }}
          >
            Laminar
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', opacity: 0.8 }}>
            Flujo de trabajo impecable para tus proyectos de ingeniería.
          </p>
        </div>
        
        {/* Main action */}
        <div className="mb-16 w-full flex flex-col items-center gap-4 px-4">
          <Button 
            variant="blue"
            onClick={handleOpenFolder}
            style={{ width: '100%', maxWidth: '360px', height: '56px', fontSize: '16px', borderRadius: '16px' }}
          >
            <FolderGit2 className="w-5 h-5 mr-2" />
            Abrir Carpeta del Proyecto
          </Button>
          <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            Selecciona cualquier carpeta que contenga archivos de código
          </p>
        </div>
        
        {/* Recent projects */}
        <div className="w-full max-w-5xl px-4">
          <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
            <h2 
              className="flex items-center gap-2"
              style={{ 
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            >
              <Clock className="w-4 h-4" />
              PROYECTOS RECIENTES
            </h2>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenRecent(project.path)}
                  className="p-5 rounded-[var(--radius-card)] text-left hover:shadow-xl hover:translate-y-[-2px] transition-all border group"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <h3 
                    className="mb-2 truncate group-hover:text-blue-500 transition-colors"
                    style={{ 
                      color: 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '15px'
                    }}
                  >
                    {project.name}
                  </h3>
                  <p 
                    className="text-xs mb-4 truncate"
                    style={{ 
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-family-mono)',
                      opacity: 0.7
                    }}
                  >
                    {project.path}
                  </p>
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-500/10 rounded"
                      style={{ color: 'var(--accent-blue)' }}
                    >
                      {project.lastAccessed}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)', opacity: 0.5 }}>
              <FolderGit2 className="w-12 h-12 mb-4 text-slate-400" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aún no has abierto ningún proyecto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}