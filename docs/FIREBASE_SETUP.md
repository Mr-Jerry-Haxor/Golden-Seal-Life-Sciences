# Firebase Setup Guide

## 1. Create Firebase Project

1. Open Firebase Console and create a project.
2. Enable these products:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage

## 2. Configure Web App Credentials

Update file:

- `src/app/core/config/firebase.config.ts`

Fill all placeholder fields:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## 3. Create Test Admin Account

Create a Firebase Auth user with:

- Email: `admin@goldenseal.local`
- Password: `password`

The login screen accepts username `admin`; the app maps it to that email format.

## 4. Recommended Firestore Rules (Starter)

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'admin@goldenseal.local';
    }

    match /site/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /media/{mediaId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /analytics_events/{eventId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    match /leads/{leadId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

## 5. Recommended Storage Rules (Starter)

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'admin@goldenseal.local';
    }

    match /site-media/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## 6. Local Run

If your machine is still on Node 22.11, use:

```bash
npm run start:portable
```

If you upgrade Node to 22.12+ or newer LTS, regular commands work:

```bash
npm run start
```
