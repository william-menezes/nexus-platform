export type TablePageState = {
  first: number;
  rows: number;
};

export const DEFAULT_TABLE_ROWS = 10;
export const TABLE_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export function createInitialTablePageState(rows = DEFAULT_TABLE_ROWS): TablePageState {
  return { first: 0, rows };
}

export function updateTablePageState(
  current: TablePageState,
  event: { first?: number; rows?: number }
): TablePageState {
  return {
    first: event.first ?? current.first,
    rows: event.rows ?? current.rows,
  };
}

export function getVisibleTableRecords(totalRecords: number, page: TablePageState): number {
  if (totalRecords <= 0 || page.first >= totalRecords) {
    return 0;
  }

  return Math.min(page.rows, totalRecords - page.first);
}

export function formatTableSummary(visibleRecords: number, totalRecords: number): string {
  return `${visibleRecords} de ${totalRecords}`;
}
