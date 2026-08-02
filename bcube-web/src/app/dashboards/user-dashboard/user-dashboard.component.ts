import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MegaMenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth/auth.service';
import { MegaMenuModule } from 'primeng/megamenu';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-user-dashboard',
    imports: [
        CommonModule,
        ToastModule,
        ConfirmDialogModule,
        RouterModule,
        MegaMenuModule
    ],
    templateUrl: './user-dashboard.component.html',
    styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  items: MegaMenuItem[] = [];

  constructor(
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const message = sessionStorage.getItem('loginSuccessMessage');
    if (message) {
      setTimeout(() => {
        this.messageService.add({
          key: 'main',
          severity: 'success',
          summary: 'Erfolg',
          detail: message
        });
      }, 0);
      sessionStorage.removeItem('loginSuccessMessage');
    }

    // initialer Menüaufbau
    this.buildMenu();

    // Menü bei Navigation aktualisieren
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.buildMenu();
    });
  }

  private isRouteActive(prefixes: string[]): boolean {
    const currentUrl = this.router.url;
    return prefixes.some(prefix => new RegExp(`/${prefix}(/|$)`).test(currentUrl));
  }

  private buildMenu(): void {
    this.items = [
      {
        label: 'Cubes',
        icon: 'pi pi-fw pi-building',
        routerLink: 'studios',
        styleClass: this.isRouteActive(['studios', 'studio-details', 'map']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Buchungen',
        icon: 'pi pi-fw pi-folder-open',
        routerLink: 'bookings',
        styleClass: this.isRouteActive(['bookings', 'all-bookings', 'calendar', 'booking-details', 'booking-confirmation']) ? 'p-menuitem-link-active' : ''
      }
    ];
  }

  get avatarLabel(): string {
    const user = this.authService.getUser();
    const source = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'B';

    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
