import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import {
  Client,
  ClientHistoryItem,
  ClientSummary,
  ClientSaleItem,
  ClientEquipmentItem,
} from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

interface TimelineItem {
  id: string;
  code: string;
  type: 'os' | 'quote' | 'created';
  status: string | null;
  date: string;
}

@Component({
  standalone: true,
  selector: 'app-client-detail',
  imports: [DatePipe, RouterLink, ButtonModule, MessageModule, ConfirmDialogModule, TooltipModule],
  providers: [ConfirmationService],
  templateUrl: './client-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent implements OnInit {
  private readonly svc           = inject(ClientsService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  private readonly confirm       = inject(ConfirmationService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  // Regular class properties — updated via cdr.markForCheck() (OnPush)
  client: Client | null = null;
  loading = true;
  error = '';

  // Signals for reactive list/tab state
  readonly activeTab     = signal('historico');
  readonly serviceOrders = signal<ClientHistoryItem[]>([]);
  readonly quotes        = signal<ClientHistoryItem[]>([]);
  readonly summary       = signal<ClientSummary | null>(null);
  readonly sales         = signal<ClientSaleItem[]>([]);
  readonly equipments    = signal<ClientEquipmentItem[]>([]);

  readonly tabs = [
    { key: 'historico',    label: 'Histórico',         count: () => this.timelineItems.length },
    { key: 'os',           label: 'Ordens de Serviço', count: () => this.serviceOrders().length },
    { key: 'orcamentos',   label: 'Orçamentos',        count: () => this.quotes().length },
    { key: 'vendas',       label: 'Vendas',            count: () => this.sales().length },
    { key: 'equipamentos', label: 'Equipamentos',      count: () => this.equipments().length },
  ];

  get clientId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  get clientInitial(): string {
    return (this.client?.name ?? '').charAt(0).toUpperCase();
  }

  get timelineItems(): TimelineItem[] {
    const items: TimelineItem[] = [
      ...this.serviceOrders().map((o) => ({
        id: o.id, code: o.code, type: 'os' as const, status: o.status, date: o.createdAt,
      })),
      ...this.quotes().map((q) => ({
        id: q.id, code: q.code, type: 'quote' as const, status: null, date: q.createdAt,
      })),
    ];
    if (this.client) {
      items.push({ id: 'created', code: '', type: 'created', status: null, date: this.client.createdAt });
    }
    return [...items]
      .sort((a: TimelineItem, b: TimelineItem) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }

  ngOnInit() {
    forkJoin({
      client:     this.svc.getOne(this.clientId),
      history:    this.svc.getHistory(this.clientId),
      summary:    this.svc.getSummary(this.clientId),
      sales:      this.svc.getSales(this.clientId),
      equipments: this.svc.getEquipments(this.clientId),
    }).subscribe({
      next: ({ client, history, summary, sales, equipments }) => {
        this.client = client;
        this.serviceOrders.set(history.serviceOrders);
        this.quotes.set(history.quotes);
        this.summary.set(summary);
        this.sales.set(sales);
        this.equipments.set(equipments);
        this.loading = false;
        this.breadcrumbSvc.set([
          { label: 'Clientes', routerLink: '/app/clientes' },
          { label: client.name },
        ]);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Erro ao carregar cliente.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  saleStatusLabel(status: string): string {
    const map: Record<string, string> = { paid: 'Pago', cancelled: 'Cancelado', open: 'Em aberto' };
    return map[status] ?? status;
  }

  whatsAppLink(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/+55${digits}`;
  }

  delete() {
    this.confirm.confirm({
      message: 'Deseja remover este cliente? Esta ação não pode ser desfeita.',
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.svc.remove(this.clientId).subscribe({
          next:  () => this.router.navigate(['/app/clientes']),
          error: () => { this.error = 'Erro ao remover cliente.'; this.cdr.markForCheck(); },
        });
      },
    });
  }
}
