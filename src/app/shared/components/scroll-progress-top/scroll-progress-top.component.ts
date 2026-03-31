import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-scroll-progress-top',
  standalone: true,
  imports: [CommonModule],
  host: {
    '[style.bottom.px]': 'hostBottom()'
  },
  templateUrl: './scroll-progress-top.component.html',
  styleUrl: './scroll-progress-top.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollProgressTopComponent implements AfterViewInit {
  private readonly baseBottom = 16;
  private readonly stackedGap = 12;

  readonly radius = 19;
  readonly circumference = 2 * Math.PI * this.radius;

  readonly progress = signal(0);
  readonly dashOffset = signal(this.circumference);
  readonly isScrollable = signal(false);
  readonly hostBottom = signal(this.baseBottom);

  ngAfterViewInit(): void {
    this.updateProgress();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChanged(): void {
    this.updateProgress();
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private updateProgress(): void {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollableHeight = doc.scrollHeight - doc.clientHeight;
    const canScroll = scrollableHeight > 0;

    this.updateBottomOffset();

    this.isScrollable.set(canScroll);
    if (!canScroll) {
      this.progress.set(0);
      this.dashOffset.set(this.circumference);
      return;
    }

    const rawProgress = (scrollTop / scrollableHeight) * 100;
    const clampedProgress = Math.min(100, Math.max(0, rawProgress));
    const offset = this.circumference - (clampedProgress / 100) * this.circumference;

    this.progress.set(clampedProgress);
    this.dashOffset.set(offset);
  }

  private updateBottomOffset(): void {
    const banner = document.querySelector('.privacy-banner');
    if (!(banner instanceof HTMLElement)) {
      this.hostBottom.set(this.baseBottom);
      return;
    }

    const styles = window.getComputedStyle(banner);
    const isHidden = styles.display === 'none' || styles.visibility === 'hidden' || banner.offsetHeight === 0;
    if (isHidden) {
      this.hostBottom.set(this.baseBottom);
      return;
    }

    const rect = banner.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const intersectsViewport = rect.bottom > 0 && rect.top < viewportHeight;

    if (!intersectsViewport) {
      this.hostBottom.set(this.baseBottom);
      return;
    }

    const offset = Math.max(0, viewportHeight - rect.top) + this.stackedGap;
    this.hostBottom.set(Math.round(offset));
  }
}
