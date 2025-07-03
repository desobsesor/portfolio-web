import { Component, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * ImageSliderComponent
 * 
 * Componente para mostrar un carrusel de imágenes con deslizamiento automático y controles manuales.
 * Recibe un array de URLs de imágenes y un texto alternativo para las imágenes.
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
    this._images = value;
    console.log('ImageSliderComponent images input:', value);
  }
  get images(): string[] {
    return this._images;
  }

  /** Texto alternativo para las imágenes */
  @Input() altText: string = '';

  /** Índice actual de la imagen mostrada */
  currentIndex: number = 0;

  /** Intervalo para el deslizamiento automático */
  private slideInterval?: any;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  /** Inicia el deslizamiento automático de imágenes cada 3 segundos */
  startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
      this.next();
    }, 3000);
  }

  /** Detiene el deslizamiento automático */
  stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = undefined;
    }
  }

  /** Muestra la siguiente imagen en el slider */
  next(): void {
    if(this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }

  /** Muestra la imagen anterior en el slider */
  prev(): void {
    if(this.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }

  /** Navega a una imagen específica por índice */
  goTo(index: number): void {
    this.currentIndex = index;
  }
}