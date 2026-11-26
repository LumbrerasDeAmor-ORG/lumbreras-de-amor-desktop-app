// Cliente del módulo de Diplomas (sidecar). El formulario de alta/edición usa estas mismas funciones.
export const SIDECAR_URL = "http://127.0.0.1:4111";

export interface Diploma {
  id: string;
  codigo: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  notas: string;
  plantillaId: string;
  plantillaNombre: string;
}

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  esPredeterminada: boolean;
  diplomasCount: number;
  creadaEl: string | null;
  html?: string;
}

/** Datos que acepta POST/PUT /diplomas. */
export interface DiplomaInput {
  nombre: string;
  titulo: string;
  fechaEntrega: string; // AAAA-MM-DD
  descripcion?: string;
  notas?: string;
  plantillaId?: string; // "" = usar la plantilla predeterminada
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SIDECAR_URL}${ruta}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || `Error ${res.status}`);
  return json as T;
}

export const listarDiplomas = (filtros: { q?: string; desde?: string; hasta?: string } = {}) => {
  const qs = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v) as [string, string][]).toString();
  return pedir<{ data: Diploma[] }>(`/diplomas${qs ? `?${qs}` : ""}`).then((r) => r.data);
};
export const obtenerDiploma = (id: string) => pedir<{ data: Diploma }>(`/diplomas/${encodeURIComponent(id)}`).then((r) => r.data);
export const crearDiplomaApi = (d: DiplomaInput) =>
  pedir<{ data: Diploma }>("/diplomas", { method: "POST", body: JSON.stringify(d) }).then((r) => r.data);
export const actualizarDiplomaApi = (id: string, d: Partial<DiplomaInput>) =>
  pedir<{ data: Diploma }>(`/diplomas/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(d) }).then((r) => r.data);
export const eliminarDiplomaApi = (id: string) => pedir<unknown>(`/diplomas/${encodeURIComponent(id)}`, { method: "DELETE" });

/** HTML ya renderizado del diploma. `plantilla`: id de plantilla, "default" (sistema) o vacío (la que corresponda). */
export async function renderizarDiplomaHtml(id: string, plantilla?: string): Promise<string> {
  const qs = plantilla ? `?plantilla=${encodeURIComponent(plantilla)}` : "";
  const res = await fetch(`${SIDECAR_URL}/diplomas/${encodeURIComponent(id)}/render${qs}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Error ${res.status}`);
  }
  return res.text();
}

export const listarPlantillas = () =>
  pedir<{ data: Plantilla[]; marcadores: string[]; usaPredeterminadaDelSistema: boolean }>("/plantillas-diploma");
export const subirPlantilla = (p: { nombre: string; descripcion?: string; html: string }) =>
  pedir<{ data: Plantilla }>("/plantillas-diploma", { method: "POST", body: JSON.stringify(p) }).then((r) => r.data);
export const eliminarPlantillaApi = (id: string) => pedir<unknown>(`/plantillas-diploma/${encodeURIComponent(id)}`, { method: "DELETE" });
export const marcarPlantillaPredeterminada = (id: string) =>
  pedir<unknown>(`/plantillas-diploma/${encodeURIComponent(id)}/predeterminada`, { method: "POST" });
export const usarDisenoDelSistema = () => pedir<unknown>("/plantillas-diploma/predeterminada", { method: "DELETE" });
export const urlPlantillaBase = () => `${SIDECAR_URL}/plantillas-diploma/base`;

export function formatearFecha(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(m[3])} ${meses[Number(m[2]) - 1]} ${m[1]}`;
}
