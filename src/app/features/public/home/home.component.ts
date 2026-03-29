import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { AnnouncementContent, ProductCategory } from '../../../core/models/site.models';
import { SiteContentService } from '../../../core/services/site-content.service';

type CategoryCard = {
  title: string;
  shortLabel: string;
  description: string;
  route: string;
  count: number;
};

type ImpactMetric = {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  description: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly siteContent = inject(SiteContentService);
  private readonly currentAnnouncementImageIndexSignal = signal(0);

  readonly content = this.siteContent.content;
  readonly products = this.siteContent.products;
  readonly settings = this.siteContent.settings;
  readonly announcement = computed<AnnouncementContent>(() => this.content().announcement);

  readonly announcementTextItems = computed(() => this.announcement().textItems.filter((item) => item.text.trim().length > 0));
  readonly announcementImageItems = computed(() => this.announcement().imageItems.filter((item) => item.imageUrl.trim().length > 0));
  readonly announcementSeparatorSymbol = computed(() => (this.announcement().separator === 'announcement' ? '📢' : '★'));
  readonly announcementTickerText = computed(() => {
    const symbol = this.announcementSeparatorSymbol();
    const messages = this.announcementTextItems().map((item) => item.text.trim()).filter(Boolean);
    return messages.length ? messages.join(`  ${symbol}  `) : '';
  });
  readonly announcementTickerDuration = computed(() => `${Math.max(10, this.announcement().scrollSpeedSeconds || 28)}s`);
  readonly currentAnnouncementImageIndex = this.currentAnnouncementImageIndexSignal.asReadonly();
  readonly currentAnnouncementImage = computed(() => {
    const images = this.announcementImageItems();
    if (images.length === 0) {
      return null;
    }

    const safeIndex = this.currentAnnouncementImageIndexSignal() % images.length;
    return images[safeIndex];
  });

  readonly sectionsWithProducts = computed(() => {
    const products = this.products();
    return this.content().sections.map((section) => ({
      ...section,
      products: products.filter((product) => section.productIds.includes(product.id))
    }));
  });

  readonly categoryCards = computed<CategoryCard[]>(() => {
    const products = this.products();
    const countByCategory = (category: ProductCategory): number =>
      products.filter((product) => product.category === category).length;

    return [
      {
        title: 'Aqua Probiotics & Chemicals',
        shortLabel: 'Aqua',
        description:
          'Aquaculture-first microbial and chemical formulations designed to improve water quality, feed conversion, and biomass consistency.',
        route: '/products',
        count: countByCategory('Aqua Probiotics')
      },
      {
        title: 'Agricultural Micronutrients',
        shortLabel: 'Agri',
        description:
          'Precision micronutrient blends that support balanced plant metabolism, higher uptake efficiency, and resilient crop performance.',
        route: '/products',
        count: countByCategory('Agricultural Micronutrients')
      },
      {
        title: 'Fine Chemicals',
        shortLabel: 'Fine',
        description:
          'High-purity chemical solutions engineered for process reliability, batch consistency, and industrial-grade performance standards.',
        route: '/products',
        count: countByCategory('Fine Chemicals')
      }
    ];
  });

  readonly impactMetrics: ImpactMetric[] = [
    {
      label: 'Increased Yield',
      value: 28,
      suffix: '%',
      prefix: '+',
      description: 'Average productivity gain across nutrient and biological optimization programs.'
    },
    {
      label: 'Sustainability Index',
      value: 92,
      suffix: '%',
      prefix: '',
      description: 'Programs aligned with responsible chemistry, reduced loss pathways, and eco-conscious deployment.'
    },
    {
      label: 'Industrial Efficiency',
      value: 35,
      suffix: '%',
      prefix: '+',
      description: 'Process-level improvement measured in throughput stability and quality repeatability.'
    }
  ];

  readonly testimonials = [
    {
      quote:
        'Golden Seal Life Sciences helped us stabilize water health and achieve consistent growth cycles through science-led probiotic protocols.',
      author: 'Operations Director',
      company: 'BlueWave Aquaculture'
    },
    {
      quote:
        'Their micronutrient portfolio delivered visible crop response and measurable quality gains with excellent field support.',
      author: 'Agronomy Lead',
      company: 'Green Harvest Farms'
    },
    {
      quote:
        'From pilot to production, their fine chemical solutions met our purity expectations while improving process efficiency.',
      author: 'Plant Head',
      company: 'Aster Industrial Labs'
    }
  ];

  constructor() {
    effect((onCleanup) => {
      const announcement = this.announcement();
      const images = this.announcementImageItems();

      if (!announcement.enabled || announcement.mode !== 'image' || images.length <= 1) {
        this.currentAnnouncementImageIndexSignal.set(0);
        return;
      }

      const intervalMs = Math.max(2200, announcement.slideshowIntervalMs || 4500);
      const timer = window.setInterval(() => {
        this.currentAnnouncementImageIndexSignal.update((index) => {
          const next = index + 1;
          return next >= images.length ? 0 : next;
        });
      }, intervalMs);

      onCleanup(() => {
        window.clearInterval(timer);
      });
    });
  }

  ngAfterViewInit(): void {
    gsap.from('.reveal', {
      y: 36,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out'
    });

    const counterNodes = gsap.utils.toArray<HTMLElement>('.counter-value');
    counterNodes.forEach((node, index) => {
      const target = Number(node.dataset['target'] || '0');
      const state = { value: 0 };
      gsap.to(state, {
        value: target,
        duration: 1.5,
        delay: 0.35 + index * 0.18,
        ease: 'power2.out',
        onUpdate: () => {
          node.textContent = Math.round(state.value).toString();
        }
      });
    });
  }

  ngOnDestroy(): void {
    gsap.killTweensOf('.reveal');
  }

  goToAnnouncementImage(index: number): void {
    const images = this.announcementImageItems();
    if (images.length === 0) {
      this.currentAnnouncementImageIndexSignal.set(0);
      return;
    }

    const safeIndex = ((index % images.length) + images.length) % images.length;
    this.currentAnnouncementImageIndexSignal.set(safeIndex);
  }
}
