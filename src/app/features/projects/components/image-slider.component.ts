import { Component, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * ImageSliderComponent
 *
 * Carrusel de capturas del proyecto: avanza solo, se detiene cuando el usuario
 * interactúa con él (ratón o teclado) y no se mueve si el sistema pide menos
 * animaciones.
 */
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-image-slider',
  imports: [CommonModule],
  templateUrl: './image-slider.component.html',
  styleUrls: ['./image-slider.component.scss']
})
export class ImageSliderComponent implements OnInit, OnDestroy {
  /** Array de URLs de imágenes a mostrar en el slider */
  private _images: string[] = [];

  @Input()
  set images(value: string[]) {
    this._images = value ?? [];
    this.currentIndex = 0;
    if (this.autoSlideEnabled) {
      this.restartAutoSlide();
    }
  }
  get images(): string[] {
    return this._images;
  }

  /** Texto alternativo base; cada captura añade su posición en la serie */
  @Input() altText: string = '';

  /** Índice actual de la imagen mostrada */
  currentIndex: number = 0;

  /** Intervalo para el deslizamiento automático */
  private slideInterval?: ReturnType<typeof setInterval>;

  /** El sistema pide reducir el movimiento, así que no hay avance automático */
  private reduceMotion = false;

  private readonly INTERVAL_MS = 4000;

  private get autoSlideEnabled(): boolean {
    return !this.reduceMotion && this.images.length > 1;
  }

  ngOnInit(): void {
    this.reduceMotion =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

    if (this.autoSlideEnabled) {
      this.startAutoSlide();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  /** Inicia el avance automático de capturas */
  startAutoSlide(): void {
    if (!this.autoSlideEnabled) {
      return;
    }
    this.stopAutoSlide();
    this.slideInterval = setInterval(() => this.next(), this.INTERVAL_MS);
  }

  /** Detiene el avance automático */
  stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = undefined;
    }
  }

  private restartAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  /** Muestra la siguiente imagen y reinicia el temporizador */
  next(): void {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.restartAutoSlide();
    }
  }

  /** Muestra la imagen anterior y reinicia el temporizador */
  prev(): void {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.restartAutoSlide();
    }
  }

  /** Navega a una imagen específica por índice */
  goTo(index: number): void {
    this.currentIndex = index;
    this.restartAutoSlide();
  }
}
