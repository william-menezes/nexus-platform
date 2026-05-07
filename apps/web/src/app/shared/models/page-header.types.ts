export type PageHeaderVariant = 'list' | 'detail';
export type PageHeaderPillColor = 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'gray';

export interface PageHeaderPill {
  label: string;
  color: PageHeaderPillColor;
}

export interface PageHeaderViewToggleOption {
  label: string;
  icon?: string;
  value: string;
}
