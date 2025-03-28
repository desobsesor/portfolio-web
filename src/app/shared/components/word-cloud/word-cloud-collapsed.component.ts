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
    :host {
      display: block;
      width: 100%;
      margin: 2rem 0;
    }

    .word-cloud-container {
      position: relative;
      width: 100%;
      height: 250px;
      margin: 0 auto;
    }

    .word-cloud-bubble {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .word-cloud-item {
      position: absolute;
      font-weight: bold;
      white-space: nowrap;
      cursor: pointer;
      transition: transform 0.3s ease, filter 0.3s ease;
    }

    .word-cloud-item:hover {
      transform: scale(1.1) !important;
      filter: brightness(1.3);
      z-index: 10;
    }
  `],
  animations: [
    trigger('pulseAnimation', [
      state('inactive', style({
        opacity: 0.7,
        transform: 'scale(1)'
      })),
      state('active', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('inactive => active', [
        animate('{{delay}}ms ease-in', style({ opacity: 0.7 })),
        animate('2000ms ease-in-out', style({ opacity: 1, transform: 'scale(1.05)' })),
        animate('2000ms ease-in-out', style({ opacity: 0.9, transform: 'scale(1)' })),
      ], { params: { delay: '0' } })
    ])
  ]
})
export class WordCloudCollapsedComponent implements OnInit {
  @Input() words: string[] = [
    'NodeJS', 'React', 'Angular', 'Javascript', 'Typescript', 'SQL Server',
    'MongoDB', 'PostreSQL', 'NextJS', 'NestJS', 'Java', 'C#', 'Python', 'JPA', 'GO', 'Intelligence Artificial',
    'LLMs', 'ChatGPT', 'OpenAI', 'DeepSeek', 'GraphQL', 'REST', 'Microservices', 'AWS', 'IIS', 'Linux', 'Windows', 'Unix',
    'GIT', 'Docker', 'CI/CD', 'SCSS', 'Swagger', 'JSF', 'Spring', 'IIS', '.Net', 'Arduino', 'Raspberry Pi',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind', 'Material UI'
  ];

  wordCloudItems: WordCloudItem[] = [];

  // Color palette based on the image
  colors: string[] = [
    '#4ECDC4', // teal
    '#FF6B6B', // coral
    '#FFE66D', // yellow
    '#1A535C', // dark teal
    '#F7FFF7', // white
    '#FF9F1C', // orange
  ];

  ngOnInit(): void {
    this.generateWordCloud();
  }

  generateWordCloud(): void {
    const centerX = 50;
    const centerY = 50;

    // Sort words by importance (we'll use length as a proxy for importance)
    // Shorter words are often more important in tech stacks
    const sortedWords = [...this.words].sort((a, b) => a.length - b.length);

    this.wordCloudItems = sortedWords.map((word, index) => {
      // Determine size based on word length and position in the sorted array
      // More important words (beginning of array) get larger sizes
      const importance = 1 - (index / sortedWords.length);
      const baseSize = 14;
      const sizeVariation = 16;
      const size = baseSize + (sizeVariation * importance) - (word.length * 0.3);

      // Use a spiral distribution starting from center
      // The golden angle ensures good distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angle = index * goldenAngle;

      // Distance from center increases with index
      // More important words (beginning of array) stay closer to center
      const distance = Math.sqrt(index) * 5.5;
      const maxRadius = 45; // Maximum radius to keep words within container
      const normalizedDistance = Math.min(distance, maxRadius);

      // Calculate position using spiral pattern
      const x = centerX + (normalizedDistance * Math.cos(angle));
      const y = centerY + (normalizedDistance * Math.sin(angle));

      // Random rotation for visual interest
      const rotation = (Math.random() * 30) - 15;

      // Random color from palette
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];

      // Animation delay based on distance from center
      // Words closer to center appear first
      const animationDelay = index * 100;

      return {
        text: word,
        size,
        color,
        x,
        y,
        rotation,
        animationDelay
      };
    });
  }
}