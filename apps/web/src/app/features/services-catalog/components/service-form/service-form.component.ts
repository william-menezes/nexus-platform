import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { ServiceCatalog } from '@nexus-platform/shared-types';
import { ServicesCatalogService } from '../../services-catalog.service';

@Component({
  standalone: true,
  selector: 'app-service-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    TextareaModule, InputNumberModule, ToggleButtonModule, ButtonModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './service-form.component.html',
})
export class ServiceFormComponent implements OnInit {
  private svc = inject(ServicesCatalogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly isEditSignal = signal(false);
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Serviços', routerLink: '/app/servicos' },
      { label: this.isEditSignal() ? 'Editar Serviço' : 'Novo Serviço' },
    ];
  }

  isEdit = false;
  editId = '';
  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [null as string | null],
    defaultPrice: [0, Validators.required],
    estimatedHours: [null as number | null],
    isActive: [true],
  });

  ngOnInit() {
    this.editId = this.route.snapshot.params['id'];
    if (this.editId) {
      this.isEdit = true;
      this.isEditSignal.set(true);
      this.svc.getOne(this.editId).subscribe(s => this.form.patchValue(s as any));
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<ServiceCatalog>;
    const req = this.isEdit ? this.svc.update(this.editId, dto) : this.svc.create(dto);
    req.subscribe({
      next: () => this.router.navigate(['/app/servicos']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
