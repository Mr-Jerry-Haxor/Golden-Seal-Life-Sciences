import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-ambient-background',
  standalone: true,
  imports: [CommonModule],
  template: '<canvas #canvas class="ambient-canvas"></canvas>',
  styleUrl: './ambient-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AmbientBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly zone = inject(NgZone);
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private particles?: THREE.Points;
  private frameId = 0;
  private lastFrameTimestamp = 0;
  private isAnimationPaused = false;
  private readonly frameIntervalMs = 1000 / 30;

  private readonly onVisibilityChange = (): void => {
    this.isAnimationPaused = document.visibilityState === 'hidden';
    if (!this.isAnimationPaused && !this.frameId) {
      this.lastFrameTimestamp = 0;
      this.animate();
    }
  };

  ngAfterViewInit(): void {
    if (!this.shouldEnableAmbientEffect()) {
      return;
    }

    this.setupScene();

    this.zone.runOutsideAngular(() => {
      document.addEventListener('visibilitychange', this.onVisibilityChange, { passive: true });
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.particles?.geometry.dispose();
    (this.particles?.material as THREE.Material | undefined)?.dispose();
    this.renderer?.dispose();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.camera || !this.renderer) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }

  private setupScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.z = 15;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height);

    const particlesCount = this.resolveParticleCount();
    const positions = new Float32Array(particlesCount * 3);

    for (let index = 0; index < particlesCount; index += 1) {
      const i3 = index * 3;
      positions[i3] = (Math.random() - 0.5) * 24;
      positions[i3 + 1] = (Math.random() - 0.5) * 18;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      color: '#3f9d67',
      transparent: true,
      opacity: 0.55
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private animate(timestamp = 0): void {
    if (!this.scene || !this.camera || !this.renderer || !this.particles) {
      return;
    }

    if (this.isAnimationPaused) {
      this.frameId = 0;
      return;
    }

    if (this.lastFrameTimestamp !== 0 && timestamp - this.lastFrameTimestamp < this.frameIntervalMs) {
      this.frameId = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
      return;
    }

    const deltaFactor = this.lastFrameTimestamp === 0 ? 1 : (timestamp - this.lastFrameTimestamp) / 16.67;
    this.lastFrameTimestamp = timestamp;

    this.particles.rotation.y += 0.00055 * deltaFactor;
    this.particles.rotation.x += 0.00022 * deltaFactor;

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
  }

  private shouldEnableAmbientEffect(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const narrowViewport = window.innerWidth < 1024;
    const lowCpuDevice = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const networkInfo = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveDataEnabled = Boolean(networkInfo?.saveData);

    return !(prefersReducedMotion || coarsePointer || narrowViewport || lowCpuDevice || saveDataEnabled);
  }

  private resolveParticleCount(): number {
    const lowCpuDevice = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 6;
    return lowCpuDevice ? 700 : 1100;
  }
}
