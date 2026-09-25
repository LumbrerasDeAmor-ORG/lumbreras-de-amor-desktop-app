// apps/desktop/src/lib/mockData.ts
//
// Capa de datos MOCK. Todas las funciones son async a propósito:
// cuando el esquema de Prisma / sidecar esté listo, solo hay que
// reemplazar el cuerpo de cada función por un fetch a
// http://127.0.0.1:4111/... sin tocar las páginas que las consumen.

export type Vulnerabilidad = "Alta" | "Media" | "Baja";

export interface Mujer {
  id: string;
  codigo: string; // ej: MUJ-2026-001
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
    telefono: "+57 300 111 2233",
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
    telefono: "+57 300 222 3344",
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
    telefono: "+57 300 333 4455",
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
    telefono: "+57 300 444 5566",
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