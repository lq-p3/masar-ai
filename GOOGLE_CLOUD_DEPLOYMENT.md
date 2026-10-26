# Google Cloud Infrastructure Deployment Manifest — Masar AI (مسار AI)

This document specifies the exact manual configuration required by the project owner to deploy and operate Masar AI on Google Cloud.

---

## 1. APIs to Enable
Execute in GCP Cloud Shell or gcloud CLI:
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  aiplatform.googleapis.com \
  gmail.googleapis.com \
  --project masar-ai-504916
```

---

## 2. Firebase & Identity Platform Configuration
- **Providers**: Enable **Email/Password** and **Google Sign-In** in Firebase Console (`masar-ai-504916`).
- **Authorized Domains**: Add `localhost`, `masar-ai-frontend-828667104263.us-west4.run.app`.

---

## 3. Secret Manager Configuration
Create secrets in Secret Manager:
1. `GEMINI_API_KEY`: API key for Gemini 1.5 Pro / Flash models.
2. `SCHEDULER_SECRET`: Random secret string for securing scheduled Cloud Scheduler HTTP endpoints.

---

## 4. Cloud Run Services Deployment

### Backend Service (`masar-ai-backend`)
- **Region**: `us-west4`
- **Port**: `8080`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `GOOGLE_CLOUD_PROJECT=masar-ai-504916`
  - `FRONTEND_ORIGINS=http://localhost:3000,http://localhost:5173,https://masar-ai-frontend-828667104263.us-west4.run.app`
- **Secrets Mapping**:
  - `GEMINI_API_KEY` from Secret Manager `GEMINI_API_KEY:latest`

### Frontend Service (`masar-ai-frontend`)
- **Region**: `us-west4`
- **Port**: `80`
- **Environment Variables**:
  - `VITE_API_BASE_URL=https://masar-ai-backend-828667104263.us-west4.run.app`

---

## 5. Cloud Scheduler Architecture (7:00 PM Daily Reports)

### A. Create Dedicated Service Account
```bash
gcloud iam service-accounts create masar-ai-scheduler-sa \
  --display-name="Masar AI Cloud Scheduler Invoker Service Account" \
  --project=masar-ai-504916
```

### B. Assign Cloud Run Invoker IAM Role
```bash
gcloud run services add-iam-policy-binding masar-ai-backend \
  --member="serviceAccount:masar-ai-scheduler-sa@masar-ai-504916.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=us-west4 \
  --project=masar-ai-504916
```

### C. Create Cloud Scheduler Job with OIDC Token
```bash
gcloud scheduler jobs create http masar-ai-daily-report-job \
  --schedule="0 19 * * *" \
  --time-zone="Asia/Riyadh" \
  --uri="https://masar-ai-backend-828667104263.us-west4.run.app/api/scheduled/daily-report" \
  --http-method=POST \
  --oidc-service-account-email="masar-ai-scheduler-sa@masar-ai-504916.iam.gserviceaccount.com" \
  --oidc-token-audience="https://masar-ai-backend-828667104263.us-west4.run.app/api/scheduled/daily-report" \
  --project=masar-ai-504916
```
