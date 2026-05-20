// Mock data for the Visual Project Manager

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  type: 'js' | 'py' | 'css' | 'json' | 'md' | 'ts' | 'tsx' | 'html';
  description: string;
  tags: string[];
  author: string;
  dateModified: string;
  size: string;
  status: 'normal' | 'modified' | 'selected' | 'uptodate' | 'pending' | 'error' | 'new' | 'deprecated';
  folder: string;
}

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  isOpen?: boolean;
  status?: string;
}

export interface Project {
  name: string;
  path: string;
  lastAccessed: string;
}

export const mockFiles: FileMetadata[] = [
  {
    id: '1',
    name: 'userAuth.js',
    path: '/src/auth/userAuth.js',
    type: 'js',
    description: 'Maneja la autenticación de usuarios con JWT, incluye login, logout y validación de tokens',
    tags: ['autenticación', 'seguridad', 'backend'],
    author: 'María González',
    dateModified: '2026-02-28',
    size: '4.2 KB',
    status: 'uptodate',
    folder: 'auth'
  },
  {
    id: '2',
    name: 'database.py',
    path: '/src/core/database.py',
    type: 'py',
    description: 'Conexión principal a PostgreSQL con pool de conexiones y gestión de transacciones',
    tags: ['database', 'postgresql', 'core'],
    author: 'Carlos Ruiz',
    dateModified: '2026-03-01',
    size: '6.8 KB',
    status: 'modified',
    folder: 'core'
  },
  {
    id: '3',
    name: 'styles.css',
    path: '/src/styles/styles.css',
    type: 'css',
    description: 'Estilos globales del proyecto con variables CSS y componentes reutilizables',
    tags: ['estilos', 'ui', 'frontend'],
    author: 'Ana Martínez',
    dateModified: '2026-02-27',
    size: '12.3 KB',
    status: 'uptodate',
    folder: 'styles'
  },
  {
    id: '4',
    name: 'config.json',
    path: '/config/config.json',
    type: 'json',
    description: 'Archivo de configuración principal con endpoints de API y variables de entorno',
    tags: ['configuración', 'env'],
    author: 'Luis Torres',
    dateModified: '2026-02-25',
    size: '1.8 KB',
    status: 'modified',
    folder: 'config'
  },
  {
    id: '5',
    name: 'README.md',
    path: '/docs/README.md',
    type: 'md',
    description: 'Documentación principal del proyecto con instrucciones de instalación y uso',
    tags: ['documentación', 'guía'],
    author: 'María González',
    dateModified: '2026-02-26',
    size: '8.5 KB',
    status: 'pending',
    folder: 'docs'
  },
  {
    id: '6',
    name: 'apiService.ts',
    path: '/src/services/apiService.ts',
    type: 'ts',
    description: 'Servicio centralizado para llamadas HTTP con interceptores y manejo de errores',
    tags: ['api', 'http', 'servicios'],
    author: 'Carlos Ruiz',
    dateModified: '2026-03-02',
    size: '5.4 KB',
    status: 'new',
    folder: 'services'
  },
  {
    id: '7',
    name: 'UserProfile.tsx',
    path: '/src/components/UserProfile.tsx',
    type: 'tsx',
    description: 'Componente React para mostrar y editar el perfil del usuario con formulario controlado',
    tags: ['react', 'componente', 'perfil'],
    author: 'Ana Martínez',
    dateModified: '2026-03-01',
    size: '7.2 KB',
    status: 'modified',
    folder: 'components'
  },
  {
    id: '8',
    name: 'validation.js',
    path: '/src/utils/validation.js',
    type: 'js',
    description: 'Funciones de validación de formularios: email, contraseña, teléfono, etc.',
    tags: ['validación', 'utilidades'],
    author: 'Luis Torres',
    dateModified: '2026-02-29',
    size: '3.1 KB',
    status: 'uptodate',
    folder: 'utils'
  },
  {
    id: '9',
    name: 'routes.py',
    path: '/src/api/routes.py',
    type: 'py',
    description: 'Definición de rutas de la API REST con Flask, incluye endpoints CRUD completos',
    tags: ['api', 'flask', 'rutas'],
    author: 'Carlos Ruiz',
    dateModified: '2026-03-02',
    size: '9.6 KB',
    status: 'error',
    folder: 'api'
  },
  {
    id: '10',
    name: 'theme.css',
    path: '/src/styles/theme.css',
    type: 'css',
    description: 'Sistema de diseño con tokens de color, tipografía y espaciado consistentes',
    tags: ['design-system', 'tokens'],
    author: 'Ana Martínez',
    dateModified: '2026-02-28',
    size: '4.9 KB',
    status: 'uptodate',
    folder: 'styles'
  },
  {
    id: '11',
    name: 'errorHandler.ts',
    path: '/src/middleware/errorHandler.ts',
    type: 'ts',
    description: 'Middleware para captura y formateo de errores con logging centralizado',
    tags: ['middleware', 'errores', 'logging'],
    author: 'Luis Torres',
    dateModified: '2026-03-01',
    size: '3.7 KB',
    status: 'modified',
    folder: 'middleware'
  },
  {
    id: '12',
    name: 'index.html',
    path: '/public/index.html',
    type: 'html',
    description: 'Punto de entrada HTML principal con meta tags y carga de recursos',
    tags: ['html', 'entrada'],
    author: 'María González',
    dateModified: '2026-02-24',
    size: '2.3 KB',
    status: 'uptodate',
    folder: 'public'
  },
  {
    id: '13',
    name: 'legacy-utils.js',
    path: '/src/utils/legacy-utils.js',
    type: 'js',
    description: 'Utilidades antiguas que serán reemplazadas por nuevos módulos ES6',
    tags: ['legacy', 'obsoleto'],
    author: 'Carlos Ruiz',
    dateModified: '2025-11-15',
    size: '8.2 KB',
    status: 'deprecated',
    folder: 'utils'
  },
  {
    id: '14',
    name: 'websocket.ts',
    path: '/src/services/websocket.ts',
    type: 'ts',
    description: 'Servicio de conexión WebSocket para actualizaciones en tiempo real',
    tags: ['websocket', 'realtime', 'servicios'],
    author: 'Ana Martínez',
    dateModified: '2026-03-09',
    size: '4.1 KB',
    status: 'new',
    folder: 'services'
  },
  {
    id: '15',
    name: 'permissions.py',
    path: '/src/core/permissions.py',
    type: 'py',
    description: 'Sistema de permisos y roles para control de acceso basado en roles (RBAC)',
    tags: ['seguridad', 'permisos', 'rbac'],
    author: 'Luis Torres',
    dateModified: '2026-03-05',
    size: '5.6 KB',
    status: 'pending',
    folder: 'core'
  }
];

export const folderStructure: FolderNode[] = [
  {
    id: 'root',
    name: 'proyecto-ingenieria',
    path: '/',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        path: '/src',
        type: 'folder',
        isOpen: true,
        children: [
          { id: 'auth', name: 'auth', path: '/src/auth', type: 'folder' },
          { id: 'api', name: 'api', path: '/src/api', type: 'folder' },
          { id: 'components', name: 'components', path: '/src/components', type: 'folder' },
          { id: 'core', name: 'core', path: '/src/core', type: 'folder' },
          { id: 'middleware', name: 'middleware', path: '/src/middleware', type: 'folder' },
          { id: 'services', name: 'services', path: '/src/services', type: 'folder' },
          {
            id: 'styles',
            name: 'styles',
            path: '/src/styles',
            type: 'folder'
          },
          { id: 'utils', name: 'utils', path: '/src/utils', type: 'folder' }
        ]
      },
      { id: 'config', name: 'config', path: '/config', type: 'folder' },
      { id: 'docs', name: 'docs', path: '/docs', type: 'folder' },
      { id: 'public', name: 'public', path: '/public', type: 'folder' }
    ]
  }
];

export const recentProjects: Project[] = [
  {
    name: 'proyecto-ingenieria',
    path: 'C:\\Users\\estudiante\\Documents\\proyecto-ingenieria',
    lastAccessed: 'Hace 2 horas'
  },
  {
    name: 'backend-flask',
    path: 'C:\\Users\\estudiante\\Documents\\backend-flask',
    lastAccessed: 'Hace 1 día'
  },
  {
    name: 'react-dashboard',
    path: 'C:\\Users\\estudiante\\Documents\\react-dashboard',
    lastAccessed: 'Hace 3 días'
  }
];