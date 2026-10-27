import { createDatabaseClient, type PrismaClient } from "./index.js";

export const MUJERES_SEED = [
  {
    codigo_expediente: "MUJ-2026-001",
    dpi_identificacion: "1000000010101",
    nombres: "Rosa Elena",
    apellidos: "Morales",
    edad: 34,
    genero: "Femenino",
    tipo_beneficiario: "Mujer",
    colonia: "Villa Esperanza",
    direccion: "Calle 45 # 12-30",
    telefono: "+502 300 111 2233",
    ocupacion: "Costurera independiente",
    estado_civil: "Madre soltera",
    tercera_edad: "No",
    hijos_a_cargo: 1,
    programas: "Emprendimiento en el Hogar, Taller de Costura",
    problemas_sociales: "Desempleo, Falta de acceso a salud",
    fuentes_de_ingreso: "vendedora informal",
    nivel_vulnerabilidad: "vendedora informal",
    nota: "Prioridad para próximo taller de emprendimiento",
  },
  {
    codigo_expediente: "MUJ-2026-002",
    dpi_identificacion: "1000000020101",
    nombres: "Carmen",
    apellidos: "Castro",
    edad: 51,
    genero: "Femenino",
    tipo_beneficiario: "Mujer",
    colonia: "Altos del Paraíso",
    direccion: "Carrera 8A # 67-14",
    telefono: "+502 300 222 3344",
    ocupacion: "Ama de casa",
    estado_civil: "Casada",
    tercera_edad: "No",
    hijos_a_cargo: 1,
    programas: "Huerta Comunitaria",
    problemas_sociales: "Dependencia económica",
    fuentes_de_ingreso: "dependiente",
    nivel_vulnerabilidad: "dependiente",
    nota: null,
  },
  {
    codigo_expediente: "MUJ-2026-003",
    dpi_identificacion: "1000000030101",
    nombres: "Andrea",
    apellidos: "Mendoza",
    edad: 28,
    genero: "Femenino",
    tipo_beneficiario: "Mujer",
    colonia: "Villa Esperanza",
    direccion: "Diagonal 22 # 5-80",
    telefono: "+502 300 333 4455",
    ocupacion: "Vendedora informal",
    estado_civil: "Unión libre",
    tercera_edad: "No",
    hijos_a_cargo: 2,
    programas: "Emprendimiento en el Hogar, Nutrición Familiar",
    problemas_sociales: "Violencia intrafamiliar, Inseguridad alimentaria",
    fuentes_de_ingreso: "vendedora informal",
    nivel_vulnerabilidad: "vendedora informal",
    nota: "Requiere seguimiento nutricional del hogar",
  },
  {
    codigo_expediente: "MUJ-2026-004",
    dpi_identificacion: "1000000040101",
    nombres: "Luz Marina",
    apellidos: "Pineda",
    edad: 45,
    genero: "Femenino",
    tipo_beneficiario: "Mujer",
    colonia: "Altos del Paraíso",
    direccion: "Carrera 15 # 40-55",
    telefono: "+502 300 444 5566",
    ocupacion: "Auxiliar de aseo",
    estado_civil: "Viuda",
    tercera_edad: "No",
    hijos_a_cargo: 1,
    programas: "Taller de Costura",
    problemas_sociales: "Duelo familiar, Bajos ingresos",
    fuentes_de_ingreso: "asalariada",
    nivel_vulnerabilidad: "asalariada",
    nota: null,
  },
  {
    codigo_expediente: "MUJ-2026-005",
    dpi_identificacion: "1000000050101",
    nombres: "Marta Alicia",
    apellidos: "Chávez López",
    edad: 63,
    genero: "Femenino",
    tipo_beneficiario: "Mujer",
    colonia: "Brisas del Sur",
    direccion: "3a Avenida 4-12 Zona 2",
    telefono: "+502 300 555 6677",
    ocupacion: "Artesana textil",
    estado_civil: "Viuda",
    tercera_edad: "Sí",
    hijos_a_cargo: 1,
    programas: "Artesanías y Tejido, Salud Integral del Adulto Mayor",
    problemas_sociales: "Falta de acceso a medicamentos, Desempleo",
    fuentes_de_ingreso: "desempleada",
    nivel_vulnerabilidad: "desempleada",
    nota: "Control mensual de presión arterial en jornada médica",
  },
  {
    codigo_expediente: "MUJ-2026-006",
    dpi_identificacion: "1000000060101",
    nombres: "Silvia Patricia",
    apellidos: "Orozco Gómez",
    edad: 31,
    genero: "Femenino",
    tipo_beneficiario: "Mujer",
    colonia: "La Esperanza",
    direccion: "Callejón Los Pinos Lote 18",
    telefono: "+502 300 666 7788",
    ocupacion: "Panadera artesanal",
    estado_civil: "Madre soltera",
    tercera_edad: "No",
    hijos_a_cargo: 1,
    programas: "Panadería Comunitaria, Emprendimiento en el Hogar",
    problemas_sociales: "Bajos ingresos",
    fuentes_de_ingreso: "asalariada y dependiente",
    nivel_vulnerabilidad: "asalariada y dependiente",
    nota: null,
  },
];

export const NINOS_SEED = [
  {
    codigo_expediente: "NIN-2026-001",
    nombres: "Mateo",
    apellidos: "Gómez Morales",
    edad: 9,
    genero: "Masculino",
    tipo_beneficiario: "Niño",
    dpi_madre: "1000000010101",
    escolaridad: "3° Primaria",
    talla_camisa: "10",
    talla_pantalon: "10",
    talla_calzado: "32",
    observaciones: "Alérgico a la Penicilina",
  },
  {
    codigo_expediente: "NIN-2026-002",
    nombres: "Sofía Valentina",
    apellidos: "Herrera Castro",
    edad: 6,
    genero: "Femenino",
    tipo_beneficiario: "Niño",
    dpi_madre: "1000000020101",
    escolaridad: "1° Primaria",
    talla_camisa: "8",
    talla_pantalon: "8",
    talla_calzado: "29",
    observaciones: null,
  },
  {
    codigo_expediente: "NIN-2026-003",
    nombres: "Samuel David",
    apellidos: "Reyes Mendoza",
    edad: 11,
    genero: "Masculino",
    tipo_beneficiario: "Niño",
    dpi_madre: "1000000030101",
    escolaridad: "5° Primaria",
    talla_camisa: "12",
    talla_pantalon: "12",
    talla_calzado: "35",
    observaciones: "Intolerancia a la lactosa",
  },
  {
    codigo_expediente: "NIN-2026-004",
    nombres: "Valery Nicole",
    apellidos: "Peña Mendoza",
    edad: 6,
    genero: "Femenino",
    tipo_beneficiario: "Niño",
    dpi_madre: "1000000030101",
    escolaridad: "Preescolar",
    talla_camisa: "6",
    talla_pantalon: "6",
    talla_calzado: "27",
    observaciones: "Rinitis alérgica con polvo",
  },
  {
    codigo_expediente: "NIN-2026-005",
    nombres: "Diego Alejandro",
    apellidos: "Chávez",
    edad: 13,
    genero: "Masculino",
    tipo_beneficiario: "Niño",
    dpi_madre: "1000000050101",
    escolaridad: "1° Básico",
    talla_camisa: "14",
    talla_pantalon: "14",
    talla_calzado: "37",
    observaciones: "Requiere refuerzo escolar en matemáticas",
  },
  {
    codigo_expediente: "NIN-2026-006",
    nombres: "Camila Fernanda",
    apellidos: "Orozco",
    edad: 8,
    genero: "Femenino",
    tipo_beneficiario: "Niño",
    dpi_madre: "1000000060101",
    escolaridad: "2° Primaria",
    talla_camisa: "8",
    talla_pantalon: "8",
    talla_calzado: "30",
    observaciones: null,
  },
];

export async function seedDatabaseIfNeeded(db: PrismaClient): Promise<{ mujeresCount: number; ninosCount: number }> {
  const existingCount = await db.beneficiario.count();
  if (existingCount > 0) {
    const mujeresCount = await db.beneficiario.count({ where: { tipo_beneficiario: "Mujer" } });
    const ninosCount = await db.beneficiario.count({ where: { tipo_beneficiario: "Niño" } });
    return { mujeresCount, ninosCount };
  }

  const madrePorDpi = new Map<string, number>();

  for (const m of MUJERES_SEED) {
    const created = await db.beneficiario.create({
      data: {
        ...m,
        estado: "Activo",
        es_tutor_principal: true,
        fecha_ingreso: "2026-01-15",
      },
    });
    if (created.dpi_identificacion) {
      madrePorDpi.set(created.dpi_identificacion, created.id_beneficiario);
    }
  }

  for (const n of NINOS_SEED) {
    const idMadre = madrePorDpi.get(n.dpi_madre) ?? null;
    await db.beneficiario.create({
      data: {
        ...n,
        id_madre: idMadre,
        estado: "Activo",
        es_tutor_principal: false,
        fecha_ingreso: "2026-01-15",
      },
    });
  }

  return {
    mujeresCount: MUJERES_SEED.length,
    ninosCount: NINOS_SEED.length,
  };
}

// Ejecución directa desde CLI: `bun run src/seed.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = createDatabaseClient({ mode: "local" });
  try {
    const result = await seedDatabaseIfNeeded(db);
    console.log(
      `[Seed] Base de datos SQLite local lista con ${result.mujeresCount} mujeres y ${result.ninosCount} niños.`
    );
  } finally {
    await db.$disconnect();
  }
}
