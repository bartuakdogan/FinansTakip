#!/usr/bin/env bash
# check-project.sh — Kapsamlı proje sağlık kontrolü (~45 sn)
# Kullanım: bash Hooks/check-project.sh
# Opsiyonel: --watch (dosya değişikliklerini izle, macOS gerektirir)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-$(which node 2>/dev/null || echo '/Users/bartuakdogan/.nvm/versions/node/v24.14.1/bin/node')}"
NPM_BIN="${NPM_BIN:-$(which npm 2>/dev/null || echo '/Users/bartuakdogan/.nvm/versions/node/v24.14.1/bin/npm')}"
PASS=0; FAIL=0; WARN=0

ok()   { echo "  ✓ $1"; ((PASS++)); }
fail() { echo "  ✗ $1"; ((FAIL++)); }
warn() { echo "  ⚠ $1"; ((WARN++)); }
info() { echo ""; echo "▶ $1"; }
sep()  { echo ""; echo "══════════════════════════════════════════"; }

run_checks() {
  PASS=0; FAIL=0; WARN=0
  echo ""
  echo "┌──────────────────────────────────────────────┐"
  echo "│   Finans Takip — Proje Sağlık Kontrolü       │"
  printf "│   %-44s│\n" "$(date '+%d.%m.%Y %H:%M:%S')"
  echo "└──────────────────────────────────────────────┘"

  # ══ BÖLÜM 1: Dosya Yapısı ═══════════════════
  sep
  info "Bölüm 1: Zorunlu dosya yapısı"

  REQUIRED_FILES=(
    "frontend/package.json"
    "frontend/src/App.tsx"
    "frontend/src/lib/mcpClient.ts"
    "frontend/src/components/TransactionList.tsx"
    "frontend/src/components/TransactionForm.tsx"
    "frontend/src/components/SummaryCard.tsx"
    "frontend/src/components/PieChart.tsx"
    "mcp-server/package.json"
    "mcp-server/src/index.ts"
    "landing/index.html"
  )

  for f in "${REQUIRED_FILES[@]}"; do
    if [ -f "$ROOT/$f" ]; then
      ok "$f"
    else
      fail "$f eksik"
    fi
  done

  # ══ BÖLÜM 2: .gitignore ══════════════════════
  sep
  info "Bölüm 2: .gitignore kontrolü"

  GITIGNORE="$ROOT/.gitignore"
  if [ -f "$GITIGNORE" ]; then
    for entry in "node_modules" "dist" "transactions.json" ".env"; do
      if grep -q "$entry" "$GITIGNORE"; then
        ok ".gitignore: $entry"
      else
        warn ".gitignore'da eksik: $entry"
      fi
    done
  else
    fail ".gitignore yok — oluşturulmalı"
  fi

  # ══ BÖLÜM 3: Kod kalitesi ════════════════════
  sep
  info "Bölüm 3: Kod kalitesi"

  # console.log taraması
  CL=$(grep -rn "console\.log" "$ROOT/frontend/src" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$CL" -eq 0 ]; then
    ok "console.log: yok"
  else
    warn "console.log: $CL adet bulundu (geliştirme aşamasında normal)"
  fi

  # TypeScript any kullanımı
  ANY=$(grep -rn ": any" "$ROOT/frontend/src" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$ANY" -eq 0 ]; then
    ok "TypeScript any: kullanılmıyor"
  else
    warn "TypeScript any: $ANY kullanım (tip güvenliğini azaltır)"
  fi

  # TODO/FIXME sayısı
  TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" "$ROOT/frontend/src" "$ROOT/mcp-server/src" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TODOS" -eq 0 ]; then
    ok "TODO/FIXME: yok"
  else
    warn "TODO/FIXME: $TODOS adet (takip edilmeli)"
  fi

  # localhost dışı hardcode URL
  LOCALHOST_FILES=$(grep -rl "localhost:3001" "$ROOT/frontend/src" \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "mcpClient.ts" || true)
  if [ -z "$LOCALHOST_FILES" ]; then
    ok "localhost referansı: sadece mcpClient.ts"
  else
    fail "localhost:3001 mcpClient dışında: $LOCALHOST_FILES"
  fi

  # ══ BÖLÜM 4: Port çakışma kontrolü ══════════
  sep
  info "Bölüm 4: Port durumu"

  if lsof -i :3001 -sTCP:LISTEN -t &>/dev/null; then
    ok "Port 3001: MCP server çalışıyor"
  else
    warn "Port 3001: MCP server çalışmıyor (başlatın: npm run dev)"
  fi

  if lsof -i :5173 -sTCP:LISTEN -t &>/dev/null; then
    ok "Port 5173: Frontend çalışıyor"
  else
    warn "Port 5173: Frontend çalışmıyor (başlatın: npm run dev)"
  fi

  # ══ BÖLÜM 5: Bağımlılık sağlığı ═════════════
  sep
  info "Bölüm 5: Bağımlılık durumu"

  for dir in "frontend" "mcp-server"; do
    if [ -d "$ROOT/$dir/node_modules" ]; then
      ok "$dir/node_modules kurulu"
    else
      fail "$dir/node_modules eksik (npm install çalıştır)"
    fi
  done

  # Kritik frontend bağımlılıkları
  FRONTEND_DEPS=("react" "recharts" "lucide-react")
  for dep in "${FRONTEND_DEPS[@]}"; do
    if [ -d "$ROOT/frontend/node_modules/$dep" ]; then
      ok "frontend dep: $dep"
    else
      fail "frontend dep eksik: $dep"
    fi
  done

  # ══ BÖLÜM 6: Veri dosyası kontrolü ══════════
  sep
  info "Bölüm 6: Veri bütünlüğü"

  DATA_FILE="$ROOT/mcp-server/data/transactions.json"
  if [ -f "$DATA_FILE" ]; then
    if "$NODE_BIN" -e "JSON.parse(require('fs').readFileSync('$DATA_FILE','utf8'))" 2>/dev/null; then
      COUNT=$("$NODE_BIN" -e "console.log(JSON.parse(require('fs').readFileSync('$DATA_FILE','utf8')).length)" 2>/dev/null || echo "?")
      ok "transactions.json geçerli ($COUNT kayıt)"
    else
      fail "transactions.json geçersiz JSON — veri bozuk!"
    fi
  else
    warn "transactions.json yok (ilk başlatmada otomatik oluşur)"
  fi

  # ══ BÖLÜM 7: Büyük dosya taraması ═══════════
  sep
  info "Bölüm 7: Dosya boyutu taraması"

  BIG=$(find "$ROOT" -type f -size +512k \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    2>/dev/null)

  if [ -z "$BIG" ]; then
    ok "500 KB üzeri kaynak dosya yok"
  else
    warn "Büyük dosyalar (git'e ekleme):"
    echo "$BIG" | while read -r f; do
      SIZE=$(du -sh "$f" 2>/dev/null | cut -f1)
      echo "    → $SIZE  ${f#$ROOT/}"
    done
  fi

  # ══ ÖZET ═════════════════════════════════════
  sep
  echo ""
  if   [ "$FAIL" -gt 0 ]; then COLOR="\033[0;31m"; ICON="❌"
  elif [ "$WARN" -gt 0 ]; then COLOR="\033[0;33m"; ICON="⚠ "
  else                          COLOR="\033[0;32m"; ICON="✅"
  fi

  printf "${COLOR}  %s  Geçti: %d   Uyarı: %d   Başarısız: %d\033[0m\n" \
    "$ICON" "$PASS" "$WARN" "$FAIL"
  echo ""

  [ "$FAIL" -gt 0 ] && return 1 || return 0
}

# ── Watch modu ────────────────────────────────
if [ "$1" = "--watch" ]; then
  echo "👁  Watch modu aktif — Ctrl+C ile durdur"
  echo "   İzlenen: frontend/src, mcp-server/src"
  run_checks || true
  if command -v fswatch &>/dev/null; then
    fswatch -r -l 2 "$ROOT/frontend/src" "$ROOT/mcp-server/src" | while read -r _; do
      clear
      run_checks || true
    done
  else
    echo ""
    echo "  fswatch kurulu değil. Yüklemek için:"
    echo "  brew install fswatch"
    echo ""
    echo "  Manuel tekrar için scripti yeniden çalıştır."
  fi
else
  run_checks
fi
