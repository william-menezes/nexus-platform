import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ItemCategory, ItemBrand, ItemQuality, LookupItemType } from '@nexus-platform/shared-types';
import { SettingsService } from '../../settings.service';
import { Observable } from 'rxjs';

type CatalogSection = 'categories' | 'brands' | 'qualities';

@Component({
  standalone: true,
  selector: 'app-catalog-settings',
  imports: [
    FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, TextareaModule, InputNumberModule,
    DialogModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './catalog-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSettingsComponent implements OnInit {
  private readonly svc = inject(SettingsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly typeOptions: { label: string; value: LookupItemType }[] = [
    { label: 'Produtos', value: 'product' },
    { label: 'Peças', value: 'part' },
    { label: 'Serviços', value: 'service' },
  ];

  readonly sectionOptions: { label: string; value: CatalogSection }[] = [
    { label: 'Categorias', value: 'categories' },
    { label: 'Marcas', value: 'brands' },
    { label: 'Qualidades', value: 'qualities' },
  ];

  readonly activeType = signal<LookupItemType>('product');
  readonly activeSection = signal<CatalogSection>('categories');
  readonly items = signal<(ItemCategory | ItemBrand | ItemQuality)[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  dialogVisible = false;
  editingId: string | null = null;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [null as string | null],
    level: [99 as number | null],
  });

  get isService() { return this.activeType() === 'service'; }

  get dialogTitle(): string {
    const action = this.editingId ? 'Editar' : 'Novo(a)';
    const names: Record<CatalogSection, string> = {
      categories: 'Categoria',
      brands: 'Marca',
      qualities: 'Qualidade',
    };
    return `${action} ${names[this.activeSection()]}`;
  }

  get showDescription() { return this.activeSection() === 'categories'; }
  get showLevel() { return this.activeSection() === 'qualities'; }

  get columnLabel(): string {
    return this.activeSection() === 'qualities' ? 'Nível' : 'Descrição';
  }

  columnValue(item: ItemCategory | ItemBrand | ItemQuality): string {
    if (this.activeSection() === 'categories') return (item as ItemCategory).description ?? '—';
    if (this.activeSection() === 'qualities') return String((item as ItemQuality).level ?? '—');
    return '—';
  }

  ngOnInit() { this.load(); }

  setType(type: LookupItemType) {
    this.activeType.set(type);
    if (type === 'service') this.activeSection.set('categories');
    this.load();
  }

  setSection(section: CatalogSection) {
    this.activeSection.set(section);
    this.load();
  }

  load() {
    this.loading.set(true);
    const type = this.activeType();
    const section = this.activeSection();
    let req$: Observable<(ItemCategory | ItemBrand | ItemQuality)[]>;

    if (section === 'categories') {
      req$ = this.svc.getCategories(type);
    } else if (section === 'brands') {
      req$ = this.svc.getBrands(type as 'product' | 'part');
    } else {
      req$ = this.svc.getQualities(type as 'product' | 'part');
    }

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.items.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(item?: ItemCategory | ItemBrand | ItemQuality) {
    this.editingId = item?.id ?? null;
    this.form.reset({
      name: item?.name ?? '',
      description: (item as ItemCategory)?.description ?? null,
      level: (item as ItemQuality)?.level ?? 99,
    });
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const { name, description, level } = this.form.getRawValue();
    const type = this.activeType();
    const section = this.activeSection();

    let req$: Observable<unknown>;

    if (section === 'categories') {
      const payload: Parameters<SettingsService['createCategory']>[0] = {
        name: name!,
        itemType: type,
        ...(description ? { description } : {}),
      };
      req$ = this.editingId
        ? this.svc.updateCategory(this.editingId, { name: name!, ...(description ? { description } : {}) })
        : this.svc.createCategory(payload);
    } else if (section === 'brands') {
      req$ = this.editingId
        ? this.svc.updateBrand(this.editingId, { name: name! })
        : this.svc.createBrand({ name: name!, itemType: type as 'product' | 'part' });
    } else {
      req$ = this.editingId
        ? this.svc.updateQuality(this.editingId, { name: name!, level: level ?? 99 })
        : this.svc.createQuality({ name: name!, itemType: type as 'product' | 'part', level: level ?? 99 });
    }

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Salvo' });
        this.dialogVisible = false;
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        const detail = err?.error?.message ?? 'Erro ao salvar';
        this.msg.add({ severity: 'error', summary: 'Erro', detail });
        this.saving.set(false);
      },
    });
  }

  confirmDelete(item: ItemCategory | ItemBrand | ItemQuality) {
    this.confirm.confirm({
      message: `Excluir "${item.name}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        const section = this.activeSection();
        let del$: Observable<void>;
        if (section === 'categories') del$ = this.svc.deleteCategory(item.id);
        else if (section === 'brands') del$ = this.svc.deleteBrand(item.id);
        else del$ = this.svc.deleteQuality(item.id);

        del$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído' });
            this.load();
          },
          error: (err) => {
            const detail = err?.error?.message ?? 'Não é possível excluir: item em uso';
            this.msg.add({ severity: 'error', summary: 'Erro', detail });
          },
        });
      },
    });
  }
}
