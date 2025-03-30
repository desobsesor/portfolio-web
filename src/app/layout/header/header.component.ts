import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="main-nav" [@fadeIn]>
      <div class="nav-content">
        <a class="logo" routerLink="/">Portfolio</a>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          <a routerLink="/projects" routerLinkActive="active">Projects</a>      
          <a routerLink="/about" routerLinkActive="active">About</a>
          <a routerLink="/contact" routerLinkActive="active">Contact</a>
          <!--<a routerLink="/analytics" routerLinkActive="active">Analytics</a>-->
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .main-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: var(--spacing-sm);
      background: var(--background-secondary);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--spacing-md);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
      }
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      gap: var(--spacing-md);

      @media (max-width: 768px) {
        flex-direction: row;
        justify-content: center;
        width: 100%;
        flex-wrap: wrap;
      }

      a {
        color: var(--text-secondary);
        text-decoration: none;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-full);
        transition: all var(--transition-normal) ease;

        &:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        &.active {
          color: var(--text-primary);
          background: var(--background-secondary);
        }
      }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HeaderComponent { }