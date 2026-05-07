import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';

@Component({
  standalone: true,
  selector: 'app-quote-detail',
  imports: [
    CommonModule, RouterLink, ButtonModule, TagModule, TableModule, ToastModule, ConfirmDialogModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './quote-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailComponent implements OnInit {
  private svc            = inject(QuotesService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private msg            = inject(MessageService);
  private confirm        = inject(ConfirmationService);
  private breadcrumbSvc  = inject(BreadcrumbService);

  quote = signal<Quote | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.svc.getOne(id).subscribe(q => {
      this.quote.set(q);
      this.breadcrumbSvc.set([
        { label: 'Orçamentos', routerLink: '/app/orcamentos' },
        { label: q.code ?? q.id },
      ]);
    });
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
