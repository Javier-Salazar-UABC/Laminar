import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { WindowsTitleBar } from '../components/WindowsTitleBar';
import { FileCard } from '../components/FileCard';
import { FolderTreeItem } from '../components/FolderTreeItem';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { ContextPanel } from '../components/ContextPanel';
import { EditMetadataModal } from '../components/EditMetadataModal';
import { GitPushModal } from '../components/GitPushModal';
import { ProjectSettings } from '../components/ProjectSettings';
import { mockFiles, folderStructure, FileMetadata, FolderNode } from '../data/mockData';
import { Search, ChevronRight, Moon, Sun, X, Filter, Settings, LogOut, CheckCircle2, Edit3, Circle, Code2, Clock, AlertCircle, Sparkles, Archive, RefreshCw, Download, GitPullRequest } from 'lucide-react';

export function MainView() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileMetadata[]>(mockFiles);
  const [folders, setFolders] = useState<FolderNode[]>(folderStructure);
  const [activeFolder, setActiveFolder] = useState<string>('root');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [gitModalFiles, setGitModalFiles] = useState<FileMetadata[]>([]);
  const [selectedForPush, setSelectedForPush] = useState<string[]>([]);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [isRepo, setIsRepo] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  
  const [gitSyncInfo, setGitSyncInfo] = useState<{ behind: number; ahead: number }>({ behind: 0, ahead: 0 });
  const [isFetchingGit, setIsFetchingGit] = useState(false);

  const pendingPushFiles = useMemo(() => {
    return files.filter(f => f.status === 'modified' || f.status === 'new');
  }, [files]);
  
  const pendingPushCount = pendingPushFiles.length;
  
  // Estados de filtros
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  
  // Obtener todos los tags únicos
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach(file => file.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [files]);
  
  // Obtener todos los tipos únicos
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    files.forEach(file => types.add(file.type));
    return Array.from(types).sort();
  }, [files]);
  
  // Filtrar archivos por carpeta activa, búsqueda y filtros
  const filteredFiles = useMemo(() => {
    let result = files;
    
    // 1. Filtrar por Carpeta Activa (Solo mostrar archivos del directorio actual)
    if (activeFolder && activeFolder !== 'root') {
      result = result.filter(file => {
        // Obtenemos la ruta de la carpeta del archivo
        const fileDir = file.id.substring(0, file.id.lastIndexOf('/'));
        return fileDir === activeFolder;
      });
    }
    
    // 2. Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => 
        file.description.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query)) ||
        file.name.toLowerCase().includes(query)
      );
    }
    
    // 3. Filtros adicionales
    if (filterType !== 'all') result = result.filter(file => file.type === filterType);
    if (filterStatus !== 'all') result = result.filter(file => file.status === filterStatus);
    if (filterTag !== 'all') result = result.filter(file => file.tags.includes(filterTag));
    
    return result;
  }, [files, activeFolder, searchQuery, filterType, filterStatus, filterTag]);
  
  // Contar archivos seleccionados
  const selectedCount = selectedForPush.length;
  
  const hasActiveFilters = filterType !== 'all' || filterStatus !== 'all' || filterTag !== 'all';
  
  const handleCloseProject = () => {
    navigate('/');
  };
  
  const handleFolderToggle = (folderId: string) => {
    const toggleFolder = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.id === folderId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleFolder(node.children) };
        }
        return node;
      });
    };
    
    setFolders(toggleFolder(folders));
  };
  
  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId);
    setShowContextPanel(true);
  };
  
  const handleToggleFileSelection = (fileId: string) => {
    setSelectedForPush(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAllModified = () => {
    const allModifiedIds = pendingPushFiles.map(f => f.id);
    const areAllSelected = allModifiedIds.every(id => selectedForPush.includes(id));
    if (areAllSelected) {
      setSelectedForPush(prev => prev.filter(id => !allModifiedIds.includes(id)));
    } else {
      setSelectedForPush(prev => {
        const newSelection = [...prev];
        allModifiedIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };
  
  const handleSaveMetadata = async (fileId: string, data: { description: string; tags: string[]; author: string }) => {
    const backend = (window as any).backend;
    if (backend && projectPath) {
      const success = await backend.save_file_metadata(projectPath, fileId, data);
      if (success) {
        setFiles(files.map(file => {
          if (file.id === fileId) {
            return { ...file, ...data };
          }
          return file;
        }));
        setShowEditModal(false);
        showToast('Metadatos persistidos en el proyecto');
      } else {
        showToast('Error al guardar metadatos');
      }
    }
  };
  
  const handleGitPush = () => {
    setSelectedForPush([]);
    if (projectPath) {
      loadProjectData(projectPath);
    }
    setShowGitModal(false);
    showToast('¡Sincronización exitosa!');
  };
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };
  
  const handleOpenInVSCode = (fileId?: string) => {
    const backend = (window as any).backend;
    if (!backend) return;

    if (fileId) {
      const file = files.find(f => f.id === fileId);
      if (file && projectPath) {
        backend.open_in_vscode(file.path, projectPath);
        showToast(`Abriendo ${file.name} en VS Code...`);
      }
    } else if (projectPath) {
      backend.open_in_vscode(projectPath, "");
      showToast('Abriendo proyecto en VS Code...');
    }
  };
  
  const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;
  const selectedFiles = files.filter(f => selectedForPush.includes(f.id));

  const { state } = (window as any).location_state_placeholder_fix || {}; // Simulating location state for now
  
  // Real implementation using useLocation if available, but since we are in a custom setup:
  // I will use a useEffect to handle the initial path from Onboarding
  
  useEffect(() => {
    // Check if there is a path in history state (passed from Onboarding)
    const historyState = (window as any).history.state;
    if (historyState && historyState.usr && historyState.usr.projectPath) {
      loadProjectData(historyState.usr.projectPath);
    }
    fetchRecentProjects();
  }, []);

  const fetchRecentProjects = async () => {
    const backend = (window as any).backend;
    if (backend && backend.get_recent_projects) {
      const projects = await backend.get_recent_projects();
      setRecentProjects(projects);
    }
  };

  const checkGitSyncStatus = async (path: string) => {
    const backend = (window as any).backend;
    if (backend && backend.git_check_sync_status) {
      try {
        const info = await backend.git_check_sync_status(path);
        if (info) {
          setGitSyncInfo({ behind: info.behind || 0, ahead: info.ahead || 0 });
        }
      } catch (e) {
        console.error("Error al obtener estado de sincronización:", e);
      }
    }
  };

  const handleGitFetch = async () => {
    if (!projectPath) return;
    const backend = (window as any).backend;
    if (!backend) return;
    setIsFetchingGit(true);
    showToast('Buscando actualizaciones remotas...');
    try {
      if (backend.git_fetch) {
        await backend.git_fetch(projectPath);
      }
      await checkGitSyncStatus(projectPath);
      showToast('Estado de Git actualizado');
    } catch (e) {
      console.error(e);
      showToast('Error al buscar actualizaciones');
    } finally {
      setIsFetchingGit(false);
    }
  };

  const handleGitPull = async () => {
    if (!projectPath) return;
    const backend = (window as any).backend;
    if (!backend || !backend.git_pull) return;
    setIsFetchingGit(true);
    showToast('Ejecutando git pull...');
    try {
      const result = await backend.git_pull(projectPath);
      if (result === 'success') {
        showToast('Repositorio actualizado correctamente (git pull exitoso)');
        loadProjectData(projectPath);
      } else {
        showToast(`Error en git pull: ${result}`);
      }
    } catch (e: any) {
      showToast(`Error al actualizar: ${e.message || e}`);
    } finally {
      setIsFetchingGit(false);
    }
  };

  const loadProjectData = async (path: string) => {
    const backend = (window as any).backend;
    if (!backend) return;
    
    setSelectedForPush([]); // Limpiar selección de Git al cambiar de proyecto
    const response = await backend.get_project_data(path);
    const data = response.files;
    setIsRepo(response.isRepo);
    
    // Transform data for the grid (files)
    const allFiles: FileMetadata[] = [];
    const flattenFiles = (items: any[]) => {
      items.forEach(item => {
        if (item.type === 'file') {
          const ext = (item.extension || 'md').toLowerCase();
          const validTypes = ['js', 'py', 'css', 'json', 'md', 'ts', 'tsx', 'html'];
          const fileType = (validTypes.includes(ext) ? ext : 'md') as FileMetadata['type'];

          allFiles.push({
            id: item.id,
            name: item.name,
            type: fileType,
            status: item.status || 'uptodate',
            description: item.description,
            tags: item.tags || [],
            author: item.author || 'Usuario Local',
            dateModified: 'Reciente',
            path: item.id,
            size: 'Desconocido',
            folder: item.id.split('/').slice(-2, -1)[0] || 'Raíz'
          });
        } else if (item.children) {
          flattenFiles(item.children);
        }
      });
    };
    
    flattenFiles(data);
    setFolders(data);
    setFiles(allFiles);
    
    const normalizedPath = path.replace(/\\/g, '/');
    setProjectPath(normalizedPath);
    setActiveFolder(normalizedPath);
    
    showToast(`Proyecto cargado: ${path.split('/').pop()}`);
    fetchRecentProjects();

    // Comprobar estado de commits remotos
    checkGitSyncStatus(path);
  };

  const handleOpenProject = async () => {
    const backend = (window as any).backend;
    if (!backend) return;
    
    const path = await backend.select_folder();
    if (path) {
      loadProjectData(path);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return (
    <div 
      className={`h-screen flex flex-col overflow-hidden select-none ${isDarkMode ? '' : 'light'}`}
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-family-base)',
        color: 'var(--text-main)'
      }}
    >
      <WindowsTitleBar />
      
      {/* Main Container with Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar - Glassy Tree */}
        <aside 
          className="w-64 shrink-0 border-r flex flex-col z-10"
          style={{ 
            backgroundColor: 'var(--glass-bg)',
            borderColor: 'var(--glass-border)'
          }}
        >
          {/* Project Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center shrink-0 overflow-visible">
                <img src="/assets/logo.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
                <h2 
                  className="text-sm font-black tracking-widest"
                  style={{ color: 'var(--text-main)', opacity: 0.9 }}
                >
                  LAMINAR
                </h2>
              </div>
              {projectPath && (
                <button 
                  onClick={() => setActiveFolder(projectPath)}
                  className={`text-[10px] px-2 py-1 rounded-md transition-all border font-bold`}
                  style={{
                    backgroundColor: activeFolder === projectPath ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    borderColor: activeFolder === projectPath ? 'var(--accent-blue)' : 'var(--border-color)',
                    color: activeFolder === projectPath ? '#ffffff' : 'var(--text-main)'
                  }}
                >
                  RAÍZ
                </button>
              )}
            </div>
            <button 
              onClick={handleOpenProject}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-all text-xs font-bold"
            >
              <Archive className="w-3 h-3" />
              Abrir Proyecto
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            {folders.map(folder => (
              <FolderTreeItem
                key={folder.id}
                node={folder}
                activeFolder={activeFolder}
                onFolderClick={setActiveFolder}
                onToggle={handleFolderToggle}
              />
            ))}
          </div>

          {/* Recent Projects Section */}
          <div className="p-4 border-t mt-auto" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recientes
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-hide">
              {recentProjects.length > 0 ? (
                recentProjects.filter(p => p.path !== projectPath).slice(0, 3).map((project, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadProjectData(project.path)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-all group"
                  >
                    <p className="text-[11px] font-bold truncate group-hover:text-blue-400" style={{ color: 'var(--text-main)' }}>
                      {project.name}
                    </p>
                    <p className="text-[9px] truncate opacity-50" style={{ color: 'var(--text-secondary)' }}>
                      {project.path}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-[10px] italic opacity-30 text-center py-2">Sin historial</p>
              )}
            </div>
          </div>

          {/* Repo Pulse Section - Only if it's a repo */}
          {isRepo && (
            <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <div 
                className="rounded-xl p-4 border"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Repo Pulse</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Modificados</span>
                    <span className="text-amber-500 font-bold">{pendingPushCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Seleccionados</span>
                    <span className="text-blue-500 font-bold">{selectedForPush.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-350" 
                      style={{ width: `${pendingPushCount > 0 ? (selectedForPush.length / pendingPushCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent z-0">
          
          {/* Modern Toolbar with Breadcrumbs */}
          <div 
            className="h-16 flex items-center justify-between px-8 border-b"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-6 flex-1">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-medium overflow-hidden">
                <Archive className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden">
                  {projectPath && activeFolder && (
                    <>
                      <button 
                        onClick={() => setActiveFolder(projectPath)}
                        className="text-slate-400 hover:text-main transition-colors"
                      >
                        {projectPath.split('/').pop()}
                      </button>
                      {activeFolder !== projectPath && activeFolder.replace(projectPath, '').split('/').filter(Boolean).map((part, i, arr) => (
                        <div key={part} className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <button 
                            onClick={() => {
                              const pathParts = activeFolder.split('/');
                              const targetIndex = pathParts.indexOf(part);
                              setActiveFolder(pathParts.slice(0, targetIndex + 1).join('/'));
                            }}
                            className={`${i === arr.length - 1 ? 'text-blue-400' : 'text-slate-400 hover:text-main'} transition-colors`}
                          >
                            {part}
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {!projectPath && <span className="text-slate-500 italic">No hay proyecto cargado</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar en el proyecto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-slate-400"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
                
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl border transition-all`}
                  style={{
                    backgroundColor: showFilters ? 'var(--accent-blue-glow)' : 'var(--bg-tertiary)',
                    borderColor: showFilters ? 'var(--accent-blue)' : 'var(--border-color)',
                    color: showFilters ? 'var(--accent-blue)' : 'var(--text-main)'
                  }}
                  title="Filtros"
                >
                  <Filter className="w-4 h-4" />
                </button>

                {isRepo && (
                  <div className="flex items-center gap-2 border-r pr-4" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={handleGitFetch}
                      disabled={isFetchingGit}
                      className="p-2 rounded-xl border transition-all flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      title="Buscar actualizaciones remotas (git fetch)"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingGit ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border" style={{ borderColor: 'var(--border-color)' }}>
                      {gitSyncInfo.behind > 0 ? (
                        <button
                          onClick={handleGitPull}
                          disabled={isFetchingGit}
                          className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors animate-pulse cursor-pointer"
                          title={`Hay ${gitSyncInfo.behind} commits pendientes de descargar. Haz clic para hacer git pull.`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Pull ({gitSyncInfo.behind})</span>
                        </button>
                      ) : (
                        <span className="text-green-500 flex items-center gap-1" title="Al día con el repositorio remoto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Al día</span>
                        </span>
                      )}

                      {pendingPushCount > 0 && (
                        <>
                          <span className="text-slate-600 font-normal">|</span>
                          <span className="text-blue-400 font-semibold" title={`${pendingPushCount} archivos modificados localmente`}>
                            Push: {pendingPushCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setShowProjectSettings(true)}
                  className="p-2 rounded-xl border transition-all hover:bg-[var(--bg-secondary)]"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                  title="Ajustes"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => handleOpenInVSCode()}
                  className="p-2 rounded-xl border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                  title="Abrir Proyecto en VS Code"
                >
                  <img src="/assets/VSCodeLogo.png" className="w-4 h-4 object-contain" alt="VS Code" />
                </button>

                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-xl border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                  title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Animated Filter Bar */}
          {showFilters && (
            <div 
              className="px-8 py-3 border-b flex flex-wrap items-center gap-6 transition-all duration-300 ease-in-out bg-[var(--glass-bg)]"
              style={{ borderColor: 'var(--glass-border)', backdropFilter: 'blur(10px)' }}
            >
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border bg-[var(--bg-tertiary)] border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">Todos</option>
                  {allTypes.map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado Git:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border bg-[var(--bg-tertiary)] border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="modified">Modificados</option>
                  <option value="new">Nuevos</option>
                  <option value="uptodate">Al día</option>
                </select>
              </div>

              {/* Tag Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Etiqueta:</span>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border bg-[var(--bg-tertiary)] border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">Todas</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              {(filterType !== 'all' || filterStatus !== 'all' || filterTag !== 'all') && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterTag('all');
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors ml-auto cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          )}

          {/* Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-24">
              {filteredFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  hideBadge={!isRepo}
                  isSelectedForPush={selectedForPush.includes(file.id)}
                  onClick={() => handleFileClick(file.id)}
                  onToggleSelection={handleToggleFileSelection}
                />
              ))}
            </div>

            {filteredFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                <Archive className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No se encontraron archivos</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Floating Action Bar - Solo si es un repo y hay cambios pendientes de push */}
      {isRepo && pendingPushCount > 0 && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-400px)] max-w-4xl h-16 flex items-center justify-between px-8 rounded-2xl border shadow-2xl z-50 overflow-hidden transition-all"
          style={{ 
            backgroundColor: 'var(--modal-bg)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span 
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: 'var(--text-main)' }}
              >
                {selectedCount} de {pendingPushCount} archivos seleccionados
              </span>
              <span 
                className="text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Modificados o nuevos localmente
              </span>
            </div>

            {/* Seleccionar todo / deseleccionar todo */}
            <button
              onClick={handleSelectAllModified}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
            >
              {selectedCount === pendingPushCount ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botón para Sincronizar Selección */}
            <button
              disabled={selectedCount === 0}
              onClick={() => {
                setGitModalFiles(selectedFiles);
                setShowGitModal(true);
              }}
              className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedCount > 0 
                  ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-disabled)] cursor-not-allowed'
              }`}
              title="Sincronizar únicamente los archivos que has seleccionado manualmente"
            >
              Sincronizar Selección ({selectedCount})
            </button>

            {/* Botón para Sincronizar Todo (Push Todo) */}
            <button
              onClick={() => {
                setGitModalFiles(pendingPushFiles);
                setShowGitModal(true);
              }}
              className="px-5 py-2 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Sincronizar absolutamente todos los archivos modificados de una sola vez (Push a todo)"
            >
              <GitPullRequest className="w-4 h-4" />
              Sincronizar Todo ({pendingPushCount})
            </button>
          </div>
        </div>
      )}

      {/* Context Panel */}
      {showContextPanel && selectedFile && (
        <ContextPanel
          file={selectedFile}
          onClose={() => setShowContextPanel(false)}
          onEdit={() => setShowEditModal(true)}
          onToggleSelection={handleToggleFileSelection}
          onOpenInVSCode={() => handleOpenInVSCode(selectedFile.id)}
        />
      )}
      
      {/* Edit Metadata Modal */}
      {showEditModal && selectedFile && (
        <EditMetadataModal
          file={selectedFile}
          onClose={() => setShowEditModal(false)}
          onSave={(data) => handleSaveMetadata(selectedFile.id, data)}
        />
      )}
      
      {/* Git Push Modal */}
      {showGitModal && projectPath && (
        <GitPushModal
          files={gitModalFiles}
          projectPath={projectPath}
          onClose={() => setShowGitModal(false)}
          onConfirm={handleGitPush}
        />
      )}
      
      {/* Project Settings Modal */}
      {showProjectSettings && (
        <ProjectSettings
          projectPath={projectPath}
          isRepo={isRepo}
          onClose={() => setShowProjectSettings(false)}
          onRepoChanged={(repoState) => {
            setIsRepo(repoState);
            if (projectPath) loadProjectData(projectPath);
          }}
        />
      )}
      
      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        variant="success"
      />
    </div>
  );
}