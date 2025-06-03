import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { StudioService } from '../../../../services/studio.service';
import { studio } from '../../../../models/studio';
import { Observable } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { UpdateStudioComponent } from './update-studio/update-studio.component';
import { DeleteStudioComponent } from './delete-studio/delete-studio.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { StudiosComponent } from '../../../shared/components/studios/studios.component';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-studios-view',
  standalone: true,
  imports: [StudiosComponent, CommonModule, LoadingSpinnerComponent, TableModule, ButtonModule, UpdateStudioComponent, DeleteStudioComponent],
  templateUrl: './studios-view.component.html',
  styleUrl: './studios-view.component.css'
})
export class StudiosViewComponent implements OnInit {
  studios$!: Observable<studio[]>;
  loading$ = this.studioService.loading$;
  isAdmin = false;

  ngOnInit(): void {
    this.studios$ = this.studioService.studios$;
    this.studioService.reloadStudios()
    this.isAdmin = this.authService.getRole() === "ADMIN" 
  }

  constructor(private studioService: StudioService, private router: Router, private route: ActivatedRoute, private authService: AuthService) {}

  navigateToDetails(studio: studio): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'studio-details', studio.id];
    this.router.navigate(navigationUrl, {
      queryParams: { company: JSON.stringify(studio) }
    });
  }
}
