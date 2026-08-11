import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { environment } from '@environments/environment';
import { User } from '@models/user.model';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const user = (id: number): User => ({ id, email: `user${id}@example.com`, role: 'USER' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), MessageService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('requests the admin listing with page/size query params', () => {
      service.getAll(1, 20).subscribe();

      const req = httpMock.expectOne(`${environment.adminApiUrl}?page=1&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: { content: [user(1)], totalPages: 1, number: 1, last: true } });
    });
  });

  describe('reloadUsers / setUsers', () => {
    it('populates items() from the default page', () => {
      service.reloadUsers();

      const req = httpMock.expectOne(`${environment.adminApiUrl}?page=0&size=10`);
      req.flush({ message: 'ok', data: { content: [user(1), user(2)], totalPages: 1, number: 0, last: true } });

      expect(service.items()).toEqual([user(1), user(2)]);
    });

    it('setUsers replaces the items signal directly', () => {
      service.setUsers([user(5)]);
      expect(service.items()).toEqual([user(5)]);
    });
  });

  describe('getUserFilter', () => {
    it('requests the filters endpoint with page/size params', () => {
      service.getUserFilter(0, 10).subscribe();

      const req = httpMock.expectOne(`${environment.adminApiUrl}/filters?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: { content: [], totalPages: 0, number: 0, last: true } });
    });
  });

  describe('getById', () => {
    it('requests a single user by id from the user endpoint', () => {
      service.getById(3).subscribe(result => {
        expect(result).toEqual(user(3));
      });

      const req = httpMock.expectOne(`${environment.userApiUrl}/3`);
      req.flush({ message: 'ok', data: user(3) });
    });
  });

  describe('updateUserAsAdmin', () => {
    it('puts to the admin endpoint with the user id in the path', () => {
      const payload = { id: 4, email: 'x@example.com', firstName: 'A', lastName: 'B', phone: '123', isAdmin: true };
      service.updateUserAsAdmin(payload).subscribe();

      const req = httpMock.expectOne(`${environment.adminApiUrl}/4`);
      expect(req.request.method).toBe('PUT');
      req.flush({ message: 'ok', data: user(4) });
    });
  });

  describe('updateUser', () => {
    it('puts to the self-service /me endpoint', () => {
      const payload = { id: 2, email: 'x@example.com', firstName: 'A', lastName: 'B', phone: '123', isAdmin: false };
      service.updateUser(payload).subscribe();

      const req = httpMock.expectOne(`${environment.userApiUrl}/me`);
      expect(req.request.method).toBe('PUT');
      req.flush({ message: 'ok', data: user(2) });
    });
  });

  describe('deleteUser', () => {
    it('deletes a user by id via the admin endpoint', () => {
      service.deleteUser(6).subscribe();

      const req = httpMock.expectOne(`${environment.adminApiUrl}/6`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'ok', data: 6 });
    });
  });
});
