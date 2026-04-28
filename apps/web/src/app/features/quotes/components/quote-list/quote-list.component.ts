import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';

@Component({
  standalone: true,
  selector: 'app-quote-list',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, TagModule,
    ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './quote-list.component.html',
})
export class QuoteListComponent implements OnInit {
  private svc = inject(QuotesService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Orçamentos', routerLink: '/app/orcamentos' }];

  quotes = signal<Quote[]>([]);
  loading = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: data => { this.quotes.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirmDelete(q: Quote) {
    this.confirm.confirm({
      message: `Remover orçamento "${q.code}"?`,
      accept: () => this.svc.remove(q.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
