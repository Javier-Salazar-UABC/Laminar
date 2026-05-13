import sys
import os
import ctypes
import json
import subprocess
import threading
import socketserver
import http.server
import socket

from PyQt6.QtCore import Qt, QUrl, QObject, pyqtSlot, pyqtSignal
from PyQt6.QtGui import QIcon
from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QFileDialog
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtWebChannel import QWebChannel

class Backend(QObject):
    def __init__(self, window):
        super().__init__()
        self.window = window

    @pyqtSlot()
    def minimize(self):
        self.window.showMinimized()

    @pyqtSlot()
    def maximize(self):
        if self.window.isMaximized():
            self.window.showNormal()
        else:
            self.window.showMaximized()

    @pyqtSlot()
    def close_app(self):
        self.window.close()

    @pyqtSlot()
    def start_drag(self):
        self.window.windowHandle().startSystemMove()

    @pyqtSlot(str, str)
    def open_in_vscode(self, path, folder_path=""):
        try:
            if folder_path:
                # Abrir carpeta y archivo
                subprocess.Popen(["code", folder_path, path], shell=True)
            else:
                # Abrir solo lo que se pase (archivo o carpeta)
                subprocess.Popen(["code", path], shell=True)
        except Exception as e:
            print(f"Error abriendo VS Code: {e}")

    @pyqtSlot(str)
    def sync_repository(self, mensaje):
        print(f"Iniciando sincronización profesional con el mensaje: {mensaje}")
        try:
            # Ejecución en segundo plano para no bloquear la UI
            threading.Thread(target=self._run_git_commands, args=(mensaje,), daemon=True).start()
        except Exception as e:
            print(f"Error iniciando hilo de sincronización: {e}")

    @pyqtSlot(result=str)
    def select_folder(self):
        folder = QFileDialog.getExistingDirectory(self.window, "Seleccionar Carpeta del Proyecto")
        if folder:
            self.save_project(folder)
        return folder

    def save_project(self, path):
        config_path = os.path.join(os.path.expanduser("~"), ".monitor_uabc_config.json")
        projects = []
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    projects = json.load(f)
            except:
                projects = []
        
        # Eliminar si ya existe para moverlo al principio
        projects = [p for p in projects if p['path'] != path]
        
        # Añadir nuevo proyecto
        projects.insert(0, {
            'name': os.path.basename(path),
            'path': path,
            'lastAccessed': 'Recientemente'
        })
        
        # Limitar a los últimos 6
        projects = projects[:6]
        
        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(projects, f, indent=4)
        except Exception as e:
            print(f"Error guardando configuración: {e}")

    @pyqtSlot(result=list)
    def get_recent_projects(self):
        config_path = os.path.join(os.path.expanduser("~"), ".monitor_uabc_config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return []
        return []

    @pyqtSlot(str, result='QVariant')
    def get_project_data(self, root_path):
        if not root_path or not os.path.exists(root_path):
            return {"files": [], "isRepo": False}
        
        is_repo = os.path.exists(os.path.join(root_path, ".git"))
        
        def scan_dir(path):
            items = []
            try:
                for entry in os.scandir(path):
                    if entry.name.startswith('.') or entry.name == 'node_modules':
                        continue
                        
                    item = {
                        "id": entry.path.replace('\\', '/'),
                        "name": entry.name,
                    }
                    
                    if entry.is_dir():
                        item["type"] = "folder"
                        item["children"] = scan_dir(entry.path)
                        item["isOpen"] = False
                    else:
                        item["type"] = "file"
                        item["extension"] = entry.name.split('.')[-1] if '.' in entry.name else ""
                        item["status"] = "uptodate"
                        item["description"] = f"Archivo {item['extension']} del proyecto."
                        item["tags"] = ["local"]
                    
                    items.append(item)
            except Exception as e:
                print(f"Error escaneando {path}: {e}")
            return items

        return {
            "files": scan_dir(root_path),
            "isRepo": is_repo
        }

    def _run_git_commands(self, mensaje):
        try:
            subprocess.run(["git", "add", "."], check=True, creationflags=subprocess.CREATE_NO_WINDOW)
            subprocess.run(["git", "commit", "-m", mensaje], check=True, creationflags=subprocess.CREATE_NO_WINDOW)
            subprocess.run(["git", "push"], check=True, creationflags=subprocess.CREATE_NO_WINDOW)
            print("¡Éxito! Repositorio sincronizado vía QWebChannel.")
        except Exception as e:
            print(f"Error en ejecución Git: {e}")

class EdgeGrip(QWidget):
    def __init__(self, parent, edge):
        super().__init__(parent)
        self.edge = edge
        self.setStyleSheet("background-color: transparent;")
        
        if edge in ['left', 'right']:
            self.setCursor(Qt.CursorShape.SizeHorCursor)
        elif edge in ['top', 'bottom']:
            self.setCursor(Qt.CursorShape.SizeVerCursor)
        elif edge in ['top-left', 'bottom-right']:
            self.setCursor(Qt.CursorShape.SizeFDiagCursor)
        elif edge in ['top-right', 'bottom-left']:
            self.setCursor(Qt.CursorShape.SizeBDiagCursor)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            edges = {
                'top': Qt.Edge.TopEdge,
                'bottom': Qt.Edge.BottomEdge,
                'left': Qt.Edge.LeftEdge,
                'right': Qt.Edge.RightEdge,
                'top-left': Qt.Edge.TopEdge | Qt.Edge.LeftEdge,
                'top-right': Qt.Edge.TopEdge | Qt.Edge.RightEdge,
                'bottom-left': Qt.Edge.BottomEdge | Qt.Edge.LeftEdge,
                'bottom-right': Qt.Edge.BottomEdge | Qt.Edge.RightEdge
            }
            self.window().windowHandle().startSystemResize(edges[self.edge])
            event.accept()

def start_server(path, port):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=path, **kwargs)
        def log_message(self, format, *args):
            pass
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        httpd.serve_forever()

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        
        # ID de aplicación para Windows (para que el icono se vea bien en la barra de tareas)
        myappid = 'uabc.laminar.projectmanager.1.0' 
        try:
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
        except Exception:
            pass
            
        self.setWindowFlags(Qt.WindowType.Window | Qt.WindowType.FramelessWindowHint)
        self.resize(1000, 700)
        self.setWindowTitle('Laminar - Engineering Project Manager')
        
        # Icono de la aplicación
        icon_path = os.path.join(os.path.dirname(__file__), 'web', 'public', 'assets', 'logo.png')
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))
        
        # Iniciar servidor local
        self.dist_path = os.path.join(os.path.dirname(__file__), 'web', 'dist')
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            self.port = s.getsockname()[1]
            
        self.server_thread = threading.Thread(target=start_server, args=(self.dist_path, self.port), daemon=True)
        self.server_thread.start()
        
        # Setup Backend y WebChannel
        self.backend = Backend(self)
        self.channel = QWebChannel()
        self.channel.registerObject('backend', self.backend)
        
        # Vista web
        self.view = QWebEngineView(self)
        self.setCentralWidget(self.view)
        
        # Configurar página con el canal
        self.view.page().setWebChannel(self.channel)
        
        self.view.setUrl(QUrl(f"http://127.0.0.1:{self.port}/index.html"))
        
        # Script de inicialización del lado del cliente
        # Incluye el bridge de compatibilidad pywebview -> QWebChannel
        js_injection = """
        // Cargar qwebchannel.js (inyectado automáticamente por Qt o servido localmente)
        // Usamos una promesa para asegurar que el canal esté listo
        (function() {
            if (typeof QWebChannel !== 'undefined') {
                new QWebChannel(qt.webChannelTransport, function(channel) {
                    window.backend = channel.objects.backend;
                    console.log("QWebChannel conectado con éxito.");
                    
                    // Capa de compatibilidad para el código React existente
                    window.pywebview = {
                        api: {
                            minimize_window: function() { window.backend.minimize(); },
                            maximize_window: function() { window.backend.maximize(); },
                            close_window: function() { window.backend.close_app(); },
                            open_in_vscode: function(path, folderPath) { 
                                window.backend.open_in_vscode(path, folderPath || ""); 
                            },
                            sincronizar_github_python: function(mensaje) { 
                                window.backend.sync_repository(mensaje);
                                return Promise.resolve("Sincronización iniciada.");
                            }
                        }
                    };
                });
            }
        })();

        // Manejo del arrastre (Drag) - Sigue siendo reactivo al mouse
        document.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            let el = e.target;
            while (el) {
                if (el.classList && el.classList.contains('pywebview-drag-region')) {
                    if (e.target.closest('button') || (e.target.style && e.target.style.webkitAppRegion === 'no-drag')) {
                        return;
                    }
                    if (window.backend) window.backend.start_drag();
                    e.preventDefault();
                    break;
                }
                el = el.parentElement;
            }
        });
        """
        
        # Inyectamos el qwebchannel.js oficial de Qt antes que nuestro script
        # Nota: QtWebEngine inyecta automáticamente 'qrc:///qtwebchannel/qwebchannel.js'
        # pero es más seguro añadirlo explícitamente si es necesario.
        
        self.view.loadFinished.connect(lambda ok: self.view.page().runJavaScript(js_injection))

        # Grips de redimensionado
        self.grips = {
            'top': EdgeGrip(self, 'top'), 'bottom': EdgeGrip(self, 'bottom'),
            'left': EdgeGrip(self, 'left'), 'right': EdgeGrip(self, 'right'),
            'top-left': EdgeGrip(self, 'top-left'), 'top-right': EdgeGrip(self, 'top-right'),
            'bottom-left': EdgeGrip(self, 'bottom-left'), 'bottom-right': EdgeGrip(self, 'bottom-right')
        }

    def resizeEvent(self, event):
        super().resizeEvent(event)
        w, h = self.width(), self.height()
        thickness = 8
        self.grips['top'].setGeometry(thickness, 0, w - thickness*2, thickness)
        self.grips['bottom'].setGeometry(thickness, h - thickness, w - thickness*2, thickness)
        self.grips['left'].setGeometry(0, thickness, thickness, h - thickness*2)
        self.grips['right'].setGeometry(w - thickness, thickness, thickness, h - thickness*2)
        self.grips['top-left'].setGeometry(0, 0, thickness, thickness)
        self.grips['top-right'].setGeometry(w - thickness, 0, thickness, thickness)
        self.grips['bottom-left'].setGeometry(0, h - thickness, thickness, thickness)
        self.grips['bottom-right'].setGeometry(w - thickness, h - thickness, thickness, thickness)
        for grip in self.grips.values():
            grip.raise_()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())