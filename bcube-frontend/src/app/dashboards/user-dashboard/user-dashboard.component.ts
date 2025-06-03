import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MegaMenuItem } from "primeng/api";
import { AuthService } from '../../services/auth/auth.service';
import { MegaMenuModule } from 'primeng/megamenu';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, ToastModule, ConfirmDialogModule, RouterModule, MegaMenuModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  items: MegaMenuItem[] | undefined;

  constructor(private messageService: MessageService, private authService: AuthService, private confirmationService: ConfirmationService) {}

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

    this.items = [
      {
        label: 'Studios',
        icon: 'pi pi-fw pi-building',
        routerLink: 'studios'
      },
      {
        label: 'Karte',
        icon: 'pi pi-fw pi-map',
        routerLink: 'map'
      },
      {
        label: 'Buchungen',
        icon: 'pi pi-fw pi-folder-open',
        routerLink: 'bookings'
      },
      {
        label: 'Kalendar',
        icon: 'pi pi-fw pi-calendar',
        routerLink: 'calendar'
      },
      {
        label: 'Logout',
        icon: 'pi pi-fw pi-sign-out',
        // routerLink: ['..', '..'],
        command: () => {
          this.confirmationService.confirm({
            message: 'Sind Sie sicher, dass Sie sich abmelden möchten?',
            header: 'Abmeldung bestätigen',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ja',
            rejectLabel: 'Nein',
            accept: () => {
              this.authService.logout();
            }
          });
        }
      }
    ];
  }
}