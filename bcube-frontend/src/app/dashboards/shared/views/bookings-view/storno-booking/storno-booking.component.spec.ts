import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StornoBookingComponent } from './storno-booking.component';

describe('StornoBookingComponent', () => {
  let component: StornoBookingComponent;
  let fixture: ComponentFixture<StornoBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StornoBookingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StornoBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
