// Generación y guardado de diplomas en formato PDF (A4 horizontal).
import { renderizarDiplomaHtml, type Diploma } from "./diplomas";

const A4_ANCHO_PX = 1123;
const A4_ALTO_PX = 794;
const A4_ANCHO_MM = 297;
const A4_ALTO_MM = 210;

const PDF_FILTRO = [{ name: "Documento PDF", extensions: ["pdf"] }];

function esEntornoTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function nombreArchivoPdf(codigo?: string): string {
  const base = (codigo || "diploma")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "diploma"}.pdf`;
}

function conTiempoLimite<T>(promesa: Promise<T>, ms: number, mensaje: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(mensaje)), ms);
    promesa.then(
      (v) => (window.clearTimeout(t), resolve(v)),
      (e) => (window.clearTimeout(t), reject(e))
    );
  });
}

async function esperarCargaIframe(iframe: HTMLIFrameElement, html: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Tiempo de espera agotado al preparar el diploma.")), 10000);
    iframe.addEventListener(
      "load",
      async () => {
        window.clearTimeout(timeout);
        const doc = iframe.contentDocument;
        if (!doc) {
          reject(new Error("No se pudo acceder al contenido del diploma."));
          return;
        }
        try {
          if (doc.fonts?.ready) await doc.fonts.ready;
        } catch {
          // Si el navegador no soporta fonts.ready en iframe, continuamos igual.
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        resolve(doc);
      },
      { once: true }
    );
    iframe.srcdoc = html;
  });
}

/** Convierte el HTML renderizado de un diploma en un PDF A4 horizontal. */
export async function htmlDiplomaAPdfBytes(html: string): Promise<Uint8Array> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${A4_ANCHO_PX}px`;
  iframe.style.height = `${A4_ALTO_PX}px`;
  iframe.style.border = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  try {
    // Sin sandbox (html2canvas necesita crear su propio iframe de clonado) pero sin scripts de la plantilla.
    const doc = await esperarCargaIframe(iframe, html.replace(/<script[\s\S]*?<\/script>/gi, ""));
    const objetivo = (doc.querySelector(".diploma") as HTMLElement | null) ?? doc.body;
    const { default: html2canvas } = await import("html2canvas-pro");
    const canvas = await conTiempoLimite(html2canvas(objetivo, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: objetivo.offsetWidth || A4_ANCHO_PX,
      height: objetivo.offsetHeight || A4_ALTO_PX,
      windowWidth: A4_ANCHO_PX,
      windowHeight: A4_ALTO_PX,
      logging: false,
      imageTimeout: 8000,
    }), 30000, "Tiempo de espera agotado al generar la imagen del diploma.");

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, A4_ANCHO_MM, A4_ALTO_MM, undefined, "FAST");
    return new Uint8Array(pdf.output("arraybuffer"));
  } finally {
    iframe.remove();
  }
}

function descargarPdfEnNavegador(nombre: string, bytes: Uint8Array): void {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Guarda un PDF en disco (diálogo nativo en Tauri o descarga directa en navegador). Devuelve la ruta o null si se canceló. */
export async function guardarArchivoPdf(nombre: string, bytes: Uint8Array): Promise<string | null> {
  if (!esEntornoTauri()) {
    descargarPdfEnNavegador(nombre, bytes);
    return nombre;
  }
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  const ruta = await save({ defaultPath: nombre, filters: PDF_FILTRO });
  if (!ruta) return null;
  await writeFile(ruta, bytes);
  return ruta;
}

/** Genera y guarda en PDF un diploma (reutilizando `html` si ya está renderizado). */
export async function guardarDiplomaPdf(
  diploma: Pick<Diploma, "id" | "codigo">,
  opciones: { html?: string; plantilla?: string } = {}
): Promise<string | null> {
  const html = opciones.html ?? (await renderizarDiplomaHtml(diploma.id, opciones.plantilla));
  const bytes = await htmlDiplomaAPdfBytes(html);
  return guardarArchivoPdf(nombreArchivoPdf(diploma.codigo), bytes);
}
