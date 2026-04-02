import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';

@Component({
  standalone: true,
  selector: 'app-quote-detail',
  imports: [
    CommonModule, RouterLink, ButtonModule, TagModule, TableModule, ToastModule, ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page" *ngIf="quote() as q">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/orcamentos" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold font-mono">{{ q.code }}</h1>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total</p>
          <p class="text-xl font-bold">{{ q.total | currency:'BRL' }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Subtotal</p>
          <p class="text-lg">{{ q.subtotal | currency:'BRL' }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Desconto</p>
          <p class="text-lg">{{ q.discountAmount | currency:'BRL' }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Válido até</p>
          <p class="text-lg">{{ q.validUntil ? (q.validUntil | date:'dd/MM/yyyy') : '—' }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        @if (!q.sentAt) {
          <button pButton label="Enviar" icon="pi pi-send" class="p-button-sm p-button-info" (click)="send(q)"></button>
        }
        @if (!q.approvedAt && !q.rejectedAt) {
          <button pButton label="Aprovar" icon="pi pi-check" class="p-button-sm p-button-success" (click)="approve(q)"></button>
          <button pButton label="Rejeitar" icon="pi pi-times" class="p-button-sm p-button-danger" (click)="reject(q)"></button>
        }
        @if (q.approvedAt && !q.convertedToOsId) {
          <button pButton label="Converter em OS" icon="pi pi-wrench" class="p-button-sm" (click)="convertToOs(q)"></button>
        }
        <a [routerLink]="['/app/orcamentos', q.id, 'editar']" pButton label="Editar" icon="pi pi-pencil" class="p-button-sm p-button-secondary"></a>
      </div>

      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <h2 class="text-lg font-semibold mb-3">Itens</h2>
        <p-table [value]="q.items || []">
          <ng-template pTemplate="header">
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Preço Unit.</th>
              <th>Desconto</th>
              <th>Total</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.description }}</td>
              <td><p-tag [value]="item.itemType === 'product' ? 'Produto' : 'Serviço'" /></td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | currency:'BRL' }}</td>
              <td>{{ item.discount | currency:'BRL' }}</td>
              <td>{{ item.totalPrice | currency:'BRL' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6" class="text-center py-4 text-gray-400">Sem itens</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class QuoteDetailComponent implements OnInit {
  private svc = inject(QuotesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  quote = signal<Quote | null>(null);

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
