// apps/desktop/src/lib/mockData.ts
//
// Los módulos consumen la base de datos SQLite local (packages/database/local.db)
// a través del Sidecar (http://127.0.0.1:4111) con fallback automático a datos
// locales para desarrollo y modo offline.

const SIDECAR_BASE_URL = "http://127.0.0.1:4111";

export type FuentesIngreso =
  | "desempleada"
  | "vendedora informal"
  | "asalariada"
  | "dependiente"
  | "asalariada y dependiente";

export type Vulnerabilidad = FuentesIngreso;

export type EstadoActividad = "Planificado" | "En curso" | "Finalizado";

export type CategoriaEvento =
  | "Celebración"
  | "Recaudación de Fondos"
  | "Capacitación"
  | "Taller Comunitario";

export const CATEGORIAS_EVENTO: CategoriaEvento[] = [
  "Celebración",
  "Recaudación de Fondos",
  "Capacitación",
  "Taller Comunitario",
];

export type CategoriaJornada =
  | "Multidisciplinaria Salud"
  | "Dental"
  | "Entrega de Víveres"
  | "Entrega de Juguetes"
  | "Vestimenta"
  | "Entrega Alimentos Servidos";

export const CATEGORIAS_JORNADA: CategoriaJornada[] = [
  "Multidisciplinaria Salud",
  "Dental",
  "Entrega de Víveres",
  "Entrega de Juguetes",
  "Vestimenta",
  "Entrega Alimentos Servidos",
];

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

// EQUIPO DE VOLUNTARIOS & COORDINADORES

export type TipoVoluntario = "Propio" | "Externo";

export interface Voluntario {
  id: string;
  nombre: string;
  especialidad: string;
  tipo: TipoVoluntario;
  esCoordinador?: boolean;
  organizacionOrigen?: string;
  email: string;
  telefono: string;
  disponibilidad: string;
  habilidades: string[];
  horasAcumuladas: number;
}

const VOLUNTARIOS: Voluntario[] = [
  {
    id: "vol-001",
    nombre: "Dra. Carolina Méndez",
    especialidad: "Médico / Salud",
    tipo: "Propio",
    esCoordinador: true,
    organizacionOrigen: "Lumbreras de Amor (Planta ONG)",
    email: "carolina.mendez@lumbrerasdeamor.org",
    telefono: "+502 5511 9081",
    disponibilidad: "Fines de semana",
    habilidades: ["Medicina General", "Primeros Auxilios", "Tamizaje Nutricional"],
    horasAcumuladas: 48,
  },
  {
    id: "vol-002",
    nombre: "Prof. Andrés Felipe Ruiz",
    especialidad: "Tutor Pedagógico",
    tipo: "Propio",
    esCoordinador: true,
    organizacionOrigen: "Lumbreras de Amor (Planta ONG)",
    email: "andres.ruiz@lumbrerasdeamor.org",
    telefono: "+502 5400 6789",
    disponibilidad: "Tardes",
    habilidades: ["Pedagogía Social", "Matemáticas Lúdicas", "Lectoescritura"],
    horasAcumuladas: 62,
  },
  {
    id: "vol-003",
    nombre: "Mariana Duque Zuluaga",
    especialidad: "Coordinadora de Actividades",
    tipo: "Propio",
    esCoordinador: true,
    organizacionOrigen: "Lumbreras de Amor (Planta ONG)",
    email: "mariana.duque@lumbrerasdeamor.org",
    telefono: "+502 5316 0123",
    disponibilidad: "Fines de semana",
    habilidades: ["Teatro Social", "Artes Plásticas", "Manejo de Grupos Grandes"],
    horasAcumuladas: 75,
  },
  {
    id: "vol-004",
    nombre: "Carlos Alberto Navarro",
    especialidad: "Apoyo Logístico",
    tipo: "Externo",
    esCoordinador: false,
    organizacionOrigen: "Iglesia Aliada Esperanza Viva",
    email: "carlos.navarro@aliados.org",
    telefono: "+502 5313 8811",
    disponibilidad: "Tiempo completo",
    habilidades: ["Transporte de Cargas", "Montaje de Eventos", "Control de Inventario"],
    horasAcumuladas: 94,
  },
  {
    id: "vol-005",
    nombre: "Chef Martha Cecilia Rojas",
    especialidad: "Cocina y Nutrición",
    tipo: "Propio",
    esCoordinador: true,
    organizacionOrigen: "Lumbreras de Amor (Planta ONG)",
    email: "martha.rojas@lumbrerasdeamor.org",
    telefono: "+502 5318 4499",
    disponibilidad: "Fines de semana",
    habilidades: ["Manipulación de Alimentos", "Menús Nutricionales Balanceados", "Cocina Masiva"],
    horasAcumuladas: 82,
  },
  {
    id: "vol-006",
    nombre: "Lic. Laura Camila Ortiz",
    especialidad: "Coordinador General",
    tipo: "Propio",
    esCoordinador: true,
    organizacionOrigen: "Lumbreras de Amor (Dirección)",
    email: "laura.ortiz@lumbrerasdeamor.org",
    telefono: "+502 5315 1098",
    disponibilidad: "Tiempo completo",
    habilidades: ["Trabajo Social", "Gestión de Donantes", "Coordinación General"],
    horasAcumuladas: 160,
  },
  {
    id: "vol-007",
    nombre: "Ing. Roberto Solís",
    especialidad: "Logística & Montaje",
    tipo: "Externo",
    esCoordinador: false,
    organizacionOrigen: "Voluntariado Corporativo Cementos Progreso",
    email: "r.solis@voluntariado.gt",
    telefono: "+502 4210 3344",
    disponibilidad: "Sábados",
    habilidades: ["Transporte", "Bodega", "Distribución de Víveres"],
    horasAcumuladas: 34,
  },
  {
    id: "vol-008",
    nombre: "Andrea Sofía Morales",
    especialidad: "Odontología Comunitaria",
    tipo: "Externo",
    esCoordinador: false,
    organizacionOrigen: "Facultad de Odontología USAC / URL",
    email: "andrea.morales@universidad.edu.gt",
    telefono: "+502 4901 7722",
    disponibilidad: "Domingos y Jornadas",
    habilidades: ["Salud Bucal", "Fluorización", "Prevención Dental Infantil"],
    horasAcumuladas: 40,
  },
];

export async function getVoluntarios(): Promise<Voluntario[]> {
  try {
    const res = await fetch(`${SIDECAR_BASE_URL}/voluntarios`, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const payload = (await res.json()) as { success: boolean; data: Voluntario[] };
      if (payload.success && Array.isArray(payload.data) && payload.data.length > 0) {
        return payload.data;
      }
    }
  } catch {
    // Fallback a lista local de voluntarios
  }
  return VOLUNTARIOS;
}

export async function getCoordinadores(): Promise<Voluntario[]> {
  const voluntarios = await getVoluntarios();
  return voluntarios.filter(
    (v) =>
      v.esCoordinador ||
      v.especialidad.toLowerCase().includes("coordinador") ||
      v.tipo === "Propio"
  );
}

// EVENTOS & ASISTENCIA

export interface Evento {
  id: string;
  titulo: string;
  categoria: string;
  estado: EstadoActividad;
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
  voluntariosIds?: string[];
  voluntariosNombres?: string[];
}

const EVENTOS: Evento[] = [
  {
    id: "evt-001",
    titulo: "Celebración Día de la Madre con las Mujeres de la Comunidad",
    categoria: "Celebración",
    estado: "Planificado",
    descripcion:
      "Convivio con refacción, música y reconocimiento a las mujeres que participan en los talleres de la organización.",
    fecha: "2026-10-30",
    horario: "15:00 - 19:00",
    ubicacion: "Sede Lumbreras de Amor",
    coordinador: "Lic. Laura Camila Ortiz",
    presupuestoEjecutado: 0,
    presupuestoTotal: 900,
    convocados: 40,
    asistieron: 0,
    voluntariosAsignados: 4,
    voluntariosIds: ["vol-006", "vol-003", "vol-005", "vol-004"],
    voluntariosNombres: [
      "Lic. Laura Camila Ortiz (Propio)",
      "Mariana Duque Zuluaga (Propio)",
      "Chef Martha Cecilia Rojas (Propio)",
      "Carlos Alberto Navarro (Externo)",
    ],
  },
  {
    id: "evt-002",
    titulo: "Cena Benéfica Lumbreras de Amor",
    categoria: "Recaudación de Fondos",
    estado: "En curso",
    descripcion:
      "Cena con donantes y aliados para recaudar fondos a favor de los programas de la organización.",
    fecha: "2026-11-14",
    horario: "18:30 - 22:00",
    ubicacion: "Salón Social Villa Esperanza",
    coordinador: "Mariana Duque Zuluaga",
    presupuestoEjecutado: 450,
    presupuestoTotal: 1500,
    convocados: 60,
    asistieron: 35,
    voluntariosAsignados: 5,
    voluntariosIds: ["vol-003", "vol-006", "vol-001", "vol-004", "vol-007"],
    voluntariosNombres: [
      "Mariana Duque Zuluaga (Propio)",
      "Lic. Laura Camila Ortiz (Propio)",
      "Dra. Carolina Méndez (Propio)",
      "Carlos Alberto Navarro (Externo)",
      "Ing. Roberto Solís (Externo)",
    ],
  },
  {
    id: "evt-003",
    titulo: "Taller de Capacitación para Voluntarios",
    categoria: "Capacitación",
    estado: "Finalizado",
    descripcion:
      "Inducción sobre trato a las familias, manejo de grupos y registro de asistencia en terreno.",
    fecha: "2026-09-19",
    horario: "09:00 - 12:00",
    ubicacion: "Sede Lumbreras de Amor",
    coordinador: "Prof. Andrés Felipe Ruiz",
    presupuestoEjecutado: 180,
    presupuestoTotal: 200,
    convocados: 12,
    asistieron: 12,
    voluntariosAsignados: 3,
    voluntariosIds: ["vol-002", "vol-001", "vol-008"],
    voluntariosNombres: [
      "Prof. Andrés Felipe Ruiz (Propio)",
      "Dra. Carolina Méndez (Propio)",
      "Andrea Sofía Morales (Externo)",
    ],
  },
];

export async function getEventos(): Promise<Evento[]> {
  try {
    const res = await fetch(`${SIDECAR_BASE_URL}/eventos`, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const payload = (await res.json()) as { success: boolean; data: Evento[] };
      if (payload.success && Array.isArray(payload.data) && payload.data.length > 0) {
        return payload.data;
      }
    }
  } catch {
    // Fallback a lista local de eventos
  }
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
  {
    id: "jor-001",
    titulo: "Gran Jornada de Salud Integral y Nutrición Comunitaria",
    categoria: "Multidisciplinaria Salud",
    estado: "Finalizado",
    descripcion:
      "Valoración médica general, control de talla y peso, entrega de suplementos multivitamínicos y kits de higiene.",
    fecha: "2026-08-08",
    horario: "08:30 - 13:30",
    ubicacion: "Centro Comunitario San Jerónimo (Villa Esperanza)",
    coordinador: "Lic. Laura Camila Ortiz",
    presupuestoEjecutado: 1150,
    presupuestoTotal: 1200,
    convocados: 45,
    asistieron: 42,
    voluntariosAsignados: 3,
    voluntariosNombres: [
      "Dra. Carolina Méndez (Propio)",
      "Lic. Laura Camila Ortiz (Propio)",
      "Carlos Alberto Navarro (Externo)",
    ],
    servicios: [
      {
        id: "srv-001",
        nombre: "Valoración médica general",
        descripcion: "Consulta médica básica y revisión de signos vitales.",
        responsable: "Dra. Carolina Méndez",
        atendidos: 42,
      },
      {
        id: "srv-002",
        nombre: "Control de talla y peso",
        descripcion: "Medición antropométrica para el seguimiento nutricional.",
        responsable: "Lic. Laura Camila Ortiz",
        atendidos: 42,
      },
      {
        id: "srv-003",
        nombre: "Entrega de suplementos y kits de higiene",
        descripcion: "Multivitamínicos y kits de cuidado personal.",
        responsable: "Carlos Alberto Navarro",
        atendidos: 42,
      },
    ],
  },
  {
    id: "jor-002",
    titulo: "Brigada de Salud Bucal y Prevención Dental Infantil",
    categoria: "Dental",
    estado: "En curso",
    descripcion:
      "Evaluación odontológica preventiva, aplicación de flúor y entrega de kits de cepillado dental para niños y madres.",
    fecha: "2026-10-25",
    horario: "09:00 - 14:00",
    ubicacion: "Cancha Polideportiva Brisas del Sur",
    coordinador: "Dra. Carolina Méndez",
    presupuestoEjecutado: 850,
    presupuestoTotal: 1400,
    convocados: 50,
    asistieron: 38,
    voluntariosAsignados: 4,
    voluntariosNombres: [
      "Dra. Carolina Méndez (Propio)",
      "Andrea Sofía Morales (Externo)",
      "Mariana Duque Zuluaga (Propio)",
      "Carlos Alberto Navarro (Externo)",
    ],
    servicios: [
      {
        id: "srv-004",
        nombre: "Limpieza y aplicación de flúor",
        descripcion: "Atención preventiva odontológica infantil.",
        responsable: "Andrea Sofía Morales",
        atendidos: 38,
      },
      {
        id: "srv-005",
        nombre: "Charla de higiene bucal y entrega de cepillos",
        descripcion: "Educación práctica en técnica de cepillado y entrega de insumos.",
        responsable: "Dra. Carolina Méndez",
        atendidos: 38,
      },
    ],
  },
  {
    id: "jor-003",
    titulo: "Jornada de Entrega de Alimentos Servidos y Nutrición Solidaria",
    categoria: "Entrega Alimentos Servidos",
    estado: "Finalizado",
    descripcion:
      "Almuerzo caliente balanceado servido en comunidad para familias prioritarias y adultos mayores.",
    fecha: "2026-09-26",
    horario: "11:30 - 15:00",
    ubicacion: "Sede Lumbreras de Amor",
    coordinador: "Chef Martha Cecilia Rojas",
    presupuestoEjecutado: 920,
    presupuestoTotal: 950,
    convocados: 60,
    asistieron: 55,
    voluntariosAsignados: 3,
    voluntariosNombres: [
      "Chef Martha Cecilia Rojas (Propio)",
      "Carlos Alberto Navarro (Externo)",
      "Ing. Roberto Solís (Externo)",
    ],
    servicios: [
      {
        id: "srv-007",
        nombre: "Almuerzo caliente balanceado",
        descripcion: "Raciones nutritivas servidas a madres y niños registrados.",
        responsable: "Chef Martha Cecilia Rojas",
        atendidos: 55,
      },
      {
        id: "srv-008",
        nombre: "Hidratación y complemento nutricional",
        descripcion: "Bebida fortificada y fruta fresca para niños.",
        responsable: "Carlos Alberto Navarro",
        atendidos: 55,
      },
    ],
  },
  {
    id: "jor-004",
    titulo: "Jornada de Entrega de Víveres y Canasta Básica Familiar",
    categoria: "Entrega de Víveres",
    estado: "Planificado",
    descripcion:
      "Distribución organizada de bolsas de víveres no perecederos, granos básicos y leche fortificada.",
    fecha: "2026-11-08",
    horario: "09:00 - 13:00",
    ubicacion: "Sede Comunitaria La Esperanza",
    coordinador: "Prof. Andrés Felipe Ruiz",
    presupuestoEjecutado: 1420,
    presupuestoTotal: 1500,
    convocados: 50,
    asistieron: 0,
    voluntariosAsignados: 3,
    voluntariosNombres: [
      "Prof. Andrés Felipe Ruiz (Propio)",
      "Carlos Alberto Navarro (Externo)",
      "Ing. Roberto Solís (Externo)",
    ],
    servicios: [
      {
        id: "srv-009",
        nombre: "Entrega de canasta de granos básicos",
        descripcion: "Arroz, frijol, incaparina, aceite y avena por familia.",
        responsable: "Prof. Andrés Felipe Ruiz",
        atendidos: 0,
      },
      {
        id: "srv-010",
        nombre: "Dotación de leche fortificada",
        descripcion: "Entrega especial para hogares con niños menores de 7 años.",
        responsable: "Ing. Roberto Solís",
        atendidos: 0,
      },
    ],
  },
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
  descripcion: string;
  categoria: string;
  fuente: string;
  cantidadActual: number;
  unidad: string;
  minimo: number;
  ubicacionBodega: string;
  estado: "Óptimo" | "Bajo Stock" | "Crítico";
}

const VIVERES: ItemViveres[] = [
  {
    id: "viv-001",
    nombre: "Leche entera en polvo fortificada (Bolsa 900g)",
    descripcion: "Lotes de leche en polvo entera fortificada con hierro y vitaminas A/D para niños en edad preescolar.",
    categoria: "Nutrición & Suplementos",
    fuente: "Donación Corporativa Lácteos del Valle",
    cantidadActual: 38,
    unidad: "bolsas",
    minimo: 20,
    ubicacionBodega: "Bodega A - Estante 1",
    estado: "Óptimo",
  },
  {
    id: "viv-002",
    nombre: "Arroz blanco seleccionado (Bolsa 1kg)",
    descripcion: "Bolsas selladas de arroz blanco de primera calidad destinadas a las canastas de entrega de víveres.",
    categoria: "Víveres no perecederos",
    fuente: "Campaña Supermercados Amigos",
    cantidadActual: 85,
    unidad: "kg",
    minimo: 40,
    ubicacionBodega: "Bodega A - Tarima 3",
    estado: "Óptimo",
  },
  {
    id: "viv-003",
    nombre: "Suplemento nutricional fortificado multivitamínico (Lata 400g)",
    descripcion: "Fórmula nutricional en polvo para niños con bajo peso detectados en jornada multidisciplinaria de salud.",
    categoria: "Nutrición & Suplementos",
    fuente: "Dra. Carolina Méndez (Donación particular)",
    cantidadActual: 4,
    unidad: "latas",
    minimo: 10,
    ubicacionBodega: "Bodega A - Estante 1",
    estado: "Crítico",
  },
  {
    id: "viv-004",
    nombre: "Kits de Juguetes Educativos y Material Didáctico",
    descripcion: "Rompecabezas, cajas de colores y juegos de construcción para jornadas de entrega de juguetes.",
    categoria: "Material Educativo & Didáctico",
    fuente: "Voluntarios de Educación",
    cantidadActual: 14,
    unidad: "cajas",
    minimo: 25,
    ubicacionBodega: "Estante B - Material Didáctico",
    estado: "Bajo Stock",
  },
  {
    id: "viv-005",
    nombre: "Calzado y Vestimenta Comunitaria Surtida",
    descripcion: "Prendas de vestir nuevas y en buen estado clasificadas por talla infantil y de mujer para jornadas de vestimenta.",
    categoria: "Ropa y Calzado",
    fuente: "Campaña Paso Firme",
    cantidadActual: 8,
    unidad: "pares",
    minimo: 15,
    ubicacionBodega: "Bodega C - Ropa",
    estado: "Bajo Stock",
  },
];

export async function getViveres(): Promise<ItemViveres[]> {
  return VIVERES;
}

// DONACIONES ECONÓMICAS (para transparencia en Víveres y Reportes)
export interface Donacion {
  recibo: string;
  donante: string;
  tipo: "Empresa" | "Persona Natural";
  destino: string;
  descripcion: string;
  monto: number;
}

const DONACIONES: Donacion[] = [
  {
    recibo: "REC-2026-089",
    donante: "Fundación Bolívar Construye",
    tipo: "Empresa",
    destino: "Entrega de Víveres y Alimentos Servidos",
    descripcion: "Aporte económico semestral para compra de granos básicos (arroz, frijol, aceite) e insumos de cocina comunitaria.",
    monto: 3500.0,
  },
  {
    recibo: "REC-2026-090",
    donante: "Dra. Mariana Restrepo",
    tipo: "Persona Natural",
    destino: "Multidisciplinaria Salud y Dental",
    descripcion: "Donativo en efectivo para adquisición de kits de flúor, cepillos dentales, analgésicos y multivitamínicos pediátricos.",
    monto: 1300.5,
  },
  {
    recibo: "REC-2026-091",
    donante: "Tecnología e Innovación S.A.",
    tipo: "Empresa",
    destino: "Capacitación y Talleres Comunitarios",
    descripcion: "Patrocinio financiero para materiales de formación en oficios, alquiler de mobiliario y refacciones de talleres.",
    monto: 1800.0,
  },
];

export async function getDonaciones(): Promise<Donacion[]> {
  return DONACIONES;
}

// REPORTES (agregados a partir de los datos del sistema)

export interface ResumenReporte {
  periodo: string;
  beneficiariosAtendidos: number;
  eventosRealizados: number;
  jornadasRealizadas: number;
  fondosRecaudados: number;
  horasVoluntariado: number;
}

export async function getResumenReporte(): Promise<ResumenReporte> {
  const [mujeres, ninos, eventos, voluntarios, jornadas, donaciones] = await Promise.all([
    getMujeres(),
    getNinos(),
    getEventos(),
    getVoluntarios(),
    getJornadas(),
    getDonaciones(),
  ]);
  return {
    periodo: "Octubre 2026",
    beneficiariosAtendidos: mujeres.length + ninos.length,
    eventosRealizados: eventos.filter((e) => e.estado === "Finalizado").length,
    jornadasRealizadas: jornadas.filter((j) => j.estado === "Finalizado").length,
    fondosRecaudados: donaciones.reduce((sum, d) => sum + d.monto, 0),
    horasVoluntariado: voluntarios.reduce((sum, v) => sum + v.horasAcumuladas, 0),
  };
}