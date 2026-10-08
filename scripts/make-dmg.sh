#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "$(uname)" != "Darwin" ]]; then
  echo "A DMG can only be built on macOS."
  exit 1
fi

npm install
npm run build
rm -rf release
npx electron-builder --mac dmg --publish never -c.mac.identity=null

dmg=$(ls -t release/*.dmg | head -n 1)
destination="$HOME/Downloads/$(basename "$dmg")"
cp "$dmg" "$destination"

echo ""
echo "Saved $destination"
