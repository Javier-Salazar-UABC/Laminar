# Historial de Cambios - Laminar

## [3.1.0] - Herramientas de Sincronización y Calidad de Vida (Fetch, Pull y Push Todo)
**Fecha:** 20 de Mayo de 2026

### Novedades Relevantes
* **Widget de Control de Git en Tiempo Real:** Barra visual en la toolbar principal con indicadores dinámicos del estado remoto.
* **Sincronización Total (Push Todo):** Botón verde "Sincronizar Todo" que permite preseleccionar todos los archivos con cambios locales de un solo clic y sincronizarlos juntos.
* **Selección Masiva Inteligente:** Capacidad para seleccionar o deseleccionar todos los archivos modificados a la vez desde la barra de acciones flotante.
* **Detección de Commits Entrantes (Behind) y Salientes (Ahead):** Notificación visual interactiva al usuario cuando hay commits nuevos disponibles para descargar en el servidor de GitHub.
* **Carga de Proyectos Recientes en Pantalla de Inicio:** Resuelto un problema asíncrono (race condition) al iniciar la aplicación que impedía mostrar los proyectos recientes en la pantalla de bienvenida antes de inicializar por completo `QWebChannel`.

### Documentación de Nuevas Funciones del Backend (Python)
A continuación se detalla la implementación y funcionamiento de cada nueva función expuesta al frontend mediante la API de `pywebview`:

1. **`git_check_sync_status(project_path)`**
   * **Propósito:** Determinar cuántos commits locales están adelantados (`ahead`) o cuántos commits remotos están atrasados (`behind`) con respecto a la rama de origen.
   * **Cómo funciona:** Ejecuta el comando `git rev-list --left-right --count HEAD...@{u}` para comparar la rama actual con su homóloga de seguimiento en el servidor remoto (`upstream`). Si no hay un `upstream` configurado, realiza un fallback probando secuencialmente contra `origin/main` y `origin/master`.
   * **Retorno:** Un diccionario de Python con las claves `{"behind": int, "ahead": int}`.

2. **`git_fetch(project_path)`**
   * **Propósito:** Descargar la información más reciente de ramas, commits y etiquetas del repositorio remoto sin fusionar nada localmente.
   * **Cómo funciona:** Ejecuta de forma asíncrona y silenciosa el comando `git fetch` dentro del directorio del proyecto actual.
   * **Retorno:** Un valor booleano (`True` si se ejecutó exitosamente, `False` en caso de error).

3. **`git_pull(project_path)`**
   * **Propósito:** Descargar y fusionar los cambios de la rama remota directamente a la rama de trabajo local.
   * **Cómo funciona:** Lanza el comando `git pull` en la carpeta del proyecto.
   * **Retorno:** Retorna el string `"success"` si la fusión fue exitosa. En caso de error o conflicto de mezcla, captura los mensajes de salida de error (`stderr`) o salida estándar (`stdout`) de Git y los devuelve como un string descriptivo para mostrar en la interfaz.

---

## [3.0.0] - Integración Real de Git y GitHub
**Fecha:** 20 de Mayo de 2026

### Novedades Relevantes
* **Control de Versiones Real:** Reemplazo de todas las simulaciones de Git por llamadas reales al ejecutable `git` del sistema operativo a través de subprocesos asíncronos en el backend de Python.
* **Sincronización de Repositorios (Push):** Nueva capacidad para realizar `git add`, `git commit` y `git push` reales en el repositorio local y enviarlo a GitHub (u otro remoto) directamente desde la interfaz.
* **Monitoreo de Estado de Archivos:** Detección automática del estado real de los archivos usando `git status --porcelain`. Los archivos son marcados visualmente como "Modificado" (`modified`), "Nuevo" (`new`), o "Al día" (`uptodate`) de forma reactiva.
* **Inicialización y Configuración de Remotos:** Nueva interfaz en "Configuración del Proyecto" que permite inicializar repositorios Git (`git init`), ver el origen remoto actual, y vincular/cambiar la URL del repositorio remoto de GitHub (`origin`).
* **Progreso de Sincronización en Tiempo Real:** Barra de estado dinámica paso a paso que se actualiza en tiempo real mediante señales de PyQt6 (`git_sync_progress`) durante las operaciones de git add, commit y push.
* **Seguridad y Ejecución Background:** Todos los comandos de Git se ejecutan en hilos secundarios (`threading.Thread`) en segundo plano para evitar congelamientos de la interfaz, utilizando banderas que ocultan las consolas del sistema (`creationflags=subprocess.CREATE_NO_WINDOW`).

## [2.3.0] - Persistencia de Metadatos y Accesos Rápidos
**Fecha:** 13 de Mayo de 2026

### Novedades Relevantes
* **Metadatos Persistentes en el Proyecto:** Ahora las descripciones, etiquetas y autores se guardan en `.laminar_metadata.json` dentro de cada proyecto. Esto permite que la documentación viaje con el código aunque se mueva la carpeta.
* **Accesos Rápidos en Sidebar:** Implementación de una sección de "Recientes" en la parte inferior de la barra lateral para saltar entre proyectos sin volver al inicio.
* **Seguridad de Datos:** El archivo de metadatos está oculto en la interfaz para evitar ediciones accidentales pero se sincroniza automáticamente.
* **Optimización de Carga:** Mejora en el escaneo de directorios para ignorar archivos temporales de sistema y basura (`__pycache__`, dotfiles innecesarios).

## [2.2.0] - Persistencia y Refinamiento UX
**Fecha:** 10 de Mayo de 2026

### Novedades Relevante}
* **Sistema de Persistencia:** Implementación de guardado automático de historial de proyectos en JSON local.
* **Dashboard Inteligente:** Pantalla de inicio dinámica que muestra los proyectos reales abiertos recientemente.
* **Ultra-Contraste UI:** Reestructuración de la jerarquía visual para eliminar el efecto "todo blanco" y mejorar la definición de botones y paneles.
* **Carga Seamless:** Integración de estados de navegación para abrir proyectos automáticamente desde la pantalla de bienvenida.

## [2.1.0] - Temas y Localización
**Fecha:** 10 de Mayo de 2026

### Novedades Relevantes
* **Modo Claro Premium:** Implementación de un sistema de temas dual (Claro/Oscuro) con transición fluida.
* **Localización Total:** Traducción completa de la interfaz al español para una mejor experiencia de usuario.
* **Ergonomía UI:** Ajuste de márgenes y espaciado en la barra de herramientas principal.

## [2.0.0] - Arquitectura y Proyectos Reales
**Fecha:** 10 de Mayo de 2026

### Novedades Relevantes
* **Gestión de Archivos Reales:** Integración con el sistema de archivos local para abrir y gestionar proyectos reales mediante `os.scandir` y `QFileDialog`.
* **Navegación Jerárquica:** Sistema de exploración por carpetas con breadcrumbs (migas de pan) para una navegación profunda.
* **Migración a QWebChannel:** Nueva arquitectura de comunicación profesional entre Python y React, eliminando el uso de la consola.
* **Optimización de Renderizado:** Estabilización de la interfaz eliminando parpadeos (flickering) mediante la optimización de capas de la GPU.

## [1.0.0] - Lanzamiento Inicial
**Fecha:** 4 de Mayo de 2026

### Novedades Relevantes
* **Migración a PyQt6:** Transición desde `pywebview` para un control total de la ventana.
* **Ventana Frameless Nativa:** Implementación de bordes de redimensionado nativos en Windows.
* **Interfaz Base:** Creación del sistema de diseño inicial y visualización de archivos.
