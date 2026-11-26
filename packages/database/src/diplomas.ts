// Módulo de Diplomas: validación, plantillas HTML, renderizado y acceso a datos.
import type { PrismaClient } from "@prisma/client";

export const ORGANIZACION = "Lumbreras de Amor ONG";
export const MAX_HTML_PLANTILLA_BYTES = 512 * 1024;

/** Marcadores disponibles en las plantillas: {{nombre}}, {{titulo}}, etc. */
export const MARCADORES_DIPLOMA = [
  "nombre",
  "titulo",
  "descripcion",
  "fecha_entrega",
  "fecha_entrega_iso",
  "notas",
  "codigo",
  "organizacion",
] as const;

/** Diseño por defecto: A4 horizontal, morado y verde azulado de la identidad de la ONG. */
export const PLANTILLA_PREDETERMINADA_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>{{titulo}} · {{nombre}}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; }
  body {
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background: #f1ecf4; font-family: Georgia, "Times New Roman", serif; color: #1e0a2b;
    display: flex; align-items: center; justify-content: center;
  }
  .diploma {
    position: relative; width: 297mm; height: 210mm; max-width: 100vw; max-height: 100vh;
    aspect-ratio: 297 / 210; background: #fffdf9; padding: 12mm;
  }
  .marco { position: absolute; inset: 8mm; border: 2.2mm solid #4c1763; }
  .marco::after { content: ""; position: absolute; inset: 2.6mm; border: 0.5mm solid #71b8b1; }
  .contenido {
    position: relative; height: 100%; display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; padding: 16mm 30mm; gap: 4.5mm;
  }
  .org { font: 600 4.2mm/1 "Helvetica Neue", Arial, sans-serif; letter-spacing: 1.2mm; text-transform: uppercase; color: #4c1763; }
  .llama { width: 14mm; height: 14mm; }
  h1 { font-size: 15mm; font-weight: 400; letter-spacing: 1mm; color: #4c1763; line-height: 1.05; }
  .otorga { font: italic 5mm/1 Georgia, serif; color: #5b4a66; }
  .nombre { font-size: 13mm; line-height: 1.1; padding: 0 8mm 2mm; border-bottom: 0.5mm solid #71b8b1; min-width: 150mm; }
  .titulo { font: 700 6.2mm/1.25 "Helvetica Neue", Arial, sans-serif; color: #047c8d; }
  .descripcion { font-size: 4.6mm; line-height: 1.5; color: #3b2a47; max-width: 190mm; }
  .pie { margin-top: 4mm; font: 3.8mm/1.4 "Helvetica Neue", Arial, sans-serif; color: #5b4a66; }
  .codigo { position: absolute; right: 22mm; bottom: 15mm; font: 3mm/1 "Helvetica Neue", Arial, sans-serif; color: #98a2b3; letter-spacing: 0.4mm; }
  @media screen { .diploma { box-shadow: 0 10px 40px rgba(30,10,43,.25); } }
  @media print { body { background: #fff; display: block; } .diploma { box-shadow: none; max-width: none; max-height: none; } }
</style>
</head>
<body>
  <div class="diploma">
    <div class="marco"></div>
    <div class="contenido">
      <svg class="llama" viewBox="0 0 24 24" fill="none" stroke="#4c1763" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c.8 3.2-1.6 4.6-3 6.8-1.6 2.4-1.2 5.2.6 6.6.2-1.4 1-2.4 2-3 0 2 1.6 2.6 1.6 4.2 0 1.2-.8 2-1.8 2.4 3.4.2 5.6-1.8 5.6-4.8 0-3.6-3.6-5.6-3.6-9.2 0-1.2-.4-2.4-1.4-3z"/></svg>
      <div class="org">{{organizacion}}</div>
      <h1>Diploma</h1>
      <p class="otorga">se otorga con gratitud a</p>
      <div class="nombre">{{nombre}}</div>
      <div class="titulo">{{titulo}}</div>
      <p class="descripcion">{{descripcion}}</p>
      <p class="pie">Entregado el {{fecha_entrega}}</p>
    </div>
    <div class="codigo">{{codigo}}</div>
  </div>
</body>
</html>
`;

// ─── Validación ──────────────────────────────────────────────────────────────

export class ErrorValidacion extends Error {}

export interface DiplomaInput {
  nombre?: unknown;
  titulo?: unknown;
  descripcion?: unknown;
  fecha_entrega?: unknown;
  notas?: unknown;
  id_plantilla?: unknown;
}

const texto = (v: unknown): string => String(v ?? "").trim();
const textoONulo = (v: unknown): string | null => texto(v) || null;

export function esFechaIsoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

async function resolverPlantillaId(db: PrismaClient, valor: unknown): Promise<number | null> {
  if (valor === undefined || valor === null || valor === "" || valor === "default") return null;
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorValidacion("La plantilla indicada no es válida");
  const existe = await db.plantillaDiploma.findUnique({ where: { id_plantilla: id } });
  if (!existe) throw new ErrorValidacion("La plantilla indicada no existe");
  return id;
}

// ─── Diplomas ────────────────────────────────────────────────────────────────

export async function crearDiploma(db: PrismaClient, input: DiplomaInput) {
  const nombre = texto(input.nombre);
  const titulo = texto(input.titulo);
  const fecha = texto(input.fecha_entrega);
  if (!nombre) throw new ErrorValidacion("El nombre es obligatorio");
  if (!titulo) throw new ErrorValidacion("El título es obligatorio");
  if (!esFechaIsoValida(fecha)) throw new ErrorValidacion("La fecha de entrega debe tener el formato AAAA-MM-DD");

  return db.diploma.create({
    data: {
      nombre,
      titulo,
      descripcion: textoONulo(input.descripcion),
      fecha_entrega: fecha,
      notas: textoONulo(input.notas),
      id_plantilla: await resolverPlantillaId(db, input.id_plantilla),
    },
    include: { plantilla: true },
  });
}

export async function actualizarDiploma(db: PrismaClient, id: number, input: DiplomaInput) {
  const existente = await db.diploma.findUnique({ where: { id_diploma: id } });
  if (!existente) return null;

  const data: Record<string, unknown> = {};
  if (input.nombre !== undefined) {
    if (!texto(input.nombre)) throw new ErrorValidacion("El nombre es obligatorio");
    data.nombre = texto(input.nombre);
  }
  if (input.titulo !== undefined) {
    if (!texto(input.titulo)) throw new ErrorValidacion("El título es obligatorio");
    data.titulo = texto(input.titulo);
  }
  if (input.fecha_entrega !== undefined) {
    if (!esFechaIsoValida(texto(input.fecha_entrega))) {
      throw new ErrorValidacion("La fecha de entrega debe tener el formato AAAA-MM-DD");
    }
    data.fecha_entrega = texto(input.fecha_entrega);
  }
  if (input.descripcion !== undefined) data.descripcion = textoONulo(input.descripcion);
  if (input.notas !== undefined) data.notas = textoONulo(input.notas);
  if (input.id_plantilla !== undefined) data.id_plantilla = await resolverPlantillaId(db, input.id_plantilla);

  return db.diploma.update({ where: { id_diploma: id }, data, include: { plantilla: true } });
}

export async function obtenerDiplomas(
  db: PrismaClient,
  filtros: { q?: string; desde?: string; hasta?: string } = {}
) {
  const q = filtros.q?.trim();
  return db.diploma.findMany({
    where: {
      ...(q
        ? { OR: [{ nombre: { contains: q } }, { titulo: { contains: q } }, { descripcion: { contains: q } }] }
        : {}),
      ...(filtros.desde || filtros.hasta
        ? {
            fecha_entrega: {
              ...(filtros.desde ? { gte: filtros.desde } : {}),
              ...(filtros.hasta ? { lte: filtros.hasta } : {}),
            },
          }
        : {}),
    },
    include: { plantilla: true },
    orderBy: [{ fecha_entrega: "desc" }, { id_diploma: "desc" }],
  });
}

export async function obtenerDiplomaPorId(db: PrismaClient, id: number) {
  return db.diploma.findUnique({ where: { id_diploma: id }, include: { plantilla: true } });
}

export async function eliminarDiploma(db: PrismaClient, id: number): Promise<boolean> {
  const existente = await db.diploma.findUnique({ where: { id_diploma: id } });
  if (!existente) return false;
  await db.diploma.delete({ where: { id_diploma: id } });
  return true;
}

export function codigoDiploma(d: { id_diploma: number; fecha_entrega: string }): string {
  return `DIP-${d.fecha_entrega.slice(0, 4)}-${String(d.id_diploma).padStart(3, "0")}`;
}

// ─── Plantillas ──────────────────────────────────────────────────────────────

/**
 * Elimina lo ejecutable de una plantilla subida: scripts, iframes, formularios, eventos on*=
 * y URLs javascript:. Es una defensa adicional: la interfaz además muestra el diploma
 * en un iframe con `sandbox` (sin scripts).
 */
export function sanitizarHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<\/?(?:script|iframe|frame|frameset|object|embed|applet|link|base|form|meta)\b[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(\b(?:href|src|xlink:href|action|formaction)\s*=\s*["']?)\s*(?:javascript|vbscript|data:text\/html)[^"'>\s]*/gi, "$1#");
}

export interface PlantillaInput {
  nombre?: unknown;
  descripcion?: unknown;
  html?: unknown;
}

export function validarPlantilla(input: PlantillaInput): { nombre: string; descripcion: string | null; html: string } {
  const nombre = texto(input.nombre);
  const html = typeof input.html === "string" ? input.html : "";
  if (!nombre) throw new ErrorValidacion("El nombre de la plantilla es obligatorio");
  if (!html.trim()) throw new ErrorValidacion("El archivo HTML está vacío");
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_PLANTILLA_BYTES) {
    throw new ErrorValidacion("La plantilla supera el tamaño máximo de 512 KB");
  }
  if (!/\{\{\s*nombre\s*\}\}/.test(html) || !/\{\{\s*titulo\s*\}\}/.test(html)) {
    throw new ErrorValidacion("La plantilla debe incluir al menos los marcadores {{nombre}} y {{titulo}}");
  }
  return { nombre, descripcion: textoONulo(input.descripcion), html: sanitizarHtml(html) };
}

export async function crearPlantilla(db: PrismaClient, input: PlantillaInput) {
  const data = validarPlantilla(input);
  const duplicada = await db.plantillaDiploma.findUnique({ where: { nombre: data.nombre } });
  if (duplicada) throw new ErrorValidacion("Ya existe una plantilla con ese nombre");
  return db.plantillaDiploma.create({ data });
}

export async function obtenerPlantillas(db: PrismaClient) {
  return db.plantillaDiploma.findMany({
    orderBy: [{ es_predeterminada: "desc" }, { nombre: "asc" }],
    include: { _count: { select: { diplomas: true } } },
  });
}

export async function obtenerPlantillaPorId(db: PrismaClient, id: number) {
  return db.plantillaDiploma.findUnique({ where: { id_plantilla: id } });
}

export async function eliminarPlantilla(db: PrismaClient, id: number): Promise<boolean> {
  const existente = await db.plantillaDiploma.findUnique({ where: { id_plantilla: id } });
  if (!existente) return false;
  // Los diplomas que la usaban vuelven al diseño por defecto (onDelete: SetNull).
  await db.plantillaDiploma.delete({ where: { id_plantilla: id } });
  return true;
}

/** Marca una plantilla como predeterminada (o quita la marca si `id` es null: vuelve al diseño del sistema). */
export async function establecerPlantillaPredeterminada(db: PrismaClient, id: number | null) {
  if (id !== null) {
    const existente = await db.plantillaDiploma.findUnique({ where: { id_plantilla: id } });
    if (!existente) return null;
  }
  await db.$transaction([
    db.plantillaDiploma.updateMany({ data: { es_predeterminada: false } }),
    ...(id !== null
      ? [db.plantillaDiploma.update({ where: { id_plantilla: id }, data: { es_predeterminada: true } })]
      : []),
  ]);
  return true;
}

// ─── Renderizado ─────────────────────────────────────────────────────────────

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatearFechaLarga(iso: string): string {
  if (!esFechaIsoValida(iso)) return iso;
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

const escaparHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Sustituye los marcadores {{...}} escapando el contenido para que no pueda inyectar HTML. */
export function aplicarPlantilla(
  html: string,
  diploma: { id_diploma: number; nombre: string; titulo: string; descripcion: string | null; fecha_entrega: string; notas: string | null }
): string {
  const valores: Record<string, string> = {
    nombre: diploma.nombre,
    titulo: diploma.titulo,
    descripcion: diploma.descripcion ?? "",
    fecha_entrega: formatearFechaLarga(diploma.fecha_entrega),
    fecha_entrega_iso: diploma.fecha_entrega,
    notas: diploma.notas ?? "",
    codigo: codigoDiploma(diploma),
    organizacion: ORGANIZACION,
  };
  return html.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, clave: string) => escaparHtml(valores[clave.toLowerCase()] ?? ""));
}

/**
 * Orden de resolución de la plantilla:
 * 1) la indicada en la vista previa (`plantillaId`) o la asignada al diploma,
 * 2) la marcada como predeterminada,
 * 3) el diseño por defecto del sistema.
 */
export async function renderizarDiploma(
  db: PrismaClient,
  id: number,
  opciones: { plantillaId?: number | "default" } = {}
): Promise<{ html: string; plantilla: string } | null> {
  const diploma = await obtenerDiplomaPorId(db, id);
  if (!diploma) return null;

  let plantilla: { nombre: string; html: string } | null = null;
  if (opciones.plantillaId === "default") {
    plantilla = null;
  } else if (typeof opciones.plantillaId === "number") {
    plantilla = await obtenerPlantillaPorId(db, opciones.plantillaId);
    if (!plantilla) throw new ErrorValidacion("La plantilla indicada no existe");
  } else if (diploma.plantilla) {
    plantilla = diploma.plantilla;
  } else {
    plantilla = await db.plantillaDiploma.findFirst({ where: { es_predeterminada: true } });
  }

  return {
    html: aplicarPlantilla(plantilla?.html ?? PLANTILLA_PREDETERMINADA_HTML, diploma),
    plantilla: plantilla?.nombre ?? "Predeterminada del sistema",
  };
}
