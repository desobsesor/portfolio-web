import { WordCloudCollapsedComponent } from "@/app/shared/components/word-cloud/word-cloud-collapsed.component";
import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Experience, PortfolioOwner, Skill } from '../models/about.model';
import { AboutDataService } from '../services/about-data.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, WordCloudCollapsedComponent],
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
export class AboutComponent implements OnInit {
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