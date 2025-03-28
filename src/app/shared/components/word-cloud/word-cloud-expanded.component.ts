import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface WordCloudItem {
  text: string;
  size: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  animationDelay: number;
}

@Component({
  selector: 'app-word-cloud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="word-cloud-container">
      <div class="word-cloud-bubble">
        <div 
          *ngFor="let word of wordCloudItems" 
          class="word-cloud-item"
          [style.font-size.px]="word.size"
          [style.color]="word.color"
          [style.left.%]="word.x"
          [style.top.%]="word.y"
          [style.transform]="'rotate(' + word.rotation + 'deg)'"
          [@pulseAnimation]="{ value: 'active', params: { delay: word.animationDelay } }"
        >
          {{ word.text }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .word-cloud-container {
      width: 100%;
      height: 300px;
      position: relative;
      margin: var(--spacing-lg) 0;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background: rgba(30, 30, 50, 0.3);
    }

    .word-cloud-bubble {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }

    .word-cloud-item {
      position: absolute;
      transform-origin: center;
      font-weight: 600;
      white-space: nowrap;
      cursor: default;
      transition: transform 0.3s ease, filter 0.3s ease;

      &:hover {
        transform: scale(1.1) !important;
        filter: brightness(1.2);
        z-index: 10;
      }
    }
  `],
  animations: [
    trigger('pulseAnimation', [
      state('active', style({ opacity: 1, transform: 'scale(1)' })),
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('{{delay}}ms ease', style({ opacity: 1, transform: 'scale(1)' }))
      ], { params: { delay: '0' } })
    ])
  ]
})
export class WordCloudExpandedComponent implements OnInit {
  @Input() words: string[] = [];
  @Input() maxItems: number = 30;

  wordCloudItems: WordCloudItem[] = [];

  ngOnInit(): void {
    this.generateWordCloud();
  }

  private generateWordCloud(): void {
    // Default words if none provided
    const defaultWords = [
      'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'RxJS',
      'Node.js', 'Express', 'MongoDB', 'SQL', 'Git', 'Docker',
      'AWS', 'Azure', 'Firebase', 'Redux', 'React', 'Vue',
      'Webpack', 'Jest', 'Cypress', 'Jasmine', 'Karma', 'SCSS',
      'Bootstrap', 'Material', 'Tailwind', 'GraphQL', 'REST', 'WebSockets'
    ];

    const wordsToUse = this.words.length > 0 ? this.words : defaultWords;
    const wordCount = Math.min(wordsToUse.length, this.maxItems);

    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#6B5CA5', '#98C1D9',
      '#F9C80E', '#F86624', '#EA3546', '#662E9B', '#43BCCD'
    ];

    this.wordCloudItems = [];

    for (let i = 0; i < wordCount; i++) {
      const randomSize = Math.floor(Math.random() * 20) + 14; // 14px to 34px
      const randomX = Math.random() * 80 + 10; // 10% to 90%
      const randomY = Math.random() * 80 + 10; // 10% to 90%
      const randomRotation = Math.random() * 60 - 30; // -30deg to 30deg
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomDelay = Math.random() * 1000 + 500; // 500ms to 1500ms

      this.wordCloudItems.push({
        text: wordsToUse[i],
        size: randomSize,
        color: randomColor,
        x: randomX,
        y: randomY,
        rotation: randomRotation,
        animationDelay: randomDelay
      });
    }
  }
}