# Telecare — Just a Click Away

Interactive prototype of a telehealth platform, built for an academic
presentation. **This is a UI/UX demo, not a production healthcare system.**

- Video calls, SMS/email/WhatsApp reminders, and pharmacy/payment/insurance
  integrations are all **simulated** — no real infrastructure behind them.
- All patients, doctors, and records are fictional.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand for session/app state (persisted to `localStorage`)
- Mock data layer under `src/lib/mock-data` — no real backend/database

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Login is a role picker (no real auth) — pick "Patient" or "Doctor" to enter
as a seeded demo account.

## Project structure

```
src/
  app/                  routes (App Router)
    login/
    patient/            patient-facing screens
    doctor/             doctor-facing screens
  components/           shared UI (DisclaimerBanner, etc.)
  lib/
    types.ts            shared TS models
    mock-data/           fictional doctors, patients, appointments, etc.
  store/
    session.ts          logged-in role/user, persisted locally
```

## Status

- [x] Project scaffold, routing, disclaimer banner, mock data, session store
- [x] Login (email match, prototype only) + Sign Up (creates a real new patient/doctor account) + quick demo shortcuts
- [ ] Patient dashboard + booking flow
- [ ] Doctor dashboard + clinical notes/prescription
- [ ] Simulated video consultation screen
- [ ] Medication tracker
- [ ] Chat
- [ ] Deploy to Vercel

## Deployment

Deployed via Vercel: _add link once deployed_.

## Disclaimer

TELECARE — Interactive Prototype. For academic/project demonstration only.
Not for real medical consultation, diagnosis, treatment, or patient data.
