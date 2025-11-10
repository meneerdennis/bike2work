Firebase setup for Bike2Work (GitHub Pages)

This file contains step-by-step instructions to configure Firebase Authentication and Firestore when hosting the app on GitHub Pages.

1. Firebase project & Auth

- Create or select a Firebase project in the Firebase Console.
- In the left menu choose "Authentication" → "Sign-in method".
- Enable "Google" sign-in provider.
- In "Authorized domains", add:
  - meneerdennis.github.io
  - (if you use a custom domain, add that too)

2. Firestore rules (safe default for per-user data)

Open Firestore → Rules and replace contents with the code below, then publish:

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// Each user may read/write only their own document under `users/{uid}`
match /users/{userId} {
allow read, write: if request.auth != null && request.auth.uid == userId;
}
}
}

This allows authenticated users to read/write their own `users/{uid}` document and nothing else.

3. Environment variables (build-time)

Create a local `.env.local` (do NOT commit) in the project root with these values (fill with your project's values):

REACT_APP_FIREBASE_API_KEY=yourApiKey
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxxxx
REACT_APP_FIREBASE_APP_ID=1:xxxx:web:yyyyy
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXX

Notes:

- Create React App reads these variables at build time. The production bundle will contain the values you build with.
- For CI (GitHub Actions) add the same names as repository secrets and configure the workflow to set them before `npm run build`.

4. OAuth redirect handling (already added to the app)

- The app uses `signInWithRedirect` and handles `getRedirectResult` to surface errors after a redirect flow.
- Make sure the domain `meneerdennis.github.io` is listed under Authorized domains in the Firebase Console (step 1).

5. Quick deploy check

- After setting the `.env.local`, run:

  npm install
  npm run build
  npm run deploy

- Open: https://meneerdennis.github.io/bike2work
- If you see "Missing or insufficient permissions" in the console after signing in, the Firestore rules are blocking reads/writes—apply the rules in step 2.

6. CI (optional)

If you'd like, I can add a GitHub Actions workflow that sets secrets and runs `npm run build` + `npm run deploy` on push to `main`.

If you want me to do those steps for you (add workflow file or apply minor code changes), tell me which ones and I will create them.
