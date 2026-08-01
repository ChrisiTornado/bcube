import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { BookingsViewComponent } from './bookings-view.component';

describe('BookingsViewComponent', () => {
  let component: BookingsViewComponent;
  let fixture: ComponentFixture<BookingsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsViewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService, ConfirmationService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
