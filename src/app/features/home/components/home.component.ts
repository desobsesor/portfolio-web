import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TrackingService } from '../../../core/services/tracking.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('{{delay}} cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })),
      ], { params: { delay: '0ms' } })
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {

  // Typewriter effect for the hero subtitle
  readonly fullSubtitle = 'Creando experiencias digitales';
  typedText = '';

  private typingTimer?: ReturnType<typeof setInterval>;
  private typingStartTimer?: ReturnType<typeof setTimeout>;
  private readonly typeDelay = 55;   // ms por carácter
  private readonly startDelay = 500; // espera a que termine la animación slideIn

  // Logic to navigate to the projects page
  constructor(
    private router: Router,
    private trackingService: TrackingService
  ) { }

  navigateToProjects() {
    this.trackingService.trackEvent({
      category: 'navigation',
      action: 'button_click',
      label: 'explore_projects'
    });
    this.router.navigate(['/projects']);
  }

  /** El avatar de la portada lleva al perfil. */
  navigateToAbout() {
    this.trackingService.trackEvent({
      category: 'navigation',
      action: 'avatar_click',
      label: 'go_about'
    });
    this.router.navigate(['/about']);
  }

  ngOnInit(): void {
    this.initParticleEffect();
    this.initTypewriter();
    // Track home page view
    this.trackingService.trackPageView('/home');
  }

  ngOnDestroy(): void {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }
    if (this.typingStartTimer) {
      clearTimeout(this.typingStartTimer);
    }
  }

  private initTypewriter(): void {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Sin movimiento: mostramos el texto completo de una vez
    if (prefersReducedMotion) {
      this.typedText = this.fullSubtitle;
      return;
    }

    this.typingStartTimer = setTimeout(() => {
      let index = 0;
      this.typingTimer = setInterval(() => {
        index++;
        this.typedText = this.fullSubtitle.slice(0, index);
        if (index >= this.fullSubtitle.length && this.typingTimer) {
          clearInterval(this.typingTimer);
          this.typingTimer = undefined;
        }
      }, this.typeDelay);
    }, this.startDelay);
  }

  private initParticleEffect(): void {
    // Particle effect initialization will be implemented here
  }
}