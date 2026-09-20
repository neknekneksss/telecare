# TeleCare — Just a Click Away

A web-based telehealth prototype designed to demonstrate patient and healthcare practitioner workflows through a modern responsive interface.

> **Academic / portfolio project:** TeleCare is a prototype and is not intended for real medical consultation, diagnosis, treatment, or storage of real patient information.

## ✨ Features

### Patient
- Patient account registration and login
- Appointment booking
- Appointment management
- Consultation history
- Clinical notes and diagnoses
- Prescription viewing
- Medication tracking
- Health records
- Patient–doctor messaging
- Simulated video consultation
- Health progress tracking
- Nearby healthcare interface

### Healthcare Practitioner
- Doctor account registration and login
- Appointment management
- Patient information and consultation history
- Clinical notes
- Vital signs recording
- Diagnosis and treatment plans
- Prescription management
- Patient messaging
- Consultation workflow
- Earnings/subscription interfaces

### Communication
- Patient–doctor chat
- Notification indicators
- Floating chat interface
- Simulated video consultation

## 🛠️ Tech Stack

- **Next.js 14** — App Router
- **TypeScript**
- **Tailwind CSS**
- **Zustand** — Client-side application state
- **Supabase** — Database/backend services
- **Lucide React** — Icons
- **Vercel** — Deployment

## 📁 Project Structure

```text
src/
├── app/
│   ├── doctor/
│   │   ├── appointments/
│   │   ├── dashboard/
│   │   ├── earnings/
│   │   ├── messages/
│   │   ├── patients/
│   │   └── subscription/
│   │
│   ├── patient/
│   │   ├── appointments/
│   │   ├── book/
│   │   ├── consultation/
│   │   ├── dashboard/
│   │   ├── health/
│   │   ├── medications/
│   │   ├── messages/
│   │   ├── nearby-care/
│   │   ├── progress/
│   │   └── records/
│   │
│   └── login/
│
├── components/
│   └── shared UI components
│
├── lib/
│   ├── mock-data/
│   ├── supabase.ts
│   └── types.ts
│
└── store/
    └── Zustand application stores
