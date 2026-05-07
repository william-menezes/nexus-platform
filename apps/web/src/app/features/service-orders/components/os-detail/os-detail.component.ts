import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { ServiceOrder } from '@nexus-platform/shared-types';
import { ServiceOrdersService } from '../../service-orders.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PageHeaderPill } from '../../../../shared/models/page-header.types';

const STATUS_FLOW: Record<string, string> = {
  open:            'in_progress',
  in_progress:     'awaiting_parts',
  awaiting_parts:  'done',
};

@Component({
  standalone: true,
  selector: 'app-os-detail',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, TagModule, ButtonModule, CardModule, SkeletonModule, ConfirmDialogModule, ToastModule, MessageModule, PageHeaderComponent],
  providers: [ConfirmationService, MessageService],
  templateUrl: './os-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsDetailComponent implements OnInit {
  private readonly svc           = inject(ServiceOrdersService);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly confirm       = inject(ConfirmationService);
  private readonly toast         = inject(MessageService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  os: ServiceOrder | null = null;
  loading = true;
  error = '';

  readonly statusLabel: Record<string, string> = {
    open:            'Aberta',
    in_progress:     'Em andamento',
    awaiting_parts:  'Aguardando peças',
    done:            'Concluída',
    cancelled:       'Cancelada',
  };

  readonly statusSeverity: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    open:            'info',
    in_progress:     'warn',
    awaiting_parts:  'warn',
    done:            'success',
    cancelled:       'danger',
  };

  readonly nextStatusLabel: Record<string, string> = {
    in_progress:    'Em andamento',
    awaiting_parts: 'Aguardando peças',
    done:           'Concluída',
  };

  get nextStatus() {
    return this.os ? STATUS_FLOW[this.os.status] : null;
  }

  osPills(): PageHeaderPill[] {
    if (!this.os) return [];
    const statusColorMap: Record<string, PageHeaderPill['color']> = {
      open:           'blue',
      in_progress:    'violet',
      awaiting_parts: 'amber',
      done:           'green',
      cancelled:      'red',
    };
    return [{
      label: this.statusLabel[this.os.status] ?? this.os.status,
      color: statusColorMap[this.os.status] ?? 'gray',
    }];
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getOne(id).subscribe({
      next: (data) => {
        this.os = data;
        this.loading = false;
        this.breadcrumbSvc.set([
          { label: 'Ordens de Serviço', routerLink: '/app/os' },
          { label: data.code ?? data.id },
        ]);
        this.cdr.markForCheck();
      },
      error: () => { this.error = 'OS não encontrada.'; this.loading = false; this.cdr.markForCheck(); },
    });
  }

  advance() {
    if (!this.os || !this.nextStatus) return;
    this.svc.update(this.os.id, { status: this.nextStatus as never }).subscribe({
      next: (updated) => {
        this.os = updated;
        this.toast.add({ severity: 'success', summary: 'Status atualizado', life: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  cancelOs() {
    if (!this.os) return;
    this.confirm.confirm({
      message: 'Deseja cancelar esta OS?',
      header: 'Confirmar cancelamento',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cancelar',
      rejectLabel: 'Não',
      accept: () => {
        this.svc.update(this.os!.id, { status: 'cancelled' as never }).subscribe({
          next: () => { void this.router.navigate(['/app/os']); },
        });
      },
    });
  }
}
