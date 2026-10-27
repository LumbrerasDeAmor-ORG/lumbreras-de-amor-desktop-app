-- CreateTable
CREATE TABLE IF NOT EXISTS "familia" (
    "id_familia" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_familia" TEXT NOT NULL,
    "apellido_familiar_referencia" TEXT NOT NULL,
    "barrio_sector" TEXT,
    "direccion_hogar" TEXT,
    "telefono_contacto_principal" TEXT,
    "condicion_vivienda" TEXT,
    "ingreso_economico_aproximado" REAL,
    "fecha_censo_ingreso" TEXT,
    "observaciones_socioeconomicas" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "beneficiario" (
    "id_beneficiario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_expediente" TEXT NOT NULL,
    "dpi_identificacion" TEXT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fecha_nacimiento" TEXT,
    "edad" INTEGER,
    "genero" TEXT,
    "tipo_beneficiario" TEXT NOT NULL,
    "direccion" TEXT,
    "colonia" TEXT,
    "telefono" TEXT,
    "estado_civil" TEXT,
    "tercera_edad" TEXT,
    "ocupacion" TEXT,
    "fuentes_de_ingreso" TEXT,
    "nivel_vulnerabilidad" TEXT,
    "hijos_a_cargo" INTEGER DEFAULT 0,
    "programas" TEXT,
    "problemas_sociales" TEXT,
    "nota" TEXT,
    "escolaridad" TEXT,
    "grado_escolar_nivel_educativo" TEXT,
    "talla_camisa" TEXT,
    "talla_pantalon" TEXT,
    "talla_ropa" TEXT,
    "talla_calzado" TEXT,
    "alergias_restricciones" TEXT,
    "condicion_medica_especial" TEXT,
    "observaciones" TEXT,
    "estado_gestacion_lactancia" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fecha_ingreso" TEXT,
    "id_familia" INTEGER,
    "rol_familiar" TEXT,
    "es_tutor_principal" BOOLEAN DEFAULT false,
    "convive_en_mismo_hogar" BOOLEAN DEFAULT true,
    "id_madre" INTEGER,
    "dpi_madre" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "beneficiario_id_madre_fkey" FOREIGN KEY ("id_madre") REFERENCES "beneficiario" ("id_beneficiario") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "beneficiario_id_familia_fkey" FOREIGN KEY ("id_familia") REFERENCES "familia" ("id_familia") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "jornada" (
    "id_jornada" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "horario" TEXT,
    "ubicacion" TEXT NOT NULL,
    "coordinador" TEXT,
    "estado" TEXT NOT NULL,
    "descripcion" TEXT,
    "presupuesto_total" REAL,
    "presupuesto_ejecutado" REAL,
    "convocados" INTEGER,
    "asistieron" INTEGER,
    "voluntarios_asignados" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "servicio" (
    "id_servicio" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_jornada" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsable" TEXT,
    "atendidos" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "servicio_id_jornada_fkey" FOREIGN KEY ("id_jornada") REFERENCES "jornada" ("id_jornada") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "evento" (
    "id_evento" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "hora_inicio" TEXT,
    "lugar" TEXT NOT NULL,
    "meta_asistentes" INTEGER,
    "presupuesto_estimado" REAL,
    "presupuesto_ejecutado" REAL,
    "coordinador_responsable" TEXT,
    "estado" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "asiste" (
    "id_asiste" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_beneficiario" INTEGER NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "estado_asistencia" TEXT,
    "hora_llegada" TEXT,
    "recibio_kit" BOOLEAN,
    "tipo_kit_recibido" TEXT,
    "observaciones_asistencia" TEXT,
    CONSTRAINT "asiste_id_beneficiario_fkey" FOREIGN KEY ("id_beneficiario") REFERENCES "beneficiario" ("id_beneficiario") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asiste_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento" ("id_evento") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "voluntario" (
    "id_voluntario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo_voluntario" TEXT NOT NULL DEFAULT 'Propio',
    "nombre_completo" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "rol_especialidad" TEXT,
    "disponibilidad" TEXT,
    "horas_acumuladas" REAL,
    "contacto_emergencia" TEXT,
    "fecha_ingreso" TEXT,
    "estado" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "apoya" (
    "id_apoya" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_voluntario" INTEGER NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "rol_en_evento" TEXT,
    "horas_dedicadas" REAL,
    CONSTRAINT "apoya_id_voluntario_fkey" FOREIGN KEY ("id_voluntario") REFERENCES "voluntario" ("id_voluntario") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "apoya_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento" ("id_evento") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "donante" (
    "id_donante" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_o_razon_social" TEXT NOT NULL,
    "tipo_donante" TEXT NOT NULL,
    "nit_o_identificacion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "persona_contacto" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "donacion_monetaria" (
    "id_donacion" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero_recibo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "descripcion" TEXT,
    "moneda" TEXT,
    "fecha" TEXT,
    "metodo_pago" TEXT,
    "programa_destino" TEXT,
    "id_donante" INTEGER,
    "id_voluntario" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "donacion_monetaria_id_donante_fkey" FOREIGN KEY ("id_donante") REFERENCES "donante" ("id_donante") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "donacion_monetaria_id_voluntario_fkey" FOREIGN KEY ("id_voluntario") REFERENCES "voluntario" ("id_voluntario") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "donacion_especie" (
    "id_donacion_especie" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero_recibo" TEXT,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT,
    "cantidad" REAL NOT NULL,
    "unidad_medida" TEXT,
    "fecha" TEXT,
    "destino_o_programa" TEXT,
    "id_donante" INTEGER,
    "id_articulo" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "donacion_especie_id_donante_fkey" FOREIGN KEY ("id_donante") REFERENCES "donante" ("id_donante") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "donacion_especie_id_articulo_fkey" FOREIGN KEY ("id_articulo") REFERENCES "articulo_inventario" ("id_articulo") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "articulo_inventario" (
    "id_articulo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "cantidad_disponible" REAL,
    "stock_minimo_alerta" INTEGER,
    "ubicacion_bodega" TEXT,
    "fecha_vencimiento" TEXT,
    "estado_stock" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "movimiento_inventario" (
    "id_movimiento" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo_movimiento" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "fecha" TEXT,
    "motivo" TEXT,
    "registrado_por" TEXT,
    "numero_acta_entrega" TEXT,
    "comprobante_recepcion" TEXT,
    "id_articulo" INTEGER NOT NULL,
    "id_donante" INTEGER,
    "id_evento" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "movimiento_inventario_id_articulo_fkey" FOREIGN KEY ("id_articulo") REFERENCES "articulo_inventario" ("id_articulo") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimiento_inventario_id_donante_fkey" FOREIGN KEY ("id_donante") REFERENCES "donante" ("id_donante") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimiento_inventario_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento" ("id_evento") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "familia_codigo_familia_key" ON "familia"("codigo_familia");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "beneficiario_codigo_expediente_key" ON "beneficiario"("codigo_expediente");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "donacion_monetaria_numero_recibo_key" ON "donacion_monetaria"("numero_recibo");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "donacion_especie_numero_recibo_key" ON "donacion_especie"("numero_recibo");
