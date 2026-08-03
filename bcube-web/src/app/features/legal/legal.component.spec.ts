import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { LegalComponent } from './legal.component';

describe('LegalComponent', () => {
  let component: LegalComponent;
  let fixture: ComponentFixture<LegalComponent>;
  let router: jasmine.SpyObj<Router>;

  function setup(queryParams: Record<string, string> = {}): void {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [LegalComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } }
        }
      ]
    });

    fixture = TestBed.createComponent(LegalComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    history.replaceState({}, '');
  });

  it('should create', () => {
    setup();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('defaults to the impressum section when no query param is given', () => {
    setup();
    fixture.detectChanges();
    expect(component.activeSection).toBe('impressum');
  });

  it('activates the section given in the "section" query param', () => {
    setup({ section: 'agb' });
    fixture.detectChanges();
    expect(component.activeSection).toBe('agb');
  });

  it('ignores an unknown section value and keeps the default', () => {
    setup({ section: 'not-a-real-section' });
    fixture.detectChanges();
    expect(component.activeSection).toBe('impressum');
  });

  it('setSection switches the active section', () => {
    setup();
    fixture.detectChanges();

    component.setSection('datenschutz');
    expect(component.activeSection).toBe('datenschutz');
  });

  it('goBack navigates to /login when no returnUrl was passed via router state', () => {
    setup();
    fixture.detectChanges();

    component.goBack();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('goBack navigates to the returnUrl from router state when one was passed', () => {
    history.replaceState({ returnUrl: '/user-dashboard/studios' }, '');
    setup();
    fixture.detectChanges();

    component.goBack();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/user-dashboard/studios');
  });
});
