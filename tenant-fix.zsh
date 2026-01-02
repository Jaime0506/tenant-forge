#!/bin/zsh

echo ""
echo "═══════════════════════════════════════════════"
echo "   🛠️  macOS App Unlocker - Dev Edition"
echo "═══════════════════════════════════════════════"
echo ""

read "APP_PATH?📦 Arrastra aquí tu archivo .app y presiona ENTER: "

APP_PATH="${APP_PATH/#\~/$HOME}"

if [ ! -d "$APP_PATH" ]; then
  echo ""
  echo "❌ La ruta no existe o no es una aplicación válida:"
  echo "   $APP_PATH"
  exit 1
fi

echo ""
echo "📍 Aplicación detectada:"
echo "   $APP_PATH"
echo ""

echo "🔓 Quitando quarantine flag..."
xattr -rd com.apple.quarantine "$APP_PATH"

echo "🔐 Corrigiendo permisos..."
chmod -R +x "$APP_PATH"

echo "🪪 Re-firmando localmente (ad-hoc)..."
codesign --force --deep --sign - "$APP_PATH"
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Error al firmar la aplicación."
  exit 1
fi

echo ""
echo "🚀 Aplicación desbloqueada correctamente."
