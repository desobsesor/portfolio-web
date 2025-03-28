import { Routes } from '@angular/router';
import { HomeComponent } from '@/app/features/home/components/home.component';
import { AboutComponent } from '@/app/features/about/components/about.component';
import { ProjectsComponent } from '@/app/features/projects/components/projects.component';
import { ContactComponent } from '@/app/features/contact/components/contact.component';
import { AnalyticsDashboardComponent } from './features/analytics/components/analytics-dashboard/analytics-dashboard.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'projects', component: ProjectsComponent },
    { path: 'contact', component: ContactComponent },
    //{ path: 'analytics', component: AnalyticsDashboardComponent },
    { path: '**', redirectTo: '' }
];
