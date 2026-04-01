import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [CommonModule],
  template: '<div #ring class="cursor-ring"></div><div #core class="cursor-core"></div>',
  styleUrl: './custom-cursor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ring', { static: true })
  private readonly ringRef!: ElementRef<HTMLDivElement>;

  @ViewChild('core', { static: true })
  private readonly coreRef!: ElementRef<HTMLDivElement>;

  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private ringXTo?: gsap.QuickToFunc;
  private ringYTo?: gsap.QuickToFunc;
  private ringScaleTo?: gsap.QuickToFunc;

  private coreXTo?: gsap.QuickToFunc;
  private coreYTo?: gsap.QuickToFunc;
  private coreScaleTo?: gsap.QuickToFunc;

  private isHoveringInteractive = false;
  private isPointerDown = false;
  private visible = false;
  private enabled = false;
  private listenerTeardowns: Array<() => void> = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.shouldEnableCursor()) {
      return;
    }

    this.enabled = true;
    this.document.body.classList.add('custom-cursor-active');

    this.zone.runOutsideAngular(() => {
      this.ringXTo = gsap.quickTo(this.ringRef.nativeElement, 'x', {
        duration: 0.2,
        ease: 'power3.out'
      });
      this.ringYTo = gsap.quickTo(this.ringRef.nativeElement, 'y', {
        duration: 0.2,
        ease: 'power3.out'
      });
      this.ringScaleTo = gsap.quickTo(this.ringRef.nativeElement, 'scale', {
        duration: 0.16,
        ease: 'power2.out'
      });

      this.coreXTo = gsap.quickTo(this.coreRef.nativeElement, 'x', {
        duration: 0.08,
        ease: 'power3.out'
      });
      this.coreYTo = gsap.quickTo(this.coreRef.nativeElement, 'y', {
        duration: 0.08,
        ease: 'power3.out'
      });
      this.coreScaleTo = gsap.quickTo(this.coreRef.nativeElement, 'scale', {
        duration: 0.18,
        ease: 'power2.out'
      });

      this.registerPointerListeners();
      this.applyCursorScale();
    });
  }

  ngOnDestroy(): void {
    this.listenerTeardowns.forEach((teardown) => teardown());
    this.listenerTeardowns = [];

    if (this.enabled) {
      this.document.body.classList.remove('custom-cursor-active');
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType && event.pointerType !== 'mouse') {
      return;
    }

    this.ringXTo?.(event.clientX);
    this.ringYTo?.(event.clientY);
    this.coreXTo?.(event.clientX);
    this.coreYTo?.(event.clientY);

    this.revealCursor();
  };

  private readonly onHover = (event: MouseEvent): void => {
    this.isHoveringInteractive = this.isInteractive(event.target);
    this.applyCursorScale();
  };

  private readonly onPointerDown = (): void => {
    this.isPointerDown = true;
    this.applyCursorScale();
  };

  private readonly onPointerUp = (): void => {
    this.isPointerDown = false;
    this.applyCursorScale();
  };

  private readonly onWindowBlur = (): void => {
    this.isPointerDown = false;
    this.isHoveringInteractive = false;
    this.applyCursorScale();
  };

  private registerPointerListeners(): void {
    const addWindowListener = <K extends keyof WindowEventMap>(
      type: K,
      listener: (event: WindowEventMap[K]) => void
    ): void => {
      window.addEventListener(type, listener as EventListener, { passive: true });
      this.listenerTeardowns.push(() => {
        window.removeEventListener(type, listener as EventListener);
      });
    };

    const addDocumentListener = <K extends keyof DocumentEventMap>(
      type: K,
      listener: (event: DocumentEventMap[K]) => void
    ): void => {
      document.addEventListener(type, listener as EventListener, { passive: true });
      this.listenerTeardowns.push(() => {
        document.removeEventListener(type, listener as EventListener);
      });
    };

    addWindowListener('pointermove', this.onPointerMove);
    addDocumentListener('mouseover', this.onHover);
    addDocumentListener('mousedown', this.onPointerDown);
    addDocumentListener('mouseup', this.onPointerUp);
    addWindowListener('blur', this.onWindowBlur);
  }

  private shouldEnableCursor(): boolean {
    try {
      const prefersReducedMotion = this.matchesMediaQuery('(prefers-reduced-motion: reduce)');
      const coarsePointer = this.matchesMediaQuery('(pointer: coarse)');
      const lowCpuDevice = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
      const networkInfo = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      const saveDataEnabled = Boolean(networkInfo?.saveData);

      return !(prefersReducedMotion || coarsePointer || lowCpuDevice || saveDataEnabled);
    } catch {
      return false;
    }
  }

  private isInteractive(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) {
      return false;
    }

    return Boolean(
      element.closest('a, button, [role="button"], .interactive, input, textarea, select, .mat-mdc-button-base')
    );
  }

  private applyCursorScale(): void {
    const ringScale = this.isPointerDown ? 0.88 : this.isHoveringInteractive ? 1.55 : 1;
    const coreScale = this.isPointerDown ? 0.58 : this.isHoveringInteractive ? 1.15 : 1;

    this.ringScaleTo?.(ringScale);
    this.coreScaleTo?.(coreScale);
  }

  private revealCursor(): void {
    if (this.visible) {
      return;
    }

    this.visible = true;
    this.ringRef.nativeElement.classList.add('is-visible');
    this.coreRef.nativeElement.classList.add('is-visible');
  }

  private matchesMediaQuery(query: string): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  }
}
