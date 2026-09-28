// apps/desktop/src/lib/mockData.ts
//
// Capa de datos MOCK. Todas las funciones son async a propósito:
// cuando el esquema de Prisma / sidecar esté listo, solo hay que
// reemplazar el cuerpo de cada función por un fetch a
// http://127.0.0.1:4111/... sin tocar las páginas que las consumen.

export type Vulnerabilidad = "Alta" | "Media" | "Baja";

export interface Mujer {
  id: string;
  codigo: string; 
  nombre: string;
  edad: number;
  comunidad: string;
  direccion: string;
  telefono: string;
  ocupacion: string;
  estadoCivil: string;
  hijosACargo: number;
  programas: string[]; // programas/talleres en los que participa
  vulnerabilidad: Vulnerabilidad;
  nota?: string; // alerta o nota de seguimiento, ej: "Requiere apoyo psicológico"
}

const MUJERES: Mujer[] = [
  {
    id: "muj-001",
    codigo: "MUJ-2026-001",
    nombre: "Rosa Elena Morales",
    edad: 34,
    comunidad: "Villa Esperanza",
    direccion: "Calle 45 # 12-30",
    telefono: "+502 300 111 2233",
    ocupacion: "Costurera independiente",
    estadoCivil: "Madre soltera",
    hijosACargo: 1,
    programas: ["Emprendimiento en el Hogar", "Taller de Costura"],
    vulnerabilidad: "Alta",
    nota: "Prioridad para próximo taller de emprendimiento",
  },
  {
    id: "muj-002",
    codigo: "MUJ-2026-002",
    nombre: "Carmen Castro",
    edad: 51,
    comunidad: "Altos del Paraíso",
    direccion: "Carrera 8A # 67-14",
    telefono: "+502 300 222 3344",
    ocupacion: "Ama de casa",
    estadoCivil: "Casada",
    hijosACargo: 0,
    programas: ["Huerta Comunitaria"],
    vulnerabilidad: "Media",
  },
  {
    id: "muj-003",
    codigo: "MUJ-2026-003",
    nombre: "Andrea Mendoza",
    edad: 28,
    comunidad: "Villa Esperanza",
    direccion: "Diagonal 22 # 5-80",
    telefono: "+502 300 333 4455",
    ocupacion: "Vendedora informal",
    estadoCivil: "Unión libre",
    hijosACargo: 2,
    programas: ["Emprendimiento en el Hogar", "Nutrición Familiar"],
    vulnerabilidad: "Alta",
    nota: "Requiere seguimiento nutricional del hogar",
  },
  {
    id: "muj-004",
    codigo: "MUJ-2026-004",
    nombre: "Luz Marina Pineda",
    edad: 45,
    comunidad: "Altos del Paraíso",
    direccion: "Carrera 15 # 40-55",
    telefono: "+502 300 444 5566",
    ocupacion: "Auxiliar de aseo",
    estadoCivil: "Viuda",
    hijosACargo: 1,
    programas: ["Taller de Costura"],
    vulnerabilidad: "Baja",
  },
];

export async function getMujeres(): Promise<Mujer[]> {
  return MUJERES;
}

export async function getMujerById(id: string): Promise<Mujer | undefined> {
  return MUJERES.find((m) => m.id === id);
}

// NIÑOS (módulo secundario, vinculado a un perfil de Mujer)

export interface Nino {
  id: string;
  codigo: string;
  nombre: string;
  edad: number;
  mujerId: string; // vínculo con el perfil de la madre/tutora
  escolaridad: string;
  tallaRopa: number;
  tallaCalzado: number;
  alergia?: string;
  vulnerabilidad: Vulnerabilidad;
}

const NINOS: Nino[] = [
  { id: "nino-001", codigo: "NIN-2026-001", nombre: "Mateo Gómez Morales", edad: 9, mujerId: "muj-001", escolaridad: "3° Primaria", tallaRopa: 10, tallaCalzado: 32, alergia: "Alérgico a la Penicilina", vulnerabilidad: "Alta" },
  { id: "nino-002", codigo: "NIN-2026-002", nombre: "Sofía Valentina Herrera", edad: 6, mujerId: "muj-002", escolaridad: "1° Primaria", tallaRopa: 8, tallaCalzado: 29, vulnerabilidad: "Media" },
  { id: "nino-003", codigo: "NIN-2026-003", nombre: "Samuel David Reyes", edad: 11, mujerId: "muj-003", escolaridad: "5° Primaria", tallaRopa: 12, tallaCalzado: 35, alergia: "Intolerancia a la lactosa", vulnerabilidad: "Media" },
  { id: "nino-004", codigo: "NIN-2026-004", nombre: "Valery Nicole Peña", edad: 6, mujerId: "muj-003", escolaridad: "Transición / Preescolar", tallaRopa: 6, tallaCalzado: 27, alergia: "Rinitis alérgica con polvo", vulnerabilidad: "Media" },
];

export async function getNinos(): Promise<Nino[]> {
  return NINOS;
}

export async function getNinoById(id: string): Promise<Nino | undefined> {
  return NINOS.find((n) => n.id === id);
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
  { id: "evt-001", titulo: "Gran Jornada de Salud Integral y Nutrición Comunitaria", categoria: "Jornada de Salud", estado: "Finalizado", descripcion: "Valoración médica general, control de talla y peso, entrega de suplementos multivitamínicos y kits de higiene.", fecha: "2026-08-08", horario: "08:30 - 13:30", ubicacion: "Centro Comunitario San Jerónimo (Villa Esperanza)", coordinador: "Lic. Laura Camila Ortiz", presupuestoEjecutado: 1150, presupuestoTotal: 1200, convocados: 8, asistieron: 7, voluntariosAsignados: 3 },
  { id: "evt-002", titulo: "Jornada Comunitaria de Integración Familiar & Talleres de Creatividad", categoria: "Jornada de Integración Familiar", estado: "Planificado", descripcion: "Estaciones de pintura, dinámicas grupales, y entrega de materiales didácticos y recreativos.", fecha: "2026-08-22", horario: "14:00 - 18:00", ubicacion: "Cancha Polideportiva Brisas del Sur", coordinador: "Mariana Duque Zuluaga", presupuestoEjecutado: 650, presupuestoTotal: 1800, convocados: 8, asistieron: 8, voluntariosAsignados: 5 },
  { id: "evt-003", titulo: "Comedor Solidario & Entrega de Mercados Nutricionales", categoria: "Comedor Comunitario", estado: "Finalizado", descripcion: "Almuerzo caliente balanceado y entrega de canasta de víveres esenciales a familias de alta vulnerabilidad.", fecha: "2026-07-26", horario: "11:30 - 15:00", ubicacion: "Sede Lumbreras de Amor", coordinador: "Chef Martha Cecilia Rojas", presupuestoEjecutado: 920, presupuestoTotal: 950, convocados: 6, asistieron: 5, voluntariosAsignados: 3 },
  { id: "evt-004", titulo: 'Campaña Educativa "Semillas de Esperanza y Conocimiento"', categoria: "Entrega de Kits & Víveres", estado: "Finalizado", descripcion: "Dotación de morrales con útiles completos, reglas, tijeras y recipientes para hidratación.", fecha: "2026-07-12", horario: "09:00 - 13:00", ubicacion: "Sede Comunitaria La Esperanza", coordinador: "Prof. Andrés Felipe Ruiz", presupuestoEjecutado: 1420, presupuestoTotal: 1500, convocados: 5, asistieron: 5, voluntariosAsignados: 3 },
];

export async function getEventos(): Promise<Evento[]> {
  return EVENTOS;
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
  fondosRecaudados: number;
  horasVoluntariado: number;
}

export async function getResumenReporte(): Promise<ResumenReporte> {
  const [mujeres, ninos, eventos, voluntarios] = await Promise.all([
    getMujeres(),
    getNinos(),
    getEventos(),
    getVoluntarios(),
  ]);
  return {
    periodo: "Agosto 2026",
    beneficiariosAtendidos: mujeres.length + ninos.length,
    eventosRealizados: eventos.filter((e) => e.estado === "Finalizado").length,
    fondosRecaudados: 6600,
    horasVoluntariado: voluntarios.reduce((sum, v) => sum + v.horasAcumuladas, 0),
  };
}