import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';

@Component({
  standalone: true,
  selector: 'app-quote-list',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, TagModule,
    ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Orçamentos</h1>
        <a routerLink="novo" pButton label="Novo Orçamento" icon="pi pi-plus" class="p-button-sm"></a>
      </div>
      <p-table [value]="quotes()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Total</th>
            <th>Enviado</th>
            <th>Aprovado</th>
            <th>Convertido em OS</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-q>
          <tr>
            <td>
              <a [routerLink]="[q.id]" class="text-blue-600 hover:underline font-mono">{{ q.code }}</a>
            </td>
            <td>{{ q.total | currency:'BRL' }}</td>
            <td>
              @if (q.sentAt) {
                <p-tag severity="info" value="Enviado" />
              } @else {
                <span class="text-gray-400">—</span>
              }
            </td>
            <td>
              @if (q.approvedAt) {
                <p-tag severity="success" value="Aprovado" />
              } @else if (q.rejectedAt) {
                <p-tag severity="danger" value="Rejeitado" />
              } @else {
                <span class="text-gray-400">Pendente</span>
              }
            </td>
            <td>
              @if (q.convertedToOsId) {
                <p-tag severity="success" value="Sim" />
              } @else {
                <span class="text-gray-400">Não</span>
              }
            </td>
            <td>{{ q.createdAt | date:'dd/MM/yyyy' }}</td>
            <td>
              <a [routerLink]="[q.id]" pButton icon="pi pi-eye" class="p-button-sm p-button-text mr-1"></a>
              <a [routerLink]="[q.id, 'editar']" pButton icon="pi pi-pencil" class="p-button-sm p-button-text mr-1"></a>
              <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(q)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" class="text-center py-8 text-gray-400">Nenhum orçamento encontrado</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class QuoteListComponent implements OnInit {
  private svc = inject(QuotesService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

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
