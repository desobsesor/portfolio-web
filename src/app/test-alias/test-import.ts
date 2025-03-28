// Este archivo es para probar el alias '@'
import { Component } from '@angular/core';
import { AppComponent } from '@/app/app.component';

@Component({
    selector: 'app-test-import',
    template: '<div>Test Import Component</div>',
    standalone: true
})
export class TestImportComponent {
    constructor() {
        console.log('Test import component initialized');
    }
}