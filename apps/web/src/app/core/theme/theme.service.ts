import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly isDark = signal(false);

  constructor() {
    const saved = this.doc.defaultView?.localStorage.getItem('nx-theme');
    if (saved === 'dark') this._apply(true);
  }

  toggle() { this._apply(!this.isDark()); }

  private _apply(dark: boolean) {
    this.isDark.set(dark);
    this.doc.documentElement.classList.toggle('dark', dark);
    this.doc.defaultView?.localStorage.setItem('nx-theme', dark ? 'dark' : 'light');
  }
}
