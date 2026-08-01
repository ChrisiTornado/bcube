import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EnterCodeComponent } from './enter-code.component';

describe('EnterCodeComponent', () => {
  let component: EnterCodeComponent;
  let fixture: ComponentFixture<EnterCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterCodeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService, ConfirmationService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EnterCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
