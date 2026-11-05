/* ==========================================================================
   SENDA B — Interacción del portal
   --------------------------------------------------------------------------
   Renderiza los lugares y la galería desde window.SENDA_GALERIA, aplica
   filtros y búsqueda, abre el visor de imágenes, completa la ubicación y el
   contacto desde window.SENDA_CONFIG y anima la página al desplazarse.

   El contenido es estático: los lugares, las fotografías y las descripciones
   viven en js/datos.js y en la carpeta imagenes/. El sitio no tiene panel de
   administración, ni sesiones, ni llamadas a una API: solo necesita el
   servidor estático de server.js para publicarse.
   ========================================================================== */
(function () {
  "use strict";

  const CONFIG = Object.assign(
    { nombre: "Senda B", pais: "Bolivia", ubicacion: {}, contacto: {}, compartir: {}, seo: {} },
    window.SENDA_CONFIG || {}
  );
  CONFIG.ubicacion = CONFIG.ubicacion || {};
  CONFIG.contacto = CONFIG.contacto || {};
  CONFIG.compartir = CONFIG.compartir || {};
  CONFIG.seo = CONFIG.seo || {};

  const SEMILLA = window.SENDA_GALERIA || { categorias: [], lugares: [] };

  const $ = (selector, contexto) => (contexto || document).querySelector(selector);
  const $$ = (selector, contexto) => Array.from((contexto || document).querySelectorAll(selector));
  const prefiereMenosMovimiento =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const estado = {
    categorias: [],
    lugares: [],
    filtro: "todas",
    busqueda: "",
    visibles: [],
    listaVisor: [],
    indice: 0,
    ultimoFoco: null,
    observador: null
  };

  /* ------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------ */
  function escapar(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizar(texto) {
    return String(texto == null ? "" : texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function icono(nombre) {
    return (
      '<svg aria-hidden="true" focusable="false"><use href="#' +
      escapar(nombre) +
      '"></use></svg>'
    );
  }

  function parametro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  function nombreCategoria(id) {
    const encontrada = estado.categorias.find((categoria) => categoria.id === id);
    return encontrada ? encontrada.nombre : "Galería";
  }

  function parrafos(texto) {
    return String(texto || "")
      .split(/\n\s*\n/)
      .map((bloque) => bloque.trim())
      .filter(Boolean);
  }

  function primerParrafo(texto) {
    const bloques = parrafos(texto);
    return bloques.length ? bloques[0] : "";
  }

  function ordenar(lugares) {
    return lugares.slice().sort((a, b) => {
      const ordenA = Number.isFinite(Number(a.orden)) ? Number(a.orden) : 999;
      const ordenB = Number.isFinite(Number(b.orden)) ? Number(b.orden) : 999;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return String(a.titulo || "").localeCompare(String(b.titulo || ""), "es");
    });
  }

  function observar(elemento) {
    if (!estado.observador) {
      elemento.classList.add("es-visible");
      return;
    }
    estado.observador.observe(elemento);
  }

  function aplicarDatos(datos) {
    if (!datos || !Array.isArray(datos.lugares)) return false;
    const categorias = Array.isArray(datos.categorias) ? datos.categorias : SEMILLA.categorias;
    const lugares = datos.lugares.filter((lugar) => lugar && lugar.id && lugar.titulo && lugar.imagen);

    estado.categorias = categorias
      .filter((categoria) => categoria && categoria.id && categoria.nombre)
      .map((categoria) => ({
        id: String(categoria.id),
        nombre: String(categoria.nombre),
        descripcion: String(categoria.descripcion || "")
      }));

    estado.lugares = ordenar(
      lugares.map((lugar) => ({
        id: String(lugar.id),
        titulo: String(lugar.titulo),
        categoria: String(lugar.categoria || ""),
        imagen: String(lugar.imagen),
        alt: String(lugar.alt || lugar.titulo),
        resumen: String(lugar.resumen || primerParrafo(lugar.descripcion)),
        descripcion: String(lugar.descripcion || lugar.resumen || ""),
        importancia: String(lugar.importancia || ""),
        destacado: Boolean(lugar.destacado),
        orden: Number.isFinite(Number(lugar.orden)) ? Number(lugar.orden) : 999
      }))
    );

    return true;
  }

  /* ------------------------------------------------------------------
     Fotografías descubiertas automáticamente

     server.js recorre las carpetas imagenes/ y public/imagenes/ y publica su
     inventario en «api/imagenes». Con esa lista se agregan a la galería las
     fotografías que todavía no tienen ficha en js/datos.js: basta con copiar
     un archivo a la carpeta imagenes/ y recargar la página.
     Si la página se abre sin servidor (por ejemplo con doble clic en el
     archivo), la consulta no responde y se conserva el catálogo de datos.js.
     ------------------------------------------------------------------ */
  const CATEGORIA_POR_DEFECTO = "vida-cotidiana";

  const PALABRAS_CATEGORIA = [
    { categoria: "iglesia", palabras: ["iglesia", "capilla", "templo"] },
    { categoria: "guarderia", palabras: ["guarderia", "ninos", "ninas", "infancia"] },
    { categoria: "educacion", palabras: ["colegio", "escuela", "unidad", "educativa", "educacion", "aula"] },
    { categoria: "deporte", palabras: ["cancha", "futbol", "basquet", "deporte", "deportiva"] },
    {
      categoria: "empresas",
      palabras: ["empresa", "planta", "fabrica", "asproban", "ebita", "te", "produccion", "galpon"]
    },
    { categoria: "paisajes", palabras: ["rio", "paisaje", "cerro", "monte", "naturaleza", "arbol", "quebrada"] },
    { categoria: "calles", palabras: ["calle", "camino", "cruce", "ruta", "senda", "puente"] },
    { categoria: "plazas", palabras: ["plaza", "rotonda", "parque", "paseo"] }
  ];

  function claveDe(texto) {
    return normalizar(texto)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* Clave compacta: ignora espacios, puntos y guiones, de modo que
     «Colegio U. E. Nueva Canaan .jpeg» y «colegio-ue-nueva-canaan.jpg» sean la
     misma fotografía. */
  function compacta(texto) {
    return normalizar(texto).replace(/[^a-z0-9]+/g, "");
  }

  function claveDeImagen(ruta) {
    const archivo = String(ruta || "").split("?")[0].split("#")[0].split("/").pop();
    let nombre = archivo;
    try {
      nombre = decodeURIComponent(archivo);
    } catch (error) {
      nombre = archivo;
    }
    return compacta(nombre.replace(/\.[a-z0-9]+$/i, ""));
  }

  function tituloDesdeArchivo(archivo) {
    const base = String(archivo || "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_\.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!base) return "Fotografía de la comunidad";
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  function categoriaSugerida(titulo) {
    const palabras = claveDe(titulo).split("-").filter(Boolean);
    const existentes = estado.categorias.map((categoria) => categoria.id);

    for (let i = 0; i < PALABRAS_CATEGORIA.length; i += 1) {
      const regla = PALABRAS_CATEGORIA[i];
      if (existentes.indexOf(regla.categoria) === -1) continue;
      if (regla.palabras.some((palabra) => palabras.indexOf(palabra) !== -1)) {
        return regla.categoria;
      }
    }

    if (existentes.indexOf(CATEGORIA_POR_DEFECTO) !== -1) return CATEGORIA_POR_DEFECTO;
    return existentes.length ? existentes[0] : "turismo";
  }

  /* Agrega los lugares que falten y devuelve true si la galería cambió. */
  function fusionarFotos(descubiertas) {
    if (!Array.isArray(descubiertas) || !descubiertas.length) return false;

    const conocidas = new Set();
    estado.lugares.forEach((lugar) => {
      conocidas.add(compacta(lugar.id));
      conocidas.add(claveDeImagen(lugar.imagen));
    });

    let agregadas = 0;

    descubiertas.forEach((foto) => {
      const archivo = String((foto && foto.archivo) || "");
      if (!archivo) return;

      const identificador = claveDe(archivo.replace(/\.[a-z0-9]+$/i, ""));
      const compacto = compacta(archivo.replace(/\.[a-z0-9]+$/i, ""));
      if (!identificador || conocidas.has(compacto)) return;
      conocidas.add(compacto);

      const titulo = String((foto && foto.titulo) || "").trim() || tituloDesdeArchivo(archivo);
      const categoria = categoriaSugerida(titulo);
      const url = String((foto && foto.url) || "").trim() || "imagenes/" + encodeURIComponent(archivo);

      estado.lugares.push({
        id: "foto-" + identificador,
        titulo: titulo,
        categoria: categoria,
        imagen: url,
        alt: "Fotografía de " + titulo + " en la comunidad de Nueva Canaán, Senda B",
        resumen:
          "Una fotografía de " + titulo + ", incorporada automáticamente desde la carpeta imagenes de la comunidad.",
        descripcion:
          "Fotografía de " +
          titulo +
          ", un rincón de la comunidad de Nueva Canaán · Senda B, en el municipio de Chimoré " +
          "(Cochabamba, Bolivia). La imagen forma parte del archivo fotográfico de la comunidad " +
          "y se muestra aquí tal como fue tomada.",
        importancia: "",
        destacado: false,
        orden: 100 + agregadas
      });
      agregadas += 1;
    });

    if (!agregadas) return false;

    estado.lugares = ordenar(estado.lugares);
    return true;
  }

  function descubrirFotos() {
    if (typeof window.fetch !== "function") return Promise.resolve(false);
    if (window.location && window.location.protocol === "file:") return Promise.resolve(false);

    return window
      .fetch("api/imagenes", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((respuesta) => (respuesta && respuesta.ok ? respuesta.json() : null))
      .then((datos) => (datos && Array.isArray(datos.imagenes) ? fusionarFotos(datos.imagenes) : false))
      .catch(() => false);
  }

  /* ------------------------------------------------------------------
     Lugares destacados
     ------------------------------------------------------------------ */
  function renderDestacados() {
    const contenedor = $("#lista-destacados");
    if (!contenedor) return;

    let destacados = estado.lugares.filter((lugar) => lugar.destacado);
    if (!destacados.length) destacados = estado.lugares.slice(0, 2);

    if (!destacados.length) {
      contenedor.innerHTML =
        '<p class="cargando">Todavía no hay lugares cargados. Revisa el catálogo de js/datos.js.</p>';
      return;
    }

    contenedor.innerHTML = destacados
      .map((lugar, posicion) => {
        const numero = String(posicion + 1).padStart(2, "0");
        const invertido = posicion % 2 === 1 ? " destacado--invertido" : "";
        return (
          '<article class="destacado revelar' + invertido + '" id="lugar-' + escapar(lugar.id) + '">' +
            '<div class="destacado__media">' +
              '<figure class="destacado__figura">' +
                '<img class="destacado__foto" src="' + escapar(lugar.imagen) + '" alt="' + escapar(lugar.alt) + '" loading="lazy" decoding="async">' +
                '<span class="destacado__numero" aria-hidden="true">' + numero + "</span>" +
              "</figure>" +
              '<button class="destacado__ampliar" type="button" data-abrir="' + escapar(lugar.id) + '" data-lista="destacados">' +
                icono("i-lupa") +
                "<span>Ampliar fotografía</span>" +
              "</button>" +
            "</div>" +
            '<div class="destacado__cuerpo">' +
              '<span class="destacado__categoria">' + escapar(nombreCategoria(lugar.categoria)) + "</span>" +
              '<h3 class="destacado__titulo">' + escapar(lugar.titulo) + "</h3>" +
              '<p class="destacado__texto">' + escapar(primerParrafo(lugar.descripcion)) + "</p>" +
              (lugar.importancia
                ? '<div class="destacado__importancia">' +
                    '<p class="destacado__importancia-titulo">Importancia para la comunidad</p>' +
                    "<p>" + escapar(lugar.importancia) + "</p>" +
                  "</div>"
                : "") +
              '<button class="enlace-flecha" type="button" data-abrir="' + escapar(lugar.id) + '" data-lista="todas">' +
                "Ver ficha completa" + icono("i-flecha") +
              "</button>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");

    $$(".destacado", contenedor).forEach((elemento) => observar(elemento));
  }

  /* ------------------------------------------------------------------
     Filtros de categorías
     ------------------------------------------------------------------ */
  function contarPorCategoria(id) {
    if (id === "todas") return estado.lugares.length;
    return estado.lugares.filter((lugar) => lugar.categoria === id).length;
  }

  function renderFiltros() {
    const contenedor = $("#filtros");
    if (!contenedor) return;

    const categorias = estado.categorias.slice();
    const huerfanas = estado.lugares
      .map((lugar) => lugar.categoria)
      .filter((id) => id && !categorias.some((categoria) => categoria.id === id));

    Array.from(new Set(huerfanas)).forEach((id) => {
      categorias.push({ id: id, nombre: id.replace(/-/g, " "), descripcion: "" });
    });

    const botones = [
      '<button class="filtro' + (estado.filtro === "todas" ? " activo" : "") + '" type="button" data-categoria="todas" aria-pressed="' + (estado.filtro === "todas") + '">' +
        "Todas" +
        '<span class="filtro__cuenta">' + contarPorCategoria("todas") + "</span>" +
      "</button>"
    ];

    categorias.forEach((categoria) => {
      const cantidad = contarPorCategoria(categoria.id);
      const activo = estado.filtro === categoria.id;
      botones.push(
        '<button class="filtro' + (activo ? " activo" : "") + (cantidad === 0 ? " filtro--vacio" : "") + '" type="button" data-categoria="' + escapar(categoria.id) + '" aria-pressed="' + activo + '" title="' + escapar(categoria.descripcion || categoria.nombre) + '">' +
          escapar(categoria.nombre) +
          '<span class="filtro__cuenta">' + cantidad + "</span>" +
        "</button>"
      );
    });

    contenedor.innerHTML = botones.join("");
  }

  /* ------------------------------------------------------------------
     Galería, búsqueda y contador
     ------------------------------------------------------------------ */
  function filtrarLugares() {
    const consulta = normalizar(estado.busqueda);
    const palabras = consulta ? consulta.split(/\s+/).filter(Boolean) : [];

    estado.visibles = estado.lugares.filter((lugar) => {
      if (estado.filtro !== "todas" && lugar.categoria !== estado.filtro) return false;
      if (!palabras.length) return true;
      const contenido = normalizar(
        [lugar.titulo, lugar.resumen, lugar.descripcion, lugar.alt, nombreCategoria(lugar.categoria)].join(" ")
      );
      return palabras.every((palabra) => contenido.indexOf(palabra) !== -1);
    });

    return estado.visibles;
  }

  function textoContador() {
    const total = estado.lugares.length;
    const visibles = estado.visibles.length;
    if (!total) return "Sin fotografías por ahora";
    if (visibles === total && !estado.busqueda.trim()) {
      return total === 1 ? "1 fotografía en la galería" : total + " fotografías en la galería";
    }
    if (!visibles) return "Ninguna fotografía coincide";
    return "Mostrando " + visibles + " de " + total + " fotografías";
  }

  function renderGaleria() {
    const contenedor = $("#lista-galeria");
    if (!contenedor) return;

    filtrarLugares();

    contenedor.innerHTML = estado.visibles
      .map((lugar, posicion) => {
        const retardo = Math.min(posicion, 5);
        return (
          '<article class="tarjeta revelar" style="--retardo:' + retardo + '">' +
            '<div class="tarjeta__media">' +
              '<img src="' + escapar(lugar.imagen) + '" alt="' + escapar(lugar.alt) + '" loading="lazy" decoding="async">' +
              '<span class="tarjeta__categoria">' + escapar(nombreCategoria(lugar.categoria)) + "</span>" +
              '<span class="tarjeta__lupa" aria-hidden="true">' + icono("i-lupa") + "</span>" +
            "</div>" +
            '<div class="tarjeta__cuerpo">' +
              '<h3 class="tarjeta__titulo">' + escapar(lugar.titulo) + "</h3>" +
              '<p class="tarjeta__resumen">' + escapar(lugar.resumen) + "</p>" +
              '<span class="tarjeta__accion">Ver fotografía' + icono("i-flecha") + "</span>" +
            "</div>" +
            '<button class="tarjeta__abrir" type="button" data-abrir="' + escapar(lugar.id) + '" data-lista="filtrada" aria-label="Ampliar la fotografía de ' + escapar(lugar.titulo) + '"></button>' +
          "</article>"
        );
      })
      .join("");

    const contador = $("#contador-galeria");
    if (contador) contador.textContent = textoContador();

    const vacio = $("#galeria-vacio");
    if (vacio) {
      const hayVacios = estado.visibles.length === 0;
      vacio.hidden = !hayVacios;
      if (hayVacios) {
        const titulo = $("h3", vacio);
        const texto = $("#galeria-vacio-texto");
        if (estado.busqueda.trim()) {
          if (titulo) titulo.textContent = "Sin resultados para «" + estado.busqueda.trim() + "»";
          if (texto) texto.textContent = "Prueba con otra palabra o vuelve a ver todas las fotografías de Senda B.";
        } else if (estado.filtro !== "todas") {
          if (titulo) titulo.textContent = "Todavía no hay fotografías en " + nombreCategoria(estado.filtro).toLowerCase();
          if (texto) texto.textContent = "Selecciona otra categoría para seguir recorriendo la galería de Senda B.";
        } else {
          if (titulo) titulo.textContent = "Todavía no hay fotografías aquí";
          if (texto) texto.textContent = "El catálogo de Senda B se revisa en js/datos.js y en la carpeta imagenes/.";
        }
      }
    }

    if (prefiereMenosMovimiento) {
      $$(".revelar", contenedor).forEach((elemento) => elemento.classList.add("es-visible"));
    } else {
      $$(".revelar", contenedor).forEach((elemento) => observar(elemento));
    }
  }

  function restablecerFiltros() {
    estado.filtro = "todas";
    estado.busqueda = "";
    const buscador = $("#buscador");
    if (buscador) buscador.value = "";
    renderFiltros();
    renderGaleria();
  }

  function prepararGaleria() {
    const filtros = $("#filtros");
    if (filtros) {
      filtros.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-categoria]");
        if (!boton) return;
        estado.filtro = boton.dataset.categoria || "todas";
        renderFiltros();
        renderGaleria();
      });
    }

    const buscador = $("#buscador");
    if (buscador) {
      buscador.addEventListener("input", () => {
        estado.busqueda = buscador.value;
        renderGaleria();
      });
      buscador.addEventListener("search", () => {
        estado.busqueda = buscador.value;
        renderGaleria();
      });
    }

    const verTodo = $("#boton-ver-todo");
    if (verTodo) verTodo.addEventListener("click", restablecerFiltros);

    document.addEventListener("click", (evento) => {
      const disparador = evento.target.closest("[data-abrir]");
      if (!disparador) return;
      const lista =
        disparador.dataset.lista === "filtrada" && estado.visibles.length
          ? estado.visibles.slice()
          : estado.lugares.slice();
      abrirVisor(disparador.dataset.abrir, lista);
    });
  }

  /* ------------------------------------------------------------------
     Visor de imágenes
     ------------------------------------------------------------------ */
  function visorAbierto() {
    const visor = $("#visor");
    return Boolean(visor && visor.classList.contains("abierto"));
  }

  function abrirVisor(id, lista) {
    const visor = $("#visor");
    if (!visor || !lista || !lista.length) return;

    const indice = lista.findIndex((lugar) => lugar.id === id);
    if (indice < 0) return;

    estado.listaVisor = lista;
    estado.indice = indice;
    estado.ultimoFoco = document.activeElement;

    actualizarVisor();
    visor.classList.add("abierto");
    visor.setAttribute("aria-hidden", "false");
    document.body.classList.add("sin-scroll");

    const cerrar = $(".visor__cerrar", visor);
    if (cerrar) {
      window.setTimeout(() => cerrar.focus(), 80);
    }
  }

  function cerrarVisor() {
    const visor = $("#visor");
    if (!visor || !visor.classList.contains("abierto")) return;

    visor.classList.remove("abierto");
    visor.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sin-scroll");

    if (estado.ultimoFoco && typeof estado.ultimoFoco.focus === "function") {
      estado.ultimoFoco.focus();
    }
    estado.ultimoFoco = null;
  }

  function actualizarVisor() {
    const visor = $("#visor");
    if (!visor) return;

    const lugar = estado.listaVisor[estado.indice];
    if (!lugar) return;

    const imagen = $("#visor-imagen");
    const categoria = $("#visor-categoria");
    const titulo = $("#visor-titulo");
    const descripcion = $("#visor-descripcion");
    const bloqueImportancia = $("#visor-importancia");
    const textoImportancia = $("#visor-importancia-texto");
    const contador = $("#visor-contador");
    const original = $("#visor-original");

    if (imagen) {
      imagen.src = lugar.imagen;
      imagen.alt = lugar.alt;
    }
    if (categoria) categoria.textContent = nombreCategoria(lugar.categoria);
    if (titulo) titulo.textContent = lugar.titulo;
    if (descripcion) descripcion.textContent = lugar.descripcion;

    if (bloqueImportancia && textoImportancia) {
      const tiene = Boolean(lugar.importancia.trim());
      bloqueImportancia.hidden = !tiene;
      textoImportancia.textContent = tiene ? lugar.importancia : "";
    }

    if (contador) {
      contador.textContent =
        "Fotografía " + (estado.indice + 1) + " de " + estado.listaVisor.length + " · " + nombreCategoria(lugar.categoria);
    }

    if (original) {
      original.href = lugar.imagen;
    }

    precargarVecinas();
  }

  function moverVisor(paso) {
    if (!estado.listaVisor.length) return;
    const total = estado.listaVisor.length;
    estado.indice = (estado.indice + paso + total) % total;
    actualizarVisor();
  }

  function precargarVecinas() {
    const total = estado.listaVisor.length;
    if (total < 2) return;
    [estado.indice - 1, estado.indice + 1].forEach((posicion) => {
      const lugar = estado.listaVisor[(posicion + total) % total];
      if (!lugar) return;
      const precarga = new Image();
      precarga.src = lugar.imagen;
    });
  }

  function enfocablesVisor() {
    const visor = $("#visor");
    if (!visor) return [];
    return $$('button, [href], [tabindex]:not([tabindex="-1"])', visor).filter(
      (elemento) => !elemento.disabled && elemento.getClientRects().length > 0
    );
  }

  function prepararVisor() {
    const visor = $("#visor");
    if (!visor) return;

    visor.addEventListener("click", (evento) => {
      if (evento.target.closest("[data-cerrar]")) {
        cerrarVisor();
      }
    });

    const anterior = $("#visor-prev");
    const siguiente = $("#visor-next");
    if (anterior) anterior.addEventListener("click", () => moverVisor(-1));
    if (siguiente) siguiente.addEventListener("click", () => moverVisor(1));

    document.addEventListener("keydown", (evento) => {
      if (!visorAbierto()) return;

      if (evento.key === "Escape") {
        evento.preventDefault();
        cerrarVisor();
        return;
      }
      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        moverVisor(-1);
        return;
      }
      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        moverVisor(1);
        return;
      }
      if (evento.key === "Tab") {
        const enfocables = enfocablesVisor();
        if (!enfocables.length) return;
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     Navegación, progreso y botones de regreso
     ------------------------------------------------------------------ */
  function prepararNavegacion() {
    const barra = $("#barra");
    const botonMenu = $("#boton-menu");
    const menu = $("#menu-principal");

    function fijarMenu(abierto) {
      if (!botonMenu || !menu) return;
      botonMenu.setAttribute("aria-expanded", String(abierto));
      botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación");
      menu.classList.toggle("abierto", abierto);
      if (barra) barra.classList.toggle("barra--solida", abierto || window.scrollY > 24);
    }

    if (botonMenu && menu) {
      botonMenu.addEventListener("click", () => {
        fijarMenu(botonMenu.getAttribute("aria-expanded") !== "true");
      });

      menu.addEventListener("click", (evento) => {
        if (evento.target.closest("a")) fijarMenu(false);
      });

      document.addEventListener("click", (evento) => {
        if (!menu.classList.contains("abierto")) return;
        if (evento.target.closest("#barra")) return;
        fijarMenu(false);
      });

      document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && menu.classList.contains("abierto")) {
          fijarMenu(false);
          botonMenu.focus();
        }
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 960) fijarMenu(false);
      });
    }

    const progreso = $("#progreso-barra");
    const flotante = $("#boton-flotante");
    let pendiente = false;

    function actualizarDesplazamiento() {
      pendiente = false;
      const desplazado = window.scrollY || document.documentElement.scrollTop;
      if (barra) {
        const menuAbierto = menu && menu.classList.contains("abierto");
        barra.classList.toggle("barra--solida", Boolean(menuAbierto) || desplazado > 24);
      }
      if (progreso) {
        const recorrible = document.documentElement.scrollHeight - window.innerHeight;
        const avance = recorrible > 0 ? Math.min(1, Math.max(0, desplazado / recorrible)) : 0;
        progreso.style.width = (avance * 100).toFixed(2) + "%";
      }
      if (flotante) {
        flotante.classList.toggle("visible", desplazado > 700);
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        if (pendiente) return;
        pendiente = true;
        window.requestAnimationFrame(actualizarDesplazamiento);
      },
      { passive: true }
    );

    actualizarDesplazamiento();

    function volverArriba() {
      window.scrollTo({ top: 0, behavior: prefiereMenosMovimiento ? "auto" : "smooth" });
    }

    const botonArriba = $("#boton-arriba");
    if (botonArriba) botonArriba.addEventListener("click", volverArriba);
    if (flotante) flotante.addEventListener("click", volverArriba);

    const enlaces = $$('#menu-principal a[href^="#"]');
    const secciones = $$("main section[id]");

    if ("IntersectionObserver" in window && enlaces.length && secciones.length) {
      const observadorSecciones = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            const id = "#" + entrada.target.id;
            enlaces.forEach((enlace) => {
              const activo = enlace.getAttribute("href") === id;
              enlace.classList.toggle("activo", activo);
              if (activo) {
                enlace.setAttribute("aria-current", "true");
              } else {
                enlace.removeAttribute("aria-current");
              }
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );

      secciones.forEach((seccion) => observadorSecciones.observe(seccion));
    }
  }

  /* ------------------------------------------------------------------
     Aparición progresiva de bloques
     ------------------------------------------------------------------ */
  function prepararRevelado() {
    const bloques = $$(".revelar");

    if (prefiereMenosMovimiento || !("IntersectionObserver" in window)) {
      bloques.forEach((bloque) => bloque.classList.add("es-visible"));
      return;
    }

    estado.observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("es-visible");
          estado.observador.unobserve(entrada.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );

    bloques.forEach((bloque) => estado.observador.observe(bloque));
  }

  /* ------------------------------------------------------------------
     Compartir
     ------------------------------------------------------------------ */
  function urlPublica() {
    const configurada = String(CONFIG.seo.urlPublica || "").trim();
    const base = configurada || window.location.href;
    return base.split("#")[0];
  }

  function mensajeCompartir() {
    const mensaje = String(CONFIG.compartir.mensaje || "").trim();
    return (mensaje ? mensaje + " " : "") + urlPublica();
  }

  function anunciarEstado(texto) {
    const salida = $("#compartir-estado");
    if (!salida) return;
    salida.textContent = texto;
    window.clearTimeout(anunciarEstado.temporizador);
    anunciarEstado.temporizador = window.setTimeout(() => {
      salida.textContent = "";
    }, 4000);
  }

  function copiarConRespaldo(texto) {
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const exito = document.execCommand("copy");
      document.body.removeChild(area);
      return exito;
    } catch (error) {
      return false;
    }
  }

  function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(
        () => true,
        () => copiarConRespaldo(texto)
      );
    }
    return Promise.resolve(copiarConRespaldo(texto));
  }

  function prepararCompartir() {
    const contenedor = $("#compartir");
    if (!contenedor) return;

    const url = urlPublica();
    const mensaje = String(CONFIG.compartir.mensaje || "").trim();
    const enlaceWhatsapp = $('[data-red="whatsapp"]', contenedor);
    const enlaceFacebook = $('[data-red="facebook"]', contenedor);
    const enlaceTelegram = $('[data-red="telegram"]', contenedor);
    const botonCopiar = $('[data-red="copiar"]', contenedor);
    const botonNativo = $('[data-red="dispositivo"]', contenedor);

    if (enlaceWhatsapp) {
      enlaceWhatsapp.href = "https://wa.me/?text=" + encodeURIComponent(mensajeCompartir());
    }
    if (enlaceFacebook) {
      enlaceFacebook.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    }
    if (enlaceTelegram) {
      enlaceTelegram.href =
        "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(mensaje);
    }
    if (botonCopiar) {
      botonCopiar.addEventListener("click", () => {
        copiarTexto(url).then((exito) => {
          anunciarEstado(exito ? "Enlace copiado. Ya puedes compartirlo." : "Copia manualmente este enlace: " + url);
        });
      });
    }
    if (botonNativo && navigator.share) {
      botonNativo.hidden = false;
      botonNativo.addEventListener("click", () => {
        navigator
          .share({ title: CONFIG.nombre + " — " + (CONFIG.lema || ""), text: mensaje, url: url })
          .catch(() => {});
      });
    }
  }

  /* ------------------------------------------------------------------
     Ubicación y mapa (Google Maps)
     Las coordenadas oficiales viven en js/config.js (SENDA_CONFIG.ubicacion)
     y alimentan el mapa interactivo, los botones y el enlace al lugar.
     ------------------------------------------------------------------ */
  const LUGAR = "Comunidad Nueva Canaán – Senda B, Chimoré, Cochabamba, Bolivia";
  const LUGAR_RESPALDO = "Chimoré, Cochabamba, Bolivia";

  function enlaceLugarGoogle(lat, lng) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(lat + "," + lng);
  }

  function enlaceRutaGoogle(lat, lng) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(lat + "," + lng);
  }

  function prepararUbicacion() {
    const ubicacion = CONFIG.ubicacion || {};
    const lat = parametro(ubicacion.lat);
    const lng = parametro(ubicacion.lng);
    const hayCoordenadas =
      lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    ["comunidad", "departamento", "provincia", "municipio"].forEach((campo) => {
      const elemento = document.querySelector('[data-campo="' + campo + '"]');
      if (!elemento) return;
      const valor = String(ubicacion[campo] || "").trim();
      elemento.textContent = valor || "Por confirmar";
      elemento.classList.toggle("pendiente", !valor);
    });

    const comunidad = $("#dato-comunidad");
    if (comunidad) {
      const nombreComunidad = String(ubicacion.comunidad || "").trim();
      if (nombreComunidad) comunidad.textContent = nombreComunidad + " – Senda B";
    }

    const coordenadas = $("#dato-coordenadas");
    if (coordenadas) {
      coordenadas.textContent = hayCoordenadas ? lat.toFixed(5) + ", " + lng.toFixed(5) : "Por confirmar";
      coordenadas.classList.toggle("pendiente", !hayCoordenadas);
    }

    const referencia = $("#dato-referencia");
    if (referencia) {
      const texto = String(ubicacion.referencia || ubicacion.lugar || "").trim();
      referencia.textContent = texto;
      referencia.hidden = !texto;
    }

    const nota = $("#ubicacion-nota");
    if (nota) {
      nota.innerHTML = hayCoordenadas
        ? "<strong>Cómo llegar.</strong> El marcador del mapa señala el punto exacto de la comunidad. Pulsa " +
          "«Cómo llegar» y Google Maps abrirá la ruta desde donde te encuentres."
        : "<strong>Ubicación pendiente de confirmación.</strong> No publicamos una ubicación aproximada para no " +
          "brindar información incorrecta. Cuando la comunidad confirme los datos, el mapa mostrará el punto exacto " +
          "y el botón «Cómo llegar» estará disponible.";
    }

    prepararMapa(hayCoordenadas, lat, lng);
    prepararMarcadorMapa(hayCoordenadas);
    prepararBotonesMapa(hayCoordenadas, lat, lng);
  }

  /* El mapa se abre centrado en las coordenadas, así que el distintivo del
     centro marca el punto exacto. Si el visitante toca el mapa (el foco pasa al
     iframe) el distintivo desaparece, para no señalar un lugar equivocado. */
  function prepararMarcadorMapa(hayCoordenadas) {
    const marcador = $("#mapa-marcador");
    if (!marcador) return;

    if (!hayCoordenadas) {
      marcador.classList.add("oculto");
      return;
    }

    const marco = $(".mapa__marco");
    const iframe = $("#mapa-senda");

    const ocultar = () => {
      marcador.classList.add("oculto");
      window.removeEventListener("blur", ocultar);
      if (iframe) iframe.removeEventListener("focus", ocultar);
      if (marco) {
        marco.removeEventListener("pointerdown", ocultar);
        marco.removeEventListener("wheel", ocultar);
        marco.removeEventListener("touchstart", ocultar);
      }
    };

    /* Al pulsar o arrastrar dentro del mapa, el iframe toma el foco y la
       ventana pierde el suyo: es la señal más fiable de que el mapa se movió. */
    window.addEventListener("blur", ocultar);
    if (iframe) iframe.addEventListener("focus", ocultar);
    if (marco) {
      marco.addEventListener("pointerdown", ocultar);
      marco.addEventListener("wheel", ocultar, { passive: true });
      marco.addEventListener("touchstart", ocultar, { passive: true });
    }
  }

  function prepararMapa(hayCoordenadas, lat, lng) {
    const marco = $(".mapa__marco");
    const iframe = $("#mapa-senda");
    if (!iframe) return;

    if (marco) {
      iframe.addEventListener("load", () => marco.classList.add("cargado"));
      window.setTimeout(() => marco.classList.add("cargado"), 7000);
    }

    const zoom = Math.min(Math.max(Number((CONFIG.ubicacion || {}).zoom) || 15, 3), 20);

    if (hayCoordenadas) {
      iframe.src =
        "https://www.google.com/maps?q=" + lat + "," + lng + "&hl=es&z=" + zoom + "&output=embed";
    } else {
      iframe.src =
        "https://www.google.com/maps?q=" +
        encodeURIComponent(LUGAR_RESPALDO) +
        "&hl=es&z=9&output=embed";
    }

    const leyenda = $("#mapa-leyenda");
    if (leyenda) {
      leyenda.textContent = hayCoordenadas
        ? "Comunidad Nueva Canaán – Senda B · Google Maps"
        : "Mapa de referencia de Chimoré · Google Maps";
    }

    const enlaceMapa = $("#mapa-enlace");
    if (enlaceMapa) {
      enlaceMapa.href = hayCoordenadas
        ? enlaceLugarGoogle(lat, lng)
        : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(LUGAR_RESPALDO);
      enlaceMapa.textContent = "Ver en Google Maps";
      enlaceMapa.title = hayCoordenadas ? "Abrir " + LUGAR + " en Google Maps" : "Abrir Google Maps";
    }
  }

  function prepararBotonesMapa(hayCoordenadas, lat, lng) {
    const comoLlegar = $("#boton-como-llegar");
    if (comoLlegar) {
      comoLlegar.href = hayCoordenadas
        ? enlaceRutaGoogle(lat, lng)
        : "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(LUGAR_RESPALDO);
    }

    const botonMaps = $("#boton-maps");
    if (botonMaps) {
      botonMaps.href = hayCoordenadas
        ? enlaceLugarGoogle(lat, lng)
        : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(LUGAR_RESPALDO);
    }

    const botonCopiar = $("#boton-copiar-coords");
    if (!botonCopiar) return;

    botonCopiar.disabled = !hayCoordenadas;
    if (!hayCoordenadas) return;

    botonCopiar.addEventListener("click", () => {
      copiarTexto(lat + ", " + lng).then((exito) => {
        if (!exito) return;
        const original = botonCopiar.innerHTML;
        botonCopiar.innerHTML = "Coordenadas copiadas";
        window.setTimeout(() => {
          botonCopiar.innerHTML = original;
        }, 2600);
      });
    });
  }

  /* ------------------------------------------------------------------
     Contacto
     ------------------------------------------------------------------ */
  function prepararContacto() {
    const lista = $("#lista-contacto");
    if (!lista) return;

    const contacto = CONFIG.contacto || {};
    const canales = [];
    const texto = (valor) => String(valor || "").trim();
    const soloDigitos = (valor) => texto(valor).replace(/[^\d+]/g, "");

    if (texto(contacto.email)) {
      canales.push({
        etiqueta: "Correo electrónico",
        icono: "i-correo",
        enlace: "mailto:" + texto(contacto.email),
        valor: texto(contacto.email)
      });
    }
    if (texto(contacto.telefono)) {
      canales.push({
        etiqueta: "Teléfono",
        icono: "i-telefono",
        enlace: "tel:" + soloDigitos(contacto.telefono),
        valor: texto(contacto.telefono)
      });
    }
    if (texto(contacto.whatsapp)) {
      canales.push({
        etiqueta: "WhatsApp",
        icono: "i-whatsapp",
        enlace: "https://wa.me/" + soloDigitos(contacto.whatsapp),
        valor: "+" + soloDigitos(contacto.whatsapp),
        externo: true
      });
    }

    [
      ["facebook", "Facebook", "i-facebook"],
      ["instagram", "Instagram", "i-instagram"],
      ["tiktok", "TikTok", "i-compartir"]
    ].forEach(([campo, etiqueta, simbolo]) => {
      const valor = texto(contacto[campo]);
      if (!valor) return;
      canales.push({
        etiqueta: etiqueta,
        icono: simbolo,
        enlace: /^https?:\/\//i.test(valor) ? valor : "https://" + valor,
        valor: etiqueta,
        externo: true
      });
    });

    if (!canales.length) return;

    lista.innerHTML = canales
      .map((canal) => {
        const atributos = canal.externo ? ' target="_blank" rel="noopener"' : "";
        return (
          '<li class="contacto__canal">' +
            '<span class="contacto__icono">' + icono(canal.icono) + "</span>" +
            '<span class="contacto__datos">' +
              '<span class="contacto__etiqueta">' + escapar(canal.etiqueta) + "</span>" +
              '<a class="contacto__enlace" href="' + escapar(canal.enlace) + '"' + atributos + ">" +
                escapar(canal.valor) +
              "</a>" +
            "</span>" +
          "</li>"
        );
      })
      .join("");

    const nota = $(".contacto__nota", lista.parentElement);
    if (nota) {
      nota.textContent =
        "¿Tienes fotografías o información de Senda B que quieras compartir? Escríbenos por cualquiera de estos canales.";
    }
  }

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */
  function iniciar() {
    aplicarDatos(SEMILLA);

    prepararRevelado();
    prepararNavegacion();
    prepararVisor();
    prepararGaleria();
    prepararCompartir();
    prepararUbicacion();
    prepararContacto();

    const anio = $("#anio-actual");
    if (anio) anio.textContent = String(new Date().getFullYear());

    renderDestacados();
    renderFiltros();
    renderGaleria();

    document.documentElement.classList.add("listo");

    /* Las fotografías que estén en las carpetas imagenes/ y no tengan ficha en
       js/datos.js se agregan en cuanto el servidor informa su inventario. */
    descubrirFotos().then((cambio) => {
      if (!cambio) return;
      renderDestacados();
      renderFiltros();
      renderGaleria();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();







