import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PickedImage } from '@shared/util/image-file.util';
import { StudioImagePickerComponent } from './studio-image-picker.component';

describe('StudioImagePickerComponent', () => {
  let component: StudioImagePickerComponent;
  let fixture: ComponentFixture<StudioImagePickerComponent>;

  const picked = (preview: string): PickedImage => ({ preview });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioImagePickerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioImagePickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onFilesPicked', () => {
    it('reads the picked files and emits them appended to the existing images', (done) => {
      component.images = [picked('data:image/png;base64,existing')];

      const file = new File(['pixel-data'], 'new.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file] });

      component.imagesChange.subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual(picked('data:image/png;base64,existing'));
        expect(result[1].file).toBe(file);
        expect(result[1].preview).toContain('data:');
        done();
      });

      component.onFilesPicked({ target: input } as unknown as Event);
    });

    it('clears the input value so the same file can be re-picked', () => {
      const file = new File(['pixel-data'], 'new.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file] });

      component.onFilesPicked({ target: input } as unknown as Event);

      expect(input.value).toBe('');
    });

    it('does nothing when no files were selected', () => {
      const emitSpy = spyOn(component.imagesChange, 'emit');
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [] });

      component.onFilesPicked({ target: input } as unknown as Event);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeImage', () => {
    it('emits the images list with the given index removed', () => {
      component.images = [picked('a'), picked('b'), picked('c')];
      const emitSpy = spyOn(component.imagesChange, 'emit');

      component.removeImage(1);

      expect(emitSpy).toHaveBeenCalledWith([picked('a'), picked('c')]);
    });

    it('removing the first image promotes the second to the new title image', () => {
      component.images = [picked('title'), picked('second')];
      let emitted: PickedImage[] = [];
      component.imagesChange.subscribe(result => (emitted = result));

      component.removeImage(0);

      expect(emitted[0]).toEqual(picked('second'));
    });
  });

  describe('onDrop', () => {
    it('reorders the images according to the drag indices and emits the result', () => {
      component.images = [picked('a'), picked('b'), picked('c')];
      const emitSpy = spyOn(component.imagesChange, 'emit');

      component.onDrop({ previousIndex: 2, currentIndex: 0 } as any);

      expect(emitSpy).toHaveBeenCalledWith([picked('c'), picked('a'), picked('b')]);
    });
  });

  describe('moveImage', () => {
    it('moves an image one position to the right', () => {
      component.images = [picked('a'), picked('b'), picked('c')];
      const emitSpy = spyOn(component.imagesChange, 'emit');

      component.moveImage(0, 1);

      expect(emitSpy).toHaveBeenCalledWith([picked('b'), picked('a'), picked('c')]);
    });

    it('moves an image one position to the left, promoting it to title image', () => {
      component.images = [picked('a'), picked('b'), picked('c')];
      const emitSpy = spyOn(component.imagesChange, 'emit');

      component.moveImage(1, -1);

      expect(emitSpy).toHaveBeenCalledWith([picked('b'), picked('a'), picked('c')]);
    });

    it('does nothing when moving the first image further left', () => {
      component.images = [picked('a'), picked('b')];
      const emitSpy = spyOn(component.imagesChange, 'emit');

      component.moveImage(0, -1);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('does nothing when moving the last image further right', () => {
      component.images = [picked('a'), picked('b')];
      const emitSpy = spyOn(component.imagesChange, 'emit');

      component.moveImage(1, 1);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('triggerFilePicker', () => {
    it('clicks the hidden file input', () => {
      fixture.detectChanges();
      const fileInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
      const clickSpy = spyOn(fileInput, 'click');

      component.triggerFilePicker();

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
