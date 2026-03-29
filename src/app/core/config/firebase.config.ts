export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseClientConfig: FirebaseClientConfig = {
  apiKey: 'AIzaSyCLRp0HZ2gkbhtD4nnHYSvmyjzDen00zkc',
  authDomain: 'golden-seal-life-sciences.firebaseapp.com',
  projectId: 'golden-seal-life-sciences',
  storageBucket: 'golden-seal-life-sciences.firebasestorage.app',
  messagingSenderId: '717499250194',
  appId: '1:717499250194:web:2b18ca889582bfe9a74acb'
};

export const cmsSecurityConfig = {
  adminUsername: 'admin',
  adminEmailDomain: 'goldenseal.local',
  fallbackPassword: 'password',
  allowMockAdminWhenFirebaseUnavailable: true,
  
  // Add your actual Firebase Auth admin email here
  // Examples: 'admin@goldenseal.local', 'your-email@gmail.com', 'your-email@company.com'
  // Leave as [] to enforce only 'admin@goldenseal.local'
  allowedAdminEmails: [
    'goldenseallifesciences@gmail.com',
    // Add more authorized admin emails here if needed
    // 'your-personal-email@gmail.com'
  ]
};

export function isFirebaseConfigured(config: FirebaseClientConfig): boolean {
  return Object.values(config).every((value) => value && !value.startsWith('YOUR_'));
}
