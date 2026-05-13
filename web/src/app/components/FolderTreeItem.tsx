import { ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';
import { FolderNode } from '../data/mockData';

interface FolderTreeItemProps {
  node: FolderNode;
  level?: number;
  activeFolder?: string;
  onFolderClick?: (folderId: string) => void;
  onToggle?: (folderId: string) => void;
}

export function FolderTreeItem({ 
  node, 
  level = 0, 
  activeFolder,
  onFolderClick,
  onToggle 
}: FolderTreeItemProps) {
  // Una carpeta es tal si su tipo es folder O si tiene hijos definidos
  const isFolder = node.type === 'folder' || (node.children && node.children.length >= 0);
  const isActive = activeFolder === node.id;
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div>
      <div
        onClick={() => {
          if (isFolder) {
            if (onToggle) onToggle(node.id);
            if (onFolderClick) onFolderClick(node.id);
          }
        }}
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all relative ${isFolder ? 'hover:bg-white/5 font-medium' : 'hover:bg-white/5 opacity-60'}`}
        style={{
          paddingLeft: `${level * 12 + 12}px`,
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          color: isActive ? '#60a5fa' : 'inherit'
        }}
      >
        {isFolder ? (
          <ChevronRight 
            className={`w-3 h-3 transition-transform ${node.isOpen ? 'rotate-90 text-amber-400' : 'text-slate-500'}`}
          />
        ) : (
          <div className="w-3" />
        )}
        
        {isFolder ? (
          node.isOpen ? (
            <FolderOpen className="w-4 h-4 text-amber-400" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500/80" />
          )
        ) : (
          <FileText className="w-3.5 h-3.5 text-slate-400" />
        )}
        
        <span 
          className="text-sm"
          style={{ 
            color: isActive ? 'var(--text-main)' : 'var(--text-secondary)'
          }}
        >
          {node.name}
        </span>
      </div>
      
      {node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              activeFolder={activeFolder}
              onFolderClick={onFolderClick}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
