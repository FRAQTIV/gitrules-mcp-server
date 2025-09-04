#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 v<version> (e.g. v0.3.1)" >&2
  exit 1
fi
VERSION=$1
TARBALL_URL="https://github.com/FRAQTIV/gitrules-mcp-server/archive/refs/tags/${VERSION}.tar.gz"
TMPFILE=$(mktemp)
curl -L -s "$TARBALL_URL" -o "$TMPFILE"
SHA=$(shasum -a 256 "$TMPFILE" | awk '{print $1}')
FORMULA=Formula/gitrules-mcp.rb
sed -i '' -E "s#(url \"https://github.com/.*/v)[0-9.]+(\.tar\.gz\")#\\1${VERSION#v}\\2#" "$FORMULA" || true
sed -i '' -E "s/sha256 \"[a-f0-9]+\"/sha256 \"$SHA\"/" "$FORMULA"
echo "Updated $FORMULA to $VERSION with sha256 $SHA"
