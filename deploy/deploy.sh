#!/bin/sh
# Deploy ke server internal. Jalankan dari folder deploy/ di server (setelah git pull).
# Skrip ini TIDAK mengubah database: delta SQL dijalankan manual lewat DBeaver SEBELUM skrip ini (lihat docs/architecture.md).
set -eu
cd "$(dirname "$0")"

[ -f .env.production ] || { echo "Tidak ada deploy/.env.production (salin dari .env.production.example)."; exit 1; }
grep -q '^JWT_SECRET=' .env.production && ! grep -q 'GANTI_DENGAN' .env.production || { echo "JWT_SECRET belum diisi di .env.production."; exit 1; }

echo "Pastikan skrip SQL delta terbaru (backend/sql/deltas/) sudah dijalankan di database produksi."
printf "Lanjut deploy? [y/N] "; read -r ans; [ "$ans" = "y" ] || { echo "Dibatalkan."; exit 1; }

docker compose --env-file .env.production up -d --build

echo "Menunggu backend sehat..."
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' sa-visit-backend 2>/dev/null)" = "healthy" ]; do
  i=$((i+1)); [ "$i" -gt 30 ] && { echo "Backend tidak sehat. Cek: docker logs sa-visit-backend"; exit 1; }
  sleep 2
done
echo "Selesai. Backend sehat. Cek https://<domain>/ lewat HTTPS."
