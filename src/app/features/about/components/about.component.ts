import { WordCloudCollapsedComponent } from "@/app/shared/components/word-cloud/word-cloud-collapsed.component";
import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Experience, PortfolioOwner, Skill } from '../models/about.model';
import { AboutDataService } from '../services/about-data.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, WordCloudCollapsedComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  animations: [
    trigger('modalEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('cardEnter', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('flipCard', [
      state('active', style({
        transform: 'rotateY(180deg)'
      })),
      state('inactive', style({
        transform: 'rotateY(0)'
      })),
      transition('inactive => active', [
        animate('0.8s')
      ]),
      transition('active => inactive', [
        animate('0.8s')
      ])
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('500ms ease-out',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AboutComponent implements OnInit, OnDestroy {
  /** Presentación: se escribe con efecto de máquina de escribir al entrar. */
  readonly profileBio = 'Desarrollador apasionado que crea soluciones digitales innovadoras con tecnologías modernas.';
  /** Resumen de trayectoria: se escribe cuando la sección aparece en pantalla. */
  readonly experienceBio = 'Más de 10 años de experiencia en ingeniería de software, con una sólida trayectoria en el desarrollo e implementación de soluciones innovadoras para diversos sectores.';

  typedProfileBio = '';
  typedExperienceBio = '';

  @ViewChild('experienceBioEl', { static: true }) private experienceBioEl?: ElementRef<HTMLElement>;

  private typingTimers: ReturnType<typeof setInterval>[] = [];
  private typingStartTimers: ReturnType<typeof setTimeout>[] = [];
  private bioObserver?: IntersectionObserver;

  showOwnerModal = false;

  portfolioOwner: PortfolioOwner = {
    name: '',
    title: '',
    bio: '',
    avatar: ''
  };

  skills: Skill[] = [];
  experiences: Experience[] = [];

  constructor(
    private sanitizer: DomSanitizer,
    private aboutDataService: AboutDataService
  ) { }

  ngOnInit(): void {
    this.loadPortfolioOwner();
    this.loadSkills();
    this.loadExperiences();
    this.initTypewriters();
  }

  ngOnDestroy(): void {
    this.typingTimers.forEach((timer) => clearInterval(timer));
    this.typingStartTimers.forEach((timer) => clearTimeout(timer));
    this.bioObserver?.disconnect();
  }

  /**
   * Escribe los dos párrafos de presentación carácter a carácter. El segundo vive más
   * abajo en la página, así que arranca cuando entra en pantalla: si se escribiera al
   * cargar, nadie llegaría a verlo.
   */
  private initTypewriters(): void {
    const reduceMotion =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

    if (reduceMotion) {
      this.typedProfileBio = this.profileBio;
      this.typedExperienceBio = this.experienceBio;
      return;
    }

    this.typeText(this.profileBio, 40, 350, (value) => (this.typedProfileBio = value));

    const target = this.experienceBioEl?.nativeElement;
    if (target && typeof IntersectionObserver !== 'undefined') {
      this.bioObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.bioObserver?.disconnect();
          this.bioObserver = undefined;
          this.typeText(this.experienceBio, 22, 0, (value) => (this.typedExperienceBio = value));
        }
      }, { threshold: 0.35 });
      this.bioObserver.observe(target);
    } else {
      this.typedExperienceBio = this.experienceBio;
    }
  }

  /** Escribe un texto carácter a carácter y entrega cada avance por callback. */
  private typeText(text: string, delayMs: number, startDelayMs: number, assign: (value: string) => void): void {
    const startTimer = setTimeout(() => {
      let index = 0;
      const timer = setInterval(() => {
        index++;
        assign(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(timer);
        }
      }, delayMs);
      this.typingTimers.push(timer);
    }, startDelayMs);

    this.typingStartTimers.push(startTimer);
  }

  loadPortfolioOwner(): void {
    this.aboutDataService.getPortfolioOwner().subscribe(owner => {
      this.portfolioOwner = owner;
    });
  }

  loadSkills(): void {
    this.aboutDataService.getSkills().subscribe(skills => {
      this.skills = this.aboutDataService.sanitizeIcons(skills);
    });
  }

  loadExperiences(): void {
    this.aboutDataService.getExperiences().subscribe(experiences => {
      this.experiences = experiences;
    });
  }

  openOwnerModal(): void {
    this.showOwnerModal = true;
  }

  closeOwnerModal(): void {
    this.showOwnerModal = false;
  }

  onAnimationDone(event: any): void {
    // Handle animation completion if needed
  }
}