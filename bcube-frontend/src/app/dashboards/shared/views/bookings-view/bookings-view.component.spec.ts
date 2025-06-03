import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingsViewComponent } from './bookings-view.component';

describe('BookingsViewComponent', () => {
  let component: BookingsViewComponent;
  let fixture: ComponentFixture<BookingsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsViewComponent]
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
