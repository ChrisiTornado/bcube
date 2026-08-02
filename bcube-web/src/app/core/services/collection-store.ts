import { Signal, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

/**
 * Base for services that hold a loading flag plus a mutable in-memory collection.
 * Backed by Signals; also exposes `loading$`/`items$` Observable mirrors so existing
 * `| async` template bindings keep working unchanged.
 */
export abstract class CollectionStore<T> {
  private readonly loadingSignal = signal(false);
  private readonly itemsSignal = signal<T[]>([]);

  readonly loading: Signal<boolean> = this.loadingSignal.asReadonly();
  readonly items: Signal<T[]> = this.itemsSignal.asReadonly();

  readonly loading$: Observable<boolean> = toObservable(this.loadingSignal);
  readonly items$: Observable<T[]> = toObservable(this.itemsSignal);

  protected setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  protected setItems(items: T[]): void {
    this.itemsSignal.set(items);
  }

  protected get currentItems(): T[] {
    return this.itemsSignal();
  }
}
