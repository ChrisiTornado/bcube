/** A single picked image: newly chosen files carry `file`, pre-existing (already
 *  saved) images only carry their `preview` data URL. */
export interface PickedImage {
  preview: string;
  file?: File;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function filesToPickedImages(files: File[]): Promise<PickedImage[]> {
  return Promise.all(files.map(file => readFileAsDataUrl(file).then(preview => ({ file, preview }))));
}

function readFileAsByteArray(file: File): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function dataUrlToByteArray(dataUrl: string): number[] {
  const base64 = dataUrl.split(',')[1] ?? dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return Array.from(bytes);
}

/** Converts picked images to byte arrays for the create/update studio payload,
 *  preserving the current order (the first entry becomes the title image). */
export function pickedImagesToByteArrays(images: PickedImage[]): Promise<number[][]> {
  return Promise.all(
    images.map(image => (image.file ? readFileAsByteArray(image.file) : Promise.resolve(dataUrlToByteArray(image.preview))))
  );
}
