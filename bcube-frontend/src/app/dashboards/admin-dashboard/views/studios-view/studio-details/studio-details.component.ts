import { Component, OnInit } from '@angular/core';
import { studio } from '../../../../../models/studio';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../services/auth/auth.service';
import { StudioService } from '../../../../../services/studio.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-studio-details',
  standalone: true,
  imports: [ButtonModule, CommonModule],
  templateUrl: './studio-details.component.html',
  styleUrl: './studio-details.component.css'
})
export class StudioDetailsComponent {
  studio: studio | null = null;
  isUser = false;

  constructor(private route: ActivatedRoute, private studioService: StudioService, private authService: AuthService) {}

  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';

    const studioId = this.route.snapshot.paramMap.get('id');
    const queryData = this.route.snapshot.queryParamMap.get('company');
    if (queryData) {
      this.studio = JSON.parse(queryData);
    } else if (studioId) {
      this.studioService.getStudioById(+studioId).subscribe((data) => {
        this.studio = data;
      });
    }
  }
}
