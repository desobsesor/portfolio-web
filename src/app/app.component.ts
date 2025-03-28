import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { StarryBackgroundService } from './core/services/starry-background.service';
import { TrackingService } from './core/services/tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-container">
      <canvas #starCanvas class="star-canvas"></canvas>
      <app-header></app-header>
      <main [@routeAnimations]="getRouteState(outlet)">
        <router-outlet #outlet="outlet"></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .star-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }

    :host {
      display: block;
      min-height: 100vh;
      color: var(--text-primary);
    }

    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    main {
      flex: 1;
      margin-top: 60px;
      position: relative;
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            opacity: 0,
            transform: 'scale(0.98)'
          })
        ], { optional: true }),
        query(':leave', [
          animate('300ms ease-out', style({ opacity: 0, transform: 'scale(0.95)' }))
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'scale(1.05)' }),
          animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('starCanvas', { static: true }) starCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private starryBackground: StarryBackgroundService,
    private trackingService: TrackingService
  ) { }

  ngOnInit() {
    this.starryBackground.initCanvas(this.starCanvas);

    // Initialize tracking service
    this.trackingService.init({
      enabled: true
    });
  }
  getRouteState(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'] || 'initial';
  }
}
