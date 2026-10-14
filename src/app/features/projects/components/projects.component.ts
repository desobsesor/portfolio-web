import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ImageSliderComponent } from './image-slider.component';

import { TrackingService } from '@/app/core/services/tracking.service';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';

/**
 * Nature of each record. The archive states plainly what each system is, so the page
 * never reads as a product catalogue on sale.
 */
type ProjectKind = 'opensource' | 'client' | 'own';

interface Project {
  title: string;
  description: string;
  image: string;
  additionalImages: string[];
  tags: string[];
  kind: ProjectKind;
  /** Only set when it points at the project itself (repo, live site or demo). */
  link?: string;
  linkLabel?: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ImageSliderComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(24px)', opacity: 0 }),
        animate('600ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('cardEnter', [
      transition(':enter', [
        style({ transform: 'translateY(18px)', opacity: 0 }),
        animate('520ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(18px)' }),
          stagger(70, [
            animate('520ms cubic-bezier(0.16, 1, 0.3, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('modalEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(0.98)' }),
        animate('280ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(8px) scale(0.99)' }))
      ])
    ])
  ]
})
export class ProjectsComponent implements OnInit, OnDestroy {
  /**
   * Registro de desarrollos hechos a lo largo de la carrera: para clientes, para la
   * propia empresa o como exploracion tecnica. No es un catalogo de productos en venta.
   * El `link` solo se define cuando apunta al proyecto mismo, nunca a la web corporativa.
   */
  projects: Project[] = [
    {
      title: 'SEAN Pets',
      description: 'Módulo de la plataforma veterinaria SEAN para la gestión de mascotas y sus propietarios: registro de pacientes, servicios y seguimiento.',
      image: 'assets/screenshots/sean-pets-web-min.png',
      additionalImages: [],
      tags: ['.Net', 'C#', 'SQL Server', 'SignalR'],
      kind: 'client'
    },
    {
      title: 'CCF Almacén',
      description: 'Sistema de almacén e inventario: entradas, salidas, bodegas y control de existencias.',
      image: 'assets/screenshots/ccf-almacen-web-min.png',
      additionalImages: [],
      tags: ['.Net', 'C#', 'SQL Server', 'Bootstrap'],
      kind: 'client'
    },
    {
      title: 'CitApp',
      description: 'Aplicación de gestión de citas: agendamiento, aprobación de solicitudes y control de disponibilidad.',
      image: 'assets/screenshots/citapp-web-min.png',
      additionalImages: [],
      tags: ['.Net', 'C#', 'Blazor', 'SQL Server'],
      kind: 'client'
    },
    {
      title: 'SurosV4 - Paneles de monitoreo',
      description: 'Paneles de monitoreo en tiempo real del sistema de información clínica SurosV4: estado de los procesos en segundo plano, trazabilidad de logs y salud de los servicios.',
      image: 'assets/screenshots/suros-v4-monitoreo-web-min.png',
      additionalImages: [],
      tags: ['.Net 10', 'Blazor', 'SignalR', 'Hangfire', 'Serilog', 'SQL Server', 'MongoDB'],
      kind: 'client'
    },
    {
      title: 'Social Network - Galactic Connection',
      description: 'Red social moderna para que todos los seres galácticos (humanos, aliens y robots) se conecten, compartan y descubran, desarrollada con React, NextJS, TypeScript, Tailwind CSS y arquitectura hexagonal.',
      image: 'assets/screenshots/social-network-min.png',
      additionalImages: [
        'assets/screenshots/social-network-VII-min.png',
        'assets/screenshots/social-network-VI-min.png',
        'assets/screenshots/social-network-II-min.png',
        'assets/screenshots/social-network-III-min.png',
        'assets/screenshots/social-network-IV-min.png',
        'assets/screenshots/social-network-V-min.png'
      ],
      tags: ['React', 'Typescript', 'TailWind', 'Zustand', 'React Query', 'Socket.io', 'NextJS'],
      kind: 'opensource',
      link: 'https://github.com/desobsesor/social-network-web',
      linkLabel: 'Ver repositorio'
    },
    {
      title: 'Grilla de proyección diaria',
      description: 'Aplicación web moderna para visualizar y gestionar proyecciones de productos, desarrollada con React, TypeScript, Tailwind CSS y arquitectura hexagonal.',
      image: 'assets/screenshots/projection-grid-web-min.png',
      additionalImages: [],
      tags: ['React', 'Typescript', 'TailWind', 'Zustand', 'React window', 'Web Workers', 'Comlink'],
      kind: 'opensource',
      link: 'https://github.com/desobsesor/projection-grid-web',
      linkLabel: 'Ver repositorio'
    },
    {
      title: 'Tech Racing F1',
      description: 'Permite ejecutar una simulación que genera un conjunto de estrategias de carrera, teniendo en cuenta los neumáticos y el número total de vueltas.',
      image: 'assets/screenshots/f1-3-min.png',
      additionalImages: [
        'assets/screenshots/f1-1-min.png',
        'assets/screenshots/f1-2-min.png',
        'assets/screenshots/f1-7.png',
        'assets/screenshots/f1-6.png'
      ],
      tags: ['.NET', 'Entity Framework', 'Serilog', 'Swagger', 'SQL Server', 'MediatR', 'Angular', 'Typescript', 'TailWind', 'RxJS'],
      kind: 'opensource',
      link: 'https://github.com/desobsesor/tech-racing-f1-web',
      linkLabel: 'Ver repositorio'
    },
    {
      title: 'Simple Payment',
      description: 'Sistema de pago simple para implementar con una pasarela de pagos.',
      image: 'assets/screenshots/simple-payment-min.png',
      additionalImages: [
        'assets/screenshots/simple-payment-1-min.png',
        'assets/screenshots/simple-payment-2-min.png',
        'assets/screenshots/simple-payment-3-min.png',
        'assets/screenshots/simple-payment-4-min.png',
        'assets/screenshots/simple-payment-5-min.png'
      ],
      tags: ['NodeJS', 'NestJS', 'PostgreSQL', 'Swagger', 'Socket', 'React', 'Material UI', 'IA'],
      kind: 'opensource',
      link: 'https://github.com/desobsesor/simple-payment-web',
      linkLabel: 'Ver repositorio'
    },
    {
      title: 'Modern Wallet',
      description: 'Sistema de gestión de cartera para el sector salud.',
      image: 'assets/screenshots/mia-wallet-web-min.png',
      additionalImages: [
        'assets/screenshots/mia-wallet-web-invoice-min.png'
      ],
      tags: ['NodeJS', 'Express', 'Mongoose', 'MongoDB', 'Swagger', 'NextJS', 'React', 'SocketIO', 'Tailwind', 'IA'],
      kind: 'client',
      link: 'http://mia.suros.co',
      linkLabel: 'Ver sitio'
    },
    {
      title: 'Árbol genealógico',
      description: 'Aplicación web para el diseño de árboles genealógicos. El recurso puede incrustarse dentro de un contenedor.',
      image: 'assets/screenshots/genealogical-chart-web-min.png',
      additionalImages: [],
      tags: ['React', 'Vite', 'React Flow', 'Tailwind', 'IA'],
      kind: 'own',
      link: 'http://cds.net.co/genealogical',
      linkLabel: 'Ver demo'
    },
    {
      title: 'Separa App',
      description: 'Aplicación web para reservar espacios de trabajo.',
      image: 'assets/screenshots/separa-web-min.png',
      additionalImages: [],
      tags: ['NodeJS', 'NestJS', 'React', 'NextJS', 'MongoDB', 'Tailwind', 'IA'],
      kind: 'client'
    },
    {
      title: 'Vibra Web',
      description: 'Web móvil interactiva con visualización de datos en tiempo real y reporte de emociones.',
      image: 'assets/screenshots/vibra-web-min.png',
      additionalImages: [],
      tags: ['NodeJS', 'NestJS', 'MongoDB', 'React', 'React Native', 'Tailwind', 'Expo', 'IA'],
      kind: 'client'
    },
    {
      title: 'EAOptima ERP',
      description: 'Sistema ERP para Optima Ballistic Glass.',
      image: 'assets/screenshots/optimaerp-web-min.png',
      additionalImages: [
        'assets/screenshots/optimaerp-web-point-min.png'
      ],
      tags: ['Java', 'EJB', 'JPA', 'HTML5', 'JSF Primefaces', 'PostgresQL', 'Linux', 'Apache Tomcat'],
      kind: 'client'
    },
    {
      title: 'EAOptimaERP Contabilidad',
      description: 'Módulo de gestión contable dentro del sistema ERP de Optima Ballistic Glass.',
      image: 'assets/screenshots/cuentas-contables-web-min.jpeg',
      additionalImages: [],
      tags: ['PHP', 'JQuery', 'PostgresQL', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'Suros',
      description: 'Sistema web para la gestión de información en clínicas y hospitales.',
      image: 'assets/screenshots/suros-historia-clinica-web-min.png',
      additionalImages: [
        'assets/screenshots/suros-web-min.png',
        'assets/screenshots/suros-farmacia-web-min.png',
        'assets/screenshots/suros-facturador-web-min.png'
      ],
      tags: ['C#', 'Ext .Net', 'SQL Server', 'JQuery', 'SignalR', 'IIS'],
      kind: 'client'
    },
    {
      title: 'Suros Veterinaria',
      description: 'Sistema de información web para la gestión de clínicas veterinarias.',
      image: 'assets/screenshots/sean-web-min.png',
      additionalImages: [
        'assets/screenshots/sean-pos-web-min.png'
      ],
      tags: ['C#', 'Ext .Net', 'SQL Server', 'JQuery', 'SignalR', 'IIS'],
      kind: 'client'
    },
    {
      title: 'POS Web',
      description: 'Aplicación POS para la gestión de farmacias.',
      image: 'assets/screenshots/scip-pos-web-min.JPG',
      additionalImages: [
        'assets/screenshots/scip-web-min.JPG'
      ],
      tags: ['Angular', 'NodeJS', 'MongoDB', 'IA'],
      kind: 'client'
    },
    {
      title: 'Portafolio',
      description: 'Este mismo sitio: la aplicación web donde se publica el archivo de proyectos.',
      image: 'assets/screenshots/portfolio-web-min.png',
      additionalImages: [],
      tags: ['Angular', 'NodeJS', 'IA'],
      kind: 'own'
    },
    {
      title: 'SCIP Zapateria',
      description: 'Sistema de control de inventario y producción para una fábrica de calzado.',
      image: 'assets/screenshots/scip-zapateria-web-min.jpeg',
      additionalImages: [
        'assets/screenshots/scip-zapateria-plan-web-min.jpeg'
      ],
      tags: ['PHP', 'JQuery', 'PostgresQL', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'SCIP Mukatri',
      description: 'Sistema de control de inventario y producción para una fábrica de dulces amazónicos.',
      image: 'assets/screenshots/mukatri-web-product-min.PNG',
      additionalImages: [
        'assets/screenshots/mukatri-web-min.PNG',
        'assets/screenshots/mukatri-user-web-min.PNG'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'SCIP Óptica',
      description: 'Sistema de control de inventario y ventas para una fábrica de productos ópticos.',
      image: 'assets/screenshots/scip-opticas-web-min.PNG',
      additionalImages: [
        'assets/screenshots/scip-opticas-admin-min.PNG',
        'assets/screenshots/scip-opticas-sales-min.PNG'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'Agenda Caqueteña',
      description: 'Sistema de control de instrumentos de diagnóstico.',
      image: 'assets/screenshots/agenda-caquetena-web-min.PNG',
      additionalImages: [
        'assets/screenshots/agenda-caquetena-admin-web-min.PNG',
        'assets/screenshots/agenda-caquetena-charts-web-min.PNG'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'MySQL', 'JQuery', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'POS Restaurante',
      description: 'Aplicación POS para restaurantes.',
      image: 'assets/screenshots/pos-min.jpg',
      additionalImages: [],
      tags: ['PHP', 'JQuery', 'PostgresQL', 'HTML5'],
      kind: 'client'
    },
    {
      title: 'Página web Cámara de Comercio Florencia',
      description: 'Sitio web de la Cámara de Comercio del Caquetá.',
      image: 'assets/screenshots/ccflorencia-web-min.png',
      additionalImages: [
        'assets/screenshots/ccflorencia-admin-web-min.png'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'Página web fundación Afrocaq',
      description: 'Sitio web de la Fundación Afrodescendiente Afrocaq.',
      image: 'assets/screenshots/afrocaq-web-min.png',
      additionalImages: [],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery', 'HTML5', 'CSS'],
      kind: 'client'
    },
    {
      title: 'Generador de código MDA',
      description: 'Generador de código para aplicaciones mediante Desarrollo Dirigido por Modelos.',
      image: 'assets/screenshots/metamodeloMSHtml5_in_eclipsejuno-min.PNG',
      additionalImages: [],
      tags: ['ATL', 'MofScript', 'Eclipse', 'MDA'],
      kind: 'own'
    }
  ];

  selectedProject: Project | null = null;

  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLElement>;

  /** Element focused before opening the dialog, so focus can be restored on close. */
  private previouslyFocused: HTMLElement | null = null;
  /** Page scrollbar width, compensated while the dialog locks the body scroll. */
  private scrollbarCompensation = 0;

  constructor(private trackingService: TrackingService) { }

  ngOnInit(): void {
    this.trackingService.trackPageView('/projects');
  }

  ngOnDestroy(): void {
    this.releaseBodyScroll();
  }

  /** Human readable nature of the record, shown on every entry. */
  kindLabel(project: Project): string {
    switch (project.kind) {
      case 'opensource':
        return 'Código abierto';
      case 'own':
        return 'Proyecto propio';
      default:
        return 'Desarrollo para cliente';
    }
  }

  /** Text of the external action; defaults to a neutral label. */
  linkLabel(project: Project): string {
    return project.linkLabel ?? 'Ver proyecto';
  }

  /** Honest note when the system has no public link, instead of a fake button. */
  noLinkNote(project: Project): string {
    return project.kind === 'own'
      ? 'Proyecto propio sin enlace público.'
      : 'Desarrollo para cliente sin enlace público.';
  }

  /**
   * Marca la captura que no cargó, para que el marco muestre el título del proyecto en
   * su lugar en vez de un hueco negro. Es el estado de una entrada cuyas capturas aún
   * no se han publicado.
   */
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).classList.add('is-missing');
  }

  openProject(project: Project): void {
    this.previouslyFocused = typeof document !== 'undefined'
      ? (document.activeElement as HTMLElement)
      : null;

    this.selectedProject = project;
    this.lockBodyScroll();
    this.trackingService.trackProjectView(project.title);

    // Wait for the dialog to render, then move the focus into it.
    setTimeout(() => this.dialogRef?.nativeElement.focus(), 0);
  }

  closeProject(): void {
    this.selectedProject = null;
    this.releaseBodyScroll();
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  // Track external link click
  onExternalLinkClick(project: Project): void {
    this.trackingService.trackExternalLinkClick(project.link ?? '', 'project_link');
  }

  /** Closes the dialog with Esc. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedProject) {
      this.closeProject();
    }
  }

  /** Keeps the keyboard focus inside the dialog while it is open. */
  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: KeyboardEvent): void {
    const dialog = this.dialogRef?.nativeElement;
    if (!this.selectedProject || !dialog) {
      return;
    }

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));

    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Locks the page scroll without letting the layout jump when the scrollbar goes away. */
  private lockBodyScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }
    this.scrollbarCompensation = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (this.scrollbarCompensation > 0) {
      document.body.style.paddingRight = `${this.scrollbarCompensation}px`;
    }
  }

  private releaseBodyScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    this.scrollbarCompensation = 0;
  }
}
