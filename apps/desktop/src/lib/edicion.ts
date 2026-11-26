// Utilidades compartidas para reutilizar los formularios "nuevo" en modo edición (?id=...).
export const SIDECAR_URL = "http://127.0.0.1:4111";

export function idEdicion(): string | null {
  const id = new URLSearchParams(window.location.search).get("id");
  return id && id.trim() ? id.trim() : null;
}

export async function cargarParaEditar(recurso: string, id: string): Promise<any> {
  const res = await fetch(`${SIDECAR_URL}/${recurso}/${encodeURIComponent(id)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "No se pudo cargar el registro");
  }
  return json.data;
}

export async function guardarEdicion(recurso: string, id: string, payload: unknown): Promise<any> {
  const res = await fetch(`${SIDECAR_URL}/${recurso}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "No se pudieron guardar los cambios");
  }
  return json.data;
}

export function llenarFormulario(form: HTMLFormElement, valores: Record<string, unknown>) {
  for (const [nombre, valor] of Object.entries(valores)) {
    const el = form.elements.namedItem(nombre);
    if (!el || el instanceof RadioNodeList) continue;
    const campo = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const texto = valor === null || valor === undefined ? "" : String(valor);
    if (campo instanceof HTMLSelectElement && texto && ![...campo.options].some((o) => o.value === texto)) {
      campo.add(new Option(texto, texto));
    }
    campo.value = texto;
  }
}

interface OpcionesModoEdicion {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  botonGuardar: string;
  volverHref: string;
}

export function activarModoEdicion(form: HTMLFormElement, o: OpcionesModoEdicion) {
  document.title = `${o.titulo} · Lumbreras de Amor`;
  const set = (sel: string, txt: string) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = txt;
  };
  set("#page-title", o.titulo);
  set("#page-subtitle", o.subtitulo);
  set(".form-card-title", o.titulo);
  set(".form-card-desc", `${o.descripcion} Los campos con * son obligatorios.`);

  const guardar = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (guardar) guardar.textContent = o.botonGuardar;

  const limpiar = form.querySelector<HTMLButtonElement>('button[type="reset"]');
  if (limpiar) {
    const cancelar = document.createElement("a");
    cancelar.className = "btn btn-ghost";
    cancelar.href = o.volverHref;
    cancelar.textContent = "Cancelar";
    limpiar.replaceWith(cancelar);
  }
}

export function mostrarError(el: HTMLElement | null, mensaje: string) {
  if (!el) return;
  el.textContent = mensaje;
  el.style.display = "block";
}
