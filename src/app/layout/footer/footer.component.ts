import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ArcadePanelComponent } from '../../shared/components/arcade/arcade-panel.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, ArcadePanelComponent],
  template: `
    <footer class="main-footer">
      <div class="impact-fx" aria-hidden="true">
        <span class="fx-glow"></span>
        <span class="fx-rays"></span>
        <span class="fx-wave"></span>
        <span class="fx-wave fx-wave-late"></span>
        <span class="fx-core"></span>
      </div>
      <div class="footer-content">
        <div class="footer-brand">
          <p>&copy; 2025 Portafolio. Todos los derechos reservados.</p>
          <div class="social-links">
            <a href="https://github.com" target="_blank" aria-label="GitHub">
              <i class="fab fa-github"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn">
              <i class="fab fa-linkedin"></i>
            </a>
            <a href="https://twitter.com" target="_blank" aria-label="Twitter">
              <i class="fab fa-twitter"></i>
            </a>
          </div>
        </div>

        <!-- Marcador del arcade, alineado a la derecha de la barra del pie. -->
        <app-arcade-panel></app-arcade-panel>
      </div>
    </footer>
  `,
  styles: [`
    .main-footer {
      --impact-x: 50%;
      --impact-scale: 1;
      padding: var(--spacing-md);
      background: var(--background-secondary);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      margin-top: auto;
      z-index: 10;
      position: relative;
    }

    /* ---- Borde superior: la línea que recibe el golpe ---- */
    .main-footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      pointer-events: none;
      transform-origin: 50% 50%;
      background: linear-gradient(90deg,
        rgba(255, 122, 99, 0) 0%,
        rgba(255, 122, 99, 0.45) 20%,
        var(--accent-coral) 50%,
        rgba(255, 122, 99, 0.45) 80%,
        rgba(255, 122, 99, 0) 100%);
      box-shadow: 0 0 14px rgba(255, 74, 54, 0.5);
      will-change: transform, filter;
    }

    /* ---- Explosión de impacto ----
       Toda el área del estallido vive POR ENCIMA de la línea (bottom: 100%) y su
       contenedor recorta cualquier exceso: por diseño no puede generar scroll
       vertical ni horizontal, y el núcleo queda justo sobre el punto de contacto.
       El alto cubre el estallido máximo (--impact-scale 1.6). */
    .impact-fx {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 100%;
      height: 660px;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }

    .impact-fx > span {
      position: absolute;
      bottom: 0;
      left: clamp(150px, var(--impact-x), calc(100% - 150px));
      opacity: 0;
      transform: scale(0.001);
      transform-origin: 50% 100%;
      will-change: opacity, transform;
    }

    /* Volumen: resplandor amplio que se abre desde el suelo */
    .fx-glow {
      width: 640px;
      height: 300px;
      margin-left: -320px;
      background: radial-gradient(320px 220px at 50% 100%,
        rgba(255, 255, 255, 0.90) 0%,
        rgba(255, 176, 150, 0.55) 32%,
        rgba(255, 74, 54, 0.30) 58%,
        rgba(255, 74, 54, 0) 100%);
    }

    /* Rayos: esquirlas de luz que salen disparadas desde el punto de contacto */
    .fx-rays {
      width: 620px;
      height: 320px;
      margin-left: -310px;
      background: repeating-conic-gradient(from 0deg at 50% 100%,
        rgba(255, 255, 255, 0.95) 0deg 1.1deg,
        rgba(255, 255, 255, 0) 1.1deg 12deg);
      -webkit-mask-image: radial-gradient(300px 260px at 50% 100%,
        #000 0%, rgba(0, 0, 0, 0.75) 35%, transparent 72%);
      mask-image: radial-gradient(300px 260px at 50% 100%,
        #000 0%, rgba(0, 0, 0, 0.75) 35%, transparent 72%);
    }

    /* Onda de choque: anillo elíptico que se abre pegado a la línea.
       El mask lo desvanece hacia arriba, así la cresta se apaga mientras sube. */
    .fx-wave {
      width: 460px;
      height: 240px;
      margin-left: -230px;
      border-radius: 50%;
      border: 3px solid rgba(255, 178, 158, 0.9);
      box-shadow: 0 0 18px rgba(255, 96, 70, 0.6),
        inset 0 0 18px rgba(255, 96, 70, 0.35);
      -webkit-mask-image: linear-gradient(to top,
        #000 0%,
        #000 30%,
        rgba(0, 0, 0, 0.45) 65%,
        rgba(0, 0, 0, 0) 100%);
      mask-image: linear-gradient(to top,
        #000 0%,
        #000 30%,
        rgba(0, 0, 0, 0.45) 65%,
        rgba(0, 0, 0, 0) 100%);
    }

    .fx-wave-late {
      width: 560px;
      height: 280px;
      margin-left: -280px;
      border-color: rgba(255, 236, 214, 0.75);
      border-width: 2px;
      box-shadow: 0 0 22px rgba(255, 140, 110, 0.5);
    }

    /* Núcleo: destello blanco incandescente en el punto de impacto */
    .fx-core {
      width: 150px;
      height: 150px;
      margin-left: -75px;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 100%,
        #ffffff 0%,
        rgba(255, 236, 214, 0.95) 25%,
        rgba(255, 122, 99, 0.60) 55%,
        rgba(255, 74, 54, 0) 85%);
    }

    /* ---- Disparo de cada impacto ---- */
    .main-footer.is-impacting::before {
      animation: footer-border-hit 460ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .main-footer.is-impacting .fx-glow {
      animation: fx-glow 760ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .main-footer.is-impacting .fx-rays {
      animation: fx-rays 460ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .main-footer.is-impacting .fx-wave {
      animation: fx-wave 640ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .main-footer.is-impacting .fx-wave-late {
      animation: fx-wave 640ms cubic-bezier(0.16, 1, 0.3, 1) 110ms;
    }

    .main-footer.is-impacting .fx-core {
      animation: fx-core 280ms ease-out;
    }

    /* La línea tiembla, se engrosa y destella con el golpe */
    @keyframes footer-border-hit {
      0% {
        transform: translateY(0) skewX(0deg) scaleY(1);
        filter: brightness(1);
      }

      10% {
        transform: translateY(2px) skewX(-1.6deg) scaleY(3.2);
        filter: brightness(2.6) drop-shadow(0 0 12px rgba(255, 255, 255, 0.9));
      }

      24% {
        transform: translateY(-1.5px) skewX(1.2deg) scaleY(1.8);
        filter: brightness(1.9);
      }

      38% {
        transform: translateY(1.5px) skewX(-1deg) scaleY(2.4);
        filter: brightness(2.2);
      }

      52% {
        transform: translateY(-1px) skewX(0.7deg) scaleY(1.4);
        filter: brightness(1.6);
      }

      66% {
        transform: translateY(1px) skewX(-0.5deg) scaleY(1.7);
        filter: brightness(1.8);
      }

      80% {
        transform: translateY(-0.5px) skewX(0.3deg) scaleY(1.2);
        filter: brightness(1.3);
      }

      100% {
        transform: translateY(0) skewX(0deg) scaleY(1);
        filter: brightness(1);
      }
    }

    /* Toda escala se multiplica por --impact-scale, que el servicio fija según el
       tamaño del texto que golpeó la línea: texto grande = explosión grande. */
    @keyframes fx-core {
      0% {
        opacity: 0;
        transform: scale(calc(0.15 * var(--impact-scale, 1)));
      }

      12% {
        opacity: 1;
        transform: scale(calc(0.8 * var(--impact-scale, 1)));
      }

      100% {
        opacity: 0;
        transform: scale(calc(1.3 * var(--impact-scale, 1)));
      }
    }

    @keyframes fx-glow {
      0% {
        opacity: 0;
        transform: scale(calc(0.25 * var(--impact-scale, 1)));
      }

      10% {
        opacity: 0.95;
        transform: scale(calc(0.55 * var(--impact-scale, 1)));
      }

      100% {
        opacity: 0;
        transform: scale(calc(1.1 * var(--impact-scale, 1)));
      }
    }

    @keyframes fx-rays {
      0% {
        opacity: 0;
        transform: scale(calc(0.2 * var(--impact-scale, 1))) rotate(0deg);
      }

      12% {
        opacity: 1;
        transform: scale(calc(0.6 * var(--impact-scale, 1))) rotate(2deg);
      }

      100% {
        opacity: 0;
        transform: scale(calc(1.2 * var(--impact-scale, 1))) rotate(7deg);
      }
    }

    @keyframes fx-wave {
      0% {
        opacity: 0;
        transform: scale(calc(0.12 * var(--impact-scale, 1)));
      }

      10% {
        opacity: 1;
        transform: scale(calc(0.3 * var(--impact-scale, 1)));
      }

      55% {
        opacity: 0.5;
        transform: scale(calc(0.85 * var(--impact-scale, 1)));
      }

      100% {
        opacity: 0;
        transform: scale(calc(1.15 * var(--impact-scale, 1)));
      }
    }

    @media (prefers-reduced-motion: reduce) {

      .main-footer.is-impacting::before {
        animation: none;
      }

      .impact-fx {
        display: none;
      }
    }

    .footer-content {
      position: relative;
      z-index: 2;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-lg);
      padding: 0 var(--spacing-md);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-md);
      }
    }

    /* Marca y redes a la izquierda; el marcador del arcade queda a la derecha. */
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: flex-start;
      flex: 0 1 auto;

      p {
        margin: 0;
      }

      @media (min-width: 769px) {
        p {
          white-space: nowrap;
        }
      }

      @media (max-width: 768px) {
        align-items: center;
        text-align: center;
      }
    }

    .social-links {
      display: flex;
      gap: var(--spacing-md);

      a {
        color: var(--text-secondary);
        font-size: 1.2rem;
        transition: all var(--transition-normal) ease;

        &:hover {
          color: var(--text-primary);
          transform: translateY(-3px);
        }
      }
    }
  `]
})
export class FooterComponent { }
