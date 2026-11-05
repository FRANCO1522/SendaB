/* ==========================================================================
   SENDA B — Servidor estático
   --------------------------------------------------------------------------
   Publica el portal turístico de Senda B tal como está guardado en public/.
   No usa dependencias externas ni base de datos: solo los módulos de Node.

   Todo el contenido (lugares, fotografías y descripciones) es estático y vive
   en public/: no hay panel de administración, ni sesiones, ni subida de
   imágenes, ni almacenamiento persistente que mantener.

   Fotografías: el servidor recorre la carpeta «imagenes/» de la raíz del
   proyecto (las fotografías originales de la comunidad) y también
   public/imagenes/. Su inventario se publica en GET /api/imagenes para que la
   galería muestre automáticamente cualquier fotografía nueva: basta con
   copiar el archivo a imagenes/ y recargar la página, sin editar el HTML.

   Variables de entorno:
     PORT   puerto de escucha. Render lo asigna automáticamente (por defecto 3000).
     HOST   interfaz de escucha (por defecto 0.0.0.0, necesario en Render).

   Uso local:
     npm start        →  http://localhost:3000
   ========================================================================== */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const CARPETA_PUBLICA = path.join(__dirname, "public");
const CARPETA_FOTOS = path.join(__dirname, "imagenes");
const CARPETA_FOTOS_PUBLICAS = path.join(CARPETA_PUBLICA, "imagenes");
const PUERTO = Number(process.env.PORT) || 3000;
const INTERFAZ = process.env.HOST || "0.0.0.0";

/* Extensiones que se consideran fotografías de la comunidad. */
const EXTENSIONES_FOTO = [".jpg", ".jpeg", ".jfif", ".png", ".webp", ".gif", ".avif", ".bmp"];

/* Tipos MIME de los archivos que publica el sitio. */
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

const TIPO_POR_DEFECTO = "application/octet-stream";

/* --------------------------------------------------------------------------
   Utilidades de archivos
   -------------------------------------------------------------------------- */
function tipoDe(archivo) {
  return TIPOS[path.extname(archivo).toLowerCase()] || TIPO_POR_DEFECTO;
}

/* El HTML siempre se revalida; las fotografías pueden guardarse en el
   navegador porque ya no se modifican. */
function cacheDe(archivo) {
  if (archivo.endsWith(".html")) return "no-cache";
  if (/\.(jpe?g|jfif|png|webp|gif|svg|ico|avif|bmp)$/i.test(archivo)) return "public, max-age=604800";
  return "public, max-age=3600";
}

function etiquetaDe(stats) {
  return 'W/"' + stats.size.toString(16) + "-" + Math.floor(stats.mtimeMs).toString(16) + '"';
}

/* Convierte la ruta pedida en un archivo real dentro de public/.
   Devuelve null si la ruta es inválida o intenta salir de la carpeta. */
function archivoSolicitado(url) {
  let ruta;

  try {
    ruta = decodeURIComponent(String(url || "/").split("?")[0].split("#")[0]);
  } catch (error) {
    return null;
  }

  if (ruta.charAt(0) !== "/" || ruta.indexOf("\0") !== -1) return null;
  if (ruta.endsWith("/")) ruta += "index.html";

  const segmentos = ruta.split("/").filter(Boolean);
  if (segmentos.some((segmento) => segmento.charAt(0) === ".")) return null;

  const absoluta = path.resolve(CARPETA_PUBLICA, "." + path.posix.normalize(ruta));
  const relativa = path.relative(CARPETA_PUBLICA, absoluta);

  if (!relativa || relativa.startsWith("..") || path.isAbsolute(relativa)) return null;

  return absoluta;
}

/* --------------------------------------------------------------------------
   Fotografías de la comunidad

   Las fotografías originales viven en imagenes/ (raíz del proyecto) y sus
   copias publicadas en public/imagenes/. El servidor las recorre, evita
   publicar dos veces el mismo archivo (se comparan por contenido) y expone el
   inventario en /api/imagenes para que la galería las muestre sola.
   -------------------------------------------------------------------------- */
function esFoto(nombre) {
  return EXTENSIONES_FOTO.indexOf(path.extname(String(nombre)).toLowerCase()) !== -1;
}

/* Texto comparable: sin tildes, sin mayúsculas y con guiones en lugar de
   espacios, puntos o signos. Así «Colegio U. E. Nueva Canaan .jpeg» y
   «colegio-ue-nueva-canaan.jpg» se reconocen como la misma fotografía. */
function claveDe(texto) {
  return String(texto == null ? "" : texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Igual que claveDe pero sin separadores: «colegio-u-e-nueva-canaan» y
   «colegio-ue-nueva-canaan» resultan la misma clave. */
function claveCompacta(texto) {
  return claveDe(texto).replace(/-/g, "");
}

/* «PLANTA DE PURIFICACIÓN DE AGUA.jpeg» → «Planta de purificacion de agua». */
function tituloDeArchivo(nombre) {
  const base = path.basename(String(nombre), path.extname(String(nombre)));
  const limpio = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return "Fotografía de la comunidad";
  const texto = limpio.toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function fotosDeCarpeta(carpeta) {
  let entradas;
  try {
    entradas = fs.readdirSync(carpeta, { withFileTypes: true });
  } catch (error) {
    return [];
  }
  return entradas
    .filter((entrada) => entrada.isFile() && esFoto(entrada.name))
    .map((entrada) => entrada.name)
    .sort((a, b) => a.localeCompare(b, "es"));
}

/* Inventario único por contenido: primero las originales de imagenes/ y luego
   las copias de public/imagenes/. Devuelve la lista ordenada por título. */
function inventariarFotos() {
  const vistas = new Map();
  const origenes = [
    { carpeta: CARPETA_FOTOS, origen: "imagenes" },
    { carpeta: CARPETA_FOTOS_PUBLICAS, origen: "public/imagenes" }
  ];

  origenes.forEach(({ carpeta, origen }) => {
    fotosDeCarpeta(carpeta).forEach((nombre) => {
      const completa = path.join(carpeta, nombre);
      let huella;
      let stats;
      try {
        huella = crypto.createHash("sha1").update(fs.readFileSync(completa)).digest("hex");
        stats = fs.statSync(completa);
      } catch (error) {
        return;
      }
      if (vistas.has(huella)) return;
      vistas.set(huella, {
        archivo: nombre,
        clave: claveDe(nombre),
        compacta: claveCompacta(nombre),
        titulo: tituloDeArchivo(nombre),
        origen: origen,
        tipo: tipoDe(nombre),
        bytes: stats.size,
        modificado: stats.mtime.toISOString(),
        url: "/imagenes/" + encodeURIComponent(nombre)
      });
    });
  });

  return Array.from(vistas.values()).sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
}

/* Caché breve del inventario: se invalida sola cuando cambia el contenido de
   las carpetas, así una fotografía nueva aparece al recargar la página. */
let cacheFotos = { firma: "", fotos: [] };

function firmaDeCarpetas() {
  return [CARPETA_FOTOS, CARPETA_FOTOS_PUBLICAS]
    .map((carpeta) => {
      try {
        const stats = fs.statSync(carpeta);
        return stats.mtimeMs;
      } catch (error) {
        return 0;
      }
    })
    .join("|");
}

function fotosDisponibles() {
  const firma = firmaDeCarpetas();
  if (cacheFotos.firma !== firma) {
    cacheFotos = { firma: firma, fotos: inventariarFotos() };
  }
  return cacheFotos.fotos;
}

/* Devuelve el archivo real de una fotografía pedida por /imagenes/<nombre>.
   Se busca primero la copia publicada y luego la original de imagenes/,
   aceptando el nombre exacto o el mismo nombre con otra extensión. */
function fotoSolicitada(nombre) {
  const pedido = String(nombre || "");
  if (!pedido || pedido.indexOf("\0") !== -1 || pedido.indexOf("/") !== -1 || pedido.indexOf("\\") !== -1) {
    return null;
  }

  const carpetas = [CARPETA_FOTOS_PUBLICAS, CARPETA_FOTOS];

  for (const carpeta of carpetas) {
    const exacta = path.join(carpeta, pedido);
    if (path.dirname(exacta) !== carpeta) continue;
    try {
      if (fs.statSync(exacta).isFile()) return exacta;
    } catch (error) {
      /* se prueba con la siguiente carpeta */
    }
  }

  for (const carpeta of carpetas) {
    const nombreClave = claveCompacta(path.basename(pedido, path.extname(pedido)));
    const encontrada = fotosDeCarpeta(carpeta).find(
      (archivo) => claveCompacta(path.basename(archivo, path.extname(archivo))) === nombreClave
    );
    if (encontrada) return path.join(carpeta, encontrada);
  }

  return null;
}

/* Respuesta JSON con el inventario de fotografías disponibles. */
function enviarIndiceFotos(respuesta) {
  const fotos = fotosDisponibles();
  const cuerpo = JSON.stringify(
    {
      total: fotos.length,
      actualizado: new Date().toISOString(),
      carpetas: ["imagenes", "public/imagenes"],
      imagenes: fotos
    },
    null,
    2
  );

  respuesta.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(cuerpo),
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff"
  });
  respuesta.end(cuerpo);
}

/* --------------------------------------------------------------------------
   Respuestas
   -------------------------------------------------------------------------- */
function paginaNoEncontrada(respuesta) {
  const html =
    '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>Página no encontrada | Senda B</title><style>" +
    "body{margin:0;min-height:100vh;display:grid;place-items:center;padding:2rem;background:#0c0a09;" +
    "color:#efe6d8;font-family:Manrope,system-ui,sans-serif;text-align:center}" +
    "h1{margin:0 0 1rem;font-family:Georgia,'Times New Roman',serif;font-weight:400;" +
    "font-size:clamp(2rem,6vw,3.2rem);color:#e8cd93}" +
    "p{max-width:44ch;margin:0 auto 2rem;color:#c9bda9;line-height:1.8}" +
    "a{display:inline-block;padding:0.85rem 1.7rem;border:1px solid rgba(214,178,116,0.5);" +
    "border-radius:999px;color:#e8cd93;text-decoration:none;font-size:0.72rem;" +
    "letter-spacing:0.14em;text-transform:uppercase}" +
    "a:hover{background:rgba(214,178,116,0.12)}" +
    "</style></head><body><main><h1>Página no encontrada</h1>" +
    "<p>La dirección que buscas no existe en el portal de Senda B. Puede que el enlace haya " +
    'cambiado o que la fotografía ya no esté disponible.</p><a href="/">Volver al inicio</a>' +
    "</main></body></html>";

  respuesta.writeHead(404, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff"
  });
  respuesta.end(html);
}

function enviarArchivo(peticion, respuesta, archivo, stats) {
  const etiqueta = etiquetaDe(stats);
  const cache = cacheDe(archivo);
  const modificado = stats.mtime.toUTCString();

  if (peticion.headers["if-none-match"] === etiqueta) {
    respuesta.writeHead(304, {
      ETag: etiqueta,
      "Cache-Control": cache,
      "Last-Modified": modificado
    });
    respuesta.end();
    return;
  }

  respuesta.writeHead(200, {
    "Content-Type": tipoDe(archivo),
    "Content-Length": stats.size,
    "Cache-Control": cache,
    ETag: etiqueta,
    "Last-Modified": modificado,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });

  if (peticion.method === "HEAD") {
    respuesta.end();
    return;
  }

  const flujo = fs.createReadStream(archivo);
  flujo.on("error", () => respuesta.destroy());
  flujo.pipe(respuesta);
}

/* --------------------------------------------------------------------------
   Servidor
   -------------------------------------------------------------------------- */
const servidor = http.createServer((peticion, respuesta) => {
  if (peticion.method !== "GET" && peticion.method !== "HEAD") {
    respuesta.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8"
    });
    respuesta.end("Método no permitido");
    return;
  }

  const ruta = String(peticion.url || "/").split("?")[0].split("#")[0];

  /* Inventario de fotografías: lo consulta la galería al cargar. */
  if (ruta === "/api/imagenes" || ruta === "/api/imagenes/") {
    enviarIndiceFotos(respuesta);
    return;
  }

  /* Fotografías de la comunidad: se buscan en public/imagenes/ y, si no
     están, en imagenes/ (los originales de la raíz del proyecto). */
  if (ruta.indexOf("/imagenes/") === 0) {
    let nombre;
    try {
      nombre = decodeURIComponent(ruta.slice("/imagenes/".length));
    } catch (error) {
      nombre = "";
    }

    const archivoFoto = fotoSolicitada(nombre);

    if (!archivoFoto) {
      paginaNoEncontrada(respuesta);
      return;
    }

    fs.stat(archivoFoto, (error, stats) => {
      if (error || !stats.isFile()) {
        paginaNoEncontrada(respuesta);
        return;
      }
      enviarArchivo(peticion, respuesta, archivoFoto, stats);
    });
    return;
  }

  const archivo = archivoSolicitado(peticion.url);

  if (!archivo) {
    paginaNoEncontrada(respuesta);
    return;
  }

  fs.stat(archivo, (error, stats) => {
    if (error || !stats.isFile()) {
      paginaNoEncontrada(respuesta);
      return;
    }

    enviarArchivo(peticion, respuesta, archivo, stats);
  });
});

servidor.on("error", (error) => {
  console.error("No se pudo iniciar el servidor de Senda B:", error.message);
  process.exit(1);
});

servidor.listen(PUERTO, INTERFAZ, () => {
  console.log("Senda B está disponible en http://localhost:" + PUERTO);
});

["SIGTERM", "SIGINT"].forEach((senal) => {
  process.on(senal, () => {
    console.log("Cerrando el servidor de Senda B…");
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
});
