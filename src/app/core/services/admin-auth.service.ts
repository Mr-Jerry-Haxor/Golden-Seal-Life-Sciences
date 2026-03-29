import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthErrorCodes, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { cmsSecurityConfig } from '../config/firebase.config';
import { FirebaseService } from './firebase.service';

type LoginResult = {
  success: boolean;
  message: string;
};

const MOCK_ADMIN_TOKEN_KEY = 'gsls_mock_admin_token';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly firebase = inject(FirebaseService);
  private readonly statusSignal = signal<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  private readonly emailSignal = signal<string | null>(null);
  private authInitialized: Promise<void>;
  private resolveAuthInit!: () => void;

  readonly status = this.statusSignal.asReadonly();
  readonly currentAdminEmail = this.emailSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.statusSignal() === 'authenticated');

  constructor() {
    // Create a promise that resolves when initial auth check is complete
    this.authInitialized = new Promise((resolve) => {
      this.resolveAuthInit = resolve;
    });

    if (this.firebase.auth) {
      onAuthStateChanged(this.firebase.auth, async (user) => {
        if (!user?.email) {
          this.statusSignal.set('unauthenticated');
          this.emailSignal.set(null);
          this.resolveAuthInit();
          return;
        }

        if (!this.isAllowedAdmin(user.email)) {
          await signOut(this.firebase.auth!);
          this.statusSignal.set('unauthenticated');
          this.emailSignal.set(null);
          this.resolveAuthInit();
          return;
        }

        this.statusSignal.set('authenticated');
        this.emailSignal.set(user.email);
        this.resolveAuthInit();
      });
      return;
    }

    const hasToken = localStorage.getItem(MOCK_ADMIN_TOKEN_KEY) === 'true';
    if (hasToken && cmsSecurityConfig.allowMockAdminWhenFirebaseUnavailable) {
      this.statusSignal.set('authenticated');
      this.emailSignal.set(this.adminEmail);
    } else {
      this.statusSignal.set('unauthenticated');
      this.emailSignal.set(null);
    }
    this.resolveAuthInit();
  }

  /**
   * Wait for initial authentication state to be checked from Firebase.
   * This ensures the guard doesn't redirect before auth state is determined.
   */
  async waitForAuthCheck(): Promise<void> {
    return this.authInitialized;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.firebase.auth) {
      try {
        const credentials = await signInWithEmailAndPassword(this.firebase.auth, normalizedEmail, password);
        if (!this.isAllowedAdmin(credentials.user.email)) {
          await signOut(this.firebase.auth);
          this.statusSignal.set('unauthenticated');
          this.emailSignal.set(null);
          return {
            success: false,
            message: 'This account is not authorized for admin access.'
          };
        }

        this.statusSignal.set('authenticated');
        this.emailSignal.set(credentials.user.email);
        return {
          success: true,
          message: 'Login successful.'
        };
      } catch (error: unknown) {
        return {
          success: false,
          message: this.mapFirebaseError(error)
        };
      }
    }

    if (
      cmsSecurityConfig.allowMockAdminWhenFirebaseUnavailable &&
      normalizedEmail === this.adminEmail.toLowerCase() &&
      password === cmsSecurityConfig.fallbackPassword
    ) {
      localStorage.setItem(MOCK_ADMIN_TOKEN_KEY, 'true');
      this.statusSignal.set('authenticated');
      this.emailSignal.set(this.adminEmail);
      return {
        success: true,
        message: 'Mock admin login successful (Firebase not configured).'
      };
    }

    this.statusSignal.set('unauthenticated');
    this.emailSignal.set(null);
    return {
      success: false,
      message: 'Invalid credentials.'
    };
  }

  async logout(): Promise<void> {
    if (this.firebase.auth) {
      await signOut(this.firebase.auth);
    }

    localStorage.removeItem(MOCK_ADMIN_TOKEN_KEY);
    this.statusSignal.set('unauthenticated');
    this.emailSignal.set(null);
  }

  private get adminEmail(): string {
    return `${cmsSecurityConfig.adminUsername}@${cmsSecurityConfig.adminEmailDomain}`;
  }

  private isAllowedAdmin(email: string | null | undefined): boolean {
    if (!email) {
      return false;
    }

    const normalizedEmail = email.toLowerCase();
    const allowedEmails = cmsSecurityConfig.allowedAdminEmails || [this.adminEmail];
    
    return allowedEmails.some(allowedEmail => 
      allowedEmail.toLowerCase() === normalizedEmail
    );
  }

  private mapFirebaseError(error: unknown): string {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return 'Unable to authenticate. Please try again.';
    }

    const code = String(error.code);
    if (code === AuthErrorCodes.INVALID_PASSWORD || code === AuthErrorCodes.USER_DELETED) {
      return 'Invalid username or password.';
    }

    if (code === AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER) {
      return 'Too many login attempts. Please try later.';
    }

    return 'Authentication failed. Contact the admin for the account status.';
  }
}
