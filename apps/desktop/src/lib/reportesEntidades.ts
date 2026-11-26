// Definición de las entidades exportables/consultables en Reportes.
// Una sola definición de columnas alimenta tanto las tablas en pantalla como los archivos .xlsx.
import type { TonoTag } from "./dataTable";

export const SIDECAR_URL = "http://127.0.0.1:4111";

export type Fila = Record<string, string | number>;
export type TipoColumna = "texto" | "numero" | "moneda";

export interface ColumnaEntidad {
  key: string;
  header: string;
  tipo?: TipoColumna;
  /** "tabla": solo en pantalla · "excel": solo en el archivo · por defecto, ambas. */
  vista?: "tabla" | "excel";
  /** Muestra el valor como etiqueta con punto de color. */
  tono?: (valor: string) => TonoTag;
}

export type EntidadId =
  | "actividades"
  | "mujeres"
  | "ninos"
  | "voluntarios"
  | "coordinadores"
  | "donantes"
  | "donaciones"
  | "viveres";

export interface DatosFuente {
  mujeres: any[];
  ninos: any[];
  voluntarios: any[];
  coordinadores: any[];
  eventos: any[];
  jornadas: any[];
  donantes: any[];
  donaciones: any[];
  viveres: any[];
}

export interface Entidad {
  id: EntidadId;
  label: string;
  hoja: string;
  descripcion: string;
  columnas: ColumnaEntidad[];
  construir(d: DatosFuente): Fila[];
}

const lista = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));
const nombreCompleto = (p: any) => `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim();

const tonoEstadoActividad = (v: string): TonoTag =>
  v === "Finalizado" ? "ok" : v === "En curso" ? "accent" : v === "Planificado" ? "info" : "neutral";
const tonoEstadoStock = (v: string): TonoTag => (v === "Óptimo" ? "ok" : v === "Bajo Stock" ? "warn" : v === "Crítico" ? "danger" : "neutral");
const tonoActivo = (v: string): TonoTag => (v === "Activo" ? "ok" : "neutral");

const columnasPersonaVoluntaria: ColumnaEntidad[] = [
  { key: "nombre", header: "Nombre" },
  { key: "tipo", header: "Tipo" },
  { key: "especialidad", header: "Rol / especialidad" },
  { key: "email", header: "Correo" },
  { key: "telefono", header: "Teléfono" },
  { key: "disponibilidad", header: "Disponibilidad" },
  { key: "horas", header: "Horas acumuladas", tipo: "numero" },
  { key: "estado", header: "Estado", tono: tonoActivo },
];

const filaVoluntario = (v: any): Fila => ({
  nombre: v.nombre || nombreCompleto(v),
  tipo: v.tipo ?? "",
  especialidad: v.especialidad ?? "",
  email: v.email ?? "",
  telefono: v.telefono ?? "",
  disponibilidad: v.disponibilidad ?? "",
  horas: Number(v.horasAcumuladas) || 0,
  estado: v.estado ?? "Activo",
});

export const ENTIDADES: Entidad[] = [
  {
    id: "actividades",
    label: "Jornadas y eventos",
    hoja: "Jornadas y eventos",
    descripcion: "Actividades con fecha, coordinador, asistencia y presupuesto",
    columnas: [
      { key: "tipo", header: "Tipo" },
      { key: "titulo", header: "Actividad" },
      { key: "categoria", header: "Categoría" },
      { key: "estado", header: "Estado", tono: tonoEstadoActividad },
      { key: "fecha", header: "Fecha" },
      { key: "horario", header: "Horario", vista: "excel" },
      { key: "ubicacion", header: "Ubicación", vista: "excel" },
      { key: "coordinador", header: "Coordinador" },
      { key: "convocados", header: "Convocados", tipo: "numero" },
      { key: "asistieron", header: "Asistieron", tipo: "numero" },
      { key: "voluntarios", header: "Voluntarios", tipo: "numero", vista: "excel" },
      { key: "presupuesto", header: "Presupuesto", tipo: "moneda", vista: "excel" },
      { key: "ejecutado", header: "Ejecutado", tipo: "moneda" },
    ],
    construir: (d) =>
      [
        ...d.jornadas.map((x) => ({ ...x, _tipo: "Jornada" })),
        ...d.eventos.map((x) => ({ ...x, _tipo: "Evento" })),
      ]
        .sort((a, b) => String(a.fecha ?? "").localeCompare(String(b.fecha ?? "")))
        .map((a) => ({
          tipo: a._tipo,
          titulo: a.titulo ?? "",
          categoria: a.categoria ?? "",
          estado: a.estado ?? "",
          fecha: a.fecha ?? "",
          horario: a.horario ?? "",
          ubicacion: a.ubicacion ?? "",
          coordinador: a.coordinador ?? "",
          convocados: Number(a.convocados) || 0,
          asistieron: Number(a.asistieron) || 0,
          voluntarios: Number(a.voluntariosAsignados) || 0,
          presupuesto: Number(a.presupuestoTotal) || 0,
          ejecutado: Number(a.presupuestoEjecutado) || 0,
        })),
  },
  {
    id: "mujeres",
    label: "Mujeres",
    hoja: "Mujeres",
    descripcion: "Perfiles, hogar, programas y seguimiento",
    columnas: [
      { key: "codigo", header: "Código" },
      { key: "nombre", header: "Nombre", vista: "tabla" },
      { key: "nombres", header: "Nombres", vista: "excel" },
      { key: "apellidos", header: "Apellidos", vista: "excel" },
      { key: "dpi", header: "DPI", vista: "excel" },
      { key: "edad", header: "Edad", tipo: "numero" },
      { key: "colonia", header: "Colonia" },
      { key: "direccion", header: "Dirección", vista: "excel" },
      { key: "telefono", header: "Teléfono" },
      { key: "ocupacion", header: "Ocupación" },
      { key: "estadoCivil", header: "Estado civil", vista: "excel" },
      { key: "terceraEdad", header: "Tercera edad", vista: "excel" },
      { key: "hijos", header: "Hijos a cargo", tipo: "numero" },
      { key: "ingreso", header: "Fuente de ingreso" },
      { key: "programas", header: "Programas", vista: "excel" },
      { key: "problemas", header: "Problemas sociales", vista: "excel" },
      { key: "nota", header: "Nota de seguimiento", vista: "excel" },
    ],
    construir: (d) =>
      d.mujeres.map((m) => ({
        codigo: m.codigo ?? "",
        nombre: nombreCompleto(m),
        nombres: m.nombres ?? "",
        apellidos: m.apellidos ?? "",
        dpi: m.dpi ?? "",
        edad: Number(m.edad) || 0,
        colonia: m.colonia ?? "",
        direccion: m.direccion ?? "",
        telefono: m.telefono ?? "",
        ocupacion: m.ocupacion ?? "",
        estadoCivil: m.estadoCivil ?? "",
        terceraEdad: m.terceraEdad ?? "",
        hijos: Number(m.hijosACargo) || 0,
        ingreso: m.fuentesDeIngreso ?? "",
        programas: lista(m.programas),
        problemas: lista(m.problemasSociales),
        nota: m.nota ?? "",
      })),
  },
  {
    id: "ninos",
    label: "Niños",
    hoja: "Niños",
    descripcion: "Perfiles vinculados a su madre o tutora",
    columnas: [
      { key: "codigo", header: "Código" },
      { key: "nombre", header: "Nombre", vista: "tabla" },
      { key: "nombres", header: "Nombres", vista: "excel" },
      { key: "apellidos", header: "Apellidos", vista: "excel" },
      { key: "edad", header: "Edad", tipo: "numero" },
      { key: "madre", header: "Madre / tutora" },
      { key: "dpiMadre", header: "DPI de la madre", vista: "excel" },
      { key: "escolaridad", header: "Escolaridad" },
      { key: "camisa", header: "Talla camisa", vista: "excel" },
      { key: "pantalon", header: "Talla pantalón", vista: "excel" },
      { key: "calzado", header: "Talla calzado", vista: "excel" },
      { key: "observaciones", header: "Observaciones" },
    ],
    construir: (d) => {
      const madres = new Map(d.mujeres.map((m) => [String(m.id), nombreCompleto(m)]));
      return d.ninos.map((n) => ({
        codigo: n.codigo ?? "",
        nombre: nombreCompleto(n),
        nombres: n.nombres ?? "",
        apellidos: n.apellidos ?? "",
        edad: Number(n.edad) || 0,
        madre: madres.get(String(n.mujerId)) ?? "",
        dpiMadre: n.dpiMadre ?? "",
        escolaridad: n.escolaridad ?? "",
        camisa: n.tallaCamisa ?? "",
        pantalon: n.tallaPantalon ?? "",
        calzado: n.tallaCalzado ?? "",
        observaciones: n.observaciones ?? "",
      }));
    },
  },
  {
    id: "voluntarios",
    label: "Voluntarios",
    hoja: "Voluntarios",
    descripcion: "Equipo propio y externo, con horas acumuladas",
    columnas: columnasPersonaVoluntaria,
    construir: (d) => d.voluntarios.map(filaVoluntario),
  },
  {
    id: "coordinadores",
    label: "Coordinadores",
    hoja: "Coordinadores",
    descripcion: "Responsables de eventos y jornadas",
    columnas: columnasPersonaVoluntaria,
    construir: (d) => d.coordinadores.map(filaVoluntario),
  },
  {
    id: "donantes",
    label: "Donantes",
    hoja: "Donantes",
    descripcion: "Personas individuales y jurídicas con NIT",
    columnas: [
      { key: "nit", header: "NIT" },
      { key: "nombre", header: "Nombre o razón social" },
      { key: "tipo", header: "Tipo de entidad" },
      { key: "clasificacion", header: "Aporte" },
      { key: "telefono", header: "Teléfono" },
      { key: "email", header: "Correo" },
      { key: "direccion", header: "Dirección", vista: "excel" },
      { key: "contacto", header: "Contacto / representante", vista: "excel" },
    ],
    construir: (d) =>
      d.donantes.map((x) => ({
        nit: x.nit ?? "",
        nombre: x.nombre ?? "",
        tipo: x.tipoPersona || x.tipo || "",
        clasificacion: x.clasificacion ?? "",
        telefono: x.telefono ?? "",
        email: x.email ?? "",
        direccion: x.direccion ?? "",
        contacto: x.juridica?.representanteLegal || x.personaContacto || "",
      })),
  },
  {
    id: "donaciones",
    label: "Donaciones económicas",
    hoja: "Donaciones",
    descripcion: "Aportes en Quetzales con recibo y destino",
    columnas: [
      { key: "recibo", header: "Recibo" },
      { key: "fecha", header: "Fecha" },
      { key: "donante", header: "Donante" },
      { key: "nit", header: "NIT", vista: "excel" },
      { key: "tipo", header: "Tipo", vista: "excel" },
      { key: "destino", header: "Destino" },
      { key: "descripcion", header: "Descripción", vista: "excel" },
      { key: "monto", header: "Monto", tipo: "moneda" },
    ],
    construir: (d) =>
      d.donaciones.map((x) => ({
        recibo: x.recibo ?? "",
        fecha: x.fecha ?? "",
        donante: x.donante ?? "",
        nit: x.nit ?? "",
        tipo: x.tipoPersona || x.tipo || "",
        destino: x.destino ?? "",
        descripcion: x.descripcion ?? "",
        monto: Number(x.monto) || 0,
      })),
  },
  {
    id: "viveres",
    label: "Víveres (inventario)",
    hoja: "Víveres",
    descripcion: "Donativos en especie y estado del inventario",
    columnas: [
      { key: "articulo", header: "Artículo" },
      { key: "categoria", header: "Categoría" },
      { key: "fuente", header: "Fuente" },
      { key: "descripcion", header: "Descripción", vista: "excel" },
      { key: "cantidad", header: "Cantidad", tipo: "numero" },
      { key: "unidad", header: "Unidad" },
      { key: "minimo", header: "Mínimo", tipo: "numero" },
      { key: "bodega", header: "Bodega" },
      { key: "estado", header: "Estado", tono: tonoEstadoStock },
    ],
    construir: (d) =>
      d.viveres.map((x) => ({
        articulo: x.nombre ?? "",
        categoria: x.categoria ?? "",
        fuente: x.fuente ?? "",
        descripcion: x.descripcion ?? "",
        cantidad: Number(x.cantidadActual) || 0,
        unidad: x.unidad ?? "",
        minimo: Number(x.minimo) || 0,
        bodega: x.ubicacionBodega ?? "",
        estado: x.estado ?? "",
      })),
  },
];

const ENDPOINTS: Partial<Record<keyof DatosFuente, string>> = {
  mujeres: "/mujeres",
  ninos: "/ninos",
  voluntarios: "/voluntarios",
  coordinadores: "/coordinadores",
  eventos: "/eventos",
  jornadas: "/jornadas",
  donantes: "/donantes",
  donaciones: "/donaciones",
};

/** Pide los datos actuales al sidecar; si alguno falla usa los embebidos al compilar la página. */
export async function cargarDatos(embebidos: DatosFuente): Promise<{ datos: DatosFuente; enVivo: boolean }> {
  const datos: DatosFuente = { ...embebidos };
  let enVivo = true;
  await Promise.all(
    (Object.entries(ENDPOINTS) as [keyof DatosFuente, string][]).map(async ([clave, ruta]) => {
      try {
        const res = await fetch(`${SIDECAR_URL}${ruta}`, { signal: AbortSignal.timeout(4000) });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) datos[clave] = json.data;
        else enVivo = false;
      } catch {
        enVivo = false;
      }
    })
  );
  return { datos, enVivo };
}

export const columnasExcel = (e: Entidad) => e.columnas.filter((c) => c.vista !== "tabla");
export const columnasTabla = (e: Entidad) => e.columnas.filter((c) => c.vista !== "excel");

/** Genera un libro .xlsx con una hoja por entidad. */
export async function generarXlsx(entidades: Entidad[], datos: DatosFuente): Promise<Uint8Array> {
  const ExcelJS = (await import("exceljs")).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = "Lumbreras de Amor";
  libro.created = new Date();

  for (const entidad of entidades) {
    const cols = columnasExcel(entidad);
    const filas = entidad.construir(datos);
    const hoja = libro.addWorksheet(entidad.hoja.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });

    hoja.columns = cols.map((c) => {
      const largo = Math.max(c.header.length, ...filas.map((f) => String(f[c.key] ?? "").length));
      return {
        header: c.header,
        key: c.key,
        width: Math.min(Math.max(largo + 3, 11), 55),
        style: c.tipo === "moneda" ? { numFmt: '"Q" #,##0.00' } : {},
      };
    });
    hoja.addRows(filas);

    const encabezado = hoja.getRow(1);
    encabezado.height = 24;
    encabezado.eachCell((celda) => {
      celda.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C1763" } };
      celda.alignment = { vertical: "middle", horizontal: "left" };
    });
    cols.forEach((c, i) => {
      if (c.tipo === "numero" || c.tipo === "moneda") {
        hoja.getColumn(i + 1).alignment = { horizontal: "right" };
        encabezado.getCell(i + 1).alignment = { vertical: "middle", horizontal: "right" };
      }
    });
    if (filas.length > 0) hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  }

  const buffer = await libro.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
