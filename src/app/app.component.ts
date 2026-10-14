import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ArcadeService } from './core/services/arcade.service';
import { MatrixRainService } from './core/services/matrix-rain.service';
import { Colector } from './core/services/telemetria-colector';
import { TrackingService } from './core/services/tracking.service';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { ArcadeBubbleComponent } from './shared/components/arcade/arcade-bubble.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, ArcadeBubbleComponent],
  template: `
    <div class="app-container">
      <canvas #matrixCanvas class="matrix-canvas"></canvas>
      <div class="crt-overlay" aria-hidden="true"></div>
      <app-header></app-header>
      <main [@routeAnimations]="getRouteState(outlet)">
        <router-outlet #outlet="outlet"></router-outlet>
      </main>
      <app-footer></app-footer>

      <!-- Arcade recogido: botón circular arriba a la derecha. El marcador vive en el pie. -->
      <app-arcade-bubble></app-arcade-bubble>

      <!-- Aviso de telemetría: aparece a los 12 s si aún no se cerró. -->
      <aside *ngIf="avisoVisible" class="aviso-telemetria" role="note" aria-live="polite"
        aria-label="Aviso de estadísticas">
        <p>
          Esta página mide, de forma anónima, qué secciones se leen y durante cuánto tiempo,
          para saber qué contenido sirve y qué sobra. Sin datos personales ni cookies.
        </p>
        <button type="button" (click)="cerrarAviso()">Entendido</button>
      </aside>
    </div>
  `,
  styles: [`
    .matrix-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      background: #181824;
      pointer-events: none;
    }

    .crt-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
      background:
        repeating-linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.08) 0,
          rgba(0, 0, 0, 0.08) 1px,
          transparent 1px,
          transparent 3px
        ),
        radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.35) 100%);
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

    .aviso-telemetria {
      position: fixed;
      bottom: 16px;
      left: 16px;
      right: 16px;
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(15, 17, 26, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      color: var(--text-primary, #e8e8ef);
      font-size: 0.85rem;
      line-height: 1.4;
      z-index: 1000;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
    }

    .aviso-telemetria p {
      margin: 0;
      flex: 1;
    }

    .aviso-telemetria button {
      flex-shrink: 0;
      padding: 6px 14px;
      border: none;
      border-radius: 6px;
      background: var(--accent-blue, #4f7cff);
      color: #fff;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .aviso-telemetria button:hover {
      filter: brightness(1.1);
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
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('matrixCanvas', { static: true }) matrixCanvas!: ElementRef<HTMLCanvasElement>;

  /** Colector de telemetría de navegación; `null` si no se mide este entorno. */
  private colector: Colector | null = null;
  private rutas!: Subscription;
  /** Aviso de privacidad de la telemetría (visible tras 12 s si no se cerró). */
  avisoVisible = false;
  /** Cierra el aviso también con Escape, como espera quien navega con teclado. */
  private alPulsarEscape = (evento: KeyboardEvent): void => {
    if (evento.key === 'Escape') this.cerrarAviso();
  };

  constructor(
    private matrixRain: MatrixRainService,
    private trackingService: TrackingService,
    private arcade: ArcadeService,
    private router: Router
  ) { }

  ngOnInit() {
    this.matrixRain.initCanvas(this.matrixCanvas);

    // Initialize tracking service
    this.trackingService.init({
      enabled: true
    });

    // Telemetría de navegación (portada de cdsmaia-cloud): manda lotes a
    // /api/telemetria. `arrancar` devuelve null si no se mide (DNT, robot,
    // telemetría apagada o entorno sin soporte).
    this.colector = Colector.arrancar({
      alPedirAviso: () => {
        this.avisoVisible = true;
        document.addEventListener('keydown', this.alPulsarEscape);
      },
      alFallar: (error) => console.warn('[telemetria] envío fallido:', error),
    });

    // El marcador del juego deja su partida en el mismo lote de telemetría.
    this.arcade.usarColector(this.colector);

    // Al cambiar de ruta (SPA) las secciones se remontan: hay que volver a
    // observarlas para que el tiempo de lectura no se pierda tras el primer
    // navegado.
    this.rutas = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.colector?.reobservar());
  }

  ngOnDestroy() {
    this.matrixRain.destroy();
    this.rutas?.unsubscribe();
    this.colector?.detener();
    document.removeEventListener('keydown', this.alPulsarEscape);
  }

  /** Cierra el aviso y lo deja marcado como visto (persiste en localStorage). */
  cerrarAviso(): void {
    Colector.cerrarAviso();
    this.avisoVisible = false;
    document.removeEventListener('keydown', this.alPulsarEscape);
  }

  getRouteState(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'] || 'initial';
  }
}
