/* ==========================================================================
   SENDA B — Configuración general del portal
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que debes editar para completar la ubicación,
   los datos de contacto y el enlace público del sitio.
   Los campos vacíos se muestran en la página como "Por confirmar".

   Las coordenadas son las OFICIALES de la comunidad (grados decimales,
   datum WGS 84) y alimentan el mapa de Google Maps y el botón «Cómo llegar».
   ========================================================================== */

window.SENDA_CONFIG = {
  nombre: 'Senda B',
  lema: 'Nuestra comunidad, un lugar para conocer y descubrir.',
  pais: 'Bolivia',

  /* ------------------------------------------------------------------
     UBICACIÓN GEOGRÁFICA
     Comunidad Nueva Canaán – Senda B, Chimoré, Cochabamba, Bolivia.
     lat / lng son las coordenadas oficiales, en grados decimales.
     zoom: 3 a 20 (15 muestra la comunidad y sus alrededores).
     ------------------------------------------------------------------ */
  ubicacion: {
    comunidad: 'Nueva Canaán',
    lugar: 'Comunidad Nueva Canaán – Senda B',
    departamento: 'Cochabamba',
    provincia: 'Carrasco',
    municipio: 'Chimoré',
    pais: 'Bolivia',
    referencia: 'Comunidad Nueva Canaán – Senda B, Chimoré, Cochabamba, Bolivia',
    lat: -16.957451,  // latitud oficial (grados decimales)
    lng: -65.146060,  // longitud oficial (grados decimales)
    zoom: 15
  },

  /* ------------------------------------------------------------------
     CONTACTO Y REDES (opcional). Deja vacío lo que no exista.
     ------------------------------------------------------------------ */
  contacto: {
    email: '',
    telefono: '',
    whatsapp: '',   // solo números, con código de país. Ej.: 59171234567
    facebook: '',   // URL completa de la página
    instagram: '',  // URL completa del perfil
    tiktok: ''
  },

  /* ------------------------------------------------------------------
     COMPARTIR Y SEO
     urlPublica: coloca aquí la dirección final del sitio en Render
     (por ejemplo "https://senda-b.onrender.com"). Si queda vacía, se
     usa la dirección desde la que se abre la página.
     ------------------------------------------------------------------ */
  compartir: {
    mensaje: 'Descubre Senda B: una comunidad de Bolivia con historia, cultura, paisajes y gente que merece ser conocida.'
  },

  seo: {
    urlPublica: ''
  }
};
