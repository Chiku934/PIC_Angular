import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { CompanyService } from './services/company.service';
import { AuthService } from './services/auth.service';
import { SidebarService } from './services/sidebar.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    CompanyService,
    AuthService,
    SidebarService
  ]
};
