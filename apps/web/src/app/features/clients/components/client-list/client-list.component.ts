import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';

@Component({
  standalone: true,
  selector: 'app-client-list',
  imports: [FormsModule, RouterLink, DatePipe, BreadcrumbModule, ButtonModule],
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit {
  private readonly svc = inject(ClientsService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Clientes', routerLink: '/app/clientes' }];

  clients = signal<Client[]>([]);
  loading = signal(false);
  error   = signal('');
  search  = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getAll(this.search || undefined).subscribe({
      next: (data) => { this.clients.set(data); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar clientes.'); this.loading.set(false); },
    });
  }

  onSearch() { this.load(); }
}
