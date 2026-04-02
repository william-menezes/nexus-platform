import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Supplier } from '@nexus-platform/shared-types';
import { SuppliersService } from '../../suppliers.service';

@Component({
  standalone: true,
  selector: 'app-supplier-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    InputTextModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Fornecedores</h1>
        <a routerLink="novo" pButton label="Novo Fornecedor" icon="pi pi-plus" class="p-button-sm"></a>
      </div>
      <div class="mb-3">
        <input pInputText [(ngModel)]="search" (input)="load()"
          placeholder="Buscar por nome..." class="w-full md:w-1/3" />
      </div>
      <p-table [value]="suppliers()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>CNPJ</th>
            <th>Contato</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-s>
          <tr>
            <td>{{ s.name }}</td>
            <td>{{ s.cnpj || '—' }}</td>
            <td>{{ s.contact || '—' }}</td>
            <td>{{ s.phone || '—' }}</td>
            <td>{{ s.email || '—' }}</td>
            <td>
              <a [routerLink]="[s.id, 'editar']" pButton icon="pi pi-pencil"
                class="p-button-sm p-button-text mr-1"></a>
              <button pButton icon="pi pi-trash"
                class="p-button-sm p-button-text p-button-danger"
                (click)="confirmDelete(s)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center text-gray-500 py-8">
              Nenhum fornecedor encontrado.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class SupplierListComponent implements OnInit {
  private readonly svc = inject(SuppliersService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(false);
  search = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.search || undefined).subscribe({
      next: data => { this.suppliers.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  confirmDelete(s: Supplier) {
    this.confirm.confirm({
      message: `Excluir fornecedor "${s.name}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(s.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: s.name });
            this.load();
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
