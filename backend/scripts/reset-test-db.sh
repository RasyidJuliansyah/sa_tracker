#!/bin/sh
# Buat ulang database uji dari 001_init.sql (+ delta berikutnya). Hanya untuk database LOKAL uji.
# Memakai kredensial root dari dalam container Docker; tidak mencetak rahasia.
set -e
C="${MYSQL_CONTAINER:-sa-visit-mysql}"
DB=sa_visit_tracker_test
docker exec "$C" sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -e 'DROP DATABASE IF EXISTS $DB; CREATE DATABASE $DB CHARACTER SET utf8mb4;'" 2>/dev/null
for f in "$(dirname "$0")"/../sql/deltas/*.sql; do
  docker exec -i "$C" sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" $DB" < "$f" 2>/dev/null
done
# Beri akun aplikasi (dari MYSQL_USER di container) hak penuh ke database uji
docker exec "$C" sh -c "[ -n \"\$MYSQL_USER\" ] && mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -e \"GRANT ALL ON $DB.* TO '\$MYSQL_USER'@'%'; FLUSH PRIVILEGES;\"" 2>/dev/null || true
echo "Database uji $DB siap."
