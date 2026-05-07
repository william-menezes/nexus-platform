import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import {
  PageHeaderPill,
  PageHeaderPillColor,
  PageHeaderVariant,
  PageHeaderViewToggleOption,
} from '../../models/page-header.types';

@Component({
  standalone: true,
  selector: 'app-page-header',
  imports: [RouterLink, NgClass],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mb-6' },
})
export class PageHeaderComponent {
  @Input() variant: PageHeaderVariant = 'list';
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;

  // Detail mode
  @Input() backLabel?: string;
  @Input() backRoute?: string | string[];
  @Input() pills?: PageHeaderPill[];

  // List mode — view toggle (opt-in, only OS and Orçamentos)
  @Input() viewToggleOptions?: PageHeaderViewToggleOption[];
  @Input() viewMode?: string;
  @Output() viewModeChange = new EventEmitter<string>();

  pillBgClasses(color: PageHeaderPillColor): Record<string, boolean> {
    return {
      'bg-blue-50':    color === 'blue',
      'text-blue-700': color === 'blue',
      'bg-violet-50':    color === 'violet',
      'text-violet-700': color === 'violet',
      'bg-amber-50':    color === 'amber',
      'text-amber-700': color === 'amber',
      'bg-emerald-50':    color === 'green',
      'text-emerald-700': color === 'green',
      'bg-red-50':    color === 'red',
      'text-red-700': color === 'red',
      'bg-slate-100':  color === 'gray',
      'text-slate-600': color === 'gray',
    };
  }

  pillDotClasses(color: PageHeaderPillColor): Record<string, boolean> {
    return {
      'bg-blue-500':    color === 'blue',
      'bg-violet-500':  color === 'violet',
      'bg-amber-500':   color === 'amber',
      'bg-emerald-500': color === 'green',
      'bg-red-500':     color === 'red',
      'bg-slate-400':   color === 'gray',
    };
  }
}
