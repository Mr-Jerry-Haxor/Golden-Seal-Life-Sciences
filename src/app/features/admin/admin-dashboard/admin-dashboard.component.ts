import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import {
  AnnouncementContent,
  AnnouncementImageItem,
  AnnouncementSeparator,
  DEFAULT_HOME_CONTENT,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  HomeContent,
  HomeSection,
  MediaItem,
  Product,
  ProductCategory,
  SiteSettings,
  SiteTheme
} from '../../../core/models/site.models';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { MediaService } from '../../../core/services/media.service';
import { SiteContentService } from '../../../core/services/site-content.service';

type SeparatorOption = {
  value: AnnouncementSeparator;
  label: string;
};

type ProductFilterCategory = ProductCategory | 'all';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ImageCropperComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly siteContent = inject(SiteContentService);
  private readonly mediaService = inject(MediaService);
  private readonly auth = inject(AdminAuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly publishedContent = this.siteContent.content;
  readonly products = this.siteContent.products;
  readonly media = this.siteContent.media;
  readonly fallbackLogoUrl = DEFAULT_SETTINGS.logoUrl;

  readonly categories: ProductCategory[] = [
    'Aqua Probiotics',
    'Agricultural Micronutrients',
    'Fine Chemicals',
    'Custom Solutions'
  ];

  readonly separatorOptions: SeparatorOption[] = [
    {
      value: 'star',
      label: 'Star separator'
    },
    {
      value: 'announcement',
      label: 'Announcement icon separator'
    }
  ];

  contentDraft: HomeContent = structuredClone(DEFAULT_HOME_CONTENT);
  settingsDraft: SiteSettings = structuredClone(DEFAULT_SETTINGS);
  themeDraft: SiteTheme = structuredClone(DEFAULT_THEME);

  selectedProductId: string | null = null;
  productDraft: Partial<Product> = this.newProductDraft();
  productTagsInput = '';

  imageChangedEvent: Event | null = null;
  croppedBlob: Blob | null = null;
  selectedUploadFile: File | null = null;
  uploadFileName = '';
  maintainCropAspectRatio = false;
  cropAspectRatio = 16 / 10;

  isUploadingAnnouncementImages = false;
  announcementUploadProgressText = '';
  isUploadingLogo = false;
  logoUploadProgressText = '';
  deletingMediaIdSet = new Set<string>();

  readonly activeTabIndex = signal(0);
  readonly lastSavedAtSignal = signal<number | null>(null);
  readonly productSearchQuery = signal('');
  readonly productCategoryFilter = signal<ProductFilterCategory>('all');
  readonly mediaSearchQuery = signal('');

  readonly dashboardKpis = computed(() => {
    const content = this.publishedContent();
    const products = this.products();
    const media = this.media();

    return {
      productCount: products.length,
      mediaCount: media.length,
      sectionCount: content.sections.length,
      highlightCount: content.highlights.length,
      announcementTextCount: content.announcement.textItems.length,
      announcementImageCount: content.announcement.imageItems.length
    };
  });

  readonly filteredProducts = computed(() => {
    const query = this.productSearchQuery().trim().toLowerCase();
    const selectedCategory = this.productCategoryFilter();

    return this.products().filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.shortDescription.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  });

  readonly filteredMedia = computed(() => {
    const query = this.mediaSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.media();
    }

    return this.media().filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.hash.toLowerCase().includes(query) ||
        item.downloadUrl.toLowerCase().includes(query)
      );
    });
  });

  readonly lastSavedLabel = computed(() => {
    const timestamp = this.lastSavedAtSignal();
    if (!timestamp) {
      return 'Not saved in this session yet';
    }

    return `Last saved at ${new Date(timestamp).toLocaleTimeString()}`;
  });

  readonly sectionOptions = computed(() => this.contentDraft.sections);

  constructor() {
    effect(() => {
      this.contentDraft = structuredClone(this.siteContent.content());
      this.settingsDraft = structuredClone(this.siteContent.settings());
      this.themeDraft = structuredClone(this.siteContent.theme());
      this.ensureAnnouncementDraft();

      if (!this.productDraft.sectionId?.trim()) {
        this.productDraft.sectionId = this.contentDraft.sections[0]?.id || '';
      }
    });
  }

  async saveContentAndSettings(): Promise<void> {
    try {
      this.prepareContentDraftForSave();
      this.prepareSettingsDraftForSave();
      await this.siteContent.saveHomeContent(this.contentDraft);
      await this.siteContent.saveSettings(this.settingsDraft);
      this.markSaved();
      this.notify('Content and settings saved to Firestore.');
    } catch (error) {
      this.handleError('Unable to save content and settings.', error);
    }
  }

  async saveContentOnly(): Promise<void> {
    try {
      this.prepareContentDraftForSave();
      await this.siteContent.saveHomeContent(this.contentDraft);
      this.markSaved();
      this.notify('Homepage content saved.');
    } catch (error) {
      this.handleError('Unable to save homepage content.', error);
    }
  }

  async saveTheme(): Promise<void> {
    try {
      await this.siteContent.saveTheme(this.themeDraft);
      this.markSaved();
      this.notify('Theme updated.');
    } catch (error) {
      this.handleError('Unable to save theme changes.', error);
    }
  }

  addHighlight(): void {
    this.contentDraft.highlights = [...this.contentDraft.highlights, ''];
  }

  removeHighlight(index: number): void {
    this.contentDraft.highlights = this.contentDraft.highlights.filter((_, itemIndex) => itemIndex !== index);
  }

  moveHighlight(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.contentDraft.highlights.length) {
      return;
    }

    const next = [...this.contentDraft.highlights];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    this.contentDraft.highlights = next;
  }

  addSection(): void {
    const nextIndex = this.contentDraft.sections.length + 1;
    const existingIds = new Set(this.contentDraft.sections.map((section) => section.id));
    const newSection: HomeSection = {
      id: this.makeUniqueSectionId(`section-${nextIndex}`, existingIds),
      title: `Section ${nextIndex}`,
      summary: 'Describe this section for the homepage.',
      productIds: []
    };

    this.contentDraft.sections = [...this.contentDraft.sections, newSection];
  }

  removeSection(index: number): void {
    if (this.contentDraft.sections.length <= 1) {
      this.notify('At least one homepage section is required.');
      return;
    }

    const removedSection = this.contentDraft.sections[index];
    this.contentDraft.sections = this.contentDraft.sections.filter((_, sectionIndex) => sectionIndex !== index);

    if (this.productDraft.sectionId === removedSection.id) {
      this.productDraft.sectionId = this.contentDraft.sections[0]?.id || '';
    }
  }

  moveSection(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.contentDraft.sections.length) {
      return;
    }

    const next = [...this.contentDraft.sections];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    this.contentDraft.sections = next;
  }

  setAnnouncementMode(mode: 'text' | 'image'): void {
    const announcement = this.ensureAnnouncementDraft();
    announcement.mode = mode;
  }

  addAnnouncementTextItem(): void {
    const announcement = this.ensureAnnouncementDraft();
    announcement.textItems = [
      ...announcement.textItems,
      {
        id: crypto.randomUUID(),
        text: ''
      }
    ];
  }

  removeAnnouncementTextItem(index: number): void {
    const announcement = this.ensureAnnouncementDraft();
    announcement.textItems = announcement.textItems.filter((_, itemIndex) => itemIndex !== index);
  }

  moveAnnouncementTextItem(index: number, direction: -1 | 1): void {
    const announcement = this.ensureAnnouncementDraft();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= announcement.textItems.length) {
      return;
    }

    const next = [...announcement.textItems];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    announcement.textItems = next;
  }

  async uploadAnnouncementImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      return;
    }

    const announcement = this.ensureAnnouncementDraft();
    this.isUploadingAnnouncementImages = true;
    this.announcementUploadProgressText = `Uploading ${files.length} image(s) to Cloudinary...`;

    let successCount = 0;

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          continue;
        }

        const mediaItem = await this.mediaService.uploadImage(file, file.name);
        const nextImage: AnnouncementImageItem = {
          id: crypto.randomUUID(),
          imageUrl: mediaItem.downloadUrl,
          caption: '',
          alt: file.name
        };
        announcement.imageItems = [...announcement.imageItems, nextImage];
        successCount += 1;
      }

      if (successCount > 0) {
        this.notify(`${successCount} announcement image(s) uploaded successfully.`);
      } else {
        this.notify('No valid image files were uploaded.');
      }
    } catch (error) {
      this.handleError('Failed to upload one or more announcement images.', error);
    } finally {
      this.isUploadingAnnouncementImages = false;
      this.announcementUploadProgressText = '';
      input.value = '';
    }
  }

  addMediaToAnnouncement(downloadUrl: string, fileName = 'Announcement image'): void {
    const announcement = this.ensureAnnouncementDraft();
    announcement.imageItems = [
      ...announcement.imageItems,
      {
        id: crypto.randomUUID(),
        imageUrl: downloadUrl,
        caption: '',
        alt: fileName
      }
    ];
    this.notify('Image added to announcement slideshow draft.');
  }

  removeAnnouncementImage(index: number): void {
    const announcement = this.ensureAnnouncementDraft();
    announcement.imageItems = announcement.imageItems.filter((_, imageIndex) => imageIndex !== index);
  }

  moveAnnouncementImage(index: number, direction: -1 | 1): void {
    const announcement = this.ensureAnnouncementDraft();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= announcement.imageItems.length) {
      return;
    }

    const next = [...announcement.imageItems];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    announcement.imageItems = next;
  }

  prepareNewProduct(): void {
    this.selectedProductId = null;
    this.productDraft = this.newProductDraft();
    this.productTagsInput = '';
  }

  editProduct(product: Product): void {
    this.selectedProductId = product.id;
    this.productDraft = structuredClone(product);
    this.productTagsInput = product.tags.join(', ');
  }

  async saveProduct(): Promise<void> {
    if (!this.productDraft.name?.trim()) {
      this.notify('Product name is required.');
      return;
    }

    const sectionId = this.productDraft.sectionId?.trim() || '';
    const tags = this.productTagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    let productId = this.selectedProductId;

    try {
      if (this.selectedProductId) {
        await this.siteContent.updateProduct(this.selectedProductId, {
          ...this.productDraft,
          tags
        });
      } else {
        productId = await this.siteContent.createProduct({
          ...this.productDraft,
          tags
        });
      }

      if (!productId) {
        this.notify('Unable to save product.');
        return;
      }

      this.syncSectionProductIds(productId, sectionId);
      await this.siteContent.saveHomeContent(this.contentDraft);
      this.markSaved();

      this.notify('Product saved.');
      this.prepareNewProduct();
    } catch (error) {
      this.handleError('Unable to save product changes.', error);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.siteContent.deleteProduct(productId);
      this.markSaved();
      this.notify('Product deleted.');

      if (this.selectedProductId === productId) {
        this.prepareNewProduct();
      }
    } catch (error) {
      this.handleError('Unable to delete product.', error);
    }
  }

  onFileChange(event: Event): void {
    this.imageChangedEvent = event;
    this.croppedBlob = null;

    const input = event.target as HTMLInputElement;
    this.selectedUploadFile = input.files?.[0] || null;
    this.uploadFileName = this.selectedUploadFile?.name || 'uploaded-image.jpg';
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob || null;
  }

  async uploadCroppedImage(): Promise<void> {
    if (!this.croppedBlob) {
      this.notify('Please crop an image before uploading.');
      return;
    }

    try {
      const mediaItem = await this.mediaService.uploadImage(this.croppedBlob, this.uploadFileName);
      this.productDraft.imageUrl = mediaItem.downloadUrl;
      this.imageChangedEvent = null;
      this.croppedBlob = null;
      this.selectedUploadFile = null;
      this.notify('Image uploaded and attached to current product draft.');
    } catch (error) {
      this.handleError('Unable to upload cropped image.', error);
    }
  }

  async uploadOriginalImage(): Promise<void> {
    if (!this.selectedUploadFile) {
      this.notify('Please select an image to upload.');
      return;
    }

    try {
      const mediaItem = await this.mediaService.uploadImage(this.selectedUploadFile, this.uploadFileName);
      this.productDraft.imageUrl = mediaItem.downloadUrl;
      this.imageChangedEvent = null;
      this.croppedBlob = null;
      this.selectedUploadFile = null;
      this.notify('Original image uploaded and attached to current product draft.');
    } catch (error) {
      this.handleError('Unable to upload original image.', error);
    }
  }

  async uploadCompanyLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notify('Please choose an image file for the company logo.');
      input.value = '';
      return;
    }

    this.isUploadingLogo = true;
    this.logoUploadProgressText = 'Uploading logo to Cloudinary...';

    try {
      const mediaItem = await this.mediaService.uploadImage(file, file.name);
      this.settingsDraft.logoUrl = mediaItem.downloadUrl;
      this.notify('Logo uploaded. Save content and settings to publish it.');
    } catch (error) {
      this.handleError('Unable to upload logo.', error);
    } finally {
      this.isUploadingLogo = false;
      this.logoUploadProgressText = '';
      input.value = '';
    }
  }

  useMediaAsCompanyLogo(downloadUrl: string): void {
    this.settingsDraft.logoUrl = downloadUrl;
    this.notify('Logo selected from media library. Save content and settings to publish it.');
  }

  clearCompanyLogo(): void {
    this.settingsDraft.logoUrl = this.fallbackLogoUrl;
  }

  useMedia(downloadUrl: string): void {
    this.productDraft.imageUrl = downloadUrl;
    this.notify('Media applied to product draft.');
  }

  isDeletingMedia(mediaId: string): boolean {
    return this.deletingMediaIdSet.has(mediaId);
  }

  async deleteMedia(item: MediaItem): Promise<void> {
    const confirmDelete = window.confirm(
      `Delete "${item.name}" from media library${item.storagePath.startsWith('cloudinary:') ? ' and Cloudinary' : ''}?`
    );

    if (!confirmDelete || this.deletingMediaIdSet.has(item.id)) {
      return;
    }

    this.deletingMediaIdSet.add(item.id);

    try {
      await this.mediaService.deleteImage(item);
      this.removeDeletedMediaFromDrafts(item.downloadUrl);
      this.markSaved();

      if (item.storagePath.startsWith('cloudinary:')) {
        this.notify('Media deleted from Cloudinary and media library.');
      } else {
        this.notify('Media removed from media library.');
      }
    } catch (error) {
      this.handleError('Unable to delete media item.', error);
    } finally {
      this.deletingMediaIdSet.delete(item.id);
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }

  jumpToTab(index: number): void {
    this.activeTabIndex.set(index);
  }

  resetProductFilters(): void {
    this.productSearchQuery.set('');
    this.productCategoryFilter.set('all');
  }

  resetMediaFilters(): void {
    this.mediaSearchQuery.set('');
  }

  private syncSectionProductIds(productId: string, nextSectionId: string): void {
    this.contentDraft.sections = this.contentDraft.sections.map((section) => {
      const hasProduct = section.productIds.includes(productId);

      if (section.id === nextSectionId && !hasProduct) {
        return {
          ...section,
          productIds: [...section.productIds, productId]
        };
      }

      if (section.id !== nextSectionId && hasProduct) {
        return {
          ...section,
          productIds: section.productIds.filter((id) => id !== productId)
        };
      }

      return section;
    });
  }

  private ensureAnnouncementDraft(): AnnouncementContent {
    if (!this.contentDraft.announcement) {
      this.contentDraft.announcement = structuredClone(DEFAULT_HOME_CONTENT.announcement);
    }

    return this.contentDraft.announcement;
  }

  private prepareContentDraftForSave(): void {
    const seenIds = new Set<string>();

    this.contentDraft.sections = this.contentDraft.sections.map((section, index) => {
      const normalizedTitle = section.title?.trim() || `Section ${index + 1}`;
      let normalizedId = section.id?.trim() || this.toId(normalizedTitle);
      normalizedId = this.makeUniqueSectionId(normalizedId, seenIds);

      return {
        ...section,
        id: normalizedId,
        title: normalizedTitle,
        summary: section.summary?.trim() || '',
        productIds: Array.from(new Set((section.productIds || []).filter(Boolean)))
      };
    });

    if (this.contentDraft.sections.length === 0) {
      this.contentDraft.sections = structuredClone(DEFAULT_HOME_CONTENT.sections);
    }

    this.contentDraft.highlights = this.contentDraft.highlights
      .map((item) => item.trim())
      .filter(Boolean);

    if (this.contentDraft.highlights.length === 0) {
      this.contentDraft.highlights = structuredClone(DEFAULT_HOME_CONTENT.highlights);
    }

    const announcement = this.ensureAnnouncementDraft();
    announcement.scrollSpeedSeconds = Math.max(10, Number(announcement.scrollSpeedSeconds) || 28);
    announcement.slideshowIntervalMs = Math.max(2200, Number(announcement.slideshowIntervalMs) || 4500);

    announcement.textItems = announcement.textItems
      .map((item, index) => ({
        id: item.id || `ann-text-${index + 1}`,
        text: item.text.trim()
      }))
      .filter((item) => item.text.length > 0);

    announcement.imageItems = announcement.imageItems
      .map((item, index) => ({
        id: item.id || `ann-img-${index + 1}`,
        imageUrl: item.imageUrl.trim(),
        caption: item.caption.trim(),
        alt: (item.alt || item.caption || `Announcement image ${index + 1}`).trim()
      }))
      .filter((item) => item.imageUrl.length > 0);
  }

  private prepareSettingsDraftForSave(): void {
    const fallback = DEFAULT_SETTINGS;
    this.settingsDraft = {
      ...fallback,
      ...this.settingsDraft,
      companyName: this.settingsDraft.companyName?.trim() || fallback.companyName,
      companyTagline: this.settingsDraft.companyTagline?.trim() || fallback.companyTagline,
      companyStory: this.settingsDraft.companyStory?.trim() || fallback.companyStory,
      logoUrl: this.settingsDraft.logoUrl?.trim() || fallback.logoUrl,
      contactEmail: this.settingsDraft.contactEmail?.trim() || fallback.contactEmail,
      contactPhone: this.settingsDraft.contactPhone?.trim() || fallback.contactPhone,
      whatsappNumber: this.settingsDraft.whatsappNumber?.trim() || fallback.whatsappNumber,
      address: this.settingsDraft.address?.trim() || fallback.address
    };
  }

  private removeDeletedMediaFromDrafts(downloadUrl: string): void {
    if (this.productDraft.imageUrl === downloadUrl) {
      this.productDraft.imageUrl = '';
    }

    if (this.settingsDraft.logoUrl === downloadUrl) {
      this.settingsDraft.logoUrl = this.fallbackLogoUrl;
    }

    const announcement = this.ensureAnnouncementDraft();
    announcement.imageItems = announcement.imageItems.filter((item) => item.imageUrl !== downloadUrl);
  }

  private makeUniqueSectionId(baseId: string, existing = new Set<string>()): string {
    let normalized = this.toId(baseId || 'section');
    if (!normalized) {
      normalized = 'section';
    }

    let suffix = 1;
    let candidate = normalized;
    while (existing.has(candidate)) {
      suffix += 1;
      candidate = `${normalized}-${suffix}`;
    }

    existing.add(candidate);
    return candidate;
  }

  private toId(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private newProductDraft(): Partial<Product> {
    return {
      name: '',
      category: 'Aqua Probiotics',
      shortDescription: '',
      longDescription: '',
      imageUrl: '',
      highlighted: false,
      sectionId: this.contentDraft.sections[0]?.id || '',
      tags: []
    };
  }

  private markSaved(): void {
    this.lastSavedAtSignal.set(Date.now());
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2800
    });
  }

  private handleError(contextMessage: string, error: unknown): void {
    console.error(contextMessage, error);
    const details = error instanceof Error ? error.message.trim() : '';
    this.notify(details ? `${contextMessage} ${details}` : contextMessage);
  }
}
