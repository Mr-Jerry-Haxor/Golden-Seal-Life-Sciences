import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseClientConfig, isFirebaseConfigured } from '../config/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  readonly app: FirebaseApp | null;
  readonly auth: Auth | null;
  readonly firestore: Firestore | null;

  constructor() {
    if (!isFirebaseConfigured(firebaseClientConfig)) {
      this.app = null;
      this.auth = null;
      this.firestore = null;
      console.warn('Firebase config placeholders detected. Running in local mock mode until configured.');
      return;
    }

    this.app = initializeApp(firebaseClientConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
  }

  get isEnabled(): boolean {
    return this.app !== null;
  }
}
