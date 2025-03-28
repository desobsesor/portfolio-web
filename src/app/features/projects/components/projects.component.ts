import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { TrackingService } from '@/app/core/services/tracking.service';

interface Project {
  title: string;
  description: string;
  image: string;
  additionalImages?: string[];
  tags: string[];
  link: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  animations: [
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
        style({ transform: 'scale(0.8) translateY(20px)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
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
    ]),
    trigger('modalEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [
    {
      title: 'Modern Wallet',
      description: 'Portfolio management system for the health sector',
      image: 'assets/screenshots/mia-wallet-web-min.png',
      additionalImages: [
        'assets/screenshots/mia-wallet-web-min.png',
        'assets/screenshots/mia-wallet-web-invoice-min.png'
      ],
      tags: ['NodeJS', 'Express', 'Mongoose', 'MongoDB', 'Swagger', 'NextJS', 'React', 'Socket', 'Tailwind', 'AI'],
      link: 'http://mia.suros.co'
    },
    {
      title: 'Genealogical Chart',
      description: 'Web application for family tree design. The resource can be embedded within a wrapper.',
      image: 'assets/screenshots/genealogical-chart-web-min.png',
      tags: ['React', 'Vite', 'React Flow', 'Tailwind', 'AI'],
      link: 'http://cds.net.co/genealogical'
    },
    {
      title: 'Separa App',
      description: 'Web application for booking workspaces',
      image: 'assets/screenshots/separa-web-min.png',
      tags: ['NodeJS', 'NestJS', 'React', 'NextJS', 'MongoDB', 'Tailwind', 'AI'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Vibra Web',
      description: 'Interactive web mobile with real-time data visualization and reporting the emotions',
      image: 'assets/screenshots/vibra-web-min.png',
      additionalImages: ['assets/screenshots/vibra-web-min.png',],
      tags: ['NodeJS', 'NestJS', 'React', 'React Native', 'NextJS', 'MongoDB', 'Tailwind', 'AI'],
      link: 'http://cds.net.co'
    },
    {
      title: 'EAOptima ERP',
      description: 'ERP system for Optima Ballistic Glass',
      image: 'assets/screenshots/optimaerp-web-min.png',
      additionalImages: ['assets/screenshots/optimaerp-web-min.png', 'assets/screenshots/optimaerp-web-point-min.png',],
      tags: ['Java', 'EJB', 'JPA', 'HTML5', 'JSF Primefaces', 'PostgresQL', 'Linux', 'Apache Tomcat'],
      link: 'http://cds.net.co'
    },
    {
      title: 'EAOptimaERP Accounting',
      description: 'Accounting management module for the Optima Ballistic Glass ERP system',
      image: 'assets/screenshots/cuentas-contables-web-min.jpeg',
      additionalImages: ['assets/screenshots/optimaerp-web-min.png', 'assets/screenshots/optimaerp-web-point-min.png',],
      tags: ['PHP', 'JQuery', 'PostgresQL', 'HTML5'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Suros',
      description: 'Web-based system for managing information in clinics and hospitals',
      image: 'assets/screenshots/suros-historia-clinica-web-min.png',
      additionalImages: [
        'assets/screenshots/suros-web-min.png',
        'assets/screenshots/suros-farmacia-web-min.png',
        'assets/screenshots/suros-facturador-web-min.png',
        'assets/screenshots/suros-historia-clinica-web-min.png'
      ],
      tags: ['C#', 'Ext.Net', 'SQL Server', 'JQuery', 'SignalR', 'IIS'],
      link: 'http://cds.net.co'
    },

    {
      title: 'Suros Veterinaria',
      description: 'Web-based information system for veterinary clinic management',
      image: 'assets/screenshots/sean-web-min.png',
      additionalImages: [
        'assets/screenshots/sean-web-min.png',
        'assets/screenshots/sean-pos-web-min.png',
      ],
      tags: ['C#', 'Ext.Net', 'SQL Server', 'JQuery', 'SignalR', 'IIS'],
      link: 'http://cds.net.co'
    },
    {
      title: 'POS Web',
      description: 'POS application for pharmacy management',
      image: 'assets/screenshots/scip-pos-web-min.JPG',
      additionalImages: ['assets/screenshots/scip-pos-web-min.JPG', 'assets/screenshots/scip-web-min.JPG'],
      tags: ['Angular', 'Node.js', 'MongoDB', 'AI'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Portfolio',
      description: 'Web application to view my development company project portfolio',
      image: 'assets/screenshots/portfolio-web-min.png',
      tags: ['Angular', 'NodeJS', 'AI'],
      link: 'http://cds.net.co'
    },
    {
      title: 'SCIP Zapateria',
      description: 'Inventory and production control system for a footwear factory',
      image: 'assets/screenshots/scip-zapateria-web-min.jpeg',
      additionalImages: [
        'assets/screenshots/scip-zapateria-plan-web-min.jpeg',
        'assets/screenshots/scip-zapateria-web-min.jpeg'
      ],
      tags: ['PHP', 'JQuery', 'PostgresQL', 'HTML5'],
      link: 'http://cds.net.co'
    },
    {
      title: 'SCIP Mukatri',
      description: 'Inventory and production control system for an Amazonian candy factory',
      image: 'assets/screenshots/mukatri-web-product-min.PNG',
      additionalImages: [
        'assets/screenshots/mukatri-web-min.PNG',
        'assets/screenshots/mukatri-web-min.PNG',
        'assets/screenshots/mukatri-web-min.PNG'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery'],
      link: 'http://cds.net.co'
    },
    {
      title: 'SCIP Optica',
      description: 'Inventory and sales control system for an optical products factory',
      image: 'assets/screenshots/scip-opticas-web-min.PNG',
      additionalImages: [
        'assets/screenshots/scip-opticas-admin-min.PNG',
        'assets/screenshots/scip-opticas-sales-min.PNG',
        'assets/screenshots/scip-opticas-web-min.PNG'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Agenda Caqueteña',
      description: 'Diagnostic instrument control system',
      image: 'assets/screenshots/agenda-caquetena-web-min.PNG',
      additionalImages: [
        'assets/screenshots/agenda-caquetena-admin-web-min.PNG',
        'assets/screenshots/agenda-caquetena-charts-web-min.PNG',
        'assets/screenshots/agenda-caquetena-web-min.PNG'
      ],
      tags: ['.Net ASP', 'Bootstrap', 'MySQL', 'JQuery'],
      link: 'http://cds.net.co'
    },
    {
      title: 'POS Restaurant',
      description: 'POS application for restaurants.',
      image: 'assets/screenshots/pos-min.jpg',
      tags: ['PHP', 'JQuery', 'PostgresQL', 'HTML5'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Web page Chamber of Commerce Florencia',
      description: 'Website of the Caquetá Chamber of Commerce',
      image: 'assets/screenshots/ccflorencia-web-min.png',
      additionalImages: ['assets/screenshots/ccflorencia-web-min.png', 'assets/screenshots/ccflorencia-admin-web-min.png'],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Web page foundation Afrocaq',
      description: 'Website of the Afrocaq African American Foundation',
      image: 'assets/screenshots/afrocaq-web-min.png',
      additionalImages: ['assets/screenshots/afrocaq-web-min.png', 'assets/screenshots/ccflorencia-admin-web-min.png'],
      tags: ['.Net ASP', 'Bootstrap', 'SQL Server', 'JQuery'],
      link: 'http://cds.net.co'
    },
    {
      title: 'Gnerarator Code MDA',
      description: 'Code generator for applications through Model-Driven Development',
      image: 'assets/screenshots/metamodeloMSHtml5_in_eclipsejuno-min.PNG',
      tags: ['ATL', 'MofScript', 'Eclipse', 'MDA'],
      link: 'http://cds.net.co'
    }
  ];

  selectedProject: Project | null = null;
  hoveredProject: Project | null = null;

  constructor(private trackingService: TrackingService) { }

  ngOnInit(): void {
    // Track page view when component initializes
    this.trackingService.trackPageView('/projects');
  }

  openProject(project: Project): void {
    this.selectedProject = project;
    // Track project view event
    this.trackingService.trackProjectView(project.title);
  }

  closeProject(): void {
    this.selectedProject = null;
  }

  showTooltip(project: Project): void {
    this.hoveredProject = project;
    // Track hover event
    this.trackEvent('hover', project.title);
  }

  hideTooltip(): void {
    this.hoveredProject = null;
  }

  // Track external link click
  onExternalLinkClick(project: Project): void {
    this.trackingService.trackExternalLinkClick(project.link, 'project_link');
  }

  // Helper method to track events
  private trackEvent(action: string, projectTitle: string): void {
    this.trackingService.trackEvent({
      category: 'projects',
      action: action,
      label: projectTitle
    });
  }
}