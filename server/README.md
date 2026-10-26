# Masar AI Backend API Service — مسار AI (Phase 2 Auth & Multi-Tenancy)

Production-ready Express & TypeScript backend REST API for **Masar AI**, integrated with Google Cloud Firestore (`masar-ai-504916`), Firebase Bearer Token Authentication, and Multi-Tenant User Workspace Isolation.

---

## 🏗 Phase 2 Architecture Overview

```
Client (React / Vite Frontend)
       │ (HTTP REST JSON with Authorization: Bearer <ID_TOKEN>)
       ▼
Express API Server (Port 8080)
   ├── Security: Helmet, CORS Isolation, Rate Limiter (100 req / 15m)
   ├── Middleware: Firebase Admin Token Verification, Zod Validation, Error Handling
   └── Services: Google Cloud Firestore Admin SDK
       │
       ├─► users/{uid}               (Profile metadata & career tracks)
       └─► applications/{docId}      (User-scoped applications with userId == req.user.uid)
```

---

## 🔑 Authentication & Token Verification Flow

1. User signs in via **Google Sign-In** on the frontend.
2. Frontend retrieves the Firebase ID Token using `user.getIdToken()`.
3. Frontend attaches `Authorization: Bearer <ID_TOKEN>` header to API requests via `src/services/api.ts`.
4. Backend `requireAuthMiddleware` verifies the token using `firebase-admin` `verifyIdToken()`.
5. Authenticated identity (`uid`, `email`, `displayName`, `photoURL`) is attached to `req.user`.
6. All Firestore application queries filter strictly by `userId == req.user.uid`. Attempting to access another user's document returns HTTP 404 (Privacy Preservation).

---

## 🚀 Legacy Applications Migration

To migrate legacy application documents created before authentication existed:

```bash
cd server
npm run migrate-legacy -- <TARGET_USER_UID>
```
Example:
```bash
npx tsx src/scripts/migrate-legacy-applications.ts 8x9YzK2L...
```
This script finds documents in `applications` missing `userId` and assigns `userId = TARGET_USER_UID` without modifying existing owner IDs.

---

## 📡 API Endpoints

### Public Endpoints
- `GET /health` - Service health status
- `GET /health/live` - Cloud Run Liveness probe
- `GET /health/ready` - Cloud Run Readiness probe (verifies Firestore DB)
- `GET /api/docs` - OpenAPI 3.0 specification JSON

### Protected Endpoints (`Authorization: Bearer <ID_TOKEN>` Required)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/me` | Get current user profile (`users/{uid}`) |
| `PATCH` | `/api/me` | Update profile fields (`displayName`, `location`, `currentJobTitle`, `careerTracks`, `onboardingCompleted`) |
| `GET` | `/api/applications` | List applications owned by current user (`userId == req.user.uid`) |
| `GET` | `/api/applications/:id` | Get single application owned by current user |
| `POST` | `/api/applications` | Create application for current user (`userId` set automatically) |
| `PATCH` | `/api/applications/:id` | Update application owned by current user |
| `DELETE`| `/api/applications/:id` | Delete application owned by current user |

---

## 🔧 Firebase Console Setup Instructions

1. Go to [Google Firebase Console](https://console.firebase.google.com/).
2. Select existing Google Cloud project: **`masar-ai-504916`**.
3. Enable **Authentication** -> **Sign-in method** -> **Google**.
4. Add `localhost` and your production domain to **Authorized Domains**.
