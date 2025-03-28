import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="main-footer">
      <div class="footer-content">
        <p>&copy; 2025 Portfolio. All rights reserved.</p>
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
    </footer>
  `,
  styles: [`
    .main-footer {
      padding: var(--spacing-md);
      background: var(--background-secondary);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      margin-top: auto;
      z-index: 10;
      position: relative;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--spacing-md);

      @media (max-width: 768px) {
        flex-direction: column;
        gap: var(--spacing-md);
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