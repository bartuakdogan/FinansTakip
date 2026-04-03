#!/usr/bin/env bash
# pre-push.sh — Push öncesi tam kontrol (~30 sn)
# Kullanım: otomatik (git hook) veya manuel: bash Hooks/pre-push.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-$(which node 2>/dev/null || echo '/Users/bartuakdogan/.nvm/versions/node/v24.14.1/bin/node')}"
NPM_BIN="${NPM_BIN:-$(which npm 2>/dev/null || echo '/Users/bartuakdogan/.nvm/versions/node/v24.14.1/bin/npm')}"
PASS=0; FAIL=0; WARN=0

ok()   { echo "  ✓ $1"; ((PASS++)); }
fail() { echo "  ✗ $1"; ((FAIL++)); }
warn() { echo "  ⚠ $1"; ((WARN++)); }
info() { echo ""; echo "▶ $1"; }

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│      Finans Takip — Pre-Push Check      │"
echo "└─────────────────────────────────────────┘"

# ── 1. .gitignore kontrolü ────────────────────
info ".gitignore zorunlu girişleri"

GITIGNORE="$ROOT/.gitignore"
REQUIRED_IGNORES=("node_modules" "dist" "transactions.json" ".env")
if [ -f "$GITIGNORE" ]; then
  for entry in "${REQUIRED_IGNORES[@]}"; do
    if grep -q "$entry" "$GITIGNORE"; then
      ok ".gitignore: $entry"
    else
      warn ".gitignore'da eksik: $entry"
    fi
  done
else
  fail ".gitignore dosyası yok"
fi

# ── 2. TypeScript tip kontrolü ────────────────
info "TypeScript derleyici kontrolü (frontend)"

TSCONFIG="$ROOT/frontend/tsconfig.app.json"
if [ -f "$TSCONFIG" ]; then
  cd "$ROOT/frontend"
  if "$NODE_BIN" "$("$NPM_BIN" bin 2>/dev/null)/tsc" --noEmit 2>&1 | grep -q "error TS"; then
    fail "TypeScript hataları var (tsc --noEmit)"
  else
    ok "TypeScript tip kontrolü geçti"
  fi
  cd "$ROOT"
else
  warn "tsconfig.app.json bulunamadı, tip kontrolü atlandı"
fi

# ── 3. Frontend build testi ───────────────────
info "Frontend build kontrolü (vite build)"

cd "$ROOT/frontend"
if "$NPM_BIN" run build --silent 2>&1 | tail -5 | grep -qiE "(error|failed)"; then
  fail "Frontend build başarısız"
else
  ok "Frontend build başarılı"
fi
cd "$ROOT"

# ── 4. Backend syntax kontrolü ────────────────
info "Backend syntax kontrolü (tsx check)"

BACKEND_SRC="$ROOT/mcp-server/src/index.ts"
if [ -f "$BACKEND_SRC" ]; then
  if "$NODE_BIN" --input-type=module <<< "import '$BACKEND_SRC'" 2>&1 | grep -qiE "SyntaxError"; then
    fail "Backend syntax hatası"
  else
    ok "Backend syntax geçerli"
  fi
fi

# ── 5. Bağımlılık güvenlik taraması ──────────
info "Bağımlılık kontrolü (npm audit)"

cd "$ROOT/frontend"
AUDIT_OUT=$("$NPM_BIN" audit --audit-level=high 2>&1 || true)
if echo "$AUDIT_OUT" | grep -q "high\|critical"; then
  fail "Yüksek/kritik güvenlik açığı var (npm audit)"
else
  ok "Frontend bağımlılıkları güvenli"
fi

cd "$ROOT/mcp-server"
AUDIT_OUT=$("$NPM_BIN" audit --audit-level=high 2>&1 || true)
if echo "$AUDIT_OUT" | grep -q "high\|critical"; then
  fail "Yüksek/kritik güvenlik açığı var (mcp-server)"
else
  ok "Backend bağımlılıkları güvenli"
fi
cd "$ROOT"

# ── 6. localhost hardcode kontrolü ────────────
info "Hardcoded localhost kontrolü"

# Sadece mcpClient.ts'de olmasına izin ver
LOCALHOST_FILES=$(grep -rl "localhost:3001" "$ROOT/frontend/src" \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "mcpClient.ts" || true)

if [ -n "$LOCALHOST_FILES" ]; then
  fail "localhost:3001 mcpClient.ts dışında kullanılmış: $LOCALHOST_FILES"
else
  ok "localhost referansları sadece mcpClient.ts'de"
fi

# ── 7. Büyük dosya taraması (tüm repo) ───────
info "Büyük dosya taraması (>500 KB)"

BIG=$(find "$ROOT" -type f -size +512k \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  2>/dev/null | head -5)

if [ -n "$BIG" ]; then
  warn "Büyük dosya(lar) bulundu (git'e ekleme):\n$BIG"
else
  ok "500 KB üzeri dosya yok"
fi

# ── Sonuç ─────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"
echo "  Geçti: $PASS   Uyarı: $WARN   Başarısız: $FAIL"
echo "─────────────────────────────────────────"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ❌ Push engellendi. $FAIL hata düzeltilmeli."
  echo ""
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo ""
  echo "  ⚠  Push devam ediyor ama $WARN uyarı var."
fi

echo ""
echo "  ✅ Push onaylandı."
echo ""
exit 0
