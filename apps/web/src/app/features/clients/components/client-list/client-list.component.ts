import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';

@Component({
  standalone: true,
  selector: 'app-client-list',
  imports: [FormsModule, RouterLink, DatePipe, TableModule, ButtonModule, InputTextModule, TagModule, MessageModule],
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit {
  private readonly svc = inject(ClientsService);

  clients: Client[] = [];
  loading = true;
  error = '';
  search = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getAll(this.search || undefined).subscribe({
      next: (data) => { this.clients = data; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar clientes.'; this.loading = false; },
    });
  }

  onSearch() {
    this.load();
  }
}
