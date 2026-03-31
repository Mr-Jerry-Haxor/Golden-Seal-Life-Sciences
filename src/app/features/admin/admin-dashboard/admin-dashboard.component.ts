import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { getBrandLogoUrl, getBrandLogoWithBackgroundUrl } from '../../../core/config/brand-assets.config';
import {
  AnnouncementContent,
  AnnouncementImageItem,
  AnnouncementSeparator,
  DEFAULT_HOME_CONTENT,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  HomeContent,
  HomeSection,
  LeadRecord,
  LeadStatus,
  MediaItem,
  Product,
  ProductCategory,
  SiteSettings,
  SiteTheme
} from '../../../core/models/site.models';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { MediaService } from '../../../core/services/media.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { ToastTone, ToastService } from '../../../core/services/toast.service';
import { UiPreferencesService } from '../../../core/services/ui-preferences.service';

type SeparatorOption = {
  value: AnnouncementSeparator;
  label: string;
};

type ProductFilterCategory = ProductCategory | 'all';

type AdminView = 'dashboard' | 'users' | 'inquiries' | 'products' | 'analytics' | 'settings';

type LeadFilterStatus = LeadStatus | 'all';

type SidebarItem = {
  view: AdminView;
  label: string;
  description: string;
  iconPath: string;
  shortcut: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Pending' | 'Suspended';
};

type DashboardStatCard = {
  label: string;
  value: string;
  trend: string;
  trendTone: 'positive' | 'neutral' | 'warning';
};

type AdminNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: number;
  tone: ToastTone;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  tone: 'success' | 'info' | 'warning';
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly siteContent = inject(SiteContentService);
  private readonly mediaService = inject(MediaService);
  private readonly auth = inject(AdminAuthService);
  private readonly toast = inject(ToastService);
  private readonly uiPreferences = inject(UiPreferencesService);
  private readonly router = inject(Router);

  readonly isLoading = this.siteContent.isLoading;
  readonly isDarkMode = this.uiPreferences.darkMode;
  readonly currentAdminEmail = this.auth.currentAdminEmail;

  readonly publishedContent = this.siteContent.content;
  readonly products = this.siteContent.products;
  readonly media = this.siteContent.media;
  readonly leads = this.siteContent.leads;
  readonly fallbackLogoUrl = DEFAULT_SETTINGS.logoUrl;
  readonly sidebarLogoFallbackUrl = getBrandLogoWithBackgroundUrl('adminSidebar');

  readonly sidebarItems: SidebarItem[] = [
    {
      view: 'dashboard',
      label: 'Dashboard',
      description: 'SaaS overview and activity',
      iconPath: 'M3 12h7V3H3v9Zm0 9h7v-7H3v7Zm11 0h7V12h-7v9Zm0-18v7h7V3h-7Z',
      shortcut: 'Alt+1'
    },
    {
      view: 'users',
      label: 'Users',
      description: 'Team and access entries',
      iconPath:
        'M16 11c1.66 0 2.99-1.79 2.99-4S17.66 3 16 3s-3 1.79-3 4 1.34 4 3 4Zm-8 0c1.66 0 2.99-1.79 2.99-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V20h7v-3.5c0-2.33-4.67-3.5-7-3.5Z',
      shortcut: 'Alt+2'
    },
    {
      view: 'inquiries',
      label: 'Inquiries',
      description: 'Contact form submissions',
      iconPath:
        'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Zm2.3.5 5.7 4.27L17.7 6H6.3Zm11.7 2.35-4.9 3.67a1.9 1.9 0 0 1-2.2 0L6 8.35V18.5c0 .28.22.5.5.5h11a.5.5 0 0 0 .5-.5V8.35Z',
      shortcut: 'Alt+3'
    },
    {
      view: 'products',
      label: 'Products / Services',
      description: 'Catalog operations',
      iconPath:
        'M4 7V4a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v1H4Zm0 2h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm3 3v5h2v-5H7Zm4 0v5h2v-5h-2Zm4 0v5h2v-5h-2Z',
      shortcut: 'Alt+4'
    },
    {
      view: 'analytics',
      label: 'Analytics',
      description: 'Insights and trends',
      iconPath: 'M4 19h16v2H4v-2Zm1-2h3V8H5v9Zm5 0h3V4h-3v13Zm5 0h3v-6h-3v6Z',
      shortcut: 'Alt+5'
    },
    {
      view: 'settings',
      label: 'Settings',
      description: 'Content, media, and theme',
      iconPath:
        'M12 8.6A3.4 3.4 0 1 0 12 15.4a3.4 3.4 0 0 0 0-6.8Zm9 3.4-.93-.54a7.53 7.53 0 0 0-.16-1.3l.86-.67a1 1 0 0 0 .25-1.3l-1.5-2.6a1 1 0 0 0-1.25-.43l-1 .4c-.33-.28-.68-.54-1.06-.76L15.1 3.7a1 1 0 0 0-.98-.7h-3a1 1 0 0 0-.98.7l-.31 1.06c-.38.22-.73.48-1.06.76l-1-.4a1 1 0 0 0-1.25.43l-1.5 2.6a1 1 0 0 0 .25 1.3l.86.67c-.07.43-.12.86-.16 1.3L3 12a1 1 0 0 0 0 1.8l.93.54c.04.44.09.87.16 1.3l-.86.67a1 1 0 0 0-.25 1.3l1.5 2.6a1 1 0 0 0 1.25.43l1-.4c.33.28.68.54 1.06.76l.31 1.06a1 1 0 0 0 .98.7h3a1 1 0 0 0 .98-.7l.31-1.06c.38-.22.73-.48 1.06-.76l1 .4a1 1 0 0 0 1.25-.43l1.5-2.6a1 1 0 0 0-.25-1.3l-.86-.67c.07-.43.12-.86.16-1.3L21 13.8a1 1 0 0 0 0-1.8Z',
      shortcut: 'Alt+6'
    }
  ];

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

  readonly activeView = signal<AdminView>('dashboard');
  readonly mobileSidebarOpen = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly dashboardSearchQuery = signal('');
  readonly inquiryStatusFilter = signal<LeadFilterStatus>('all');
  readonly lastSavedAtSignal = signal<number | null>(null);
  readonly productSearchQuery = signal('');
  readonly productCategoryFilter = signal<ProductFilterCategory>('all');
  readonly mediaSearchQuery = signal('');

  readonly adminUsers = signal<AdminUserRow[]>([
    {
      id: 'u-01',
      name: 'Jerry Haxor',
      email: 'jerry.haxor@goldenseallifesciences.com',
      status: 'Active'
    },
    {
      id: 'u-02',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@goldenseallifesciences.com',
      status: 'Active'
    },
    {
      id: 'u-03',
      name: 'Rahul Mehta',
      email: 'rahul.mehta@goldenseallifesciences.com',
      status: 'Pending'
    },
    {
      id: 'u-04',
      name: 'Priya Das',
      email: 'priya.das@goldenseallifesciences.com',
      status: 'Suspended'
    }
  ]);

  readonly notifications = signal<AdminNotification[]>([
    {
      id: crypto.randomUUID(),
      title: 'Cloud sync ready',
      detail: 'Realtime Firestore sync is active for content, products, and media.',
      createdAt: Date.now() - 90_000,
      tone: 'info'
    },
    {
      id: crypto.randomUUID(),
      title: 'Security notice',
      detail: 'Keyboard shortcuts enabled: Alt+1 to Alt+6 for view navigation.',
      createdAt: Date.now() - 45_000,
      tone: 'success'
    }
  ]);

  readonly chartBarHeights = ['h-20', 'h-28', 'h-24', 'h-36', 'h-32', 'h-40', 'h-28'];

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

  readonly activeViewMeta = computed(() => {
    const selectedView = this.activeView();
    return this.sidebarItems.find((item) => item.view === selectedView) || this.sidebarItems[0];
  });

  readonly globalSearchLabel = computed(() => {
    if (this.activeView() === 'inquiries') {
      return 'Search inquiries';
    }

    return 'Search dashboard users';
  });

  readonly globalSearchPlaceholder = computed(() => {
    if (this.activeView() === 'inquiries') {
      return 'Search by name, email, company, message, or source path';
    }

    return 'Search users by name, email, or status';
  });

  readonly dashboardStatCards = computed<DashboardStatCard[]>(() => {
    const kpi = this.dashboardKpis();
    return [
      {
        label: 'Total Users',
        value: this.adminUsers().length.toString(),
        trend: '+12% this month',
        trendTone: 'positive'
      },
      {
        label: 'Active Sessions',
        value: Math.max(4, Math.round(kpi.productCount * 1.4)).toString(),
        trend: '+8.6% this week',
        trendTone: 'positive'
      },
      {
        label: 'Catalog Items',
        value: kpi.productCount.toString(),
        trend: `${kpi.mediaCount} linked media assets`,
        trendTone: 'neutral'
      },
      {
        label: 'Open Inquiries',
        value: this.leads().filter((lead) => lead.status !== 'closed').length.toString(),
        trend: `${this.leads().length} total submissions`,
        trendTone: this.leads().length > 0 ? 'warning' : 'neutral'
      }
    ];
  });

  readonly filteredAdminUsers = computed(() => {
    const query = this.dashboardSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.adminUsers();
    }

    return this.adminUsers().filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      );
    });
  });

  readonly filteredLeads = computed(() => {
    const query = this.dashboardSearchQuery().trim().toLowerCase();
    const statusFilter = this.inquiryStatusFilter();

    return this.leads().filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.message.toLowerCase().includes(query) ||
        lead.sourcePath.toLowerCase().includes(query) ||
        lead.status.toLowerCase().includes(query)
      );
    });
  });

  readonly leadStatusCounts = computed(() => {
    const leads = this.leads();
    const next = {
      total: leads.length,
      newCount: 0,
      inProgressCount: 0,
      closedCount: 0
    };

    leads.forEach((lead) => {
      if (lead.status === 'new') {
        next.newCount += 1;
      } else if (lead.status === 'in-progress') {
        next.inProgressCount += 1;
      } else if (lead.status === 'closed') {
        next.closedCount += 1;
      }
    });

    return next;
  });

  readonly activityFeed = computed<ActivityItem[]>(() => {
    const feed: ActivityItem[] = [
      {
        id: 'activity-sync',
        title: 'Realtime synchronization enabled',
        description: 'All dashboard updates are persisted to Firestore collections.',
        timeLabel: 'Live',
        tone: 'info'
      },
      {
        id: 'activity-products',
        title: `${this.products().length} products currently managed`,
        description: 'Use Products / Services to update catalog metadata and images.',
        timeLabel: 'Today',
        tone: 'success'
      },
      {
        id: 'activity-media',
        title: `${this.media().length} media assets in library`,
        description: 'Media library supports reusable images for products and announcements.',
        timeLabel: 'Today',
        tone: 'info'
      },
      {
        id: 'activity-leads',
        title: `${this.leads().length} inquiry submission(s) received`,
        description: 'Open the inquiries tab to review and update follow-up status.',
        timeLabel: 'Today',
        tone: this.leads().length > 0 ? 'warning' : 'info'
      }
    ];

    const lastSavedAt = this.lastSavedAtSignal();
    if (lastSavedAt) {
      feed.unshift({
        id: 'activity-save',
        title: 'Configuration saved',
        description: `Latest content commit completed at ${new Date(lastSavedAt).toLocaleTimeString()}.`,
        timeLabel: 'Just now',
        tone: 'success'
      });
    }

    return feed.slice(0, 5);
  });

  readonly unreadNotificationsCount = computed(() => this.notifications().length);

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

  setActiveView(view: AdminView): void {
    this.activeView.set(view);
    this.mobileSidebarOpen.set(false);
    this.profileMenuOpen.set(false);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((state) => !state);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((state) => !state);
    if (this.notificationsOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((state) => !state);
    if (this.profileMenuOpen()) {
      this.notificationsOpen.set(false);
    }
  }

  toggleDarkMode(): void {
    this.uiPreferences.toggleDarkMode();
  }

  dismissNotification(notificationId: string): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  editAdminUser(row: AdminUserRow): void {
    this.notify(`Edit user action for ${row.name} is available as a placeholder.`, 'info');
  }

  deleteAdminUser(row: AdminUserRow): void {
    this.adminUsers.update((users) => users.filter((user) => user.id !== row.id));
    this.notify(`Removed ${row.name} from the dashboard table.`, 'warning');
  }

  async setLeadStatus(lead: LeadRecord, status: LeadStatus): Promise<void> {
    if (lead.status === status) {
      return;
    }

    try {
      await this.siteContent.updateLeadStatus(lead.id, status);
      this.notify(`Inquiry status updated to ${this.getLeadStatusLabel(status)}.`, 'success');
    } catch (error) {
      this.handleError('Unable to update inquiry status.', error);
    }
  }

  getLeadStatusLabel(status: LeadStatus): string {
    switch (status) {
      case 'new':
        return 'New';
      case 'in-progress':
        return 'In Progress';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }

  formatLeadTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  resetInquiryFilters(): void {
    this.inquiryStatusFilter.set('all');
    this.dashboardSearchQuery.set('');
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.mobileSidebarOpen.set(false);
    this.profileMenuOpen.set(false);
    this.notificationsOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName || '';
    const isTypingTarget = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;

    if (!isTypingTarget && event.altKey && /^[1-6]$/.test(event.key)) {
      const map: AdminView[] = ['dashboard', 'users', 'inquiries', 'products', 'analytics', 'settings'];
      const index = Number(event.key) - 1;
      const nextView = map[index];
      if (nextView) {
        event.preventDefault();
        this.setActiveView(nextView);
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.activeView() === 'settings') {
        void this.saveContentAndSettings();
      } else if (this.activeView() === 'products') {
        void this.saveProduct();
      }
    }
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

  getSidebarLogoUrl(): string {
    return getBrandLogoUrl(this.settingsDraft.logoUrl, 'adminSidebar');
  }

  useSidebarLogoFallback(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image) {
      return;
    }

    image.src = this.sidebarLogoFallbackUrl;
  }

  jumpToTab(index: number): void {
    const map: AdminView[] = ['settings', 'products', 'inquiries', 'settings', 'analytics'];
    const nextView = map[index] || 'dashboard';
    this.setActiveView(nextView);
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

  private notify(message: string, tone: ToastTone = 'info'): void {
    this.toast.show({
      message,
      tone
    });
  }

  private handleError(contextMessage: string, error: unknown): void {
    console.error(contextMessage, error);
    const details = error instanceof Error ? error.message.trim() : '';
    this.notify(details ? `${contextMessage} ${details}` : contextMessage);
  }
}
