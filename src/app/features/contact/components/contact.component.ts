import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';
import { EmailService, EmailData } from '../services/email.service';
import { TrackingService } from '@/app/core/services/tracking.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
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
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'scale(1)', opacity: 1 }))
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
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  saveSvg = '<svg height="32px" width="32px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.615 16.615" xml:space="preserve" fill="#f7f3f3"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path style="fill:#f6f3f7;" d="M16.614,5.208c0-0.276-0.225-0.501-0.502-0.501H7.53l1.208,0.813 c0.078,0.053,0.142,0.119,0.199,0.19h6.455L10.408,9.32L7.971,7.566l-0.965,0.65l3.111,2.218c0.17,0.123,0.412,0.121,0.582,0 l4.912-3.502v5.09H5.205V9.428L5.003,9.565C4.845,9.669,4.669,9.721,4.488,9.721C4.39,9.721,4.295,9.7,4.202,9.67v2.854 c0,0.277,0.225,0.502,0.502,0.502h11.409c0.277,0,0.502-0.225,0.502-0.502V5.958c0-0.026-0.004-0.05-0.008-0.072 c0.006-0.027,0.008-0.054,0.008-0.08V5.208H16.614z"></path> <path style="fill:#f6f3f7;" d="M4.308,8.799c0,0.066,0.037,0.127,0.096,0.158c0.06,0.031,0.13,0.027,0.185-0.01l3.735-2.514 C8.373,6.4,8.403,6.344,8.403,6.283c0-0.06-0.03-0.115-0.079-0.149L4.59,3.621C4.535,3.585,4.464,3.58,4.405,3.611 c-0.059,0.032-0.096,0.093-0.096,0.16v1.454C3.721,5.221,3.235,5.195,2.83,5.146C0.888,4.916,0.368,3.75,0.347,3.7 C0.318,3.632,0.252,3.59,0.181,3.59c-0.012,0-0.024,0-0.035,0.003C0.06,3.611,0,3.685,0,3.77c0,2.944,3.495,3.571,4.307,3.677 L4.308,8.799L4.308,8.799z"></path> </g> </g> </g></svg>';


  constructor(
    private fb: FormBuilder,
    public sanitizer: DomSanitizer,
    private emailService: EmailService,
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Sanitize SVG icons to bypass Angular's security
    this.sanitizeSocialIcons();
  }

  ngOnInit(): void {

  }

  socialLinks: any = [
    { name: 'GitHub', url: 'https://github.com/desobsesor/', icon: null },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/yovany-su%C3%A1rez-silva-78202029/', icon: null },
    { name: 'Phone (318-150-1170)', url: '#', icon: null },
    { name: 'yovanysuarezsilva@gmail.com', url: '/pdf/CV_es_Yovany_Suarez_Silva_2025_FullStack.pdf', icon: null },
    { name: 'Download CV', url: '/pdf/CV_es_Yovany_Suarez_Silva_2025_FullStack.pdf', icon: null }
  ];

  private sanitizeSocialIcons(): void {
    const githubSvg = '<svg fill="#f3f1f1" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve" stroke="#f3f1f1"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="5151e0c8492e5103c096af88a5006e1e"> <path id="XMLID_1_" display="inline" d="M6.962,266.753c22.59-5.641,53.305-13.324,107.118-14.753 c-1.487-2.974-2.83-6.053-4.019-9.228c-20.94-0.182-85.43,2.792-107.521,8.25c-0.125,0.039-0.259,0.048-0.393,0.048 c-0.739,0-1.42-0.508-1.602-1.256c-0.211-0.873,0.326-1.774,1.208-1.995c21.89-5.41,84.825-8.413,107.118-8.355 c-5.017-14.753-7.233-31.655-7.233-50.523c0-33.516,10.437-46.159,24.46-64.02c-10.724-38.197,3.847-64.307,3.847-64.307 s22.533-4.671,65.132,25.832c23.089-9.89,84.647-10.714,113.77-2.196c17.88-11.818,50.571-28.585,63.77-23.895 c3.568,5.755,11.262,22.513,4.662,59.348c4.489,8.077,27.761,25.286,27.856,73.928c-0.384,17.938-2.245,33.084-5.698,45.899 c55.54-0.47,88.212,4.115,110.715,8.259c0.883,0.182,1.478,1.036,1.324,1.928c-0.153,0.787-0.844,1.353-1.611,1.353 c-0.115,0-0.211-0.009-0.326-0.019c-22.466-4.163-55.194-8.729-111.061-8.221c-0.979,3.252-2.072,6.341-3.262,9.286 c19.013,0.633,71.233,2.667,113.823,15.693c0.883,0.269,1.362,1.189,1.094,2.072c-0.211,0.7-0.863,1.16-1.573,1.16 c-0.153,0-0.326-0.019-0.479-0.076c-43.185-13.199-96.538-15.012-114.283-15.598c-15.444,33.929-47.118,46.59-98.322,51.856 c16.595,10.446,21.353,23.548,21.353,59.003c0,35.453-0.479,40.211-0.364,48.363c0.173,13.383,19.779,19.789,19.051,24.096 c-0.729,4.299-16.403,3.607-23.731,1.047c-20.758-7.232-18.687-24.5-18.687-24.5l-0.69-47.404c0,0,1.42-25.516-8-25.516 c0,5.131,0,59.242,0,77.592c0,16.863,11.799,21.986,11.799,28.221c0,10.715-21.563-1.016-28.202-7.703 c-10.134-10.168-8.982-31.73-8.733-48.785c0.23-16.471-0.153-52.49-0.153-52.49l-6.877,0.145c0,0,2.82,78.686-3.626,93.025 c-8.335,18.408-33.477,24.74-33.477,16.355c0-5.641,6.196-3.846,9.621-16.488c2.925-10.754,1.928-90.975,1.928-90.975 s-8.057,4.768-8.057,19.789c0,6.877-0.192,46.158-0.192,57.852c0,14.705-20.883,23.078-30.917,23.078 c-5.084,0-11.405-0.248-11.405-2.943c0-6.801,19.099-10.793,19.099-24.941c0-12.268-0.269-43.826-0.269-43.826 s-9.631,1.648-23.367,1.648c-34.628,0-45.583-22.1-50.792-34.465c-6.782-16.105-15.578-23.673-24.921-29.717 c-5.736-3.712-7.06-8.096-0.422-9.343c30.657-5.774,38.494,34.763,58.964,41.218c14.609,4.615,33.391,2.619,42.734-3.424 c1.238-12.385,10.159-23.089,17.593-28.729c-52.067-4.998-82.936-23.079-98.936-52.145c-54.466,1.305-85.372,9.036-108.029,14.695 c-1.65,0.413-3.261,0.815-4.815,1.209c-0.134,0.028-0.269,0.038-0.403,0.038c-0.739,0-1.41-0.499-1.602-1.247 c-0.221-0.882,0.326-1.784,1.209-2.005C3.72,267.567,5.322,267.175,6.962,266.753z"> </path> </g> </g></svg>';
    const linkedinSvg = '<svg fill="#f8f7f7" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M23,0H9C4,0,0,4,0,9v14c0,5,4,9,9,9h14c5,0,9-4,9-9V9C32,4,28,0,23,0z M12,25c0,0.6-0.4,1-1,1H7c-0.6,0-1-0.4-1-1V13 c0-0.6,0.4-1,1-1h4c0.6,0,1,0.4,1,1V25z M9,11c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S10.7,11,9,11z M26,25c0,0.6-0.4,1-1,1h-3 c-0.6,0-1-0.4-1-1v-3.5v-1v-2c0-0.8-0.7-1.5-1.5-1.5S18,17.7,18,18.5v2v1V25c0,0.6-0.4,1-1,1h-3c-0.6,0-1-0.4-1-1V13 c0-0.6,0.4-1,1-1h4c0.3,0,0.5,0.1,0.7,0.3c0.6-0.2,1.2-0.3,1.8-0.3c3,0,5.5,2.5,5.5,5.5V25z"></path> </g></svg>';
    const phoneSvg = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 14C20 17.7712 20 19.6569 18.8284 20.8284C17.6569 22 15.7712 22 12 22C8.22876 22 6.34315 22 5.17157 20.8284C4 19.6569 4 17.7712 4 14V10C4 6.22876 4 4.34315 5.17157 3.17157C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.17157C20 4.34315 20 6.22876 20 10" stroke="#edeef2" stroke-width="1.5" stroke-linecap="round"></path> <path d="M15 5H9" stroke="#edeef2" stroke-width="1.5" stroke-linecap="round"></path> <circle cx="12" cy="17" r="2" stroke="#edeef2" stroke-width="1.5"></circle> </g></svg>';
    const emailSvg = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12ZM16 12V13.5C16 14.8807 17.1193 16 18.5 16V16C19.8807 16 21 14.8807 21 13.5V12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21H16" stroke="#faf4f4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>';
    const pdfSvg = '<svg fill="#f8f7f7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M19.2,6.67,12.34,0H2.74A2.77,2.77,0,0,0,.81.78,2.62,2.62,0,0,0,0,2.67V21.33a2.62,2.62,0,0,0,.81,1.89A2.77,2.77,0,0,0,2.74,24H16.46a2.77,2.77,0,0,0,1.93-.78,2.62,2.62,0,0,0,.81-1.89V20H24V9.33H19.2ZM11.66,2.16,17,7.33H11.66Zm11,8.51v8H6.17v-8Z"></path><path d="M11.76,13.69a1.71,1.71,0,0,1-.12.71,1.58,1.58,0,0,1-.43.59,2.41,2.41,0,0,1-1.56.46h-.5v1.89H8V12H9.76a2.22,2.22,0,0,1,1.5.42,1.67,1.67,0,0,1,.38.58A1.6,1.6,0,0,1,11.76,13.69Zm-2.64.85h.39a1.29,1.29,0,0,0,.79-.21.9.9,0,0,0,.21-.27.88.88,0,0,0,.07-.32.89.89,0,0,0-.05-.32,1,1,0,0,0-.17-.27A1,1,0,0,0,9.67,13H9.15v1.57Z"></path><path d="M17.33,14.65a2.7,2.7,0,0,1-.16,1.09,2.64,2.64,0,0,1-.61.93,3.13,3.13,0,0,1-2.22.7H12.77V12H14.5a3,3,0,0,1,2.09.7,2.47,2.47,0,0,1,.74,1.92Zm-1.21,0c0-1.14-.52-1.7-1.56-1.7h-.64v3.46h.5a1.53,1.53,0,0,0,1.7-1.76Z"></path><path d="M19.6,17.37H18.45V12h3.16V13h-2v1.38h1.87v.94H19.6Z"></path></g></svg>';


    // Sanitize SVG strings and assign to socialLinks
    this.socialLinks[0].icon = this.sanitizer.bypassSecurityTrustHtml(githubSvg);
    this.socialLinks[1].icon = this.sanitizer.bypassSecurityTrustHtml(linkedinSvg);
    this.socialLinks[2].icon = this.sanitizer.bypassSecurityTrustHtml(phoneSvg);
    this.socialLinks[3].icon = this.sanitizer.bypassSecurityTrustHtml(emailSvg);
    this.socialLinks[4].icon = this.sanitizer.bypassSecurityTrustHtml(pdfSvg);
  }

  isFieldInvalid(field: string): boolean {
    const formControl = this.contactForm.get(field);
    return formControl ? formControl.invalid && (formControl.dirty || formControl.touched) : false;
  }

  async onSubmit() {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      try {
        // Implement form submission logic here
        const emailData: EmailData = {
          name: this.contactForm.get('name')?.value,
          email: this.contactForm.get('email')?.value,
          message: this.contactForm.get('message')?.value
        };

        await this.emailService.sendEmail(emailData);
        // await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
        this.contactForm.reset();
        // Show success message
      } catch (error) {
        // Handle error
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}