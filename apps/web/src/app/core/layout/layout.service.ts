import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly doc = inject(DOCUMENT);

  private get windowWidth() { return this.doc.defaultView?.innerWidth ?? 0; }

  isMobile() { return this.windowWidth < 1024; }

  // Start open on desktop (≥ 1024px), closed on mobile
  readonly sidebarVisible = signal(this.windowWidth >= 1024);

  toggleSidebar() { this.sidebarVisible.update(v => !v); }
  openSidebar()   { this.sidebarVisible.set(true); }
  closeSidebar()  { this.sidebarVisible.set(false); }

  /** Fecha apenas em viewport mobile */
  closeSidebarOnMobile() { if (this.isMobile()) this.closeSidebar(); }
}
