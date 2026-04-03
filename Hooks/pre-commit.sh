#!/usr/bin/env bash
# pre-commit.sh — Commit öncesi hızlı kontroller (~5 sn)
# Kullanım: otomatik (git hook) veya manuel: bash Hooks/pre-commit.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0

ok()   { echo "  ✓ $1"; ((PASS++)); }
fail() { echo "  ✗ $1"; ((FAIL++)); }
info() { echo ""; echo "▶ $1"; }

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│     Finans Takip — Pre-Commit Check     │"
echo "└─────────────────────────────────────────┘"

# ── 1. Yasaklı dosyalar ───────────────────────
info "Yasaklı dosya kontrolü"

if git diff --cached --name-only 2>/dev/null | grep -qE "^mcp-server/data/transactions\.json$"; then
  fail "transactions.json commit edilemez (kişisel veri)"
else
  ok "transactions.json commit dışı"
fi

if git diff --cached --name-only 2>/dev/null | grep -qE "(node_modules|/dist/)"; then
  fail "node_modules veya dist commit edilemez"
else
  ok "node_modules/dist commit dışı"
fi

if git diff --cached --name-only 2>/dev/null | grep -qE "\.env"; then
  fail ".env dosyası commit edilemez (secret riski)"
else
  ok ".env dosyası commit dışı"
fi

# ── 2. Büyük dosya kontrolü ───────────────────
info "Dosya boyutu kontrolü (limit: 500 KB)"

BIG=$(git diff --cached --name-only 2>/dev/null | while read -r f; do
  [ -f "$ROOT/$f" ] && SIZE=$(wc -c < "$ROOT/$f") && [ "$SIZE" -gt 512000 ] && echo "$f ($(( SIZE / 1024 ))KB)"
done)

if [ -n "$BIG" ]; then
  fail "Büyük dosya: $BIG"
else
  ok "Tüm dosyalar boyut limitinde"
fi

# ── 3. Secret / API key taraması ─────────────
info "Secret / hardcoded key kontrolü"

STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E "\.(ts|tsx|js|json)$" || true)
SECRET_PATTERN='(api[_-]?key|secret|password|token|private[_-]?key)\s*[:=]\s*["'"'"'][^"'"'"']{8,}'

FOUND_SECRET=""
for f in $STAGED_FILES; do
  [ -f "$ROOT/$f" ] || continue
  if grep -qiE "$SECRET_PATTERN" "$ROOT/$f" 2>/dev/null; then
    FOUND_SECRET="$FOUND_SECRET $f"
  fi
done

if [ -n "$FOUND_SECRET" ]; then
  fail "Olası secret bulundu:$FOUND_SECRET"
else
  ok "Secret bulunamadı"
fi

# ── 4. console.log kontrolü (frontend) ───────
info "console.log kontrolü"

CONSOLE=$(git diff --cached --name-only 2>/dev/null | grep -E "frontend/src/.*\.(ts|tsx)$" | while read -r f; do
  [ -f "$ROOT/$f" ] && grep -l "console\.log" "$ROOT/$f" 2>/dev/null || true
done)

if [ -n "$CONSOLE" ]; then
  fail "console.log bulundu: $CONSOLE"
else
  ok "console.log yok"
fi

# ── 5. package.json geçerliliği ───────────────
info "package.json JSON geçerliliği"

for pkg in "frontend/package.json" "mcp-server/package.json"; do
  if [ -f "$ROOT/$pkg" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('$ROOT/$pkg','utf8'))" 2>/dev/null; then
      ok "$pkg geçerli"
    else
      fail "$pkg geçersiz JSON"
    fi
  fi
done

# ── Sonuç ─────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"
echo "  Geçti: $PASS   Başarısız: $FAIL"
echo "─────────────────────────────────────────"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ❌ Commit engellendi. Hataları düzelt."
  echo ""
  exit 1
fi

echo ""
echo "  ✅ Commit onaylandı."
echo ""
exit 0
