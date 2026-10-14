import { ArcadeService } from '@/app/core/services/arcade.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/**
 * Marcador del pasatiempo, en una sola fila horizontal dentro del pie de página para no
 * aumentar su alto. Solo se despliega en la portada; fuera de ella queda recogido en el
 * botón circular (app-arcade-bubble).
 */
@Component({
  selector: 'app-arcade-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="arcade" *ngIf="juego.mostrarPanel" aria-label="Arcade de palabras">
      <span class="arcade-brand">
        <span class="arcade-dot" aria-hidden="true"></span>
        Arcade
      </span>

      <span class="arcade-level" [attr.title]="'Tope de caída: ' + juego.topeLluvia + ' px/s'">
        Nivel {{ juego.nivelLluvia }}
      </span>

      <p class="arcade-note" *ngIf="!juego.disponible">
        El sistema pide reducir el movimiento: la lluvia está quieta y no hay nada que reventar.
      </p>

      <ng-container *ngIf="juego.disponible">
        <ng-container [ngSwitch]="juego.estado">
          <ng-container *ngSwitchCase="'inactivo'">
            <span class="arcade-help">Pulsa la inicial de cada texto.</span>
            <label class="arcade-label" for="arcade-nombre">Tu nombre</label>
            <input id="arcade-nombre" class="arcade-input" type="text" maxlength="18" autocomplete="off"
              [value]="juego.usuario" (input)="onNombre($event)" placeholder="Invitado">
            <button type="button" class="arcade-action" (click)="juego.iniciar()">Jugar</button>
          </ng-container>

          <ng-container *ngSwitchCase="'jugando'">
            <span class="arcade-score">{{ juego.puntos }}<span class="arcade-unit">pts</span></span>
            <span class="arcade-bar" role="presentation">
              <span [style.width.%]="progreso"></span>
            </span>
            <span class="arcade-meta">
              {{ segundosRestantes }} s · {{ juego.destruidas }} reventadas
            </span>
            <span class="arcade-hit" *ngIf="juego.ultimoAcierto">+{{ juego.ultimoAcierto.puntos }}</span>
            <button type="button" class="arcade-quit" (click)="juego.detener()">Rendirse</button>
          </ng-container>

          <ng-container *ngSwitchCase="'terminado'">
            <span class="arcade-result" aria-live="polite">
              <strong>{{ juego.puntos }}</strong> puntos · {{ juego.destruidas }} palabras
            </span>
            <span class="arcade-place" *ngIf="juego.puesto !== null">Puesto {{ juego.puesto + 1 }}</span>
            <span class="arcade-place" *ngIf="juego.puesto === null">Fuera del ranking</span>
            <button type="button" class="arcade-action" (click)="juego.iniciar()">Otra ronda</button>
          </ng-container>
        </ng-container>

        <div class="arcade-rank">
          <span class="arcade-rank-title" [attr.title]="tituloRanking">
            {{ juego.fuenteRanking === 'global' ? 'Mejores' : 'Mejores (local)' }}
          </span>
          <ol class="arcade-list">
            <li *ngFor="let marca of juego.ranking; let i = index" [class.mia]="juego.esUltima(marca)"
              [attr.title]="marca.usuario + ': ' + marca.puntos + ' puntos'">
              <span class="arcade-pos">{{ i + 1 }}</span>
              <span class="arcade-who">{{ marca.usuario }}</span>
              <span class="arcade-pts">{{ marca.puntos }}</span>
            </li>
            <li class="arcade-empty" *ngIf="!juego.ranking.length">todavía sin marcas</li>
          </ol>
        </div>
      </ng-container>

      <button type="button" class="arcade-toggle" (click)="juego.alternarPanel()" aria-label="Ocultar el marcador">
        –
      </button>
    </section>
  `,
  styles: [`
    /* Una sola fila: el pie de página no crece en alto. */
    :host {
      display: block;
      flex: 1 1 auto;
      max-width: 880px;
      font-size: 0.8rem;
      text-align: left;
    }

    .arcade {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 10px;
      padding: 8px 12px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(24, 24, 36, 0.94);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: var(--text-primary);
      animation: panel-entra 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes panel-entra {
      from {
        opacity: 0;
        transform: translateY(8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .arcade-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.66rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .arcade-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent-coral);
      box-shadow: 0 0 9px var(--matrix-glow);
      animation: arcade-pulse 1.8s ease-in-out infinite;
    }

    .arcade-level {
      padding: 1px 7px;
      border-radius: var(--radius-full);
      background: rgba(255, 74, 54, 0.16);
      color: var(--accent-coral);
      font-size: 0.62rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .arcade-note,
    .arcade-help {
      margin: 0;
      font-size: 0.74rem;
      line-height: 1.4;
      color: var(--text-secondary);
    }

    .arcade-help {
      max-width: 24ch;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .arcade-label {
      font-size: 0.66rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .arcade-input {
      width: 112px;
      padding: 5px 8px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: rgba(0, 0, 0, 0.35);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.8rem;

      &:focus-visible {
        outline: 2px solid var(--accent-coral);
        outline-offset: 1px;
      }
    }

    .arcade-action,
    .arcade-quit {
      padding: 5px 13px;
      border: none;
      border-radius: var(--radius-full);
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
    }

    .arcade-action {
      background: var(--accent-coral);
      color: #ffffff;

      &:hover {
        filter: brightness(1.08);
      }
    }

    .arcade-quit {
      background: rgba(255, 255, 255, 0.07);
      color: var(--text-secondary);

      &:hover {
        color: var(--text-primary);
      }
    }

    .arcade-score {
      display: flex;
      align-items: baseline;
      gap: 3px;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--accent-coral);
      font-variant-numeric: tabular-nums;
      line-height: 1;
      white-space: nowrap;
    }

    .arcade-unit {
      font-size: 0.62rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .arcade-bar {
      flex: 0 1 130px;
      min-width: 60px;
      height: 4px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;

      span {
        display: block;
        height: 100%;
        background: var(--gradient-primary);
      }
    }

    .arcade-meta,
    .arcade-place {
      font-size: 0.74rem;
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .arcade-hit {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--accent-coral);
      white-space: nowrap;
    }

    .arcade-result {
      font-size: 0.8rem;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;

      strong {
        font-size: 1.05rem;
        color: var(--accent-coral);
      }
    }

    /* Ranking en línea, empujado al extremo derecho de la fila. */
    .arcade-rank {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      min-width: 0;
    }

    .arcade-rank-title {
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .arcade-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
      margin: 0;
      padding: 0;
      list-style: none;
      min-width: 0;

      li {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 0.74rem;
        color: var(--text-secondary);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        max-width: 12ch;
      }

      li.mia {
        color: var(--text-primary);

        .arcade-pos {
          color: var(--accent-coral);
        }
      }
    }

    .arcade-pos {
      font-weight: 600;
      opacity: 0.8;
    }

    .arcade-who {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .arcade-pts {
      font-weight: 600;
      color: var(--text-primary);
    }

    .arcade-empty {
      display: block !important;
      opacity: 0.8;
    }

    .arcade-toggle {
      flex: 0 0 auto;
      margin-left: 4px;
      padding: 1px 7px;
      border: none;
      border-radius: 4px;
      background: none;
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.2;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.07);
        color: var(--text-primary);
      }
    }

    @keyframes arcade-pulse {

      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.35;
      }
    }

    @media (max-width: 1200px) {

      /* Sin espacio para una fila: la ayuda desaparece y el ranking baja de línea. */
      .arcade-help {
        display: none;
      }

      .arcade-rank {
        margin-left: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {

      .arcade,
      .arcade-dot {
        animation: none;
      }
    }
  `]
})
export class ArcadePanelComponent {
  constructor(public juego: ArcadeService) { }

  /** Explica de dónde sale la lista que se está viendo. */
  get tituloRanking(): string {
    return this.juego.fuenteRanking === 'global'
      ? `Ranking global: ${this.juego.totalGlobal} partidas registradas`
      : 'Sin conexión con el ranking global: se muestran los marcadores de este equipo';
  }

  get segundosRestantes(): number {
    return Math.ceil(this.juego.restanteMs / 1000);
  }

  /** Porcentaje ya consumido de la partida, para la barra de tiempo. */
  get progreso(): number {
    if (!this.juego.duracionMs) {
      return 0;
    }
    return Math.min(100, Math.max(0, (1 - this.juego.restanteMs / this.juego.duracionMs) * 100));
  }

  onNombre(evento: Event): void {
    this.juego.usuario = (evento.target as HTMLInputElement).value;
  }
}
