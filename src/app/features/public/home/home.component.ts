import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getBrandLogoWithBackgroundUrl } from '../../../core/config/brand-assets.config';
import { ProductCategory } from '../../../core/models/site.models';
import { SiteContentService } from '../../../core/services/site-content.service';

type ServiceCard = {
  iconPath: string;
  title: string;
  description: string;
  route: string;
  stat: string;
};

type TrustBadge = {
  iconPath: string;
  label: string;
  description: string;
};

type WhyChooseItem = {
  iconPath: string;
  title: string;
  description: string;
};

type ProjectCard = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  route: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly siteContent = inject(SiteContentService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private revealObserver: IntersectionObserver | null = null;
  private revealAnimationFrameId: number | null = null;

  readonly content = this.siteContent.content;
  readonly products = this.siteContent.products;
  readonly settings = this.siteContent.settings;
  readonly isLoading = this.siteContent.isLoading;
  readonly heroLogoUrl = getBrandLogoWithBackgroundUrl('heroMark');

  readonly trustBadges: TrustBadge[] = [
    {
      iconPath:
        'M9 12.75 11.25 15 15 9.75m-3-6.75a8.97 8.97 0 0 0-4.68 1.31.75.75 0 0 0-.38.65v3.7c0 3.06 1.57 5.9 4.14 7.5a.75.75 0 0 0 .82 0c2.57-1.6 4.14-4.44 4.14-7.5v-3.7a.75.75 0 0 0-.38-.65A8.97 8.97 0 0 0 12 3Z',
      label: 'ISO Certified',
      description: 'Quality systems aligned with international standards and controlled documentation.'
    },
    {
      iconPath:
        'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
      label: '10+ Years Experience',
      description: 'A decade of biotech expertise across agriculture, aquaculture, and industrial chemistry.'
    },
    {
      iconPath:
        'M3 17.25V9.75m6 7.5V6.75m6 10.5v-4.5m6 4.5V4.5M1.5 21h21',
      label: '50+ Projects',
      description: 'Trusted delivery across pilot studies, process optimization, and commercial deployments.'
    }
  ];

  readonly whyChooseUs: WhyChooseItem[] = [
    {
      iconPath:
        'M11.25 18.75a9 9 0 1 0-9-9 9 9 0 0 0 9 9Zm0 0c3.038 0 5.625-2.686 5.625-6a5.625 5.625 0 0 0-11.25 0c0 3.314 2.587 6 5.625 6Zm0 0v2.25m-6 0h12',
      title: 'Research-First Approach',
      description: 'Every recommendation is supported by formulation science, pilot data, and practical field outcomes.'
    },
    {
      iconPath:
        'M3.75 12h16.5m-16.5 0 3.75-3.75M3.75 12l3.75 3.75m12.75-3.75-3.75-3.75m3.75 3.75-3.75 3.75',
      title: 'Rapid Technical Support',
      description: 'Our team helps you move from consultation to implementation with clear timelines and action plans.'
    },
    {
      iconPath:
        'M12 3.75c-4.97 0-9 3.03-9 6.75S7.03 17.25 12 17.25 21 14.22 21 10.5 16.97 3.75 12 3.75Zm0 13.5v3m-3-1.5h6',
      title: 'Compliance and Traceability',
      description: 'Documented processes and transparent quality controls to meet audit and regulatory expectations.'
    },
    {
      iconPath:
        'M5.25 9.75h13.5m-13.5 4.5h9m-9 4.5h6m7.5-10.5A2.25 2.25 0 0 0 17 6h-2.25A2.25 2.25 0 0 0 12.5 3.75h-1A2.25 2.25 0 0 0 9.25 6H7A2.25 2.25 0 0 0 4.75 8.25v10.5A2.25 2.25 0 0 0 7 21h10a2.25 2.25 0 0 0 2.25-2.25V8.25Z',
      title: 'Outcome Measurement',
      description: 'We track operational metrics so you can quantify yield gains, quality improvements, and ROI.'
    }
  ];

  readonly displayedHighlights = computed(() =>
    this.content()
      .highlights.filter((highlight) => highlight.trim().length > 0)
      .slice(0, 3)
  );

  readonly serviceCards = computed<ServiceCard[]>(() => {
    const products = this.products();
    const countByCategory = (category: ProductCategory): number =>
      products.filter((product) => product.category === category).length;

    return [
      {
        iconPath:
          'M12 3.75c-1.98 2.58-5.25 6.5-5.25 9.2a5.25 5.25 0 1 0 10.5 0c0-2.7-3.27-6.62-5.25-9.2Z',
        title: 'Aqua Probiotics',
        description:
          'Aquaculture-focused microbial formulations for healthier water systems, stronger growth cycles, and lower operational volatility.',
        route: '/products',
        stat: `${countByCategory('Aqua Probiotics')} active products`
      },
      {
        iconPath:
          'M12 3.75c2.25 1.5 4.5 4.5 4.5 7.5A4.5 4.5 0 1 1 7.5 11.25c0-3 2.25-6 4.5-7.5Zm0 0v16.5',
        title: 'Agricultural Micronutrients',
        description:
          'Precision nutrient blends designed for balanced crop metabolism, improved uptake efficiency, and resilient yields.',
        route: '/products',
        stat: `${countByCategory('Agricultural Micronutrients')} active products`
      },
      {
        iconPath:
          'M6.75 3.75h10.5v4.5H6.75v-4.5Zm-1.5 6h13.5l-1.35 9.45a2.25 2.25 0 0 1-2.22 1.95H8.07a2.25 2.25 0 0 1-2.22-1.95L4.5 9.75Z',
        title: 'Fine Chemicals',
        description:
          'High-purity chemical solutions engineered for process reliability, batch consistency, and industrial-grade performance.',
        route: '/products',
        stat: `${countByCategory('Fine Chemicals')} active products`
      }
    ];
  });

  readonly featuredProjects = computed<ProjectCard[]>(() => {
    const products = this.products();
    const sortedProducts = [...products].sort((a, b) => {
      if (a.highlighted !== b.highlighted) {
        return Number(b.highlighted) - Number(a.highlighted);
      }

      return b.updatedAt - a.updatedAt;
    });

    const fallbackImages = [
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1628359355624-855775b5c9c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1766297246906-210617be31a4?auto=format&fit=crop&w=1200&q=80'
    ];

    if (sortedProducts.length === 0) {
      return [
        {
          id: 'project-aqua',
          title: 'Aquaculture Yield Stabilization Program',
          description: 'A multi-stage probiotic protocol improving water quality and growth consistency in dense farming cycles.',
          imageUrl: fallbackImages[0],
          category: 'Aqua Probiotics',
          route: '/contact'
        },
        {
          id: 'project-agri',
          title: 'Micronutrient Optimization Initiative',
          description: 'Balanced micro-nutrient interventions for stronger crop resilience and improved nutrient uptake efficiency.',
          imageUrl: fallbackImages[1],
          category: 'Agricultural Micronutrients',
          route: '/contact'
        },
        {
          id: 'project-chem',
          title: 'Fine Chemical Process Consistency Upgrade',
          description: 'Purity-focused process support model for repeatable quality and lower production variability.',
          imageUrl: fallbackImages[2],
          category: 'Fine Chemicals',
          route: '/contact'
        }
      ];
    }

    return sortedProducts.slice(0, 3).map((product, index) => ({
      id: product.id,
      title: product.name,
      description: product.shortDescription,
      imageUrl: product.imageUrl || fallbackImages[index % fallbackImages.length],
      category: product.category,
      route: `/products/${product.slug}`
    }));
  });

  readonly capabilityStats = [
    { label: 'Programs Deployed', value: '50+' },
    { label: 'Scientific Team', value: '20+' },
    { label: 'Support Coverage', value: '24/7' }
  ];

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        return;
      }

      this.scheduleRevealSetup();
    });
  }

  ngAfterViewInit(): void {
    this.scheduleRevealSetup();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.revealObserver = null;

    if (this.revealAnimationFrameId !== null) {
      window.cancelAnimationFrame(this.revealAnimationFrameId);
      this.revealAnimationFrameId = null;
    }
  }

  private scheduleRevealSetup(): void {
    if (typeof window === 'undefined' || this.isLoading()) {
      return;
    }

    if (this.revealAnimationFrameId !== null) {
      window.cancelAnimationFrame(this.revealAnimationFrameId);
    }

    this.revealAnimationFrameId = window.requestAnimationFrame(() => {
      this.revealAnimationFrameId = null;
      this.setupRevealObserver();
    });
  }

  private setupRevealObserver(): void {
    const revealNodes = Array.from(this.hostElement.nativeElement.querySelectorAll('.reveal-item')) as HTMLElement[];
    if (revealNodes.length === 0) {
      return;
    }

    this.revealObserver?.disconnect();
    this.revealObserver = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealNodes.forEach((node) => {
        node.classList.remove('opacity-0', 'translate-y-8');
        node.classList.add('opacity-100', 'translate-y-0');
      });
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const node = entry.target as HTMLElement;
          node.classList.remove('opacity-0', 'translate-y-8');
          node.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(node);
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    revealNodes.forEach((node) => {
      if (!node.classList.contains('opacity-100')) {
        this.revealObserver?.observe(node);
      }
    });
  }
}
