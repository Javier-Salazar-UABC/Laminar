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
    git_sync_progress = pyqtSignal(str)

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

    @pyqtSlot(str, str, list)
    def sync_repository(self, project_path, mensaje, file_paths):
        print(f"Iniciando sincronización para {project_path} con el mensaje: {mensaje}")
        try:
            # Ejecución en segundo plano para no bloquear la UI
            threading.Thread(target=self._run_git_commands, args=(project_path, mensaje, file_paths), daemon=True).start()
        except Exception as e:
            print(f"Error iniciando hilo de sincronización: {e}")
            self.git_sync_progress.emit(json.dumps({"status": "error", "message": str(e)}))

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
                    projects = json.load(f)
                
                # Filtrar proyectos cuya carpeta ya no existe en disco
                valid_projects = [p for p in projects if os.path.exists(p.get('path', ''))]
                
                # Si se eliminó alguno, persistir la lista limpia
                if len(valid_projects) != len(projects):
                    try:
                        with open(config_path, 'w', encoding='utf-8') as f:
                            json.dump(valid_projects, f, indent=4)
                    except Exception:
                        pass
                
                return valid_projects
            except:
                return []
        return []

    @pyqtSlot(str, str, 'QVariant')
    def save_file_metadata(self, project_path, file_id, metadata):
        metadata_path = os.path.join(project_path, ".laminar_metadata.json")
        all_metadata = {}
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    all_metadata = json.load(f)
            except:
                all_metadata = {}
        
        all_metadata[file_id] = metadata
        
        try:
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(all_metadata, f, indent=4)
            return True
        except Exception as e:
            print(f"Error guardando metadatos: {e}")
            return False

    @pyqtSlot(str, result='QVariant')
    def get_project_data(self, root_path):
        if not root_path or not os.path.exists(root_path):
            return {"files": [], "isRepo": False, "pathExists": False}
        
        is_repo = os.path.exists(os.path.join(root_path, ".git"))
        metadata_path = os.path.join(root_path, ".laminar_metadata.json")
        project_metadata = {}
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    project_metadata = json.load(f)
            except:
                project_metadata = {}
        
        git_statuses = {}
        deleted_files = {}  # Archivos eliminados localmente (D en git status)
        if is_repo:
            try:
                res = subprocess.run(
                    ["git", "status", "--porcelain"],
                    cwd=root_path,
                    capture_output=True,
                    text=True,
                    check=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                for line in res.stdout.splitlines():
                    if len(line) >= 4:
                        status_code = line[:2]
                        file_path = line[3:].strip()
                        if file_path.startswith('"') and file_path.endswith('"'):
                            file_path = file_path[1:-1]
                        abs_path = os.path.abspath(os.path.join(root_path, file_path)).replace('\\', '/')
                        
                        if 'M' in status_code:
                            git_statuses[abs_path] = 'modified'
                        elif '?' in status_code:
                            git_statuses[abs_path] = 'new'
                        elif 'A' in status_code:
                            git_statuses[abs_path] = 'selected'
                        elif 'D' in status_code:
                            git_statuses[abs_path] = 'deleted'
                            # Guardar rutas relativas para los archivos eliminados
                            deleted_files[abs_path] = file_path
            except Exception as e:
                print(f"Error running git status: {e}")
        
        def scan_dir(path):
            items = []
            try:
                for entry in os.scandir(path):
                    if entry.name.startswith('.') or entry.name == 'node_modules' or entry.name == '__pycache__':
                        continue
                        
                    item_id = entry.path.replace('\\', '/')
                    item = {
                        "id": item_id,
                        "name": entry.name,
                    }
                    
                    if entry.is_dir():
                        item["type"] = "folder"
                        item["children"] = scan_dir(entry.path)
                        item["isOpen"] = False
                    else:
                        item["type"] = "file"
                        item["extension"] = entry.name.split('.')[-1] if '.' in entry.name else ""
                        
                        # Match status from git status
                        if item_id in git_statuses:
                            item["status"] = git_statuses[item_id]
                        else:
                            item["status"] = "uptodate"
                        
                        # Cargar metadatos persistidos o usar por defecto
                        if item_id in project_metadata:
                            m = project_metadata[item_id]
                            item["description"] = m.get("description", f"Archivo {item['extension']} del proyecto.")
                            item["tags"] = m.get("tags", ["local"])
                            item["author"] = m.get("author", "Usuario Local")
                        else:
                            item["description"] = f"Archivo {item['extension']} del proyecto."
                            item["tags"] = ["local"]
                            item["author"] = "Usuario Local"
                    
                    items.append(item)
            except Exception as e:
                print(f"Error escaneando {path}: {e}")
            return items

        scanned = scan_dir(root_path)
        
        # Inyectar archivos eliminados en el árbol de carpetas correspondiente
        if is_repo and deleted_files:
            def inject_deleted_into_tree(nodes, deleted_abs_path, rel_path, file_metadata):
                """Inserta un nodo de archivo eliminado en la posición correcta del árbol."""
                # Calcular la carpeta padre del archivo eliminado
                parent_abs = os.path.dirname(deleted_abs_path).replace('\\', '/')
                
                for node in nodes:
                    if node.get('type') == 'folder' and node['id'] == parent_abs:
                        # Insertar el archivo en esta carpeta
                        node.setdefault('children', []).append(file_metadata)
                        return True
                    elif node.get('type') == 'folder' and node.get('children'):
                        if inject_deleted_into_tree(node['children'], deleted_abs_path, rel_path, file_metadata):
                            return True
                return False
            
            for abs_path, rel_path in deleted_files.items():
                file_name = os.path.basename(rel_path)
                ext = file_name.split('.')[-1] if '.' in file_name else ''
                m = project_metadata.get(abs_path, {})
                deleted_node = {
                    "id": abs_path,
                    "name": file_name,
                    "type": "file",
                    "extension": ext,
                    "status": "deleted",
                    "description": m.get("description", f"Archivo eliminado localmente."),
                    "tags": m.get("tags", ["eliminado"]),
                    "author": m.get("author", "Usuario Local"),
                }
                
                parent_abs = os.path.dirname(abs_path).replace('\\', '/')
                
                if parent_abs == root_path.replace('\\', '/'):
                    # El archivo está en la raíz del proyecto
                    scanned.append(deleted_node)
                else:
                    # Intentar insertar en el árbol; si no se encuentra la carpeta, añadir a la raíz
                    inserted = inject_deleted_into_tree(scanned, abs_path, rel_path, deleted_node)
                    if not inserted:
                        scanned.append(deleted_node)
        
        return {
            "files": scanned,
            "isRepo": is_repo
        }

    @pyqtSlot(str, result=bool)
    def git_init(self, project_path):
        if not project_path or not os.path.exists(project_path):
            return False
        try:
            subprocess.run(
                ["git", "init"],
                cwd=project_path,
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return True
        except Exception as e:
            print(f"Error in git init: {e}")
            return False

    @pyqtSlot(str, result=str)
    def git_get_remote(self, project_path):
        if not project_path or not os.path.exists(project_path):
            return ""
        try:
            result = subprocess.run(
                ["git", "remote", "get-url", "origin"],
                cwd=project_path,
                capture_output=True,
                text=True,
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return result.stdout.strip()
        except Exception:
            return ""

    @pyqtSlot(str, str, result=bool)
    def git_set_remote(self, project_path, remote_url):
        if not project_path or not os.path.exists(project_path):
            return False
        try:
            check_remote = subprocess.run(
                ["git", "remote"],
                cwd=project_path,
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            remotes = check_remote.stdout.split()
            if "origin" in remotes:
                if remote_url.strip():
                    subprocess.run(
                        ["git", "remote", "set-url", "origin", remote_url],
                        cwd=project_path,
                        check=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                else:
                    subprocess.run(
                        ["git", "remote", "remove", "origin"],
                        cwd=project_path,
                        check=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
            else:
                if remote_url.strip():
                    subprocess.run(
                        ["git", "remote", "add", "origin", remote_url],
                        cwd=project_path,
                        check=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
            return True
        except Exception as e:
            print(f"Error en git_set_remote: {e}")
            return False

    def _run_git_commands(self, project_path, mensaje, file_paths):
        try:
            self.git_sync_progress.emit(json.dumps({"status": "started"}))
            
            # Step 1: Add files
            if file_paths:
                for path in file_paths:
                    # Usamos 'git add -A -- <path>' para manejar tanto
                    # modificaciones/nuevos como eliminaciones (deleted).
                    subprocess.run(
                        ["git", "add", "-A", "--", path],
                        cwd=project_path,
                        check=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
            else:
                subprocess.run(
                    ["git", "add", "-A"],
                    cwd=project_path,
                    check=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
            self.git_sync_progress.emit(json.dumps({"status": "added"}))
            
            # Step 2: Commit
            subprocess.run(
                ["git", "commit", "-m", mensaje],
                cwd=project_path,
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            self.git_sync_progress.emit(json.dumps({"status": "committed"}))
            
            # Step 3: Branch detection
            branch_result = subprocess.run(
                ["git", "branch", "--show-current"],
                cwd=project_path,
                capture_output=True,
                text=True,
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            branch = branch_result.stdout.strip() or "main"
            
            # Step 4: Push to origin
            remote_result = subprocess.run(
                ["git", "remote"],
                cwd=project_path,
                capture_output=True,
                text=True,
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            if "origin" not in remote_result.stdout:
                raise Exception("No se ha configurado el repositorio remoto 'origin'. Ve a la Configuración del Proyecto.")

            push_res = subprocess.run(
                ["git", "push", "-u", "origin", branch],
                cwd=project_path,
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            if push_res.returncode != 0:
                err_msg = push_res.stderr.strip()
                if push_res.stdout:
                    err_msg += "\n" + push_res.stdout.strip()
                raise Exception(err_msg)
                
            self.git_sync_progress.emit(json.dumps({"status": "success"}))
        except Exception as e:
            print(f"Error en ejecución Git: {e}")
            self.git_sync_progress.emit(json.dumps({"status": "error", "message": str(e)}))

    @pyqtSlot(str, result='QVariant')
    def git_check_sync_status(self, project_path):
        if not project_path or not os.path.exists(project_path):
            return {"behind": 0, "ahead": 0, "emptyRepo": False}
        
        is_repo = os.path.exists(os.path.join(project_path, ".git"))
        if not is_repo:
            return {"behind": 0, "ahead": 0, "emptyRepo": False}
        
        # Detectar si el repo local no tiene commits aún
        head_check = subprocess.run(
            ["git", "rev-parse", "--verify", "HEAD"],
            cwd=project_path,
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        has_local_commits = (head_check.returncode == 0)
        
        behind = 0
        ahead = 0
        empty_repo = False
        
        try:
            if not has_local_commits:
                # Repo vacío: hacer fetch para obtener info remota
                empty_repo = True
                fetch_res = subprocess.run(
                    ["git", "fetch", "--all"],
                    cwd=project_path,
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                # Contar commits en el remoto (origin/main o origin/master)
                for default_branch in ["origin/main", "origin/master"]:
                    count_res = subprocess.run(
                        ["git", "rev-list", "--count", default_branch],
                        cwd=project_path,
                        capture_output=True,
                        text=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    if count_res.returncode == 0:
                        try:
                            behind = int(count_res.stdout.strip())
                        except ValueError:
                            behind = 0
                        break
            else:
                res = subprocess.run(
                    ["git", "rev-list", "--left-right", "--count", "HEAD...@{u}"],
                    cwd=project_path,
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                if res.returncode == 0:
                    parts = res.stdout.strip().split()
                    if len(parts) == 2:
                        ahead = int(parts[0])
                        behind = int(parts[1])
                else:
                    for default_branch in ["origin/main", "origin/master"]:
                        res2 = subprocess.run(
                            ["git", "rev-list", "--left-right", "--count", f"HEAD...{default_branch}"],
                            cwd=project_path,
                            capture_output=True,
                            text=True,
                            creationflags=subprocess.CREATE_NO_WINDOW
                        )
                        if res2.returncode == 0:
                            parts = res2.stdout.strip().split()
                            if len(parts) == 2:
                                ahead = int(parts[0])
                                behind = int(parts[1])
                                break
        except Exception as e:
            print(f"Error checking sync status: {e}")
            
        return {"behind": behind, "ahead": ahead, "emptyRepo": empty_repo}

    @pyqtSlot(str, result=bool)
    def git_fetch(self, project_path):
        if not project_path or not os.path.exists(project_path):
            return False
        try:
            subprocess.run(
                ["git", "fetch"],
                cwd=project_path,
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return True
        except Exception as e:
            print(f"Error running git fetch: {e}")
            return False

    @pyqtSlot(str, result=str)
    def git_pull(self, project_path):
        if not project_path or not os.path.exists(project_path):
            return "Ruta de proyecto inválida."
        try:
            # Verificar si el repo tiene commits locales
            head_check = subprocess.run(
                ["git", "rev-parse", "--verify", "HEAD"],
                cwd=project_path,
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            has_local_commits = (head_check.returncode == 0)
            
            if not has_local_commits:
                # Repo vacío: intentar pull inicial desde origin/main o origin/master
                for branch in ["main", "master"]:
                    res = subprocess.run(
                        ["git", "pull", "origin", branch, "--allow-unrelated-histories"],
                        cwd=project_path,
                        capture_output=True,
                        text=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    if res.returncode == 0:
                        # Establecer la rama de seguimiento
                        subprocess.run(
                            ["git", "branch", "--set-upstream-to", f"origin/{branch}", branch],
                            cwd=project_path,
                            capture_output=True,
                            creationflags=subprocess.CREATE_NO_WINDOW
                        )
                        return "success"
                return "No se pudo obtener del remoto. Verifica la URL y que la rama 'main' o 'master' exista."
            else:
                res = subprocess.run(
                    ["git", "pull"],
                    cwd=project_path,
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                if res.returncode == 0:
                    return "success"
                else:
                    return res.stderr.strip() or res.stdout.strip() or "Error al ejecutar git pull"
        except Exception as e:
            return str(e)

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
                            sincronizar_github_python: function(projectPath, mensaje, filePaths) { 
                                window.backend.sync_repository(projectPath, mensaje, filePaths);
                                return Promise.resolve("Sincronización iniciada.");
                            },
                            git_init: function(projectPath) {
                                return window.backend.git_init(projectPath);
                            },
                            git_get_remote: function(projectPath) {
                                return window.backend.git_get_remote(projectPath);
                            },
                            git_set_remote: function(projectPath, remoteUrl) {
                                return window.backend.git_set_remote(projectPath, remoteUrl);
                            },
                            git_check_sync_status: function(projectPath) {
                                return window.backend.git_check_sync_status(projectPath);
                            },
                            git_fetch: function(projectPath) {
                                return window.backend.git_fetch(projectPath);
                            },
                            git_pull: function(projectPath) {
                                return window.backend.git_pull(projectPath);
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