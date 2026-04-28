import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { SettingsService, Permission } from '../../settings.service';

interface PermissionRow {
  module: string;
  moduleLabel: string;
  actions: string[];
  allActions: string[];
  roleActions: Record<string, string[]>;
}

const MODULE_LABELS: Record<string, string> = {
  clients: 'Clientes',
  quotes: 'Orçamentos',
  service_orders: 'Ordens de Serviço',
  equipments: 'Equipamentos',
  sales: 'Vendas',
  returns: 'Devoluções',
  cash_register: 'Caixa',
  products: 'Produtos',
  services_catalog: 'Catálogo de Serviços',
  inventory: 'Estoque',
  purchase_orders: 'Compras',
  financial: 'Financeiro',
  contracts: 'Contratos',
  reports: 'Relatórios',
  settings: 'Configurações',
  employees: 'Funcionários',
  audit_logs: 'Logs de Auditoria',
};

const ROLES = ['TENANT_ADMIN', 'TECNICO', 'VENDEDOR'];

@Component({
  standalone: true,
  selector: 'app-permissions',
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    CheckboxModule, CardModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './permissions.component.html',
})
export class PermissionsComponent implements OnInit {
  private readonly svc = inject(SettingsService);
  private readonly msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Configurações', routerLink: '/app/configuracoes' },
    { label: 'Permissões' },
  ];

  readonly rows = signal<PermissionRow[]>([]);
  readonly saving = signal(false);
  readonly roles = ROLES;

  private permissionsMap: Map<string, Set<string>> = new Map();

  ngOnInit() { this.load(); }

  load() {
    this.svc.getPermissions().subscribe(perms => {
      this.permissionsMap.clear();
      perms.forEach(p => {
        this.permissionsMap.set(`${p.role}:${p.module}`, new Set(p.actions));
      });
      this.buildRows(perms);
    });
  }

  buildRows(perms: Permission[]) {
    const moduleActions: Record<string, Set<string>> = {};
    perms.forEach(p => {
      if (!moduleActions[p.module]) moduleActions[p.module] = new Set();
      p.actions.forEach(a => moduleActions[p.module].add(a));
    });

    Object.keys(MODULE_LABELS).forEach(m => {
      if (!moduleActions[m]) moduleActions[m] = new Set(['create', 'read', 'update', 'delete']);
    });

    this.rows.set(
      Object.entries(moduleActions).map(([module, actionsSet]) => ({
        module,
        moduleLabel: MODULE_LABELS[module] ?? module,
        actions: [],
        allActions: Array.from(actionsSet).sort(),
        roleActions: Object.fromEntries(
          ROLES.map(role => [role, Array.from(this.permissionsMap.get(`${role}:${module}`) ?? new Set())])
        ),
      }))
    );
  }

  hasPermission(row: PermissionRow, role: string, action: string): boolean {
    return row.roleActions[role]?.includes(action) ?? false;
  }

  togglePermission(row: PermissionRow, role: string, action: string, checked: boolean) {
    const current = new Set(row.roleActions[role] ?? []);
    if (checked) current.add(action); else current.delete(action);
    row.roleActions[role] = Array.from(current);
    this.rows.update(r => [...r]);
  }

  save() {
    this.saving.set(true);
    const permissions = this.rows().flatMap(row =>
      ROLES.map(role => ({
        role,
        module: row.module,
        actions: row.roleActions[role] ?? [],
      }))
    );

    this.svc.updatePermissions(permissions).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Permissões salvas' });
        this.saving.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar' });
        this.saving.set(false);
      },
    });
  }
}
