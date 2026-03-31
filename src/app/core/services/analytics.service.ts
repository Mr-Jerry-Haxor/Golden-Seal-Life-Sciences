import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { analyticsRuntimeConfig } from '../config/analytics.config';
import { LeadCapture } from '../models/site.models';
import { SiteContentService } from './site-content.service';

const CONSENT_KEY = 'gsls_analytics_consent';
const SESSION_KEY = 'gsls_session_id';

type EventMetadata = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly contentService = inject(SiteContentService);

  private readonly gaMeasurementId = this.resolveGaMeasurementId();
  private readonly clarityProjectId = this.resolveClarityProjectId();

  private readonly consentSignal = signal<boolean>(this.readConsentFromStorage());
  private readonly choiceSignal = signal<boolean>(this.readChoiceFromStorage());
  readonly consentGranted = this.consentSignal.asReadonly();
  readonly hasConsentChoice = this.choiceSignal.asReadonly();

  private readonly sessionStartedAt = Date.now();
  private readonly sessionId = this.getOrCreateSessionId();
  private trackingStarted = false;
  private engagementTrackingStarted = false;
  private gaLoaded = false;
  private clarityLoaded = false;
  private leadFormStartTracked = false;
  private lastEngagementReportedMs = 0;

  constructor() {
    if (this.consentSignal()) {
      this.enableTracking();
    }
  }

  setConsent(granted: boolean): void {
    this.consentSignal.set(granted);
    this.choiceSignal.set(true);
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');

    if (granted) {
      this.enableTracking();
      void this.trackEvent('consent_granted', this.router.url);
      return;
    }

    this.updateGoogleConsent(false);
  }

  async trackEvent(eventType: string, path: string, metadata: EventMetadata = {}): Promise<void> {
    if (!this.consentSignal()) {
      return;
    }

    const createdAt = Date.now();
    const payload = {
      eventType,
      path,
      referrer: document.referrer || '',
      sessionId: this.sessionId,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookieKeys: this.readCookieKeys(),
      metadata,
      createdAt
    };

    await this.contentService.createAnalyticsEvent(payload);
    this.sendProviderEvent(eventType, path, metadata, createdAt);
  }

  async trackCtaClick(ctaName: string, placement: string, path = this.router.url): Promise<void> {
    await this.trackEvent('cta_click', path, {
      ctaName,
      placement
    });
  }

  async trackLeadFormStarted(path = this.router.url, source = 'lead_form'): Promise<void> {
    if (this.leadFormStartTracked) {
      return;
    }

    this.leadFormStartTracked = true;
    await this.trackEvent('lead_form_started', path, { source });
  }

  async captureLead(lead: Omit<LeadCapture, 'createdAt'>): Promise<void> {
    if (!lead.consent) {
      throw new Error('Lead consent is required before submission.');
    }

    await this.contentService.createLead({
      ...lead,
      createdAt: Date.now()
    });

    if (!this.consentSignal()) {
      return;
    }

    await this.trackEvent('lead_submitted', lead.sourcePath || this.router.url, {
      sourcePath: lead.sourcePath || this.router.url,
      hasPhone: Boolean(lead.phone?.trim()),
      hasCompany: Boolean(lead.company?.trim())
    });
  }

  private enableTracking(): void {
    this.loadProviderScripts();
    this.updateGoogleConsent(true);
    this.startRouteTracking();
    this.startEngagementTracking();
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

  private startEngagementTracking(): void {
    if (this.engagementTrackingStarted) {
      return;
    }

    this.engagementTrackingStarted = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') {
        return;
      }

      void this.trackSessionEngagement('visibility_hidden');
    });

    window.addEventListener('beforeunload', () => {
      void this.trackSessionEngagement('before_unload');
    });
  }

  private async trackSessionEngagement(trigger: string): Promise<void> {
    const sessionDurationMs = Date.now() - this.sessionStartedAt;
    if (sessionDurationMs < 5000) {
      return;
    }

    if (sessionDurationMs - this.lastEngagementReportedMs < 15000) {
      return;
    }

    this.lastEngagementReportedMs = sessionDurationMs;
    await this.trackEvent('session_engagement', this.router.url, {
      trigger,
      sessionDurationMs
    });
  }

  private getOrCreateSessionId(): string {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  private resolveGaMeasurementId(): string {
    const configured = analyticsRuntimeConfig.ga4MeasurementId.trim();
    if (configured) {
      return configured;
    }

    const meta = this.document.querySelector('meta[name="ga4-measurement-id"]') as HTMLMetaElement | null;
    return meta?.content?.trim() || '';
  }

  private resolveClarityProjectId(): string {
    const configured = analyticsRuntimeConfig.clarityProjectId.trim();
    if (configured) {
      return configured;
    }

    const meta = this.document.querySelector('meta[name="clarity-project-id"]') as HTMLMetaElement | null;
    return meta?.content?.trim() || '';
  }

  private loadProviderScripts(): void {
    this.loadGoogleAnalytics();
    this.loadClarity();
  }

  private loadGoogleAnalytics(): void {
    if (!this.gaMeasurementId || this.gaLoaded) {
      return;
    }

    const existing = this.document.querySelector(`script[data-gsls-ga="${this.gaMeasurementId}"]`);
    if (existing) {
      this.gaLoaded = true;
      return;
    }

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.gaMeasurementId)}`;
    script.setAttribute('data-gsls-ga', this.gaMeasurementId);
    this.document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('consent', 'default', {
      analytics_storage: 'denied'
    });
    window.gtag('config', this.gaMeasurementId, {
      send_page_view: false,
      anonymize_ip: true
    });

    this.gaLoaded = true;
  }

  private updateGoogleConsent(granted: boolean): void {
    if (!window.gtag) {
      return;
    }

    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied'
    });
  }

  private loadClarity(): void {
    if (!this.clarityProjectId || this.clarityLoaded) {
      return;
    }

    const existing = this.document.querySelector(`script[data-gsls-clarity="${this.clarityProjectId}"]`);
    if (existing) {
      this.clarityLoaded = true;
      return;
    }

    const win = window as Window & {
      clarity: (...args: unknown[]) => void;
    };

    const doc = this.document;
    const tagName = 'script';
    const firstScript = doc.getElementsByTagName(tagName)[0];

    win.clarity =
      win.clarity ||
      ((...args: unknown[]) => {
        const queueHolder = win.clarity as unknown as { q?: unknown[][] };
        queueHolder.q = queueHolder.q || [];
        queueHolder.q.push(args);
      });

    const script = doc.createElement(tagName);
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(this.clarityProjectId)}`;
    script.setAttribute('data-gsls-clarity', this.clarityProjectId);
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      doc.head.appendChild(script);
    }

    this.clarityLoaded = true;
  }

  private sendProviderEvent(eventType: string, path: string, metadata: EventMetadata, createdAt: number): void {
    if (window.gtag && this.gaMeasurementId) {
      if (eventType === 'page_view') {
        window.gtag('config', this.gaMeasurementId, {
          page_path: path,
          page_title: this.document.title
        });
      } else {
        window.gtag('event', eventType, {
          page_path: path,
          event_time: createdAt,
          ...metadata
        });
      }
    }

    if (window.clarity && this.clarityProjectId) {
      window.clarity('set', 'route', path);
      if (eventType !== 'page_view') {
        window.clarity('event', eventType);
      }
    }
  }
}
