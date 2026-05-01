import { Injectable, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _items = signal<MenuItem[]>([]);
  private readonly _home  = signal<MenuItem>({ icon: 'pi pi-home', routerLink: '/app/dashboard' });

  readonly items = this._items.asReadonly();
  readonly home  = this._home.asReadonly();

  set(items: MenuItem[], home?: MenuItem): void {
    this._items.set(items);
    if (home) this._home.set(home);
  }
}
