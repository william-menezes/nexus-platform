import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';

@Component({
  standalone: true,
  selector: 'app-quote-detail',
  imports: [
    CommonModule, RouterLink, ButtonModule, TagModule, TableModule, ToastModule, ConfirmDialogModule,
    BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './quote-detail.component.html',
})
export class QuoteDetailComponent implements OnInit {
  private svc = inject(QuotesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  quote = signal<Quote | null>(null);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Orçamentos', routerLink: '/app/orcamentos' },
      { label: this.quote()?.code ?? '...' },
    ];
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.svc.getOne(id).subscribe(q => this.quote.set(q));
  }

  send(q: Quote) {
    this.svc.send(q.id).subscribe({
      next: updated => { this.quote.set(updated); this.msg.add({ severity: 'success', summary: 'Orçamento enviado' }); },
      error: () => this.msg.add({ severity: 'error', summary: 'Erro ao enviar' }),
    });
  }

  approve(q: Quote) {
    this.confirm.confirm({
      message: 'Aprovar este orçamento?',
      accept: () => this.svc.approve(q.id).subscribe({
        next: updated => { this.quote.set(updated); this.msg.add({ severity: 'success', summary: 'Aprovado' }); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao aprovar' }),
      }),
    });
  }

  reject(q: Quote) {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    this.svc.reject(q.id, reason).subscribe({
      next: updated => { this.quote.set(updated); this.msg.add({ severity: 'info', summary: 'Rejeitado' }); },
      error: () => this.msg.add({ severity: 'error', summary: 'Erro ao rejeitar' }),
    });
  }

  convertToOs(q: Quote) {
    this.confirm.confirm({
      message: 'Converter este orçamento em Ordem de Serviço?',
      accept: () => this.svc.convertToOs(q.id).subscribe({
        next: updated => {
          this.quote.set(updated);
          this.msg.add({ severity: 'success', summary: 'OS criada com sucesso' });
        },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao converter' }),
      }),
    });
  }
}
