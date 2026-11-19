# Firebase Firestore Setup & Configuration Guide

This guide provides step-by-step instructions to configure Google Cloud Firestore with the Attendance Management Dashboard.

---

## 1. Create a Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter a project name, e.g., `attendance-management-portal`.
4. (Optional) Choose whether to enable Google Analytics, then click **Create project**.
5. Once initialized, click **Continue**.

---

## 2. Set Up Cloud Firestore Database

1. In the Firebase console left sidebar, navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a Firestore location close to your users (e.g. `nam5 (us-central)` or `asia-south1`).
4. Select the security rules mode:
   - For initial testing: select **Start in test mode** (allows read/write for 30 days).
   - For production: select **Start in production mode** (all read/write blocked until rules applied).
5. Click **Create** / **Enable**.

---

## 3. Register a Web Application & Get Credentials

1. In your Firebase Project Overview page, click the **Web icon** (`</>`) to add a web app.
2. Enter an app nickname, e.g., `attendance-web-dashboard`.
3. Click **Register app**.
4. In the generated `firebaseConfig` object, locate the following properties:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 4. Configure Environment Variables

1. Open the project root directory.
2. Create or open `.env.local` (ensure it is never committed to GitHub):
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```
3. Restart your Next.js development server to load the new environment variables:
   ```bash
   npm run dev
   ```
4. The dashboard header and status badge will now show **Firestore Real-Time Sync** (green pulse).

---

## 5. Seed Initial Sample Data (One Click)

When connecting a newly created Firestore database, your collection will initially be empty:
1. Open `http://localhost:3000` in your browser.
2. Click the **Seed Sample Data** button in the dashboard toolbar.
3. This will populate your Firestore `attendance` collection with sample records across Engineering, Design, Product, HR, Sales, and Operations.

---

## 6. Deploy Firestore Security Rules

To apply production security rules, install the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
```

When prompted, select the existing project. Use the provided [firestore.rules](file:///c:/Users/Administrator/Desktop/attendance/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /attendance/{documentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 2
        && request.resource.data.department is string
        && request.resource.data.date is string
        && request.resource.data.status in ['Present', 'Late', 'Half-Day', 'Absent']
        && request.resource.data.createdAt != null;
      allow update: if request.auth != null
        && request.resource.data.status in ['Present', 'Late', 'Half-Day', 'Absent']
        && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if request.auth != null;
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

---

## 7. Verify Multi-Tab Real-Time Sync

1. Open `http://localhost:3000` in two separate browser windows (or one normal tab and one incognito tab).
2. In Window 1, click **+ Add Attendance** and record an entry for a new employee.
3. Observe Window 2: Window 2 updates immediately via Firestore's `onSnapshot` listener without refreshing the page!
4. In Window 2, edit the record's status from **Present** to **Late**.
5. Observe Window 1: The status badge and KPI counters update instantaneously in real time.

