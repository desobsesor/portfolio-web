import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
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
export class HomeComponent implements OnInit {

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

  ngOnInit(): void {
    this.initParticleEffect();
    // Track home page view
    this.trackingService.trackPageView('/home');
  }

  private initParticleEffect(): void {
    // Particle effect initialization will be implemented here
  }
}