import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminService, AdminCoupon } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-coupon-list',
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './coupon-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouponListComponent implements OnInit {
  private readonly svc          = inject(AdminService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);
  private readonly confirm      = inject(ConfirmationService);
  private readonly msg          = inject(MessageService);

  readonly coupons            = signal<AdminCoupon[]>([]);
  readonly loading            = signal(false);
  readonly tablePage          = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Cupons' }]);
  }

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.svc.getCoupons().subscribe({
      next:  data => { this.coupons.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update(current => updateTablePageState(current, event));
  }

  couponStatus(coupon: AdminCoupon): { label: string; severity: string } {
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return { label: 'Esgotado', severity: 'danger' };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { label: 'Expirado', severity: 'secondary' };
    }
    if (!coupon.is_active) {
      return { label: 'Inativo', severity: 'secondary' };
    }
    return { label: 'Ativo', severity: 'success' };
  }

  usesLabel(coupon: AdminCoupon): string {
    const max = coupon.max_uses === null || coupon.max_uses === 0 ? 'ilimitado' : String(coupon.max_uses);
    return `${coupon.uses_count} / ${max}`;
  }

  typeLabel(type: string): string {
    return type === 'percentage' ? 'Percentual' : 'Fixo';
  }

  valueLabel(coupon: AdminCoupon): string {
    return coupon.type === 'percentage'
      ? `${coupon.value}%`
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.value);
  }

  confirmDelete(coupon: AdminCoupon) {
    this.confirm.confirm({
      message: `Deseja excluir o cupom "${coupon.code}"?`,
      header: 'Excluir Cupom',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.deleteCoupon(coupon.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Cupom excluído' });
            this.coupons.update(list => list.filter(c => c.id !== coupon.id));
          },
          error: err => this.msg.add({ severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message }),
        });
      },
    });
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.coupons().length, this.tablePage()),
      this.coupons().length
    );
  }
}
