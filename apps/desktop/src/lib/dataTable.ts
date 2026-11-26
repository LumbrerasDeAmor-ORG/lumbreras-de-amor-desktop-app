// Tabla de datos basada en TanStack Table (@tanstack/table-core, sin framework).
// TanStack gestiona el estado (orden, filtro, paginación); este módulo solo pinta el DOM.
import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type Row,
  type SortingState,
  type TableState,
  type Updater,
} from "@tanstack/table-core";

export function esc(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function badge(clase: string, texto: unknown): string {
  return `<span class="badge ${clase}">${esc(texto)}</span>`;
}

/** Etiqueta de estado con punto de color (reemplaza a los badges en tablas). */
export type TonoTag = "ok" | "warn" | "danger" | "info" | "brand" | "accent" | "neutral";
export function tag(tono: TonoTag, texto: unknown): string {
  return `<span class="tag ${tono === "neutral" ? "" : `tag-${tono}`}">${esc(texto)}</span>`;
}

export interface Columna<T> {
  id: string;
  header: string;
  /** Valor usado para ordenar. Si se omite, la columna no es ordenable. */
  accessor?: (fila: T) => string | number;
  /** HTML de la celda (escapar con `esc`). */
  cell: (fila: T) => string;
  align?: "left" | "right";
  /** Clases extra de Tailwind para la celda (ej. "whitespace-nowrap"). */
  className?: string;
}

export interface OpcionesTabla<T, F = unknown> {
  mount: HTMLElement;
  data: T[];
  columns: Columna<T>[];
  pageSize?: number;
  pageSizes?: number[];
  /** Predicado de filtrado; recibe el valor establecido con `setFilter`. */
  filter?: (fila: T, filtro: F) => boolean;
  emptyTitle?: string;
  emptyText?: string;
  /** Texto del contador, ej. "donantes". */
  noun?: string;
  initialSort?: { id: string; desc?: boolean };
  /** Clic en elementos con data-action dentro de las celdas. */
  onAction?: (accion: string, fila: T, el: HTMLElement) => void;
}

const ICON_SORT = `<svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;
const iconoOrden = (dir: false | "asc" | "desc") =>
  dir === "asc"
    ? `${ICON_SORT}<path d="m6 15 6-6 6 6"/></svg>`
    : dir === "desc"
      ? `${ICON_SORT}<path d="m6 9 6 6 6-6"/></svg>`
      : `${ICON_SORT}<path d="m8 9 4-4 4 4M16 15l-4 4-4-4" opacity=".45"/></svg>`;

export function crearTabla<T, F = unknown>(opts: OpcionesTabla<T, F>) {
  const { mount } = opts;
  const pageSizes = opts.pageSizes ?? [10, 25, 50];
  const noun = opts.noun ?? "registros";
  let datos = [...opts.data];

  const columnas: ColumnDef<T>[] = opts.columns.map((c) => ({
    id: c.id,
    header: c.header,
    accessorFn: (fila: T) => (c.accessor ? c.accessor(fila) : ""),
    enableSorting: !!c.accessor,
    cell: (ctx) => c.cell(ctx.row.original),
    meta: { align: c.align ?? "left", className: c.className ?? "" },
  }));

  const sorting: SortingState = opts.initialSort ? [{ id: opts.initialSort.id, desc: !!opts.initialSort.desc }] : [];

  const table = createTable<T>({
    data: datos,
    columns: columnas,
    state: {} as TableState,
    onStateChange: () => {},
    renderFallbackValue: "",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: true,
    sortDescFirst: false,
    getColumnCanGlobalFilter: () => true,
    globalFilterFn: (row: Row<T>, _col, filtro) => (opts.filter ? opts.filter(row.original, filtro as F) : true),
  });

  let state: TableState = {
    ...table.initialState,
    sorting,
    pagination: { pageIndex: 0, pageSize: opts.pageSize ?? pageSizes[0] },
  };

  function actualizarOpciones() {
    table.setOptions((prev) => ({
      ...prev,
      data: datos,
      state,
      onStateChange: (updater: Updater<TableState>) => {
        state = typeof updater === "function" ? updater(state) : updater;
        actualizarOpciones();
        pintar();
      },
    }));
  }

  function pintarEncabezado(): string {
    return table
      .getHeaderGroups()
      .map(
        (g) =>
          `<tr>${g.headers
            .map((h) => {
              const meta = h.column.columnDef.meta as { align: string };
              const alineado = meta.align === "right" ? "text-right" : "text-left";
              const dir = h.column.getIsSorted();
              const aria = dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";
              const etiqueta = esc(h.column.columnDef.header as string);
              const contenido = h.column.getCanSort()
                ? `<button type="button" data-sort="${esc(h.column.id)}" class="inline-flex cursor-pointer items-center gap-1 rounded uppercase tracking-wider transition-colors hover:text-slate-900 ${dir ? "text-slate-900" : ""} ${meta.align === "right" ? "flex-row-reverse" : ""}">${etiqueta}${iconoOrden(dir)}</button>`
                : etiqueta;
              return `<th scope="col" aria-sort="${aria}" class="${alineado}">${contenido}</th>`;
            })
            .join("")}</tr>`
      )
      .join("");
  }

  function pintarFilas(): string {
    const filas = table.getRowModel().rows;
    if (filas.length === 0) {
      return `<tr><td colspan="${columnas.length}" class="!py-14 text-center">
        <div class="mx-auto flex max-w-sm flex-col items-center gap-1.5">
          <svg class="size-9 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <p class="text-sm font-semibold text-slate-700">${esc(opts.emptyTitle ?? "Sin resultados")}</p>
          <p class="text-[13px] text-slate-500">${esc(opts.emptyText ?? "Probá con otros criterios de búsqueda o filtros.")}</p>
        </div></td></tr>`;
    }
    return filas
      .map(
        (fila) =>
          `<tr data-row-id="${esc(fila.id)}">${fila
            .getVisibleCells()
            .map((celda) => {
              const meta = celda.column.columnDef.meta as { align: string; className: string };
              const alineado = meta.align === "right" ? "text-right tabular-nums" : "";
              const html = (celda.column.columnDef.cell as (c: unknown) => string)(celda.getContext());
              return `<td class="${alineado} ${esc(meta.className)}">${html}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");
  }

  function pintarPie(): string {
    const total = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = table.getState().pagination;
    const paginas = Math.max(1, table.getPageCount());
    const desde = total === 0 ? 0 : pageIndex * pageSize + 1;
    const hasta = Math.min(total, (pageIndex + 1) * pageSize);
    const btn = (accion: string, etiqueta: string, deshabilitado: boolean) =>
      `<button type="button" data-page="${accion}" class="btn btn-ghost btn-sm" aria-label="${etiqueta}" ${deshabilitado ? "disabled" : ""}>${etiqueta}</button>`;
    return `
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-[13px] text-slate-600">
        <span>Mostrando <strong class="font-semibold text-slate-900 tabular-nums">${desde}–${hasta}</strong> de <strong class="font-semibold text-slate-900 tabular-nums">${total}</strong> ${esc(noun)}</span>
        <div class="flex flex-wrap items-center gap-2.5">
          <label class="flex items-center gap-2">Filas
            <select data-page-size class="form-control !w-auto !py-1 !text-[13px]">
              ${pageSizes.map((n) => `<option value="${n}" ${n === pageSize ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </label>
          <span class="tabular-nums">Página ${pageIndex + 1} de ${paginas}</span>
          ${btn("prev", "‹ Anterior", !table.getCanPreviousPage())}
          ${btn("next", "Siguiente ›", !table.getCanNextPage())}
        </div>
      </div>`;
  }

  function pintar() {
    mount.innerHTML = `
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div class="overflow-x-auto">
          <table class="data-table-plain w-full text-sm">
            <thead>${pintarEncabezado()}</thead>
            <tbody>${pintarFilas()}</tbody>
          </table>
        </div>
        ${pintarPie()}
      </div>`;
  }

  mount.addEventListener("click", (e) => {
    const objetivo = e.target as HTMLElement;
    const ordenar = objetivo.closest<HTMLElement>("[data-sort]");
    if (ordenar) {
      table.getColumn(ordenar.dataset.sort!)?.toggleSorting();
      return;
    }
    const pagina = objetivo.closest<HTMLElement>("[data-page]");
    if (pagina) {
      if (pagina.dataset.page === "prev") table.previousPage();
      else table.nextPage();
      return;
    }
    const accion = objetivo.closest<HTMLElement>("[data-action]");
    if (accion && opts.onAction) {
      const id = accion.closest<HTMLElement>("[data-row-id]")?.dataset.rowId;
      const fila = id !== undefined ? table.getCoreRowModel().rowsById[id] : undefined;
      if (fila) opts.onAction(accion.dataset.action!, fila.original, accion);
    }
  });

  mount.addEventListener("change", (e) => {
    const sel = (e.target as HTMLElement).closest<HTMLSelectElement>("[data-page-size]");
    if (sel) table.setPageSize(Number(sel.value));
  });

  actualizarOpciones();
  pintar();

  return {
    table,
    /** Define el filtro externo (se pasa a `opts.filter`). `undefined` lo quita. */
    setFilter(filtro: F | undefined) {
      table.setGlobalFilter(filtro as unknown);
    },
    getData: () => [...datos],
    setData(nuevos: T[]) {
      datos = [...nuevos];
      actualizarOpciones();
      pintar();
    },
    /** Agrega una fila al inicio y vuelve a la primera página. */
    addRow(fila: T) {
      datos = [fila, ...datos];
      actualizarOpciones();
      table.resetPageIndex();
      pintar();
    },
    getFilteredCount: () => table.getFilteredRowModel().rows.length,
  };
}
