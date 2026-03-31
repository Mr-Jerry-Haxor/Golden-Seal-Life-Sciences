import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

type SeoData = {
  title?: string;
  description?: string;
  keywords?: string;
};

const DEFAULT_SEO: Required<SeoData> = {
  title: 'Golden Seal Life Sciences | Premium Biotech Solutions',
  description:
    'Golden Seal Life Sciences delivers premium biotech solutions across aquaculture, agriculture, and fine chemicals with research-led execution.',
  keywords: 'biotech, aquaculture probiotics, agricultural micronutrients, fine chemicals, life sciences'
};

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.applyRouteSeo(this.router.routerState.snapshot.root);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.applyRouteSeo(this.router.routerState.snapshot.root);
      });
  }

  private applyRouteSeo(route: ActivatedRouteSnapshot): void {
    const seo = this.resolveSeoData(route);

    this.title.setTitle(seo.title || DEFAULT_SEO.title);
    this.meta.updateTag({
      name: 'description',
      content: seo.description || DEFAULT_SEO.description
    });
    this.meta.updateTag({
      name: 'keywords',
      content: seo.keywords || DEFAULT_SEO.keywords
    });
    this.meta.updateTag({
      property: 'og:title',
      content: seo.title || DEFAULT_SEO.title
    });
    this.meta.updateTag({
      property: 'og:description',
      content: seo.description || DEFAULT_SEO.description
    });
    this.meta.updateTag({
      name: 'twitter:title',
      content: seo.title || DEFAULT_SEO.title
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: seo.description || DEFAULT_SEO.description
    });

    this.updateCanonicalUrl();
  }

  private resolveSeoData(route: ActivatedRouteSnapshot): SeoData {
    const collected: SeoData = {};
    let current: ActivatedRouteSnapshot | null = route;

    while (current) {
      const data = current.data as SeoData;
      if (data.title) {
        collected.title = data.title;
      }
      if (data.description) {
        collected.description = data.description;
      }
      if (data.keywords) {
        collected.keywords = data.keywords;
      }

      current = current.firstChild;
    }

    return collected;
  }

  private updateCanonicalUrl(): void {
    const href = `${this.document.location.origin}${this.router.url.split('?')[0]}`;
    let canonical = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }

    canonical.href = href;
  }
}
