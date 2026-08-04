import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StripeCardComponent } from './stripe-card.component';

describe('StripeCardComponent', () => {
  let component: StripeCardComponent;
  let fixture: ComponentFixture<StripeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StripeCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StripeCardComponent);
    component = fixture.componentInstance;
    component.clientSecret = 'pi_test_secret';
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('does not attempt to confirm payment while a previous confirmation is still in flight', async () => {
    component.submitting = true;
    await component.confirmPayment();
    expect(component.submitting).toBeTrue();
  });
});
