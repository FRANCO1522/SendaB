# Senda B · Portal turístico

Sitio web del portal turístico de la comunidad de **Senda B** (Bolivia): la iglesia, la guardería, la unidad
educativa, las canchas, las empresas de la comunidad, el río y los caminos, presentados con fotografías y
descripciones pensadas como una guía para quien llega por primera vez.

El contenido es **estático** (HTML, CSS y JavaScript) y lo sirve un servidor **Node.js sin dependencias**
(`server.js`). El sitio no tiene panel de administración, ni inicio de sesión, ni base de datos, ni subida de
imágenes: las fotografías y los textos viven en el repositorio.

## Estructura

```
senda-b/
├─ server.js             Servidor estático de Node (sin dependencias)
├─ package.json          npm start → node server.js
├─ render.yaml           Blueprint para Render (plan free, sin disco persistente)
├─ .env.example          Variables opcionales (PORT, HOST)
├─ imagenes/             Fotografías originales de la comunidad (12 fotos)
├─ public/               Todo lo que se publica
│  ├─ index.html         Página única del portal (la galería completa)
│  ├─ favicon.svg
│  ├─ site.webmanifest
│  ├─ css/estilos.css    Diseño oscuro y dorado
│  ├─ js/config.js       Nombre, lema, ubicación y contacto
│  ├─ js/datos.js        Categorías, lugares y descripciones
│  ├─ js/galeria.js      Galería, filtros, búsqueda y visor de imágenes
│  └─ imagenes/          Copias publicadas de las fotografías
├─ index.html            Portada: abre public/index.html
├─ css/styles.css        Estilo de la antigua galería de la iglesia (sin uso)
└─ README.md
```

El `index.html` de la raíz es solo una portada: redirige a `public/index.html` para que un doble clic en el
archivo muestre **todas** las fotografías y no una sola. El sitio publicado es siempre `public/`.

Las carpetas `imagenes/` y `css/` de la raíz pertenecen a la antigua galería de la iglesia; hoy `imagenes/`
es la carpeta donde se dejan las fotografías originales de la comunidad y el servidor las publica e inventaría
junto con las de `public/imagenes/` (sin duplicarlas: compara su contenido). No se elimina ninguna fotografía.

## Descubrimiento automático de fotografías

`server.js` recorre `imagenes/` y `public/imagenes/`, evita repetir archivos idénticos (los compara por SHA-1) y
publica el inventario en **`GET /api/imagenes`**:

```json
{
  "total": 12,
  "imagenes": [
    { "archivo": "iglesia.jfif", "titulo": "Iglesia", "clave": "iglesia", "origen": "imagenes",
      "tipo": "image/jpeg", "bytes": 130511, "modificado": "2026-10-30T…", "url": "/imagenes/iglesia.jfif" }
  ]
}
```

`js/galeria.js` lee ese inventario y **añade a la galería cualquier fotografía que todavía no tenga ficha en
`js/datos.js`**: el título sale del nombre del archivo, la categoría de una lista de palabras clave (cancha →
Canchas deportivas, río → Paisajes naturales, iglesia → Iglesia…) y el resto de los textos se genera solo. Por
eso **agregar una foto no requiere tocar el HTML**: se copia el archivo a `imagenes/` y se recarga la página.

Las rutas `/imagenes/<nombre>` aceptan el nombre exacto, el mismo nombre con otra extensión (`.jpg`/`.jpeg`/
`.jfif`) y también sin tildes ni mayúsculas: `/imagenes/colegio-ue-nueva-canaan.jpg` sirve
`Colegio U. E. Nueva Canaan .jpeg`. Lo que no existe responde 404.

## Requisitos

- Node.js 20 o superior (solo para servir la página).
- No hace falta `npm install`: el proyecto no tiene dependencias.

## Ejecutar en local

```powershell
npm start
```

Abre <http://localhost:3000>. También puedes ejecutar `node server.js` directamente.

Para usar otro puerto:

```powershell
$env:PORT = 4000
npm start
```

## Editar el contenido

Todo el contenido de la galería está en **`public/js/datos.js`**:

- `categorias`: los filtros de la galería (`id`, `nombre`, `descripcion`).
- `lugares`: cada fotografía con `id`, `titulo`, `categoria`, `imagen`, `alt`, `resumen`, `descripcion`,
  `importancia`, `destacado` y `orden`.

Para agregar un lugar: guarda la fotografía en `public/imagenes/` (o en `imagenes/`) y, si quieres una ficha
propia, añade un objeto a `lugares` con un `id` único; la galería, los filtros y el visor se actualizan solos.
Si no añades la ficha, la fotografía igual aparece, con los textos generados a partir del nombre del archivo.

- **Fotografías:** `public/imagenes/` y `imagenes/`.
- **Diseño:** `public/css/estilos.css` (diseño oscuro y dorado, sin cambios).
- **Ubicación y contacto:** `public/js/config.js`. Los campos vacíos se muestran como «Por confirmar».

## Ubicación y mapa

La sección **«¿Dónde estamos?»** identifica el lugar como
**Comunidad Nueva Canaán – Senda B, Chimoré, Cochabamba, Bolivia** y muestra las coordenadas oficiales:

| Dato | Valor |
| --- | --- |
| Latitud | `-16.957451` |
| Longitud | `-65.146060` |
| Zoom del mapa | `15` |

Todo se edita en `public/js/config.js` (`ubicacion.lat`, `ubicacion.lng`, `ubicacion.zoom`). Con esos valores
`public/js/galeria.js`:

- carga el **mapa interactivo de Google Maps** en el `iframe` `#mapa-senda`, centrado en el punto exacto y con el
  **marcador** de la comunidad (distintivo dorado con su nombre) sobre ese centro; el distintivo desaparece en
  cuanto el visitante toca o mueve el mapa, para no señalar un lugar equivocado;
- completa el botón **«Cómo llegar»** con la ruta de Google Maps hasta las coordenadas;
- completa el botón **«Abrir en Google Maps»** y el enlace «Ver en Google Maps» del pie del mapa;
- habilita **«Copiar coordenadas»** y el enlace del pie de página.

El `src` del mapa también está escrito en `public/index.html`, así que el mapa se ve aunque JavaScript no cargue.
El mapa usa el visor público de Google Maps (`output=embed`): no necesita clave de API ni variables de entorno.
Si las coordenadas quedan vacías en `config.js`, la sección vuelve a mostrar «Por confirmar» y el mapa apunta a
Chimoré como referencia.

## Comprobar que la galería y el mapa se ven completos

Los archivos con guion bajo son utilidades de revisión (`.gitignore` los excluye del repositorio):

```powershell
node _verificar.js http://127.0.0.1:3000   # revisa /, /api/imagenes, las 12 fotos, css, js, los 404 y la ubicación
node _gen_prueba.js                        # genera public/_prueba_galeria.html con las pruebas del navegador
node _prueba_navegador.js 3320 escritorio 1440,900   # abre esa página con Chrome sin ventana
node _prueba_archivo.js                    # doble clic en index.html: debe mostrar las 12 fotografías
```

Para la ubicación y el mapa:

```powershell
node _gen_prueba_mapa.js                                       # genera public/_prueba_mapa.html
node _prueba_navegador.js 3322 mapa-escritorio 1440,900 _prueba_mapa.html
node _prueba_navegador.js 3323 mapa-movil 390,844 _prueba_mapa.html
```

`_prueba_navegador.js` informa cuántas tarjetas se pintaron, cuántas imágenes se cargaron de verdad y si
funcionan «siguiente», «anterior», «cerrar» y la tecla Escape. El resultado se escribe en `_prueba_<etiqueta>.txt`.
La prueba del mapa comprueba además el título «¿Dónde estamos?», los datos de la comunidad, el `src` del mapa con
las coordenadas y el zoom, el tamaño visible del mapa, los botones «Cómo llegar» y «Abrir en Google Maps», y la
maquetación en computadora y en celular.

Recuerda borrar `public/_prueba_galeria.html` y `public/_prueba_mapa.html` después de usarlos: son copias de la
portada con el script de pruebas y no deben publicarse.

## Publicar en GitHub

El proyecto se publica en <https://github.com/FRANCO1522/SendaB> (rama `main`). Para subir cambios:

```powershell
git add -A
git status --short      # revisa que no aparezcan .env ni carpetas de trabajo
git commit -m "Describe aquí el cambio"
git push                # usa la credencial guardada por Git
```

El `.gitignore` excluye `node_modules/`, `.env` y los archivos temporales de trabajo (`_*`), de modo que solo
se publican el sitio y sus fotografías.

## Publicar en Render

El servicio ya existe: **Web Service `nueva-canaan`**, conectado al repositorio `FRANCO1522/SendaB`, rama `main`.
Cada `git push` a `main` lo despliega automáticamente (`autoDeploy`).

Configuración del servicio (por si hay que recrearlo o revisarlo):

| Ajuste | Valor |
| --- | --- |
| Repository | `FRANCO1522/SendaB` |
| Branch | `main` |
| Runtime / Language | `Node` |
| Build Command | `npm install --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/` |
| Plan | `Free` |

Pasos si hubiera que crearlo desde cero:

1. Entra en <https://render.com> y crea una cuenta con GitHub.
2. **New → Web Service**, elige el repositorio `SendaB` y la rama `main`.
3. *Runtime:* Node, *Build Command:* `npm install --omit=dev`, *Start Command:* `npm start`,
   *Health Check Path:* `/`, plan Free.
4. Confirma la creación. No hay variables secretas ni discos que configurar.
5. Espera el primer despliegue y abre la URL que Render asigna (por ejemplo `https://nueva-canaan.onrender.com`).

`render.yaml` describe el mismo servicio, por si algún día se prefiere **New → Blueprint** en lugar de crearlo a mano.

Con el plan gratuito el servicio se suspende tras un tiempo sin visitas: la primera petición puede tardar unos
segundos en responder. Cuando tengas la URL definitiva, puedes anotarla en `public/js/config.js`
(`seo.urlPublica`) para que los enlaces al compartir la página sean siempre los correctos.

## Notas

- No se publican credenciales: no existe `.env` en el repositorio y el sitio no maneja contraseñas.
- `server.js` sirve únicamente la carpeta `public/`; el resto del repositorio no se expone en internet.
- Las fotografías no cambian, por eso el servidor las envía con caché de una semana y el HTML siempre se
  revalida.
