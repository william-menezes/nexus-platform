import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/equipment-list/equipment-list.component').then(m => m.EquipmentListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/equipment-form/equipment-form.component').then(m => m.EquipmentFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/equipment-form/equipment-form.component').then(m => m.EquipmentFormComponent),
  },
  {
    path: 'tipos',
    loadComponent: () =>
      import('./components/equipment-type-list/equipment-type-list.component').then(m => m.EquipmentTypeListComponent),
  },
];
