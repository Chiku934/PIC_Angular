import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    title: 'PIC - Login'
  },
  { 
    path: '', 
    component: HomeComponent, 
    canActivate: [authGuard],
    title: 'PIC - Dashboard'
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];
