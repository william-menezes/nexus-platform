import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { ServiceCatalog, ItemCategory } from '@nexus-platform/shared-types';
import { ServicesCatalogService } from '../../services-catalog.service';
import { SettingsService } from '../../../settings/settings.service';

@Component({
  standalone: true,
  selector: 'app-service-form',
  imports: [
    RouterLink, ReactiveFormsModule,
    InputTextModule, TextareaModule, InputNumberModule,
    AutoCompleteModule, ToggleButtonModule, ButtonModule, CardModule,
    DialogModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './service-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFormComponent implements OnInit {
  private readonly svc          = inject(ServicesCatalogService);
  private readonly settingsSvc  = inject(SettingsService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly msg          = inject(MessageService);
  private readonly fb           = inject(FormBuilder);
  private readonly destroyRef   = inject(DestroyRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  private editId = '';

  // Category autocomplete
  readonly allCategories      = signal<ItemCategory[]>([]);
  readonly filteredCategories = signal<ItemCategory[]>([]);
  lastCategoryQuery = '';

  // Quick-add dialog
  readonly quickAddVisible = signal(false);
  readonly quickAddSaving  = signal(false);
  readonly quickAddName    = this.fb.control('', Validators.required);

  readonly form = this.fb.group({
    name:           ['', Validators.required],
    description:    [null as string | null],
    defaultPrice:   [0, Validators.required],
    estimatedHours: [null as number | null],
    isActive:       [true],
    category:       [null as ItemCategory | null],
  });

  ngOnInit() {
    this.editId = this.route.snapshot.params['id'] ?? '';
    this.isEdit.set(!!this.editId);

    this.breadcrumbSvc.set([
      { label: 'Serviços', routerLink: '/app/servicos' },
      { label: this.isEdit() ? 'Editar Serviço' : 'Novo Serviço' },
    ]);

    this.settingsSvc.getCategories('service')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => this.allCategories.set(cats));

    if (this.editId) {
      this.svc.getOne(this.editId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(s => {
          this.form.patchValue({
            ...s,
            category: s.category ?? null,
          } as any);
        });
    }
  }

  searchCategory(event: { query: string }) {
    this.lastCategoryQuery = event.query;
    const q = event.query.toLowerCase();
    this.filteredCategories.set(
      q ? this.allCategories().filter(c => c.name.toLowerCase().includes(q))
        : this.allCategories(),
    );
  }

  openQuickAdd() {
    this.quickAddName.reset(this.lastCategoryQuery);
    this.quickAddVisible.set(true);
  }

  saveQuickAdd() {
    if (this.quickAddName.invalid) return;
    this.quickAddSaving.set(true);
    this.settingsSvc.createCategory({ name: this.quickAddName.value!, itemType: 'service' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cat => {
          this.allCategories.update(l => [...l, cat]);
          this.form.get('category')!.setValue(cat);
          this.quickAddVisible.set(false);
          this.quickAddSaving.set(false);
        },
        error: () => {
          this.quickAddSaving.set(false);
          this.msg.add({ severity: 'error', summary: 'Erro ao criar categoria' });
        },
      });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto: Partial<ServiceCatalog> = {
      name:           raw.name ?? '',
      defaultPrice:   raw.defaultPrice ?? 0,
      isActive:       raw.isActive ?? true,
      categoryId:     raw.category?.id || undefined,
      ...(raw.description    ? { description: raw.description }       : {}),
      ...(raw.estimatedHours ? { estimatedHours: raw.estimatedHours } : {}),
    };
    const req = this.isEdit()
      ? this.svc.update(this.editId, dto)
      : this.svc.create(dto);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/app/servicos']),
      error: () => {
        this.saving.set(false);
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar' });
      },
    });
  }
}
