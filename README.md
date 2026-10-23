# StructurePlan

A calm, connected practice workspace for psychotherapists supporting adults with ADHD and depression. Built with Laravel, Inertia, React, TypeScript, and Tailwind CSS.

## Features

- Fortify authentication, email verification, password recovery, and optional two-factor authentication
- Per-clinician patient records with diagnoses, contact details, clinical context, and status
- Individual treatment plans with goals, interventions, review dates, and optimistic goal completion
- Session scheduling and documentation, including mood ratings and between-session experiments
- Patient wellbeing check-ins for mood, energy, focus, and sleep with trend visualization
- Responsive dashboard, search/filter states, empty states, loading indicators, confirmations, and toast feedback
- User-scoped persistent storage and rich fictional demo data

## Run locally

```bash
composer setup
php artisan db:seed
composer run dev
```

For an existing installation:

```bash
cp .env.example .env
touch database/database.sqlite
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
```

Open the URL printed by Vite/Laravel. Choose **Explore the demo workspace** on the login page, or use:

- Email: `demo@structureplan.test`
- Password: `password`

All seeded names and clinical details are fictional. StructurePlan is a practice-organization demo, not a diagnostic tool, medical device, or emergency service.
