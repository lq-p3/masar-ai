# Masar AI | مسار AI

**Cloud-native, AI-powered job application platform built on Google Cloud.**

Masar AI helps job seekers manage their entire job search in one place: tracking applications, reading job-related emails, matching resumes to roles, and getting AI guidance on the next step. Built as the final project of the Tuwaiq Academy Professional Cloud Developer Bootcamp.

## Features

- **Application tracking** – dashboard, application details, interviews and tasks
- **Inbox Intelligence** – Gmail API integration that classifies job-related emails
- **AI assistance** – Gemini (Vertex AI) for job recommendations, resume matching and next-action suggestions
- **Resume management** – upload and parse PDF/DOCX resumes (Cloud Storage)
- **Career analytics** – charts and progress insights
- **Notifications & daily reports** – scheduled reports via Cloud Scheduler, Telegram notifications
- **Bilingual UI** – Arabic (RTL) and English (LTR), fully responsive
- **Secure multi-tenant API** – Firebase Auth token verification, per-user data isolation, Helmet, CORS, rate limiting, Zod validation

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Node.js, Express, TypeScript, Zod |
| Data & Auth | Cloud Firestore, Firebase Authentication, Cloud Storage |
| AI | Gemini / Vertex AI |
| Cloud & DevOps | Cloud Run, Cloud Build, Artifact Registry, Cloud Scheduler, Secret Manager, IAM, Docker, Nginx |

## Architecture

```
React + Vite (Cloud Run, Nginx)
        │  HTTPS + Firebase ID token
        ▼
Express / TypeScript API (Cloud Run)
        ├── Firestore     (users, applications, tasks)
        ├── Cloud Storage (resumes)
        ├── Gemini / Vertex AI
        ├── Gmail API
        └── Cloud Scheduler → daily 7 PM report
```

## Getting Started

```bash
# Frontend
cp .env.example .env        # add your Firebase web config
npm install
npm run dev                 # http://localhost:3000

# Backend
cd server
cp .env.example .env        # add project ID and secrets
npm install
npm run dev
```

Deployment steps on Google Cloud are documented in [`GOOGLE_CLOUD_DEPLOYMENT.md`](GOOGLE_CLOUD_DEPLOYMENT.md). Backend API details are in [`server/README.md`](server/README.md).

## Author

**Ali Alqahtani** – [GitHub](https://github.com/lq-p3) · [LinkedIn](https://www.linkedin.com/in/ali-alqhtani-2a8297333)
