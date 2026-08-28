@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 天使桥前端服务
echo 正在启动天使桥前端...
echo 浏览器地址：http://127.0.0.1:4173/
echo 请保持此窗口开启；按 Ctrl+C 可停止服务。
echo.
npm run dev
if errorlevel 1 (
  echo.
  echo 启动失败，请确认已安装 Node.js 20 或更高版本。
  pause
)
