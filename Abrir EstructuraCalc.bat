@echo off
echo Iniciando EstructuraCalc...

:: Matar servidor anterior si existe
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Iniciar servidor Python con CORS
start "" /B python server.py

:: Esperar a que levante
timeout /t 2 /nobreak >nul

:: Abrir navegador
start "" "http://localhost:3001"

exit
