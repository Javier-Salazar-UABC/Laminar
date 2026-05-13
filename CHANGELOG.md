# Historial de Cambios - Laminar

## [2.2.0] - Persistencia y Refinamiento UX
**Fecha:** 10 de Mayo de 2026

### Novedades Relevantes
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
