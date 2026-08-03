import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PickedImage, filesToPickedImages } from '@shared/util/image-file.util';

/**
 * Studio image picker: choosing a file adds it immediately (no separate "upload" step),
 * images can be removed individually, and their order can be changed via drag-and-drop -
 * the first image is always the title image used elsewhere in the app.
 */
@Component({
    selector: 'app-studio-image-picker',
    imports: [DragDropModule],
    templateUrl: './studio-image-picker.component.html',
    styleUrl: './studio-image-picker.component.css'
})
export class StudioImagePickerComponent {
  @Input() images: PickedImage[] = [];
  @Output() imagesChange = new EventEmitter<PickedImage[]>();

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  triggerFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (!files.length) {
      return;
    }

    filesToPickedImages(files).then(picked => {
      this.imagesChange.emit([...this.images, ...picked]);
    });
  }

  removeImage(index: number): void {
    const next = this.images.slice();
    next.splice(index, 1);
    this.imagesChange.emit(next);
  }

  onDrop(event: CdkDragDrop<PickedImage[]>): void {
    const next = this.images.slice();
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.imagesChange.emit(next);
  }

  /** Keyboard-operable equivalent of dragging an image left/right, for users who can't use drag-and-drop. */
  moveImage(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.images.length) {
      return;
    }

    const next = this.images.slice();
    moveItemInArray(next, index, targetIndex);
    this.imagesChange.emit(next);
  }
}
