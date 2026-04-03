# Finans Takip — Proje Kuralları

## Genel Kurallar

| # | Kural | Neden |
|---|-------|-------|
| 1 | `console.log` production kodunda olmamalı | Log sızıntısı / performans |
| 2 | Hardcoded secret / API key yasak | Güvenlik |
| 3 | `localhost` URL'leri sadece `mcpClient.ts` içinde olmalı | Taşınabilirlik |
| 4 | `any` tipi TypeScript'te yasak (frontend) | Type safety |
| 5 | Büyük dosya (>500 KB) commit edilemez | Repo şişmesi |
| 6 | `node_modules/` ve `dist/` commit edilemez | Build artifact kirliliği |
| 7 | `data/transactions.json` commit edilemez | Kişisel veri gizliliği |
| 8 | Her iki paket de build başarısız olmamalı | CI güvencesi |
| 9 | Port 3001 (backend) ve 5173 (frontend) sabit kalmalı | Servis bağımlılığı |
| 10 | `package.json` geçerli JSON olmalı | Bozuk bağımlılık riski |

## Dosya & Klasör Yapısı

```
finans-takip/
├── mcp-server/          # Node.js / Express backend (port 3001)
│   ├── src/index.ts     # Ana server dosyası
│   └── data/            # .gitignore'da olmalı (transactions.json)
├── frontend/            # React + Vite + TypeScript (port 5173)
│   ├── src/
│   │   ├── lib/mcpClient.ts   # Tek localhost referans noktası
│   │   └── components/        # Tüm UI bileşenleri burada
│   └── dist/            # .gitignore'da olmalı (build çıktısı)
├── landing/             # Statik HTML (Netlify'a deploy edilir)
│   └── index.html
└── Hooks/               # Bu klasör — geliştirici scriptleri
```

## .gitignore Zorunluları

```
node_modules/
dist/
mcp-server/data/transactions.json
*.env
.env.*
```

## Commit Mesajı Formatı

```
<tip>: <kısa açıklama>

tip: feat | fix | refactor | style | docs | chore
```

Örnekler:
- `feat: aylık harcama grafiği eklendi`
- `fix: silme butonunun çift tetikleme sorunu giderildi`
- `chore: bağımlılıklar güncellendi`

## Hook Referansı

| Script | Ne Zaman Çalışır | Süre |
|--------|-----------------|------|
| `pre-commit.sh` | `git commit` öncesi | ~5 sn |
| `pre-push.sh` | `git push` öncesi | ~30 sn |
| `check-project.sh` | Manuel / isteğe bağlı | ~45 sn |
| `install-hooks.sh` | Bir kez kurulum | — |
