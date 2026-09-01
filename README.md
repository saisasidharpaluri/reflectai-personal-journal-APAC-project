# ReflectAI - Intelligent Journaling & Cognitive Reflection Workspace

ReflectAI is a full-stack, user-authenticated journaling web application powered by **Google Gemini 3.6 Flash** and **Cloud Firestore**. It provides an introspective, multi-turn reflection canvas where users converse with an AI reflection partner, brainstorm divergent ideas, generate structured executive summaries, and track emotional patterns over time—with strictly isolated data persistence per user.

---

## Architecture Overview

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Federated Google Sign-In & Anonymous Guest auth. Zero password storage. |
| **Backend Database** | Cloud Firestore | Isolated document storage per user (`/users/{userId}/entries/{entryId}`). |
| **AI Processing Engine** | Gemini 3.6 Flash API | Multi-turn reflections, executive summarization, and action plan extraction. |
| **Backend Service** | Node.js / Express + Vite | Secure server-side API proxying with fallback ladder. |
| **Secret Management** | GCP Secret Manager / Env | Zero hardcoding of sensitive credentials. |

---

## 1. Security Architecture & Threat Model

### Threat Summary Table

| Threat Zone | Identified Risk | Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious payloads, XSS in journal entries, oversized prompt injections. | Server-side request sanitization, typed interfaces, sanitized markdown rendering via `react-markdown` with strict HTML escape. |
| **Planning & Reasoning** | Prompt injection attempting to alter AI system persona or bypass boundaries. | Hardened system instructions with explicit role boundaries and context fencing. |
| **Tool / API Execution** | SSRF or unauthorized execution of internal backend services. | Strict server-side API routes (`/api/gemini/*`), no client-side API key exposure. |
| **Memory & State** | Cross-user data leakage in Firestore database queries. | Path-isolated Firestore schema (`/users/{userId}/entries/{id}`) enforced via owner-bound `firestore.rules`. |
| **Inter-System Communication** | Gemini API key leakage or transient outage failures. | Secret Manager injection on Cloud Run, 4-tier model fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`). |

---

## 2. Cloud Firestore Security Rules

Deploy the following owner-isolated security rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data isolation: each user can only read and write their own documents and subcollections
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Environment Variables & Secret Manager Setup

### Required Environment Variables

```env
# Gemini API Key for Server-Side AI Generation
GEMINI_API_KEY="your-gemini-api-key"

# App URL for OAuth & Host Configuration
APP_URL="https://your-service-url.run.app"
```

### Google Cloud Secret Manager Configuration

```bash
# 1. Enable Secret Manager and Cloud Run APIs
gcloud services enable secretmanager.googleapis.com run.googleapis.com firestore.googleapis.com

# 2. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Run Deployment Flow

```bash
# 1. Build and Deploy to Cloud Run
gcloud run deploy reflectai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"

# 2. Apply Mandatory Campaign Verification Label
gcloud run services update reflectai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Run type validation
npm run lint

# 4. Compile production bundle
npm run build
```

---

## 6. Functional Verification Walkthrough

The following test cases verify all end-to-end user flows and system operations:

### TC-01: Authentication & Landing View
- **Action**: Open the application at the root URL as an unauthenticated visitor.
- **Expected Result**: Landing page is displayed with feature breakdown, security architecture explanation, and "Continue with Google" / "Instant Guest Preview" buttons. No private journal data is visible.

### TC-02: Google & Guest Authentication
- **Action**: Click "Continue with Google" or "Instant Guest Preview".
- **Expected Result**: Firebase Auth completes authentication and transitions into the private workspace dashboard with user profile badge and isolated UID.

### TC-03: Real-Time Firestore Sync & Isolation
- **Action**: Create a new reflection with title "Daily Strategy Session" and category "Action Plan".
- **Expected Result**: Entry is instantly written to Firestore collection `/users/{userId}/entries/{entryId}` with undefined-sanitized payload, header indicates `Firestore Synced`.

### TC-04: Multi-Turn Conversation with Gemini 3.6 Flash
- **Action**: Type a reflection message and click "Send" or press `Enter`.
- **Expected Result**: Both user prompt and Gemini 3.6 Flash response appear in the conversation canvas and are immediately persisted to Firestore with zero data loss.

### TC-05: AI Executive Summarization & Takeaways
- **Action**: Click "Summarize & Extract" on an active reflection.
- **Expected Result**: Modal displays structured executive summary, key insight bullets, checkable action items, sentiment tag, and auto-generated title. Clicking "Attach Summary & Save to Entry" commits the structured summary to Firestore.

### TC-06: History Filtering & Search
- **Action**: Type keywords in the history search bar or click category filter pills (e.g., "Action Plans", "Starred").
- **Expected Result**: The entry list dynamically filters matching records in real time.

### TC-07: Reflection Analytics
- **Action**: Click the Analytics icon in the top header.
- **Expected Result**: Modal displays total reflections count, total words written, AI interaction count, category distribution bar graphs, and emotional tone palette.
