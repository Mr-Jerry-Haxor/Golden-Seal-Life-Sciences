import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LeadCapture } from '../models/site.models';
import { SiteContentService } from './site-content.service';

const CONSENT_KEY = 'gsls_analytics_consent';
const SESSION_KEY = 'gsls_session_id';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly contentService = inject(SiteContentService);

  private readonly consentSignal = signal<boolean>(this.readConsentFromStorage());
  private readonly choiceSignal = signal<boolean>(this.readChoiceFromStorage());
  readonly consentGranted = this.consentSignal.asReadonly();
  readonly hasConsentChoice = this.choiceSignal.asReadonly();

  private readonly sessionId = this.getOrCreateSessionId();
  private trackingStarted = false;

  constructor() {
    if (this.consentSignal()) {
      this.startRouteTracking();
    }
  }

  setConsent(granted: boolean): void {
    this.consentSignal.set(granted);
    this.choiceSignal.set(true);
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');

    if (granted) {
      this.startRouteTracking();
      void this.trackEvent('consent_granted', this.router.url);
    }
  }

  async trackEvent(eventType: string, path: string): Promise<void> {
    if (!this.consentSignal()) {
      return;
    }

    const payload = {
      eventType,
      path,
      referrer: document.referrer || '',
      sessionId: this.sessionId,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookieKeys: this.readCookieKeys(),
      createdAt: Date.now()
    };

    await this.contentService.createAnalyticsEvent(payload);
  }

  async captureLead(lead: Omit<LeadCapture, 'createdAt'>): Promise<void> {
    if (!lead.consent) {
      throw new Error('Lead consent is required before submission.');
    }

    await this.contentService.createLead({
      ...lead,
      createdAt: Date.now()
    });
  }

  private startRouteTracking(): void {
    if (this.trackingStarted) {
      return;
    }

    this.trackingStarted = true;
    void this.trackEvent('page_view', this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        void this.trackEvent('page_view', navEnd.urlAfterRedirects);
      });
  }

  private getOrCreateSessionId(): string {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }

    const generated = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, generated);
    return generated;
  }

  private readConsentFromStorage(): boolean {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  }

  private readChoiceFromStorage(): boolean {
    return localStorage.getItem(CONSENT_KEY) !== null;
  }

  private readCookieKeys(): string[] {
    if (!document.cookie) {
      return [];
    }

    return document.cookie
      .split(';')
      .map((cookie) => cookie.trim().split('=')[0])
      .filter(Boolean);
  }
}
