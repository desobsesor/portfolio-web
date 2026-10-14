import { ArcadeService } from '@/app/core/services/arcade.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/**
 * Botón circular flotante del arcade, arriba a la derecha. Aparece cuando el marcador
 * está recogido, es decir fuera de la portada, y lleva de vuelta a ella para jugar.
 */
@Component({
  selector: 'app-arcade-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="arcade-burbuja" *ngIf="juego.mostrarBurbuja" (click)="juego.alPulsarBurbuja()"
      [attr.aria-label]="juego.etiquetaBurbuja" [attr.title]="juego.etiquetaBurbuja">
      <!-- Marcianito de arcade, dibujado pixel a pixel -->
      <svg class="arcade-icono" viewBox="0 0 11 8" aria-hidden="true" focusable="false">
        <path
          d="M2 0h1v1H2zM8 0h1v1H8zM3 1h1v1H3zM7 1h1v1H7zM2 2h7v1H2zM1 3h2v1H1zM4 3h3v1H4zM8 3h2v1H8zM0 4h11v1H0zM0 5h1v1H0zM2 5h7v1H2zM10 5h1v1h-1zM0 6h1v1H0zM2 6h1v1H2zM8 6h1v1H8zM10 6h1v1h-1zM3 7h2v1H3zM6 7h2v1H6z" />
      </svg>
      <span class="arcade-burbuja-tiempo" *ngIf="juego.estado === 'jugando'">{{ segundosRestantes }}</span>
    </button>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 72px;
      right: 16px;
      z-index: 900;
      display: block;
    }

    .arcade-burbuja {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      padding: 0;
      border: 1px solid var(--border-subtle);
      border-radius: 50%;
      background: rgba(24, 24, 36, 0.94);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      cursor: pointer;
      animation: burbuja-entra 240ms cubic-bezier(0.16, 1, 0.3, 1) both;

      &:hover {
        border-color: rgba(255, 74, 54, 0.5);
      }

      &:focus-visible {
        outline: 2px solid var(--accent-coral);
        outline-offset: 3px;
      }
    }

    /* Marcianito de arcade: pixeles nítidos y un latido suave de luz. */
    .arcade-icono {
      width: 22px;
      height: 16px;
      fill: var(--accent-coral);
      shape-rendering: crispEdges;
      filter: drop-shadow(0 0 6px var(--matrix-glow));
      animation: arcade-late 2.2s ease-in-out infinite;
    }

    .arcade-burbuja-tiempo {
      position: absolute;
      right: -2px;
      bottom: -2px;
      min-width: 18px;
      padding: 1px 4px;
      border-radius: var(--radius-full);
      background: var(--accent-coral);
      color: #ffffff;
      font-size: 0.6rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
    }

    @keyframes burbuja-entra {
      from {
        opacity: 0;
        transform: scale(0.5);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes arcade-late {

      0%,
      100% {
        opacity: 1;
        transform: translateY(0);
      }

      50% {
        opacity: 0.65;
        transform: translateY(-1px);
      }
    }

    @media (prefers-reduced-motion: reduce) {

      .arcade-burbuja,
      .arcade-icono {
        animation: none;
      }
    }
  `]
})
export class ArcadeBubbleComponent {
  constructor(public juego: ArcadeService) { }

  get segundosRestantes(): number {
    return Math.ceil(this.juego.restanteMs / 1000);
  }
}
