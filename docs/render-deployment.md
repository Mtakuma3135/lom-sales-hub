# Render Deployment

This project is prepared for Render with Docker and Render PostgreSQL.

## 1. Push the Repository

Push the current repository to GitHub. Render deploys from the GitHub repository.

## 2. Create from Blueprint

The easiest path is Render Blueprint:

1. Open Render Dashboard.
2. Select **New +** -> **Blueprint**.
3. Select this repository.
4. Render reads `render.yaml` and creates:
   - Web Service: `lom-sales-hub`
   - PostgreSQL: `lom-sales-hub-db`

## 3. Required Environment Variables

Set these values on the Web Service after the first Blueprint import.

| Key | Value |
| --- | --- |
| `APP_KEY` | Output of `php artisan key:generate --show` |
| `APP_URL` | `https://<your-render-service>.onrender.com` or your custom domain |

The Blueprint already sets the production-safe defaults:

| Key | Default |
| --- | --- |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `DB_CONNECTION` | `pgsql` |
| `DB_URL` | Render PostgreSQL internal connection string used by Laravel |
| `DATABASE_URL` | Same Render PostgreSQL connection string, kept for platform compatibility |
| `FORCE_HTTPS` | `true` |
| `TRUSTED_PROXIES` | `*` |
| `REGISTRATION_ENABLED` | `false` |
| `KOT_MOCK_ENDPOINT_ENABLED` | `false` |

## 4. First Deploy

The Docker start script runs:

```bash
php artisan migrate --force
php artisan storage:link --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Seeders are disabled by default. For a portfolio demo, run this once from Render Shell:

```bash
php artisan db:seed --force
```

Or temporarily set `RUN_SEEDERS=true` for the first deploy, then set it back to `false`.

## 5. Queue Notes

The Blueprint uses `QUEUE_CONNECTION=sync` so the portfolio deployment works with a single Web Service.

If you want production-like background processing later:

1. Set `QUEUE_CONNECTION=database`.
2. Add a Render Background Worker.
3. Use this start command:

```bash
php artisan queue:work --tries=3 --timeout=90
```

## 6. Final Checks

After deploy:

```bash
php artisan security:check
```

Then confirm:

- Login page loads.
- CSS/JS assets load from `public/build`.
- Database-backed pages load.
- `APP_URL` matches the Render URL.
- `APP_DEBUG=false`.
