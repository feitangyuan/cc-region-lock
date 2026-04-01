#!/bin/zsh
set -euo pipefail

REPO_SLUG="${CC_REGION_LOCK_REPO:-feitangyuan/cc-region-lock}"
REF="${CC_REGION_LOCK_REF:-main}"
INSTALL_ROOT="${HOME}/.local/share/cc-region-lock"
BIN_DIR="${HOME}/.local/bin"
ARCHIVE_URL="https://github.com/${REPO_SLUG}/archive/refs/heads/${REF}.tar.gz"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$INSTALL_ROOT" "$BIN_DIR"

curl -fsSL "$ARCHIVE_URL" -o "$TMP_DIR/release.tar.gz"
tar -xzf "$TMP_DIR/release.tar.gz" -C "$TMP_DIR"

EXTRACTED_DIR="$TMP_DIR/cc-region-lock-${REF}"
rm -rf "$INSTALL_ROOT/current"
mkdir -p "$INSTALL_ROOT/current"
cp -R "$EXTRACTED_DIR"/. "$INSTALL_ROOT/current/"

cat > "$BIN_DIR/cc-region-lock" <<EOF
#!/bin/zsh
exec node "$INSTALL_ROOT/current/bin/region-lock.mjs" "\$@"
EOF

cat > "$BIN_DIR/cc-region-check" <<EOF
#!/bin/zsh
exec node "$INSTALL_ROOT/current/bin/region-check.mjs" "\$@"
EOF

cat > "$BIN_DIR/cc-egress-check" <<EOF
#!/bin/zsh
exec node "$INSTALL_ROOT/current/bin/region-egress-check.mjs" "\$@"
EOF

cat > "$BIN_DIR/cc-region-health" <<EOF
#!/bin/zsh
exec node "$INSTALL_ROOT/current/bin/region-health.mjs" "\$@"
EOF

cat > "$BIN_DIR/cc-region-proxy" <<EOF
#!/bin/zsh
exec node "$INSTALL_ROOT/current/bin/region-proxy.mjs" "\$@"
EOF

chmod +x \
  "$BIN_DIR/cc-region-lock" \
  "$BIN_DIR/cc-region-check" \
  "$BIN_DIR/cc-egress-check" \
  "$BIN_DIR/cc-region-health" \
  "$BIN_DIR/cc-region-proxy"

echo "Installed: $BIN_DIR/cc-region-lock"
echo "Usage:"
echo "  cc-region-lock"
echo "  cc-region-lock --check"
echo "  cc-egress-check"
echo "  cc-region-check"
echo "  cc-region-health"
