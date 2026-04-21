import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterModule } from '@angular/router';

type LegalSection = 'impressum' | 'datenschutz' | 'agb';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css'
})
export class LegalComponent implements OnInit {
  activeSection: LegalSection = 'impressum';
  private returnUrl: string = '/login';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const section = this.route.snapshot.queryParamMap.get('section');
    if (section === 'impressum' || section === 'datenschutz' || section === 'agb') {
      this.activeSection = section;
    }

    const stateReturnUrl = history.state?.returnUrl;
    if (typeof stateReturnUrl === 'string' && stateReturnUrl.trim()) {
      this.returnUrl = stateReturnUrl;
    }
  }

  setSection(section: LegalSection): void {
    this.activeSection = section;
  }

  goBack(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}
