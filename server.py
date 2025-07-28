#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Локальный HTTP сервер для разработки
Запускает сервер на порту 3000 для просмотра HTML файлов
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

def main():
    # Порт для сервера
    PORT = 3000
    
    # Получаем путь к текущей директории
    current_dir = Path(__file__).parent.absolute()
    
    # Переходим в директорию со скриптом
    os.chdir(current_dir)
    
    # Создаем HTTP сервер
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🚀 Сервер запущен на http://localhost:{PORT}")
            print(f"📁 Рабочая директория: {current_dir}")
            print(f"🌐 Открываю браузер...")
            print(f"⏹️  Для остановки сервера нажмите Ctrl+C")
            print("-" * 50)
            
            # Открываем браузер автоматически
            webbrowser.open(f"http://localhost:{PORT}")
            
            # Запускаем сервер
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n🛑 Сервер остановлен")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Ошибка: Порт {PORT} уже занят!")
            print(f"💡 Попробуйте другой порт или остановите процесс на порту {PORT}")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
