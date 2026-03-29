import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  ViewChild,
  inject
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [CommonModule],
  template: '<div #cursor class="cursor-orb"></div>',
  styleUrl: './custom-cursor.component.scss'
})
export class CustomCursorComponent implements AfterViewInit {
  @ViewChild('cursor', { static: true })
  private readonly cursorRef!: ElementRef<HTMLDivElement>;

  private readonly zone = inject(NgZone);
  private xTo?: gsap.QuickToFunc;
  private yTo?: gsap.QuickToFunc;
  private scaleTo?: gsap.QuickToFunc;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.xTo = gsap.quickTo(this.cursorRef.nativeElement, 'x', {
        duration: 0.22,
        ease: 'power3.out'
      });
      this.yTo = gsap.quickTo(this.cursorRef.nativeElement, 'y', {
        duration: 0.22,
        ease: 'power3.out'
      });
      this.scaleTo = gsap.quickTo(this.cursorRef.nativeElement, 'scale', {
        duration: 0.18,
        ease: 'power2.out'
      });
    });
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.xTo?.(event.clientX);
    this.yTo?.(event.clientY);
  }

  @HostListener('document:mouseover', ['$event'])
  onHover(event: MouseEvent): void {
    this.scaleTo?.(this.isInteractive(event.target) ? 1.8 : 1);
  }

  @HostListener('document:mousedown')
  onPointerDown(): void {
    this.scaleTo?.(2.1);
  }

  @HostListener('document:mouseup')
  onPointerUp(): void {
    this.scaleTo?.(1);
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
}
