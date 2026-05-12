#!/usr/bin/env bash
set -euo pipefail

: "${PORT:=8080}"
: "${RUN_MIGRATIONS:=true}"
: "${RUN_SEEDERS:=false}"
: "${AUTO_SEED_EMPTY_DATABASE:=false}"

sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

php artisan optimize:clear --no-interaction || true

if [[ "${RUN_MIGRATIONS}" == "true" ]]; then
    php artisan migrate --force --no-interaction
fi

if [[ "${RUN_SEEDERS}" == "true" ]]; then
    php artisan db:seed --force --no-interaction
elif [[ "${AUTO_SEED_EMPTY_DATABASE}" == "true" ]]; then
    php artisan app:seed-if-empty --no-interaction
fi

php artisan storage:link --force --no-interaction || true
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan view:cache --no-interaction

exec apache2-foreground
