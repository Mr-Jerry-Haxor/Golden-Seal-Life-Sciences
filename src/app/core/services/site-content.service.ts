import { Injectable, computed, inject, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import {
  AnnouncementContent,
  DEFAULT_HOME_CONTENT,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  HomeContent,
  LeadRecord,
  LeadStatus,
  MediaItem,
  Product,
  SiteSettings,
  SiteSnapshot,
  SiteTheme
} from '../models/site.models';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class SiteContentService {
  private readonly firebase = inject(FirebaseService);
  private readonly unsubscribers: Array<() => void> = [];
  private readonly pendingBootstrapKeys = new Set(['content', 'theme', 'settings', 'products', 'media']);
  private bootstrapFallbackTimer: number | null = null;

  private readonly loadingSignal = signal(true);

  private readonly snapshotSignal = signal<SiteSnapshot>({
    content: DEFAULT_HOME_CONTENT,
    products: [],
    theme: DEFAULT_THEME,
    settings: DEFAULT_SETTINGS,
    media: []
  });

  readonly snapshot = this.snapshotSignal.asReadonly();
  readonly content = computed(() => this.snapshotSignal().content);
  readonly products = computed(() => this.snapshotSignal().products);
  readonly theme = computed(() => this.snapshotSignal().theme);
  readonly settings = computed(() => this.snapshotSignal().settings);
  readonly media = computed(() => this.snapshotSignal().media);
  private readonly leadsSignal = signal<LeadRecord[]>([]);
  readonly leads = this.leadsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly highlightedProducts = computed(() => this.products().filter((product) => product.highlighted));

  constructor() {
    this.startRealtimeSync();

    if (!this.firebase.firestore) {
      this.loadingSignal.set(false);
      return;
    }

    this.bootstrapFallbackTimer = window.setTimeout(() => {
      this.loadingSignal.set(false);
    }, 4500);
  }

  async saveHomeContent(content: HomeContent): Promise<void> {
    const normalizedContent = this.normalizeHomeContent(content);
    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({ content: normalizedContent });
      return;
    }

    await setDoc(doc(db, 'site', 'content'), normalizedContent, { merge: true });
  }

  async saveTheme(theme: SiteTheme): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({ theme });
      return;
    }

    await setDoc(doc(db, 'site', 'theme'), theme, { merge: true });
  }

  async saveSettings(settings: SiteSettings): Promise<void> {
    const normalizedSettings = this.normalizeSettings(settings);
    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({ settings: normalizedSettings });
      return;
    }

    await setDoc(doc(db, 'site', 'settings'), normalizedSettings, { merge: true });
  }

  async createProduct(draft: Partial<Product>): Promise<string> {
    const now = Date.now();
    const productId = draft.id?.trim() || crypto.randomUUID();

    const product: Product = {
      id: productId,
      slug: draft.slug?.trim() || this.toSlug(draft.name || productId),
      name: draft.name?.trim() || 'Untitled Product',
      category: draft.category || 'Custom Solutions',
      shortDescription: draft.shortDescription?.trim() || '',
      longDescription: draft.longDescription?.trim() || '',
      imageUrl: draft.imageUrl?.trim() || '',
      highlighted: draft.highlighted ?? false,
      sectionId: draft.sectionId?.trim() || '',
      tags: draft.tags || [],
      createdAt: draft.createdAt || now,
      updatedAt: now
    };

    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({
        products: [product, ...this.snapshotSignal().products]
      });
      return productId;
    }

    await setDoc(doc(db, 'products', productId), product, { merge: true });
    return productId;
  }

  async updateProduct(productId: string, patch: Partial<Product>): Promise<void> {
    const db = this.firebase.firestore;
    const updatedAt = Date.now();

    if (!db) {
      const updatedProducts = this.snapshotSignal().products.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const next = {
          ...product,
          ...patch,
          slug: patch.name ? this.toSlug(patch.name) : product.slug,
          updatedAt
        };

        return next;
      });

      this.patchSnapshot({ products: updatedProducts });
      return;
    }

    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...patch,
      ...(patch.name ? { slug: this.toSlug(patch.name) } : {}),
      updatedAt
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({
        products: this.snapshotSignal().products.filter((product) => product.id !== productId)
      });
      return;
    }

    await deleteDoc(doc(db, 'products', productId));

    const nextSections = this.content().sections.map((section) => ({
      ...section,
      productIds: section.productIds.filter((id) => id !== productId)
    }));

    await this.saveHomeContent({
      ...this.content(),
      sections: nextSections
    });
  }

  async saveMediaItem(item: MediaItem): Promise<void> {
    const normalizedItem = this.normalizeMediaItem(item);
    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({
        media: [normalizedItem, ...this.snapshotSignal().media]
      });
      return;
    }

    await setDoc(doc(db, 'media', normalizedItem.id), normalizedItem, { merge: true });
  }

  async deleteMediaItem(itemId: string): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) {
      this.patchSnapshot({
        media: this.snapshotSignal().media.filter((item) => item.id !== itemId)
      });
      return;
    }

    await deleteDoc(doc(db, 'media', itemId));
  }

  async findProductsBySection(sectionId: string): Promise<Product[]> {
    const db = this.firebase.firestore;
    if (!db) {
      return this.products().filter((product) => product.sectionId === sectionId);
    }

    return new Promise<Product[]>((resolve, reject) => {
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, where('sectionId', '==', sectionId));

      const unsubscribe = onSnapshot(
        productsQuery,
        (snapshot) => {
          const products = snapshot.docs.map((docSnap) => docSnap.data() as Product);
          unsubscribe();
          resolve(products);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
  }

  async createAnalyticsEvent(payload: Record<string, unknown>): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) {
      return;
    }

    await addDoc(collection(db, 'analytics_events'), payload);
  }

  async createLead(payload: Record<string, unknown>): Promise<void> {
    const createdAt =
      typeof payload['createdAt'] === 'number' ? (payload['createdAt'] as number) : Date.now();
    const normalizedLead: Record<string, unknown> & {
      createdAt: number;
      updatedAt: number;
      status: LeadStatus;
      adminNotes: string;
    } = {
      ...payload,
      createdAt,
      updatedAt: typeof payload['updatedAt'] === 'number' ? (payload['updatedAt'] as number) : createdAt,
      status: (payload['status'] as LeadStatus | undefined) || 'new',
      adminNotes: (payload['adminNotes'] as string | undefined) || ''
    };

    const db = this.firebase.firestore;
    if (!db) {
      const leadId = crypto.randomUUID();
      this.leadsSignal.update((leads) => [
        {
          id: leadId,
          name: (normalizedLead['name'] as string) || '',
          email: (normalizedLead['email'] as string) || '',
          phone: (normalizedLead['phone'] as string) || '',
          company: (normalizedLead['company'] as string) || '',
          message: (normalizedLead['message'] as string) || '',
          sourcePath: (normalizedLead['sourcePath'] as string) || '',
          consent: Boolean(normalizedLead['consent']),
          createdAt,
          updatedAt: normalizedLead.updatedAt,
          status: normalizedLead.status,
          adminNotes: normalizedLead.adminNotes
        },
        ...leads
      ]);
      return;
    }

    await addDoc(collection(db, 'leads'), normalizedLead);
  }

  async updateLeadStatus(leadId: string, status: LeadStatus, adminNotes = ''): Promise<void> {
    const updatedAt = Date.now();
    const db = this.firebase.firestore;
    if (!db) {
      this.leadsSignal.update((leads) =>
        leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status,
                adminNotes,
                updatedAt
              }
            : lead
        )
      );
      return;
    }

    await updateDoc(doc(db, 'leads', leadId), {
      status,
      adminNotes,
      updatedAt
    });
  }

  private startRealtimeSync(): void {
    const db = this.firebase.firestore;
    if (!db) {
      return;
    }

    this.unsubscribers.push(
      onSnapshot(doc(db, 'site', 'content'), async (snapshot) => {
        if (!snapshot.exists()) {
          await setDoc(doc(db, 'site', 'content'), DEFAULT_HOME_CONTENT, { merge: true });
          this.patchSnapshot({ content: DEFAULT_HOME_CONTENT });
          this.markBootstrapReady('content');
          return;
        }

        this.patchSnapshot({ content: this.normalizeHomeContent(snapshot.data() as HomeContent) });
        this.markBootstrapReady('content');
      })
    );

    this.unsubscribers.push(
      onSnapshot(doc(db, 'site', 'theme'), async (snapshot) => {
        if (!snapshot.exists()) {
          await setDoc(doc(db, 'site', 'theme'), DEFAULT_THEME, { merge: true });
          this.patchSnapshot({ theme: DEFAULT_THEME });
          this.markBootstrapReady('theme');
          return;
        }

        this.patchSnapshot({ theme: { ...DEFAULT_THEME, ...(snapshot.data() as SiteTheme) } });
        this.markBootstrapReady('theme');
      })
    );

    this.unsubscribers.push(
      onSnapshot(doc(db, 'site', 'settings'), async (snapshot) => {
        if (!snapshot.exists()) {
          await setDoc(doc(db, 'site', 'settings'), DEFAULT_SETTINGS, { merge: true });
          this.patchSnapshot({ settings: DEFAULT_SETTINGS });
          this.markBootstrapReady('settings');
          return;
        }

        this.patchSnapshot({ settings: this.normalizeSettings(snapshot.data() as SiteSettings) });
        this.markBootstrapReady('settings');
      })
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'products'), (snapshot) => {
        const products = snapshot.docs.map((docSnap) => docSnap.data() as Product);
        const sorted = products.sort((a, b) => b.updatedAt - a.updatedAt);
        this.patchSnapshot({ products: sorted });
        this.markBootstrapReady('products');
      })
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'media'), (snapshot) => {
        const mediaItems = snapshot.docs.map((docSnap) => docSnap.data() as MediaItem);
        const sorted = mediaItems.sort((a, b) => b.createdAt - a.createdAt);
        this.patchSnapshot({ media: sorted });
        this.markBootstrapReady('media');
      })
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'leads'), (snapshot) => {
        const leads = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<LeadRecord>;
          const createdAt = typeof data.createdAt === 'number' ? data.createdAt : Date.now();
          const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : createdAt;

          return {
            id: docSnap.id,
            name: data.name?.trim() || 'Unknown',
            email: data.email?.trim() || '',
            phone: data.phone?.trim() || '',
            company: data.company?.trim() || '',
            message: data.message?.trim() || '',
            sourcePath: data.sourcePath?.trim() || '/',
            consent: Boolean(data.consent),
            createdAt,
            updatedAt,
            status: data.status || 'new',
            adminNotes: data.adminNotes?.trim() || ''
          } as LeadRecord;
        });

        leads.sort((a, b) => b.updatedAt - a.updatedAt);
        this.leadsSignal.set(leads);
      })
    );
  }

  private markBootstrapReady(key: string): void {
    this.pendingBootstrapKeys.delete(key);

    if (this.pendingBootstrapKeys.size > 0) {
      return;
    }

    this.loadingSignal.set(false);

    if (this.bootstrapFallbackTimer !== null) {
      window.clearTimeout(this.bootstrapFallbackTimer);
      this.bootstrapFallbackTimer = null;
    }
  }

  private patchSnapshot(patch: Partial<SiteSnapshot>): void {
    this.snapshotSignal.update((snapshot) => ({
      ...snapshot,
      ...patch
    }));
  }

  private normalizeMediaItem(item: MediaItem): MediaItem {
    const normalizedName = item.name?.trim() || 'Untitled media';
    const normalizedHash = item.hash?.trim() || crypto.randomUUID();
    const normalizedStoragePath = item.storagePath?.trim() || `media:${normalizedHash}`;
    const normalizedDownloadUrl = item.downloadUrl?.trim() || '';
    const normalizedPublicId = item.cloudinaryPublicId?.trim();
    const normalizedDeleteToken = item.cloudinaryDeleteToken?.trim();

    return {
      id: item.id,
      name: normalizedName,
      hash: normalizedHash,
      storagePath: normalizedStoragePath,
      downloadUrl: normalizedDownloadUrl,
      ...(normalizedPublicId ? { cloudinaryPublicId: normalizedPublicId } : {}),
      ...(normalizedDeleteToken ? { cloudinaryDeleteToken: normalizedDeleteToken } : {}),
      createdAt: item.createdAt || Date.now()
    };
  }

  private normalizeHomeContent(rawContent: Partial<HomeContent> | HomeContent): HomeContent {
    const content = rawContent || DEFAULT_HOME_CONTENT;

    const sections = Array.isArray(content.sections)
      ? content.sections.map((section, index) => ({
          id: section?.id?.trim() || `section-${index + 1}`,
          title: section?.title?.trim() || `Section ${index + 1}`,
          summary: section?.summary?.trim() || '',
          productIds: Array.isArray(section?.productIds) ? section.productIds.filter(Boolean) : []
        }))
      : structuredClone(DEFAULT_HOME_CONTENT.sections);

    const highlights = Array.isArray(content.highlights)
      ? content.highlights.map((item) => item?.trim()).filter(Boolean)
      : structuredClone(DEFAULT_HOME_CONTENT.highlights);

    const announcementPatch = (content as { announcement?: Partial<AnnouncementContent> }).announcement || {};
    const announcement: AnnouncementContent = {
      ...structuredClone(DEFAULT_HOME_CONTENT.announcement),
      ...announcementPatch,
      textItems: Array.isArray(announcementPatch.textItems)
        ? announcementPatch.textItems
            .map((item, index) => ({
              id: item?.id?.trim() || `ann-text-${index + 1}`,
              text: item?.text?.trim() || ''
            }))
            .filter((item) => item.text.length > 0)
        : structuredClone(DEFAULT_HOME_CONTENT.announcement.textItems),
      imageItems: Array.isArray(announcementPatch.imageItems)
        ? announcementPatch.imageItems
            .map((item, index) => ({
              id: item?.id?.trim() || `ann-img-${index + 1}`,
              imageUrl: item?.imageUrl?.trim() || '',
              caption: item?.caption?.trim() || '',
              alt: item?.alt?.trim() || 'Announcement slide'
            }))
            .filter((item) => item.imageUrl.length > 0)
        : structuredClone(DEFAULT_HOME_CONTENT.announcement.imageItems)
    };

    return {
      ...structuredClone(DEFAULT_HOME_CONTENT),
      ...content,
      hero: {
        ...DEFAULT_HOME_CONTENT.hero,
        ...(content.hero || {})
      },
      sections,
      highlights: highlights.length ? highlights : structuredClone(DEFAULT_HOME_CONTENT.highlights),
      announcement
    };
  }

  private normalizeSettings(rawSettings: Partial<SiteSettings> | SiteSettings): SiteSettings {
    const settings = rawSettings || DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      companyName: settings.companyName?.trim() || DEFAULT_SETTINGS.companyName,
      companyTagline: settings.companyTagline?.trim() || DEFAULT_SETTINGS.companyTagline,
      companyStory: settings.companyStory?.trim() || DEFAULT_SETTINGS.companyStory,
      logoUrl: settings.logoUrl?.trim() || DEFAULT_SETTINGS.logoUrl,
      contactEmail: settings.contactEmail?.trim() || DEFAULT_SETTINGS.contactEmail,
      contactPhone: settings.contactPhone?.trim() || DEFAULT_SETTINGS.contactPhone,
      whatsappNumber: settings.whatsappNumber?.trim() || DEFAULT_SETTINGS.whatsappNumber,
      address: settings.address?.trim() || DEFAULT_SETTINGS.address
    };
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
