# MASAR AI — GOOGLE CLOUD READINESS REPORT

This document outlines the verified local code architecture and the exact step-by-step Google Cloud deployment operations required for production activation.

---

## 1. CODE COMPLETE (VERIFIED LOCAL IMPLEMENTATION)

The following backend and frontend code architectures are 100% complete, typechecked, and verified:

- **Firebase Authentication & ID Token Verification**: Server-side JWT verification (`requireAuthMiddleware`) isolating user data strictly by authenticated `uid`.
- **User Profile & Job Search Preferences**: Full CRUD persistence in Firestore under `users/{uid}` and `users/{uid}/preferences/jobSearch`.
- **Smart Job Discovery Provider Architecture**: Multi-tenant provider abstraction (`IJobProvider`, `LiveJobProvider`) and deduplication fingerprints.
- **Gmail OAuth & Recruitment Email Intelligence**: Clean server-side OAuth 2.0 flow (`/api/gmail/connect`, `/api/gmail/callback`, `/api/gmail/status`, `/api/gmail/sync`, `/api/gmail/disconnect`).
- **Application & Task Automation**: Automatic contextual task creation on status transitions to `Assessment`, `Interview`, and `Offer`.
- **Resume Upload & Metadata Management**: `POST /api/resumes/upload` multipart handler (PDF/DOCX, max 5MB) with GCS bucket validation.
- **Career Copilot & Vertex AI Abstraction**: `ai-context.service.ts` and `ai-provider.service.ts` supporting `@google/genai` Vertex AI SDK.
- **Scheduled OIDC Endpoint**: `POST /api/scheduled/daily-report` secured via Google OIDC ID token verification (`OAuth2Client.verifyIdToken`).
- **Responsive Web UI**: Responsive across 320px, 639px, 768px, 1024px, 1280px, 1440px+ screens supporting Arabic RTL and English LTR.

---

## 2. REQUIRES GOOGLE CLOUD CONFIGURATION (MANUAL GCP STEPS)

The following operations must be configured in Google Cloud Console / IAM (do not execute locally):

1. **Enable Vertex AI API**:
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=masar-ai-504916
   ```

2. **Configure Dedicated Cloud Run Backend Service Account**:
   - Create Service Account: `masar-ai-backend-sa@masar-ai-504916.iam.gserviceaccount.com`.
   - Grant `roles/aiplatform.user` (Vertex AI User) and `roles/datastore.user` (Firestore User).

3. **Configure Google Cloud Storage Bucket**:
   - Create private GCS Bucket: `gs://masar-ai-resumes-504916`.
   - Grant `roles/storage.objectAdmin` to backend Service Account.

4. **Configure Gmail OAuth 2.0 Credentials**:
   - Configure OAuth Consent Screen for scope `https://www.googleapis.com/auth/gmail.readonly`.
   - Create OAuth 2.0 Client ID (Web Application).
   - Set Authorized Redirect URI: `https://masar-ai-backend-828667104263.us-west4.run.app/api/gmail/callback`.

5. **Configure GCP Secret Manager / Environment Variables**:
   - Store `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GCS_BUCKET_NAME`, and `TELEGRAM_BOT_TOKEN`.
   - Set `GOOGLE_GENAI_USE_VERTEXAI=true`, `GOOGLE_CLOUD_PROJECT=masar-ai-504916`, and `GOOGLE_CLOUD_LOCATION=global`.

6. **Configure Telegram Bot Integration**:
   - Create Telegram Bot via Telegram `@BotFather` and obtain `TELEGRAM_BOT_TOKEN`.
   - Store `TELEGRAM_BOT_TOKEN` in GCP Secret Manager and map to Cloud Run environment.
   - Users provide their Chat ID in Settings (`/app/settings`).
   - Enable 7 PM daily report delivery to Telegram.

7. **Configure GCP Cloud Scheduler (Daily Reports)**:
   - Create dedicated Scheduler Service Account: `masar-ai-scheduler-sa@masar-ai-504916.iam.gserviceaccount.com`.
   - Grant `roles/run.invoker` on Cloud Run backend service `masar-ai-backend-828667104263`.
   - Create Cron Job: `0 19 * * *` (19:00 Asia/Riyadh).
   - Target HTTP URL: `https://masar-ai-backend-828667104263.us-west4.run.app/api/scheduled/daily-report`.
   - Authentication: OIDC Token (Audience: `https://masar-ai-backend-828667104263.us-west4.run.app`).
