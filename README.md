# StructurePlan

A calm, connected practice workspace for psychotherapists supporting adults with ADHD and depression. Built with Laravel, Inertia, React, TypeScript, Tailwind CSS, and PostgreSQL.

## Features

- Fortify authentication, email verification, password recovery, and optional two-factor authentication
- Per-clinician patient records with diagnoses, contact details, clinical context, and status
- Individual treatment plans with goals, interventions, review dates, and optimistic goal completion
- Session scheduling and documentation, including mood ratings and between-session experiments
- Patient wellbeing check-ins for mood, energy, focus, and sleep with trend visualization
- Responsive dashboard, search/filter states, empty states, loading indicators, confirmations, and toast feedback
- User-scoped PostgreSQL persistence and rich fictional demo data

## Run locally with PostgreSQL

Create a PostgreSQL database named `structureplan`, then copy the environment file:

```bash
cp .env.example .env
```

The included defaults are for the starter's Sail service. For PostgreSQL running directly on your machine, set `DB_HOST=127.0.0.1` and update `DB_USERNAME` / `DB_PASSWORD` to match your local database. Then run:

```bash
composer setup
php artisan db:seed
composer run dev
```

For an existing installation, use:

```bash
composer install
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
```

### Using the included Sail PostgreSQL service

The default `.env` values match `compose.yaml` (`pgsql:5432`, database `structureplan`, user `sail`). With Docker running:

```bash
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install
./vendor/bin/sail npm run dev
```

The named `sail-pgsql` volume preserves application data between container restarts.

Open the URL printed by Vite/Laravel (or `http://localhost` with Sail). Choose **Explore the demo workspace** on the login page, or use:

- Email: `demo@structureplan.test`
- Password: `password`

## Tests

```bash
composer ci:check
```

Tests use an isolated in-memory SQLite database for speed and never touch your PostgreSQL development data. The application itself defaults to PostgreSQL.

All seeded names and clinical details are fictional. StructurePlan is a practice-organization demo, not a diagnostic tool, medical device, or emergency service.
