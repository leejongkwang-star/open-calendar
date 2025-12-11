@echo off
echo ========================================
echo 서버 시작 스크립트
echo ========================================
echo.

echo 백엔드 서버를 시작합니다...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo 프론트엔드 서버를 시작합니다...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo 서버가 별도 창에서 시작되었습니다.
echo ========================================
echo.
echo 백엔드: http://localhost:3001
echo 프론트엔드: http://localhost:5173
echo.
pause

