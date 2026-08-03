import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { environment } from '@environments/environment';
import { Studio } from '@models/studio.model';
import { StudioService } from './studio.service';

describe('StudioService', () => {
  let service: StudioService;
  let httpMock: HttpTestingController;

  const studio = (id: number): Studio => ({ id, name: `Studio ${id}` } as Studio);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    });

    service = TestBed.inject(StudioService);
    httpMock = TestBed.inject(HttpTestingController);

    // The constructor eagerly calls reloadStudios(); flush that initial request first.
    // The service builds this URL as a literal string with the query baked in, so the
    // request's `.url` includes it too - match by prefix rather than an exact string.
    const initialReq = httpMock.expectOne(r => r.url.startsWith(`${environment.studioApiUrl}/page`));
    initialReq.flush({ message: 'ok', data: { content: [], totalPages: 0, number: 0, last: true } });
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllStudios', () => {
    it('requests the full unpaginated studio list', () => {
      service.getAllStudios().subscribe(result => {
        expect(result).toEqual([studio(1), studio(2)]);
      });

      const req = httpMock.expectOne(environment.studioApiUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: [studio(1), studio(2)] });
    });
  });

  describe('getStudiosPagination', () => {
    it('requests the paged endpoint with page/size query params', () => {
      service.getStudiosPagination(2, 5).subscribe();

      const req = httpMock.expectOne(`${environment.studioApiUrl}/page?page=2&size=5`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: { content: [studio(1)], totalPages: 1, number: 2, last: true } });
    });
  });

  describe('getStudioById', () => {
    it('requests the studio by id', () => {
      service.getStudioById(4).subscribe(result => {
        expect(result).toEqual(studio(4));
      });

      const req = httpMock.expectOne(`${environment.studioApiUrl}/4`);
      req.flush({ message: 'ok', data: studio(4) });
    });
  });

  describe('reloadStudios / setStudios', () => {
    it('populates items() from the paginated response', () => {
      service.reloadStudios(0, 10);

      const req = httpMock.expectOne(`${environment.studioApiUrl}/page?page=0&size=10`);
      req.flush({ message: 'ok', data: { content: [studio(1)], totalPages: 1, number: 0, last: true } });

      expect(service.items()).toEqual([studio(1)]);
    });

    it('setStudios replaces the items signal directly', () => {
      service.setStudios([studio(9)]);
      expect(service.items()).toEqual([studio(9)]);
    });
  });

  describe('moveStudioToTop', () => {
    it('moves the matching studio to the front of the list', () => {
      service.setStudios([studio(1), studio(2), studio(3)]);

      service.moveStudioToTop(studio(3));

      expect(service.items().map(s => s.id)).toEqual([3, 1, 2]);
    });

    it('does nothing when the studio is not in the current list', () => {
      service.setStudios([studio(1), studio(2)]);

      service.moveStudioToTop(studio(99));

      expect(service.items().map(s => s.id)).toEqual([1, 2]);
    });
  });

  describe('create / update / delete', () => {
    it('posts a new studio to the admin endpoint', () => {
      const payload = { name: 'New Studio' } as any;
      service.create(payload).subscribe();

      const req = httpMock.expectOne(environment.adminStudioApiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(payload);
      req.flush({ message: 'ok', data: studio(1) });
    });

    it('puts an updated studio to the admin endpoint with its id in the path', () => {
      const payload = { id: 7, name: 'Updated' } as any;
      service.update(payload).subscribe();

      const req = httpMock.expectOne(`${environment.adminStudioApiUrl}/7`);
      expect(req.request.method).toBe('PUT');
      req.flush({ message: 'ok', data: studio(7) });
    });

    it('deletes a studio by id', () => {
      service.delete(3).subscribe();

      const req = httpMock.expectOne(`${environment.adminStudioApiUrl}/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'ok', data: 3 });
    });
  });
});
