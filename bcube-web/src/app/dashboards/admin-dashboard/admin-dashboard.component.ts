import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MegaMenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth/auth.service';
import { MegaMenuModule } from 'primeng/megamenu';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-admin-dashboard',
    imports: [CommonModule, RouterModule, ToastModule, MegaMenuModule, ConfirmDialogModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  items: MegaMenuItem[] = [];

  constructor(
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
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

    this.buildMenu();

    // Rebuild on every navigation so the active-menu highlight (isRouteActive) tracks the current route.
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
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
        label: 'Users',
        icon: 'pi pi-fw pi-users',
        routerLink: 'users',
        styleClass: this.isRouteActive(['users']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Buchungen',
        icon: 'pi pi-fw pi-folder-open',
        routerLink: 'bookings',
        styleClass: this.isRouteActive(['bookings', 'booking-details', 'booking-confirmation']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Schlösser',
        icon: 'pi pi-fw pi-lock'
      },
      {
        label: 'Logout',
        icon: 'pi pi-fw pi-sign-out',
        styleClass: 'logout-item',
        command: () => {
          this.confirmationService.confirm({
            message: 'Sind Sie sicher, dass Sie sich abmelden möchten?',
            header: 'Abmeldung bestätigen',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ja',
            rejectLabel: 'Abbrechen',
            accept: () => {
              this.authService.logout();
            }
          });
        }
      }
    ];
  }
}
