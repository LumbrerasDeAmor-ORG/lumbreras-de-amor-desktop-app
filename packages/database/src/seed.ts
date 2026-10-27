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

export const VOLUNTARIOS_SEED = [
  // 4 voluntarios propios (con al menos 2 coordinadores)
  {
    tipo_voluntario: "Propio",
    nombre_completo: "Lic. Laura Camila Ortiz",
    email: "laura.ortiz@lumbrerasdeamor.org",
    telefono: "+502 3154 3210",
    rol_especialidad: "Coordinador General",
    disponibilidad: "Tiempo completo",
    horas_acumuladas: 160,
    estado: "Activo",
    fecha_ingreso: "2025-01-10",
  },
  {
    tipo_voluntario: "Propio",
    nombre_completo: "Mariana Duque Zuluaga",
    email: "mariana.duque@lumbrerasdeamor.org",
    telefono: "+502 3167 8901",
    rol_especialidad: "Coordinador de Logística y Recreación",
    disponibilidad: "Fines de semana",
    horas_acumuladas: 75,
    estado: "Activo",
    fecha_ingreso: "2025-03-15",
  },
  {
    tipo_voluntario: "Propio",
    nombre_completo: "Prof. Andrés Felipe Ruiz",
    email: "andres.ruiz@lumbrerasdeamor.org",
    telefono: "+502 3004 4567",
    rol_especialidad: "Tutor Pedagógico",
    disponibilidad: "Tardes",
    horas_acumuladas: 62,
    estado: "Activo",
    fecha_ingreso: "2025-02-01",
  },
  {
    tipo_voluntario: "Propio",
    nombre_completo: "Carlos Alberto Navarro",
    email: "carlos.navarro@lumbrerasdeamor.org",
    telefono: "+502 3136 0988",
    rol_especialidad: "Apoyo Logístico y Transporte",
    disponibilidad: "Tiempo completo",
    horas_acumuladas: 94,
    estado: "Activo",
    fecha_ingreso: "2025-01-20",
  },
  // 3 voluntarios externos (universidades, empresas, iglesias)
  {
    tipo_voluntario: "Externo",
    nombre_completo: "Dra. Carolina Méndez",
    email: "carolina.mendez@universidad.edu.gt",
    telefono: "+502 3115 0090",
    rol_especialidad: "Médico General / Fac. Medicina Universidad",
    disponibilidad: "Fines de semana",
    horas_acumuladas: 48,
    estado: "Activo",
    fecha_ingreso: "2025-06-01",
  },
  {
    tipo_voluntario: "Externo",
    nombre_completo: "Chef Martha Cecilia Rojas",
    email: "martha.rojas@iglesiacentral.org",
    telefono: "+502 3182 0044",
    rol_especialidad: "Nutrición y Cocina / Iglesia Alianza Central",
    disponibilidad: "Fines de semana",
    horas_acumuladas: 82,
    estado: "Activo",
    fecha_ingreso: "2025-04-10",
  },
  {
    tipo_voluntario: "Externo",
    nombre_completo: "Ing. Mateo Gómez",
    email: "mateo.gomez@techgt.com",
    telefono: "+502 3201 9988",
    rol_especialidad: "Soporte Digital / Empresa Aliada TechGT",
    disponibilidad: "Sábados",
    horas_acumuladas: 30,
    estado: "Activo",
    fecha_ingreso: "2025-08-15",
  },
];

export const DONANTES_SEED = [
  {
    nombre_o_razon_social: "Fundación Bolívar Construye",
    tipo_donante: "Empresa",
    nit_o_identificacion: "90012345-1",
    email: "contacto@bolivarconstruye.org",
  },
  {
    nombre_o_razon_social: "Dra. Mariana Restrepo",
    tipo_donante: "Persona Natural",
    nit_o_identificacion: "45892301-K",
    email: "m.restrepo@gmail.com",
  },
  {
    nombre_o_razon_social: "Tecnología e Innovación S.A.S.",
    tipo_donante: "Empresa",
    nit_o_identificacion: "80098765-4",
    email: "rse@tecinnovacion.com",
  },
];

export const DONACIONES_SEED = [
  {
    numero_recibo: "REC-2026-089",
    donante_nombre: "Fundación Bolívar Construye",
    monto: 3500.0,
    moneda: "GTQ",
    programa_destino: "Fondo de Alimentación y Comedor Comunitario",
    fecha: "2026-08-01",
    descripcion: "Donación mensual corporativa para víveres y nutrición comunitaria",
  },
  {
    numero_recibo: "REC-2026-090",
    donante_nombre: "Dra. Mariana Restrepo",
    monto: 300.0,
    moneda: "GTQ",
    programa_destino: "Jornada de Salud Integral y Medicamentos",
    fecha: "2026-08-05",
    descripcion: "Aporte para botiquín y medicamentos pediátricos básicos",
  },
  {
    numero_recibo: "REC-2026-091",
    donante_nombre: "Tecnología e Innovación S.A.S.",
    monto: 1800.0,
    moneda: "GTQ",
    programa_destino: "Jornada Comunitaria de Integración Familiar",
    fecha: "2026-08-12",
    descripcion: "Patrocinio empresarial para insumos de talleres y refrigerios",
  },
];

export const EVENTOS_SEED = [
  {
    titulo: "Celebración Día de la Madre con las Mujeres de la Comunidad",
    categoria: "Celebración",
    estado: "Planificado",
    fecha: "2026-10-30",
    hora_inicio: "15:00 - 19:00",
    lugar: "Sede Lumbreras de Amor",
    coordinador_responsable: "Lic. Laura Camila Ortiz",
    presupuesto_estimado: 900,
    presupuesto_ejecutado: 0,
    meta_asistentes: 40,
    descripcion:
      "Convivio con refacción, música y reconocimiento a las mujeres que participan en los talleres de la organización.",
    voluntarios_nombres: [
      "Lic. Laura Camila Ortiz",
      "Mariana Duque Zuluaga",
      "Carlos Alberto Navarro",
      "Dra. Carolina Méndez",
    ],
  },
  {
    titulo: "Cena Benéfica Lumbreras de Amor",
    categoria: "Recaudación de Fondos",
    estado: "Planificado",
    fecha: "2026-11-14",
    hora_inicio: "18:30 - 22:00",
    lugar: "Salón Social Villa Esperanza",
    coordinador_responsable: "Mariana Duque Zuluaga",
    presupuesto_estimado: 1500,
    presupuesto_ejecutado: 200,
    meta_asistentes: 60,
    descripcion:
      "Cena con donantes y aliados para recaudar fondos a favor de los programas de la organización.",
    voluntarios_nombres: [
      "Mariana Duque Zuluaga",
      "Lic. Laura Camila Ortiz",
      "Chef Martha Cecilia Rojas",
    ],
  },
  {
    titulo: "Taller de Capacitación para Voluntarios",
    categoria: "Capacitación",
    estado: "Finalizado",
    fecha: "2026-09-19",
    hora_inicio: "09:00 - 12:00",
    lugar: "Sede Lumbreras de Amor",
    coordinador_responsable: "Prof. Andrés Felipe Ruiz",
    presupuesto_estimado: 200,
    presupuesto_ejecutado: 180,
    meta_asistentes: 6,
    descripcion:
      "Inducción sobre trato a las familias, manejo de grupos y registro de asistencia en terreno.",
    voluntarios_nombres: ["Prof. Andrés Felipe Ruiz", "Carlos Alberto Navarro"],
  },
];

export const JORNADAS_SEED = [
  {
    titulo: "Gran Jornada de Salud Integral y Nutrición Comunitaria",
    categoria: "Jornada de Salud",
    estado: "Finalizado",
    fecha: "2026-08-08",
    horario: "08:30 - 13:30",
    ubicacion: "Centro Comunitario San Jerónimo (Villa Esperanza)",
    coordinador: "Lic. Laura Camila Ortiz",
    presupuesto_total: 1200,
    presupuesto_ejecutado: 1150,
    convocados: 8,
    asistieron: 7,
    voluntarios_asignados: 3,
    descripcion:
      "Valoración médica general, control de talla y peso, entrega de suplementos multivitamínicos y kits de higiene.",
    servicios: [
      {
        nombre: "Valoración médica general",
        descripcion: "Consulta médica básica y revisión de signos vitales.",
        responsable: "Dra. Carolina Méndez",
        atendidos: 7,
      },
      {
        nombre: "Control de talla y peso",
        descripcion: "Medición antropométrica para el seguimiento nutricional.",
        responsable: "Lic. Laura Camila Ortiz",
        atendidos: 7,
      },
      {
        nombre: "Entrega de suplementos y kits de higiene",
        descripcion: "Multivitamínicos y kits de cuidado bucal y personal.",
        responsable: "Carlos Alberto Navarro",
        atendidos: 7,
      },
    ],
  },
  {
    titulo: "Jornada de Atención Psicosocial y Salud Mental Comunitaria",
    categoria: "Atención Psicosocial",
    estado: "Planificado",
    fecha: "2026-08-22",
    horario: "14:00 - 18:00",
    ubicacion: "Cancha Polideportiva Brisas del Sur",
    coordinador: "Mariana Duque Zuluaga",
    presupuesto_total: 1800,
    presupuesto_ejecutado: 650,
    convocados: 8,
    asistieron: 8,
    voluntarios_asignados: 5,
    descripcion:
      "Estaciones de pintura, dinámicas grupales, y entrega de materiales didácticos y recreativos.",
    servicios: [
      {
        nombre: "Estaciones de pintura y creatividad",
        descripcion: "Taller de pintura y obra reflexiva con valores de paz.",
        responsable: "Mariana Duque Zuluaga",
        atendidos: 8,
      },
      {
        nombre: "Dinámicas grupales",
        descripcion: "Juegos y actividades de integración familiar.",
        responsable: "Mariana Duque Zuluaga",
        atendidos: 8,
      },
      {
        nombre: "Entrega de materiales didácticos",
        descripcion: "Materiales recreativos y educativos para las familias.",
        responsable: "Carlos Alberto Navarro",
        atendidos: 0,
      },
    ],
  },
  {
    titulo: "Comedor Solidario & Entrega de Mercados Nutricionales",
    categoria: "Comedor Comunitario",
    estado: "Finalizado",
    fecha: "2026-07-26",
    horario: "11:30 - 15:00",
    ubicacion: "Sede Lumbreras de Amor",
    coordinador: "Chef Martha Cecilia Rojas",
    presupuesto_total: 950,
    presupuesto_ejecutado: 920,
    convocados: 6,
    asistieron: 5,
    voluntarios_asignados: 3,
    descripcion:
      "Almuerzo caliente balanceado y entrega de canasta de víveres esenciales a familias de alta vulnerabilidad.",
    servicios: [
      {
        nombre: "Almuerzo caliente balanceado",
        descripcion: "Comida nutritiva servida en el comedor comunitario.",
        responsable: "Chef Martha Cecilia Rojas",
        atendidos: 5,
      },
      {
        nombre: "Entrega de canasta de víveres",
        descripcion: "Mercado nutricional para familias de alta vulnerabilidad.",
        responsable: "Carlos Alberto Navarro",
        atendidos: 5,
      },
    ],
  },
  {
    titulo: 'Campaña Educativa "Semillas de Esperanza y Conocimiento"',
    categoria: "Entrega de Kits & Víveres",
    estado: "Finalizado",
    fecha: "2026-07-12",
    horario: "09:00 - 13:00",
    ubicacion: "Sede Comunitaria La Esperanza",
    coordinador: "Prof. Andrés Felipe Ruiz",
    presupuesto_total: 1500,
    presupuesto_ejecutado: 1420,
    convocados: 5,
    asistieron: 5,
    voluntarios_asignados: 3,
    descripcion:
      "Dotación de morrales con útiles completos, reglas, tijeras y recipientes para hidratación.",
    servicios: [
      {
        nombre: "Entrega de morrales con útiles",
        descripcion: "Cuadernos, reglas, tijeras y colores completos.",
        responsable: "Prof. Andrés Felipe Ruiz",
        atendidos: 5,
      },
      {
        nombre: "Entrega de recipientes para hidratación",
        descripcion: "Botellas reutilizables para cada niño beneficiado.",
        responsable: "Prof. Andrés Felipe Ruiz",
        atendidos: 5,
      },
    ],
  },
];

export async function seedDatabaseIfNeeded(db: PrismaClient): Promise<{
  mujeresCount: number;
  ninosCount: number;
  voluntariosCount: number;
  donacionesCount: number;
  eventosCount: number;
  jornadasCount: number;
}> {
  // 1. Beneficiarios (Mujeres y Niños)
  const existingBeneficiarios = await db.beneficiario.count();
  if (existingBeneficiarios === 0) {
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
  }

  // 2. Voluntarios (Propios y Externos)
  const existingVoluntarios = await db.voluntario.count();
  const voluntarioPorNombre = new Map<string, number>();
  if (existingVoluntarios === 0) {
    for (const v of VOLUNTARIOS_SEED) {
      const created = await db.voluntario.create({ data: v });
      voluntarioPorNombre.set(created.nombre_completo, created.id_voluntario);
    }
  } else {
    const todos = await db.voluntario.findMany();
    for (const v of todos) {
      voluntarioPorNombre.set(v.nombre_completo, v.id_voluntario);
    }
  }

  // 3. Donantes y Donaciones Monetarias
  const existingDonaciones = await db.donacionMonetaria.count();
  if (existingDonaciones === 0) {
    const donantePorNombre = new Map<string, number>();
    for (const d of DONANTES_SEED) {
      const created = await db.donante.create({ data: d });
      donantePorNombre.set(created.nombre_o_razon_social, created.id_donante);
    }

    for (const don of DONACIONES_SEED) {
      const idDonante = donantePorNombre.get(don.donante_nombre) ?? null;
      await db.donacionMonetaria.create({
        data: {
          numero_recibo: don.numero_recibo,
          monto: don.monto,
          moneda: don.moneda,
          programa_destino: don.programa_destino,
          fecha: don.fecha,
          descripcion: don.descripcion,
          metodo_pago: "Transferencia / Depósito",
          id_donante: idDonante,
        },
      });
    }
  }

  // 4. Eventos y Asignación de Voluntarios (Apoya)
  const existingEventos = await db.evento.count();
  if (existingEventos === 0) {
    for (const e of EVENTOS_SEED) {
      const created = await db.evento.create({
        data: {
          titulo: e.titulo,
          categoria: e.categoria,
          estado: e.estado,
          fecha: e.fecha,
          hora_inicio: e.hora_inicio,
          lugar: e.lugar,
          coordinador_responsable: e.coordinador_responsable,
          presupuesto_estimado: e.presupuesto_estimado,
          presupuesto_ejecutado: e.presupuesto_ejecutado,
          meta_asistentes: e.meta_asistentes,
          descripcion: e.descripcion,
        },
      });

      for (const nomVol of e.voluntarios_nombres) {
        const idVol = voluntarioPorNombre.get(nomVol);
        if (idVol) {
          await db.apoya.create({
            data: {
              id_evento: created.id_evento,
              id_voluntario: idVol,
            },
          });
        }
      }
    }
  }

  // 5. Jornadas y Servicios
  const existingJornadas = await db.jornada.count();
  if (existingJornadas === 0) {
    for (const j of JORNADAS_SEED) {
      const created = await db.jornada.create({
        data: {
          titulo: j.titulo,
          categoria: j.categoria,
          estado: j.estado,
          fecha: j.fecha,
          horario: j.horario,
          ubicacion: j.ubicacion,
          coordinador: j.coordinador,
          presupuesto_total: j.presupuesto_total,
          presupuesto_ejecutado: j.presupuesto_ejecutado,
          convocados: j.convocados,
          asistieron: j.asistieron,
          voluntarios_asignados: j.voluntarios_asignados,
          descripcion: j.descripcion,
        },
      });

      for (const s of j.servicios) {
        await db.servicio.create({
          data: {
            id_jornada: created.id_jornada,
            nombre: s.nombre,
            descripcion: s.descripcion,
            responsable: s.responsable,
            atendidos: s.atendidos,
          },
        });
      }
    }
  }

  return {
    mujeresCount: await db.beneficiario.count({
      where: { tipo_beneficiario: "Mujer" },
    }),
    ninosCount: await db.beneficiario.count({
      where: { tipo_beneficiario: "Niño" },
    }),
    voluntariosCount: await db.voluntario.count(),
    donacionesCount: await db.donacionMonetaria.count(),
    eventosCount: await db.evento.count(),
    jornadasCount: await db.jornada.count(),
  };
}

// Ejecución directa desde CLI: `bun run src/seed.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = createDatabaseClient({ mode: "local" });
  try {
    const result = await seedDatabaseIfNeeded(db);
    console.log(
      `[Seed] Base de datos SQLite local lista: ${result.mujeresCount} mujeres, ${result.ninosCount} niños, ${result.voluntariosCount} voluntarios, ${result.donacionesCount} donaciones, ${result.eventosCount} eventos, ${result.jornadasCount} jornadas.`
    );
  } finally {
    await db.$disconnect();
  }
}
