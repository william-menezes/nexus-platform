import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

@Component({
  standalone: true,
  selector: 'app-client-detail',
  imports: [DatePipe, RouterLink, ButtonModule, TagModule, MessageModule, ConfirmDialogModule, TooltipModule],
  providers: [ConfirmationService],
  templateUrl: './client-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent implements OnInit {
  private readonly svc          = inject(ClientsService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly confirm      = inject(ConfirmationService);
  private readonly cdr          = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  client: Client | null = null;
  loading = true;
  error = '';

  get clientId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit() {
    this.svc.getOne(this.clientId).subscribe({
      next: (c) => {
        this.client = c;
        this.loading = false;
        this.breadcrumbSvc.set([
          { label: 'Clientes', routerLink: '/app/clientes' },
          { label: c.name },
        ]);
        this.cdr.markForCheck();
      },
      error: () => { this.error = 'Erro ao carregar cliente.'; this.loading = false; this.cdr.markForCheck(); },
    });
  }

  delete() {
    this.confirm.confirm({
      message: 'Deseja remover este cliente?',
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.svc.remove(this.clientId).subscribe({
          next: () => this.router.navigate(['/app/clientes']),
          error: () => { this.error = 'Erro ao remover cliente.'; this.cdr.markForCheck(); },
        });
      },
    });
  }
}
