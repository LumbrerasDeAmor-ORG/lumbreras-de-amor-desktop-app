// apps/desktop/src/lib/mockData.ts
//
// Los módulos de Mujeres y Niños consumen la base de datos SQLite local
// (packages/database/local.db) a través del Sidecar (http://127.0.0.1:4111)
// o directamente mediante @lumbreras/database en tiempo de compilación/SSR.
// El resto de módulos permanecen con datos mock.

const SIDECAR_BASE_URL = "http://127.0.0.1:4111";

export type FuentesIngreso =
  | "desempleada"
  | "vendedora informal"
  | "asalariada"
  | "dependiente"
  | "asalariada y dependiente";

export type Vulnerabilidad = FuentesIngreso;

export interface Mujer {
  id: string;
  codigo: string;
  dpi: string;
  nombres: string;
  apellidos: string;
  edad: number;
  colonia: string;
  comunidad: string;
  direccion: string;
  telefono: string;
  ocupacion: string;
  estadoCivil: string;
  terceraEdad: "Sí" | "No";
  hijosACargo: number;
  programas: string[]; // programas/talleres en los que participa
  problemasSociales: string[]; // problemas sociales identificados
  fuentesDeIngreso: FuentesIngreso;
  vulnerabilidad: Vulnerabilidad;
  nota?: string; // alerta o nota de seguimiento, ej: "Requiere apoyo psicológico"
}

export interface Nino {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  edad: number;
  mujerId: string; // vínculo interno con el perfil de la madre/tutora
  dpiMadre: string; // DPI de la madre: es el dato que captura el formulario de registro
  escolaridad: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaCalzado?: string;
  observaciones?: string; // texto libre: alergias, condiciones médicas, notas
}

export async function getMujeres(): Promise<Mujer[]> {
  try {
    const res = await fetch(`${SIDECAR_BASE_URL}/mujeres`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const payload = (await res.json()) as { success: boolean; data: Mujer[] };
      if (payload.success && Array.isArray(payload.data)) {
        return payload.data;
      }
    }
  } catch (err) {
    console.warn("[mockData] No se pudo conectar al Sidecar (/mujeres):", (err as Error).message);
  }
  return [];
}

export async function getMujerById(id: string): Promise<Mujer | undefined> {
  try {
    const res = await fetch(`${SIDECAR_BASE_URL}/mujeres/${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const payload = (await res.json()) as { success: boolean; data: Mujer };
      if (payload.success && payload.data) {
        return payload.data;
      }
    }
  } catch (err) {
    console.warn(`[mockData] No se pudo conectar al Sidecar (/mujeres/${id}):`, (err as Error).message);
  }

  const mujeres = await getMujeres();
  return mujeres.find((m) => m.id === id || m.codigo === id);
}

// NIÑOS (módulo secundario, vinculado a un perfil de Mujer en SQLite)

export async function getNinos(): Promise<Nino[]> {
  try {
    const res = await fetch(`${SIDECAR_BASE_URL}/ninos`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const payload = (await res.json()) as { success: boolean; data: Nino[] };
      if (payload.success && Array.isArray(payload.data)) {
        return payload.data;
      }
    }
  } catch (err) {
    console.warn("[mockData] No se pudo conectar al Sidecar (/ninos):", (err as Error).message);
  }
  return [];
}

export async function getNinoById(id: string): Promise<Nino | undefined> {
  try {
    const res = await fetch(`${SIDECAR_BASE_URL}/ninos/${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const payload = (await res.json()) as { success: boolean; data: Nino };
      if (payload.success && payload.data) {
        return payload.data;
      }
    }
  } catch (err) {
    console.warn(`[mockData] No se pudo conectar al Sidecar (/ninos/${id}):`, (err as Error).message);
  }

  const ninos = await getNinos();
  return ninos.find((n) => n.id === id || n.codigo === id);
}


// EVENTOS & ASISTENCIA


export interface Evento {
  id: string;
  titulo: string;
  categoria: string;
  estado: "Planificado" | "Finalizado";
  descripcion: string;
  fecha: string;
  horario: string;
  ubicacion: string;
  coordinador: string;
  presupuestoEjecutado: number;
  presupuestoTotal: number;
  convocados: number;
  asistieron: number;
  voluntariosAsignados: number;
}

const EVENTOS: Evento[] = [
  { id: "evt-001", titulo: "Celebración Día de la Madre con las Mujeres de la Comunidad", categoria: "Celebración", estado: "Planificado", descripcion: "Convivio con refacción, música y reconocimiento a las mujeres que participan en los talleres de la organización.", fecha: "2026-10-30", horario: "15:00 - 19:00", ubicacion: "Sede Lumbreras de Amor", coordinador: "Lic. Laura Camila Ortiz", presupuestoEjecutado: 0, presupuestoTotal: 900, convocados: 40, asistieron: 0, voluntariosAsignados: 6 },
  { id: "evt-002", titulo: "Cena Benéfica Lumbreras de Amor", categoria: "Recaudación de Fondos", estado: "Planificado", descripcion: "Cena con donantes y aliados para recaudar fondos a favor de los programas de la organización.", fecha: "2026-11-14", horario: "18:30 - 22:00", ubicacion: "Salón Social Villa Esperanza", coordinador: "Mariana Duque Zuluaga", presupuestoEjecutado: 200, presupuestoTotal: 1500, convocados: 60, asistieron: 0, voluntariosAsignados: 8 },
  { id: "evt-003", titulo: "Taller de Capacitación para Voluntarios", categoria: "Capacitación", estado: "Finalizado", descripcion: "Inducción sobre trato a las familias, manejo de grupos y registro de asistencia en terreno.", fecha: "2026-09-19", horario: "09:00 - 12:00", ubicacion: "Sede Lumbreras de Amor", coordinador: "Prof. Andrés Felipe Ruiz", presupuestoEjecutado: 180, presupuestoTotal: 200, convocados: 6, asistieron: 6, voluntariosAsignados: 2 },
];

export async function getEventos(): Promise<Evento[]> {
  return EVENTOS;
}
// JORNADAS (módulo independiente de Eventos)

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  atendidos: number; // personas atendidas en este servicio
}

export interface Jornada extends Evento {
  servicios: Servicio[]; // servicios que se prestan dentro de la jornada
}

const JORNADAS: Jornada[] = [
  { id: "jor-001", titulo: "Gran Jornada de Salud Integral y Nutrición Comunitaria", categoria: "Jornada de Salud", estado: "Finalizado", descripcion: "Valoración médica general, control de talla y peso, entrega de suplementos multivitamínicos y kits de higiene.", fecha: "2026-08-08", horario: "08:30 - 13:30", ubicacion: "Centro Comunitario San Jerónimo (Villa Esperanza)", coordinador: "Lic. Laura Camila Ortiz", presupuestoEjecutado: 1150, presupuestoTotal: 1200, convocados: 8, asistieron: 7, voluntariosAsignados: 3, servicios: [
    { id: "srv-001", nombre: "Valoración médica general", descripcion: "Consulta médica básica y revisión de signos vitales.", responsable: "Dra. Carolina Méndez", atendidos: 7 },
    { id: "srv-002", nombre: "Control de talla y peso", descripcion: "Medición antropométrica para el seguimiento nutricional.", responsable: "Lic. Laura Camila Ortiz", atendidos: 7 },
    { id: "srv-003", nombre: "Entrega de suplementos y kits de higiene", descripcion: "Multivitamínicos y kits de cuidado bucal y personal.", responsable: "Carlos Alberto Navarro", atendidos: 7 },
  ] },
  { id: "jor-002", titulo: "Jornada Comunitaria de Integración Familiar & Talleres de Creatividad", categoria: "Jornada de Integración Familiar", estado: "Planificado", descripcion: "Estaciones de pintura, dinámicas grupales, y entrega de materiales didácticos y recreativos.", fecha: "2026-08-22", horario: "14:00 - 18:00", ubicacion: "Cancha Polideportiva Brisas del Sur", coordinador: "Mariana Duque Zuluaga", presupuestoEjecutado: 650, presupuestoTotal: 1800, convocados: 8, asistieron: 8, voluntariosAsignados: 5, servicios: [
    { id: "srv-004", nombre: "Estaciones de pintura y creatividad", descripcion: "Taller de pintura y obra reflexiva con valores de paz.", responsable: "Mariana Duque Zuluaga", atendidos: 8 },
    { id: "srv-005", nombre: "Dinámicas grupales", descripcion: "Juegos y actividades de integración familiar.", responsable: "Mariana Duque Zuluaga", atendidos: 8 },
    { id: "srv-006", nombre: "Entrega de materiales didácticos", descripcion: "Materiales recreativos y educativos para las familias.", responsable: "Carlos Alberto Navarro", atendidos: 0 },
  ] },
  { id: "jor-003", titulo: "Comedor Solidario & Entrega de Mercados Nutricionales", categoria: "Comedor Comunitario", estado: "Finalizado", descripcion: "Almuerzo caliente balanceado y entrega de canasta de víveres esenciales a familias de alta vulnerabilidad.", fecha: "2026-07-26", horario: "11:30 - 15:00", ubicacion: "Sede Lumbreras de Amor", coordinador: "Chef Martha Cecilia Rojas", presupuestoEjecutado: 920, presupuestoTotal: 950, convocados: 6, asistieron: 5, voluntariosAsignados: 3, servicios: [
    { id: "srv-007", nombre: "Almuerzo caliente balanceado", descripcion: "Comida nutritiva servida en el comedor comunitario.", responsable: "Chef Martha Cecilia Rojas", atendidos: 5 },
    { id: "srv-008", nombre: "Entrega de canasta de víveres", descripcion: "Mercado nutricional para familias de alta vulnerabilidad.", responsable: "Carlos Alberto Navarro", atendidos: 5 },
  ]},
  { id: "jor-004", titulo: 'Campaña Educativa "Semillas de Esperanza y Conocimiento"', categoria: "Entrega de Kits & Víveres", estado: "Finalizado", descripcion: "Dotación de morrales con útiles completos, reglas, tijeras y recipientes para hidratación.", fecha: "2026-07-12", horario: "09:00 - 13:00", ubicacion: "Sede Comunitaria La Esperanza", coordinador: "Prof. Andrés Felipe Ruiz", presupuestoEjecutado: 1420, presupuestoTotal: 1500, convocados: 5, asistieron: 5, voluntariosAsignados: 3, servicios: [
    { id: "srv-009", nombre: "Entrega de morrales con útiles", descripcion: "Cuadernos, reglas, tijeras y colores completos.", responsable: "Prof. Andrés Felipe Ruiz", atendidos: 5 },
    { id: "srv-010", nombre: "Entrega de recipientes para hidratación", descripcion: "Botellas reutilizables para cada niño beneficiado.", responsable: "Prof. Andrés Felipe Ruiz", atendidos: 5 },
  ] },
];

export async function getJornadas(): Promise<Jornada[]> {
  return JORNADAS;
}

export async function getJornadaById(id: string): Promise<Jornada | undefined> {
  return JORNADAS.find((j) => j.id === id);
}





// VÍVERES & DONACIONES

export interface ItemViveres {
  id: string;
  nombre: string;
  categoria: string;
  fuente: string;
  cantidadActual: number;
  unidad: string;
  minimo: number;
  ubicacionBodega: string;
  estado: "Óptimo" | "Bajo Stock" | "Crítico";
}

const VIVERES: ItemViveres[] = [
  { id: "viv-001", nombre: "Leche entera en polvo fortificada (Bolsa 900g)", categoria: "Nutrición & Suplementos", fuente: "Donación Corporativa Lácteos del Valle", cantidadActual: 38, unidad: "bolsas", minimo: 20, ubicacionBodega: "Bodega A - Estante 1", estado: "Óptimo" },
  { id: "viv-002", nombre: "Arroz blanco seleccionado (Bolsa 1kg)", categoria: "Víveres no perecederos", fuente: "Campaña Supermercados Amigos", cantidadActual: 85, unidad: "kg", minimo: 40, ubicacionBodega: "Bodega A - Tarima 3", estado: "Óptimo" },
  { id: "viv-003", nombre: "Suplemento nutricional fortificado multivitamínico (Lata 400g)", categoria: "Nutrición & Suplementos", fuente: "Dra. Carolina Méndez (Donación particular)", cantidadActual: 4, unidad: "latas", minimo: 10, ubicacionBodega: "Bodega A - Estante 1", estado: "Crítico" },
  { id: "viv-004", nombre: "Cajas de Colores y Marcadores (12 unidades)", categoria: "Material Educativo & Didáctico", fuente: "Voluntarios de Educación", cantidadActual: 14, unidad: "cajas", minimo: 25, ubicacionBodega: "Estante B - Material Didáctico", estado: "Bajo Stock" },
  { id: "viv-005", nombre: "Calzado y Ropa Comunitaria Surtida", categoria: "Ropa y Calzado", fuente: "Campaña Paso Firme", cantidadActual: 8, unidad: "pares", minimo: 15, ubicacionBodega: "Bodega C - Ropa", estado: "Bajo Stock" },
];

export async function getViveres(): Promise<ItemViveres[]> {
  return VIVERES;
}


// EQUIPO DE VOLUNTARIOS


export interface Voluntario {
  id: string;
  nombre: string;
  especialidad: string;
  email: string;
  telefono: string;
  disponibilidad: string;
  habilidades: string[];
  horasAcumuladas: number;
}

const VOLUNTARIOS: Voluntario[] = [
  { id: "vol-001", nombre: "Dra. Carolina Méndez", especialidad: "Médico / Salud", email: "carolina.mendez@lumbrerasdeamor.org", telefono: "+57 311 500 9081", disponibilidad: "Fines de semana", habilidades: ["Medicina General", "Primeros Auxilios", "Tamizaje Nutricional"], horasAcumuladas: 48 },
  { id: "vol-002", nombre: "Prof. Andrés Felipe Ruiz", especialidad: "Tutor Pedagógico", email: "andres.ruiz@lumbrerasdeamor.org", telefono: "+57 300 445 6789", disponibilidad: "Tardes", habilidades: ["Pedagogía Social", "Matemáticas Lúdicas", "Lectoescritura"], horasAcumuladas: 62 },
  { id: "vol-003", nombre: "Mariana Duque Zuluaga", especialidad: "Recreador / Dinámicas", email: "mariana.duque@lumbrerasdeamor.org", telefono: "+57 316 789 0123", disponibilidad: "Fines de semana", habilidades: ["Teatro Social", "Artes Plásticas", "Manejo de Grupos Grandes"], horasAcumuladas: 75 },
  { id: "vol-004", nombre: "Carlos Alberto Navarro", especialidad: "Apoyo Logístico", email: "carlos.navarro@lumbrerasdeamor.org", telefono: "+57 313 609 8811", disponibilidad: "Tiempo completo", habilidades: ["Transporte de Cargas", "Montaje de Eventos", "Control de Inventario"], horasAcumuladas: 94 },
  { id: "vol-005", nombre: "Chef Martha Cecilia Rojas", especialidad: "Cocina y Nutrición", email: "martha.rojas@lumbrerasdeamor.org", telefono: "+57 318 200 4499", disponibilidad: "Fines de semana", habilidades: ["Manipulación de Alimentos", "Menús Nutricionales Balanceados", "Cocina Masiva"], horasAcumuladas: 82 },
  { id: "vol-006", nombre: "Lic. Laura Camila Ortiz", especialidad: "Coordinador", email: "laura.ortiz@lumbrerasdeamor.org", telefono: "+57 315 432 1098", disponibilidad: "Tiempo completo", habilidades: ["Trabajo Social", "Gestión de Donantes", "Coordinación General"], horasAcumuladas: 160 },
];

export async function getVoluntarios(): Promise<Voluntario[]> {
  return VOLUNTARIOS;
}


// DONACIONES (para transparencia en Reportes)
export interface Donacion {
  recibo: string;
  donante: string;
  tipo: "Empresa" | "Persona Natural";
  destino: string;
  monto: number;
}

const DONACIONES: Donacion[] = [
  { recibo: "REC-2026-089", donante: "Fundación Bolívar Construye", tipo: "Empresa", destino: "Fondo de Alimentación y Comedor Comunitario", monto: 3500 },
  { recibo: "REC-2026-090", donante: "Dra. Mariana Restrepo", tipo: "Persona Natural", destino: "Jornada de Salud Integral y Medicamentos", monto: 300 },
  { recibo: "REC-2026-091", donante: "Tecnología e Innovación S.A.S.", tipo: "Empresa", destino: "Jornada Comunitaria de Integración Familiar", monto: 1800 },
];

export async function getDonaciones(): Promise<Donacion[]> {
  return DONACIONES;
}


// REPORTES (agregados a partir de los mocks q se hicieron)


export interface ResumenReporte {
  periodo: string;
  beneficiariosAtendidos: number;
  eventosRealizados: number;
  jornadasRealizadas: number;
  fondosRecaudados: number;
  horasVoluntariado: number;
}

export async function getResumenReporte(): Promise<ResumenReporte> {
    const [mujeres, ninos, eventos, voluntarios, jornadas] = await Promise.all([
    getMujeres(),
    getNinos(),
    getEventos(),
    getVoluntarios(),
    getJornadas(),
  ]);
  return {
    periodo: "Agosto 2026",
    beneficiariosAtendidos: mujeres.length + ninos.length,
    eventosRealizados: eventos.filter((e) => e.estado === "Finalizado").length,
    jornadasRealizadas: jornadas.filter((j) => j.estado === "Finalizado").length,
    fondosRecaudados: 6600,
    horasVoluntariado: voluntarios.reduce((sum, v) => sum + v.horasAcumuladas, 0),
  };
}