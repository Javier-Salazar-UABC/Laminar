# Estructura Detallada del Proyecto: Laminar

Laminar es una aplicación de escritorio diseñada para estudiantes de ingeniería, que combina la potencia de **Python** para el control del sistema y **React** para una interfaz de usuario moderna y fluida.

## 🏗️ Arquitectura General

El proyecto utiliza una arquitectura **Híbrida (Shell-Web)**:
- **Backend (Shell)**: Desarrollado en Python con **PyQt6**. Se encarga de la gestión de ventanas, acceso al sistema de archivos y ejecución de comandos Git.
- **Frontend (UI)**: Desarrollado en **React + TypeScript + Vite**. Proporciona una interfaz estética de estilo "glassmorphism".
- **Puente (Bridge)**: Utiliza **QWebChannel** para permitir que el código JavaScript en el navegador se comunique directamente con las funciones de Python.

---

## 📁 Carpeta Raíz

- `main.py`: El corazón de la aplicación de escritorio. Configura la ventana de PyQt6, inyecta el puente de comunicación y expone las APIs al frontend.
- `CHANGELOG.md`: Registro histórico de cambios, actualizaciones y mejoras del proyecto.
- `debug.py`: Script de utilidad para pruebas rápidas del backend.
- `web/`: Directorio principal del frontend (ver sección detallada).

---

## 🐍 Backend: `main.py`

Este archivo contiene la lógica de sistema necesaria para que la aplicación funcione como una herramienta nativa:

1.  **Clase `Backend(QObject)`**: Define las funciones que React puede llamar desde la web:
    - `minimize()`, `maximize()`, `close_app()`: Control de la ventana.
    - `open_in_vscode(path)`: Abre archivos o carpetas directamente en VS Code usando `subprocess`.
    - `sync_repository(mensaje)`: Ejecuta una secuencia de comandos Git (`add`, `commit`, `push`) en un hilo separado.
    - `get_project_data(root_path)`: Escanea recursivamente el sistema de archivos para construir el árbol de carpetas del proyecto, detectando si es un repositorio Git.
    - `get_recent_projects()`: Recupera la lista de proyectos abiertos recientemente desde la configuración local.

2.  **Servidor Local**: Inicia un servidor HTTP (`socketserver`) para servir la versión compilada del frontend (`web/dist`) de forma segura.

3.  **Inyección de Bridge**: Al cargar la página, inyecta un script de inicialización que crea `window.pywebview.api`, permitiendo que el código React existente llame a Python de forma transparente.

---

## 🌐 Frontend: `web/`

El frontend sigue los estándares modernos de desarrollo web con una estructura modular:

### `web/src/app/`
- `main.tsx`: Punto de entrada de React.
- `App.tsx`: Componente raíz que maneja las rutas principales.
- `routes.ts`: Definición de las rutas de navegación (Onboarding, Dashboard, etc.).

### `web/src/app/screens/` (Vistas principales)
- `Onboarding.tsx`: Pantalla de bienvenida donde el usuario selecciona o crea un nuevo proyecto.
- `MainView.tsx`: La vista principal del gestor de proyectos. Incluye el explorador de archivos, el panel de Git y la previsualización de archivos.

### `web/src/app/components/` (Componentes reutilizables)
- `WindowsTitleBar.tsx`: Barra de título personalizada que permite arrastrar la ventana y controlarla.
- `FolderTreeItem.tsx`: Componente recursivo para renderizar la estructura de carpetas.
- `FileCard.tsx`: Visualización de archivos individuales con metadatos y estados.
- `GitPushModal.tsx`: Diálogo interactivo para realizar commits y pushes a GitHub.
- `ContextPanel.tsx`: Panel lateral que muestra información detallada del archivo seleccionado.
- `ProjectSettings.tsx`: Configuración específica del proyecto actual.
- `ui/`: Componentes básicos de diseño (botones, inputs, paneles).

### `web/src/styles/`
- Contiene los archivos CSS que definen la estética de la aplicación, incluyendo variables de diseño, efectos de desenfoque (backdrop-filter) y animaciones.

---

## 💾 Persistencia de Datos

La aplicación mantiene el estado del usuario fuera del directorio del proyecto para mayor seguridad:
- **Ruta de Configuración**: `%USERPROFILE%\.monitor_uabc_config.json` (en Windows).
- **Contenido**: Almacena los últimos 6 proyectos abiertos, sus rutas y la última fecha de acceso, permitiendo que la aplicación "recuerde" dónde se quedó el usuario.

---

## 🛠️ Flujo de Desarrollo

1.  **Frontend**: Se desarrolla en la carpeta `web`. Al terminar cambios, se ejecuta `npm run build` para generar la carpeta `dist`.
2.  **Producción**: `main.py` lee la carpeta `dist` y la muestra en la ventana nativa.
3.  **Comunicación**: Cualquier acción en la UI que requiera interactuar con el PC (como abrir VS Code o hacer un commit) viaja a través del objeto `backend` registrado en el sistema.
holaasdad