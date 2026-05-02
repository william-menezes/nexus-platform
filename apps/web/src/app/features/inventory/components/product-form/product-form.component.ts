import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  ItemCategory, ItemBrand, ItemQuality, ProductType,
} from '@nexus-platform/shared-types';
import { Supplier } from '@nexus-platform/shared-types';
import { InventoryService } from '../../inventory.service';
import { SettingsService } from '../../../../features/settings/settings.service';
import { SuppliersService } from '../../../../features/suppliers/suppliers.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { MASKS } from '../../../../shared/validators/input-masks';

type QuickAddFor = 'category' | 'brand' | 'quality' | 'supplier';

@Component({
  standalone: true,
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule, RouterLink,
    ButtonModule, InputTextModule, InputMaskModule, InputNumberModule,
    AutoCompleteModule, SelectButtonModule, SelectModule,
    TextareaModule, ToggleSwitchModule, DividerModule,
    MessageModule, DialogModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './product-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(InventoryService);
  private readonly settingsSvc = inject(SettingsService);
  private readonly suppliersSvc = inject(SuppliersService);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly toast      = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly MASKS = MASKS;

  readonly isEdit  = signal(false);
  readonly loading = signal(false);
  readonly saving  = signal(false);
  readonly error   = signal('');

  private editId = '';

  // Lookup data
  readonly allCategories  = signal<ItemCategory[]>([]);
  readonly allBrands      = signal<ItemBrand[]>([]);
  readonly allQualities   = signal<ItemQuality[]>([]);
  readonly allSuppliers   = signal<Supplier[]>([]);

  // Filtered suggestions for autocomplete
  readonly filteredCategories = signal<ItemCategory[]>([]);
  readonly filteredBrands     = signal<ItemBrand[]>([]);
  readonly filteredQualities  = signal<ItemQuality[]>([]);
  readonly filteredSuppliers  = signal<Supplier[]>([]);

  // Last typed query (used to pre-fill quick-add name)
  lastCategoryQuery = '';
  lastBrandQuery    = '';
  lastQualityQuery  = '';
  lastSupplierQuery = '';

  // Quick-add dialog
  readonly quickAddVisible = signal(false);
  readonly quickAddFor     = signal<QuickAddFor | null>(null);
  readonly quickAddSaving  = signal(false);

  readonly quickAddForm = this.fb.group({
    name:        ['', Validators.required],
    description: [null as string | null],
    level:       [99 as number | null],
    phone:       [null as string | null],
    cnpj:        [null as string | null],
  });

  readonly typeOptions = [
    { label: 'Produto', value: 'product' as ProductType },
    { label: 'Peça',    value: 'part'    as ProductType },
  ];

  readonly unitOptions = [
    { label: 'Unidade (un)', value: 'un' },
    { label: 'Quilo (kg)',   value: 'kg' },
    { label: 'Metro (m)',    value: 'm'  },
    { label: 'Litro (l)',    value: 'l'  },
    { label: 'Caixa (cx)',   value: 'cx' },
    { label: 'Peça (pç)',    value: 'pç' },
  ];

  readonly form = this.fb.group({
    type:      ['product' as ProductType],
    name:      ['', [Validators.required, Validators.minLength(3)]],
    sku:       [''],
    barcode:   [''],
    description: [''],
    unit:      ['un'],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    minStock:  [0, [Validators.min(0)]],
    isActive:  [true],
    // Autocomplete fields store full objects; ids are extracted on save
    category:  [null as ItemCategory | null],
    brand:     [null as ItemBrand | null],
    quality:   [null as ItemQuality | null],
    supplier:  [null as Supplier | null],
  });

  get quickAddTitle(): string {
    const map: Record<QuickAddFor, string> = {
      category: 'Nova Categoria',
      brand:    'Nova Marca',
      quality:  'Nova Qualidade',
      supplier: 'Novo Fornecedor',
    };
    return this.quickAddFor() ? map[this.quickAddFor()!] : '';
  }

  isInvalid(path: string): boolean {
    const c = this.form.get(path);
    return !!c?.invalid && (c.touched || c.dirty);
  }

  ngOnInit() {
    this.editId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit.set(!!this.editId);
    this.breadcrumbSvc.set([
      { label: 'Estoque', routerLink: '/app/estoque' },
      { label: this.isEdit() ? 'Editar Item' : 'Novo Item' },
    ]);

    // Listen to type changes to reload lookups
    this.form.get('type')!.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(type => {
      this.form.patchValue({ category: null, brand: null, quality: null }, { emitEvent: false });
      this.loadLookups(type as ProductType);
    });

    if (this.editId) {
      this.loading.set(true);
      this.svc.getProduct(this.editId).pipe(
        switchMap(product => forkJoin({
          product:    of(product),
          categories: this.settingsSvc.getCategories(product.type),
          brands:     this.settingsSvc.getBrands(product.type),
          qualities:  this.settingsSvc.getQualities(product.type),
          suppliers:  this.suppliersSvc.findAll(),
        })),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: ({ product: p, categories, brands, qualities, suppliers }) => {
          this.allCategories.set(categories);
          this.allBrands.set(brands);
          this.allQualities.set(qualities);
          this.allSuppliers.set(suppliers);
          this.form.patchValue({
            type:        p.type,
            name:        p.name,
            sku:         p.sku ?? '',
            barcode:     p.barcode ?? '',
            description: p.description ?? '',
            unit:        p.unit ?? 'un',
            costPrice:   p.costPrice,
            salePrice:   p.salePrice,
            minStock:    p.minStock,
            isActive:    p.isActive,
            category:    categories.find(c => c.id === p.categoryId) ?? null,
            brand:       brands.find(b => b.id === p.brandId) ?? null,
            quality:     qualities.find(q => q.id === p.qualityId) ?? null,
            supplier:    suppliers.find(s => s.id === p.supplierId) ?? null,
          }, { emitEvent: false });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Erro ao carregar item.');
          this.loading.set(false);
        },
      });
    } else {
      this.loadLookups('product');
      this.suppliersSvc.findAll().pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(s => this.allSuppliers.set(s));
    }
  }

  private loadLookups(type: ProductType) {
    forkJoin({
      categories: this.settingsSvc.getCategories(type),
      brands:     this.settingsSvc.getBrands(type),
      qualities:  this.settingsSvc.getQualities(type),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ categories, brands, qualities }) => {
      this.allCategories.set(categories);
      this.allBrands.set(brands);
      this.allQualities.set(qualities);
    });
  }

  // Autocomplete search handlers
  searchCategory(event: { query: string }) {
    this.lastCategoryQuery = event.query;
    const q = event.query.toLowerCase();
    this.filteredCategories.set(
      q ? this.allCategories().filter(c => c.name.toLowerCase().includes(q))
        : this.allCategories(),
    );
  }

  searchBrand(event: { query: string }) {
    this.lastBrandQuery = event.query;
    const q = event.query.toLowerCase();
    this.filteredBrands.set(
      q ? this.allBrands().filter(b => b.name.toLowerCase().includes(q))
        : this.allBrands(),
    );
  }

  searchQuality(event: { query: string }) {
    this.lastQualityQuery = event.query;
    const q = event.query.toLowerCase();
    this.filteredQualities.set(
      q ? this.allQualities().filter(q2 => q2.name.toLowerCase().includes(q))
        : this.allQualities(),
    );
  }

  searchSupplier(event: { query: string }) {
    this.lastSupplierQuery = event.query;
    const q = event.query.toLowerCase();
    this.filteredSuppliers.set(
      q ? this.allSuppliers().filter(s => s.name.toLowerCase().includes(q))
        : this.allSuppliers(),
    );
  }

  // Quick-add dialog
  openQuickAdd(field: QuickAddFor) {
    const prefill =
      field === 'category' ? this.lastCategoryQuery :
      field === 'brand'    ? this.lastBrandQuery    :
      field === 'quality'  ? this.lastQualityQuery  :
                             this.lastSupplierQuery;

    this.quickAddFor.set(field);
    this.quickAddForm.reset({ name: prefill, description: null, level: 99, phone: null, cnpj: null });
    this.quickAddVisible.set(true);
  }

  saveQuickAdd() {
    if (this.quickAddForm.invalid) return;
    this.quickAddSaving.set(true);
    const { name, description, level, phone, cnpj } = this.quickAddForm.getRawValue();
    const type = this.form.get('type')!.value as ProductType;

    switch (this.quickAddFor()) {
      case 'category':
        this.settingsSvc.createCategory({
          name: name!, itemType: type, ...(description ? { description } : {}),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: cat => {
            this.allCategories.update(l => [...l, cat]);
            this.form.get('category')!.setValue(cat);
            this.quickAddVisible.set(false);
            this.quickAddSaving.set(false);
          },
          error: () => { this.quickAddSaving.set(false); this.toast.add({ severity: 'error', summary: 'Erro ao criar categoria' }); },
        });
        break;

      case 'brand':
        this.settingsSvc.createBrand({ name: name!, itemType: type }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: brand => {
            this.allBrands.update(l => [...l, brand]);
            this.form.get('brand')!.setValue(brand);
            this.quickAddVisible.set(false);
            this.quickAddSaving.set(false);
          },
          error: () => { this.quickAddSaving.set(false); this.toast.add({ severity: 'error', summary: 'Erro ao criar marca' }); },
        });
        break;

      case 'quality':
        this.settingsSvc.createQuality({ name: name!, itemType: type, level: level ?? 99 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: qual => {
            this.allQualities.update(l => [...l, qual]);
            this.form.get('quality')!.setValue(qual);
            this.quickAddVisible.set(false);
            this.quickAddSaving.set(false);
          },
          error: () => { this.quickAddSaving.set(false); this.toast.add({ severity: 'error', summary: 'Erro ao criar qualidade' }); },
        });
        break;

      case 'supplier':
        this.suppliersSvc.create({
          name: name!,
          ...(phone ? { phone } : {}),
          ...(cnpj  ? { cnpj  } : {}),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: supplier => {
            this.allSuppliers.update(l => [...l, supplier]);
            this.form.get('supplier')!.setValue(supplier);
            this.quickAddVisible.set(false);
            this.quickAddSaving.set(false);
          },
          error: () => { this.quickAddSaving.set(false); this.toast.add({ severity: 'error', summary: 'Erro ao criar fornecedor' }); },
        });
        break;
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    const dto = {
      type:        raw.type ?? 'product',
      name:        raw.name ?? '',
      sku:         raw.sku   || undefined,
      barcode:     raw.barcode || undefined,
      description: raw.description || undefined,
      unit:        raw.unit ?? 'un',
      costPrice:   raw.costPrice ?? 0,
      salePrice:   raw.salePrice ?? 0,
      minStock:    raw.minStock ?? 0,
      isActive:    raw.isActive ?? true,
      categoryId:  raw.category?.id || undefined,
      brandId:     raw.brand?.id    || undefined,
      qualityId:   raw.quality?.id  || undefined,
      supplierId:  raw.supplier?.id || undefined,
    };

    const req = this.isEdit()
      ? this.svc.updateProduct(this.editId, dto)
      : this.svc.createProduct(dto);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/app/estoque']),
      error: () => {
        this.error.set('Erro ao salvar item.');
        this.saving.set(false);
      },
    });
  }
}
