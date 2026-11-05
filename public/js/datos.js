/* ==========================================================================
   SENDA B — Catálogo de lugares y fotografías
   --------------------------------------------------------------------------
   Este archivo es la única fuente de datos del portal. Cada lugar se agrega
   como un objeto dentro de "lugares" y aparece automáticamente en la galería
   y en su categoría. Las fotografías viven en public/imagenes/.

   Campos de cada lugar:
     id          identificador único (sin espacios ni tildes)
     titulo      nombre del lugar
     categoria   id de una de las categorías de "categorias"
     imagen      ruta relativa a la carpeta public/ (ej.: imagenes/iglesia.jpg)
     alt         texto alternativo para accesibilidad
     resumen     descripción breve que aparece en la tarjeta
     descripcion descripción turística completa
     importancia (opcional) importancia del lugar para la comunidad
     destacado   true para mostrarlo además en "Lugares destacados"
     orden       número de orden dentro de la galería

   Para publicar un cambio basta con editar este archivo, guardar la
   fotografía en public/imagenes/ (o en imagenes/, en la raíz del proyecto) y
   recargar la página. Las fotografías que estén en cualquiera de esas dos
   carpetas y no tengan ficha aquí se agregan solas a la galería: el servidor
   (server.js) publica el inventario en /api/imagenes y js/galeria.js lo lee.
   ========================================================================== */

window.SENDA_GALERIA = {
  version: 1,
  actualizado: '2026-11-05',

  categorias: [
    {
      id: 'iglesia',
      nombre: 'Iglesia',
      descripcion: 'El templo de la comunidad y su entorno.'
    },
    {
      id: 'guarderia',
      nombre: 'Guardería',
      descripcion: 'Espacios comunitarios para la atención y el desarrollo de los niños.'
    },
    {
      id: 'educacion',
      nombre: 'Educación',
      descripcion: 'Unidades educativas y espacios de aprendizaje.'
    },
    {
      id: 'paisajes',
      nombre: 'Paisajes naturales',
      descripcion: 'Cielos, vegetación y horizonte: la naturaleza de Senda B.'
    },
    {
      id: 'calles',
      nombre: 'Calles y caminos',
      descripcion: 'Los caminos que recorren y conectan la comunidad.'
    },
    {
      id: 'deporte',
      nombre: 'Canchas deportivas',
      descripcion: 'Canchas, encuentros y vida deportiva.'
    },
    {
      id: 'plazas',
      nombre: 'Plazas y espacios públicos',
      descripcion: 'Plazas y espacios de encuentro de la comunidad.'
    },
    {
      id: 'tradiciones',
      nombre: 'Costumbres y tradiciones',
      descripcion: 'Las costumbres que dan identidad al pueblo.'
    },
    {
      id: 'cultura',
      nombre: 'Actividades culturales',
      descripcion: 'Fiestas, encuentros y expresiones culturales.'
    },
    {
      id: 'turismo',
      nombre: 'Lugares turísticos',
      descripcion: 'Rincones y atractivos que merecen ser visitados.'
    },
    {
      id: 'vida-cotidiana',
      nombre: 'Vida cotidiana',
      descripcion: 'La gente, el día a día y los oficios de Senda B.'
    },
    {
      id: 'empresas',
      nombre: 'Empresas y producción',
      descripcion: 'Espacios de trabajo, producción y servicios de la comunidad.'
    }
  ],

  lugares: [
    {
      id: 'iglesia-senda-b',
      titulo: 'Iglesia de Senda B',
      categoria: 'iglesia',
      imagen: 'imagenes/iglesia.jpg',
      alt: 'Fachada de la iglesia de Senda B, con arcos de ladrillo visto, ventanales y plantas ornamentales junto a la entrada.',
      resumen: 'El templo de la comunidad, reconocible por sus arcos de ladrillo visto, sus ventanales y el amplio espacio abierto de su frente.',
      descripcion:
        'En el corazón de Senda B se levanta la iglesia de la comunidad, un edificio de líneas sencillas que se distingue por su fachada de ladrillo visto. Los arcos de las ventanas, el acceso principal enmarcado y la cubierta oscura componen una imagen serena, de esas que invitan a detenerse y mirar con calma.\n\n' +
        'Frente al templo se extiende un espacio abierto que forma parte del paisaje cotidiano del pueblo. Las plantas ornamentales que acompañan la entrada y el emblema circular sobre la puerta son detalles que dan carácter propio al lugar y lo convierten en una de las postales más queridas de Senda B.\n\n' +
        'Visitar la iglesia es asomarse a la vida de la comunidad: un punto de referencia para orientarse, para encontrarse y para comprender la identidad de un pueblo que conserva sus tradiciones.',
      importancia:
        'La iglesia es uno de los principales puntos de referencia de Senda B y forma parte de la memoria colectiva del pueblo. Cuidarla y darla a conocer es también una manera de preservar la identidad de la comunidad.',
      destacado: true,
      orden: 1
    },
    {
      id: 'guarderia-senda-b',
      titulo: 'Guardería de Senda B',
      categoria: 'guarderia',
      imagen: 'imagenes/guarderia.jpg',
      alt: 'Edificio de ladrillo de la guardería de Senda B, con juegos infantiles de colores y la bandera de Bolivia en el patio.',
      resumen: 'Un espacio comunitario dedicado al cuidado y al desarrollo de los niños, con juegos al aire libre y la bandera de Bolivia como parte de su paisaje.',
      descripcion:
        'La guardería de Senda B forma parte de los espacios comunitarios dedicados a la atención y al desarrollo de los niños. Su edificio, de una sola planta y muros de ladrillo, se integra al paisaje con la vegetación que lo rodea; en el frente, los juegos infantiles de colores y el mástil con la bandera de Bolivia anuncian un lugar pensado para la infancia.\n\n' +
        'La construcción presenta una franja amarilla que recorre la fachada, puertas y ventanas en tonos azules y una cubierta de calamina que protege los ambientes. El patio abierto, todavía sin pavimentar, es el escenario donde los niños juegan y comparten; alrededor, las palmeras y los árboles recuerdan que Senda B es una comunidad rodeada de naturaleza.\n\n' +
        'Conocer la guardería es entender una parte esencial de la vida de Senda B: el cuidado de los más pequeños y el esfuerzo de una comunidad por ofrecerles un espacio propio.',
      importancia:
        'La guardería representa el compromiso de Senda B con la niñez. Es uno de los espacios que muestran el rostro solidario y organizado del pueblo, y un lugar donde los más pequeños dan sus primeros pasos en la vida comunitaria.',
      destacado: true,
      orden: 2
    },
    {
      id: 'unidad-educativa-nueva-canaan',
      titulo: 'Unidad Educativa Nueva Canaán',
      categoria: 'educacion',
      imagen: 'imagenes/colegio-ue-nueva-canaan.jpg',
      alt: 'Fachada de la Unidad Educativa Nueva Canaán: edificio de dos plantas, blanco con franjas azules y un acceso central.',
      resumen: 'Un edificio amplio de dos plantas, de fachada blanca y azul, que forma parte de los espacios educativos de la comunidad.',
      descripcion:
        'La Unidad Educativa Nueva Canaán se presenta con una fachada amplia y luminosa, pintada de blanco con franjas azules y un acceso central que se abre al interior del establecimiento. Sus dos plantas, la cubierta metálica y la línea de ventanas a lo largo del edificio hablan de un espacio pensado para recibir a los estudiantes y acompañar su formación.\n\n' +
        'Según el letrero de su fachada, el establecimiento corresponde a la Unidad Educativa Nueva Canaán C V. Frente a ella se extiende un camino de piedra y tierra que forma parte de los recorridos cotidianos de la comunidad, con la vegetación del entorno como telón de fondo.\n\n' +
        'Incluir la escuela en esta galería es reconocer el valor de la educación para Senda B y el esfuerzo diario de las familias que acompañan a sus hijos en el camino hacia el estudio.',
      importancia:
        'La unidad educativa es uno de los espacios que sostienen la vida de la comunidad: allí se forman los niños y jóvenes de Senda B y se construye buena parte de su futuro. Su presencia en esta galería es un reconocimiento a la educación y a la comunidad que la hace posible.',
      destacado: false,
      orden: 3
    },
    {
      id: 'rotonda-de-bienvenida',
      titulo: 'Rotonda de bienvenida',
      categoria: 'calles',
      imagen: 'imagenes/rotunda.jpg',
      alt: 'Rotonda de entrada a la comunidad con un cantero de ladrillo, el cartel «Bienvenidos a Nueva Canaán» y una bandera izada en su mástil.',
      resumen: 'El punto donde se abren los caminos de la comunidad, con su cartel de bienvenida, su bandera y el movimiento diario de vecinos y vehículos.',
      descripcion:
        'La rotonda recibe a quien llega a la comunidad. En el centro, un cantero de ladrillo sostiene el cartel que da la bienvenida a Nueva Canaán y el mástil con la bandera izada; a su alrededor, los caminos de tierra y piedra se abren hacia las casas, los comercios y las calles del pueblo.\n\n' +
        'La fotografía muestra además la vida que pasa por allí: un mototaxi, un camión detenido, vecinos que caminan y puestos con toldo, con las palmeras y la vegetación como fondo. Es el cruce donde el campo y el pueblo se encuentran.\n\n' +
        'Para quien llega por primera vez, la rotonda es la primera referencia de Senda B; para la comunidad, es un lugar de paso obligado y de encuentro cotidiano.',
      importancia:
        'La rotonda ordena el tránsito, recibe a los visitantes y reúne a los vecinos: es la primera imagen que la comunidad ofrece a quien llega.',
      destacado: false,
      orden: 4
    },
    {
      id: 'cruce-senda-b',
      titulo: 'El cruce de Senda B',
      categoria: 'calles',
      imagen: 'imagenes/cruce-senda-b.jpg',
      alt: 'Cruce de caminos de tierra con casas de uno y dos pisos, palmeras, un puesto con toldo azul y un tanque de agua elevado.',
      resumen: 'Uno de los cruces principales de la comunidad, rodeado de casas, palmeras, pequeños comercios y el tanque de agua que se ve a lo lejos.',
      descripcion:
        'El cruce de Senda B es un punto de confluencia: por él pasan los vehículos que entran y salen de la comunidad y los vecinos que van de una calle a otra. A un lado se alinean las casas de uno y dos pisos con sus balcones, sus rejas y sus techos de calamina; al otro, un puesto con toldo azul y un tanque de agua elevado sobre columnas que se recorta contra el cielo.\n\n' +
        'La calle es de tierra y piedra, y en ella conviven los mototaxis, los autos y los peatones. Las palmeras y los cables de luz cruzan el paisaje, mientras un perro atraviesa el camino sin apuro.\n\n' +
        'La imagen resume el ritmo de Senda B: un pueblo que se mueve entre el trabajo, el comercio y la vida de barrio.',
      importancia:
        'Los cruces son los nodos de la comunidad: allí se encuentran los caminos, se instalan los comercios y se cruza la vida diaria de Senda B.',
      destacado: false,
      orden: 5
    },
    {
      id: 'cancha-de-pasto',
      titulo: 'Cancha de pasto',
      categoria: 'deporte',
      imagen: 'imagenes/cancha-de-pasto.jpg',
      alt: 'Cancha de fútbol de pasto con arcos blancos, cerco de alambre y un camino de tierra con charcos en primer plano.',
      resumen: 'La cancha de pasto donde se juega al fútbol, con sus arcos blancos y el paisaje abierto de la comunidad como tribuna.',
      descripcion:
        'La cancha de pasto es uno de los espacios deportivos de Senda B. El campo se extiende amplio y verde, delimitado por un cerco de alambre y postes de madera, con los arcos blancos a cada extremo y la vegetación del entorno como único límite.\n\n' +
        'Al frente pasa el camino de tierra que, después de la lluvia, conserva los charcos que reflejan el cielo. Al fondo se ven las casas de la comunidad, un tanque elevado y las líneas de luz que cruzan el paisaje.\n\n' +
        'Es un lugar pensado para el juego y para el encuentro: un espacio abierto donde el deporte se mezcla con el paisaje cotidiano del pueblo.',
      importancia:
        'La cancha es uno de los puntos de reunión de la comunidad y el lugar donde niños, jóvenes y mayores comparten el deporte.',
      destacado: false,
      orden: 6
    },
    {
      id: 'cancha-nueva-vida',
      titulo: 'Cancha Nueva Vida',
      categoria: 'deporte',
      imagen: 'imagenes/cancha-nueva-vida.jpg',
      alt: 'Cancha de cemento con dos tableros de básquet, postes de iluminación y un terreno de piedras en primer plano.',
      resumen: 'Una cancha de cemento con tableros de básquet y postes de luz: el espacio donde se juega y se entrena en la comunidad.',
      descripcion:
        'La cancha Nueva Vida es una superficie de cemento con dos tableros de básquet en los extremos y varios postes de iluminación que permiten usarla también al atardecer. Uno de los tableros conserva su estructura metálica completa; el otro se sostiene sobre un soporte más sencillo, con el aro a la vista.\n\n' +
        'Alrededor, el terreno es de piedra y tierra, y el camino de acceso se abre entre la vegetación. En la fotografía, una persona cruza la cancha en moto y unos perros caminan entre las piedras del borde, con las palmeras y los árboles del fondo.\n\n' +
        'Es uno de los espacios deportivos de Senda B y forma parte de la vida diaria de quienes encuentran allí un lugar para jugar, entrenar y compartir.',
      importancia:
        'La cancha es un punto de encuentro para el deporte y la recreación, y una muestra del esfuerzo de la comunidad por contar con espacios para sus jóvenes.',
      destacado: false,
      orden: 7
    },
    {
      id: 'empresa-asproban',
      titulo: 'Empresa ASPROBAN',
      categoria: 'empresas',
      imagen: 'imagenes/empresa-asproban.jpg',
      alt: 'Galpón blanco de ASPROBAN con el nombre pintado en la fachada, palmeras alrededor y un patio de tierra y grava.',
      resumen: 'Un galpón de trabajo de la comunidad, con su nombre pintado en la fachada y un patio abierto hacia el camino.',
      descripcion:
        'El galpón de ASPROBAN se levanta a un costado del camino, con muros blancos, cubierta de calamina y un corredor de acceso donde se abre la puerta de ingreso. Sobre la pared del frente, el nombre de la empresa está pintado con letras azules, visibles desde la calle.\n\n' +
        'El patio que lo rodea es de grava y tierra, con las huellas del paso de vehículos y algunos charcos después de la lluvia. Las palmeras y los árboles acompañan la construcción, y a un costado se ve el tanque de agua elevado sobre su torre, junto a otro edificio del conjunto.\n\n' +
        'Es uno de los espacios productivos de Senda B: un lugar de trabajo que forma parte del paisaje cotidiano de la comunidad.',
      importancia:
        'Los espacios productivos de la comunidad sostienen el trabajo y la economía de las familias de Senda B; conocerlos es conocer también el esfuerzo de su gente.',
      destacado: false,
      orden: 8
    },
    {
      id: 'empresa-de-te',
      titulo: 'Empresa de té',
      categoria: 'empresas',
      imagen: 'imagenes/empresa-de-te.jpg',
      alt: 'Edificio blanco y alargado de la empresa de té, con cubierta de calamina oscura y portones a lo largo de la fachada.',
      resumen: 'Un edificio largo y blanco entre la vegetación, dedicado a la actividad productiva de la comunidad.',
      descripcion:
        'La empresa de té ocupa un edificio alargado, de una sola planta y muros blancos, con una cubierta de calamina oscura que se extiende sobre toda la construcción y que en algunos tramos conserva las láminas oxidadas por el tiempo. A lo largo de la fachada se alinean portones y ventanas que se abren hacia el campo.\n\n' +
        'Frente al edificio crece la vegetación: arbustos, pasto alto y las palmeras que se elevan por detrás de la cubierta. La imagen fue tomada desde el camino, con el paisaje verde de Senda B como marco y las líneas de luz cruzando el cielo.\n\n' +
        'Es uno de los espacios productivos que forman parte de la vida económica de la comunidad y de su paisaje cotidiano.',
      importancia:
        'La actividad productiva de Senda B genera trabajo y movimiento en la comunidad; este edificio es parte de ese esfuerzo colectivo.',
      destacado: false,
      orden: 9
    },
    {
      id: 'empresa-ebita',
      titulo: 'Empresa EBITA',
      categoria: 'empresas',
      imagen: 'imagenes/empresa-ebita.jpg',
      alt: 'Edificio de dos plantas con corredor techado sobre postes de madera, carteles con el nombre EBITA y una bandera de Bolivia.',
      resumen: 'Un edificio de dos plantas con corredor techado y carteles informativos, sede de la empresa EBITA.',
      descripcion:
        'La sede de EBITA es un edificio de dos plantas con cubierta de calamina y muros claros con detalles en azul. En la planta baja, un corredor techado se apoya sobre postes de madera y protege el ingreso; detrás, la segunda planta se abre con un ventanal amplio bajo la cubierta.\n\n' +
        'A lo largo de la fachada cuelgan carteles y láminas informativas, y a un costado se lee el nombre de la empresa en un banner blanco con letras azules. En el patio de grava, un banco de madera, un pilar de ladrillo y una bandera de Bolivia completan la escena, junto al vehículo estacionado sobre un costado.\n\n' +
        'Es uno de los espacios de trabajo de Senda B y forma parte de la vida productiva de la comunidad.',
      importancia:
        'Las empresas de la comunidad son espacios de trabajo y de servicio para las familias de Senda B, y parte del paisaje cotidiano del pueblo.',
      destacado: false,
      orden: 10
    },
    {
      id: 'planta-de-purificacion-de-agua',
      titulo: 'Planta de purificación de agua',
      categoria: 'empresas',
      imagen: 'imagenes/planta-de-purificacion-de-agua.jpg',
      alt: 'Edificio de la planta de purificación de agua con su cartel en la fachada, vegetación alta alrededor y una calle empedrada.',
      resumen: 'La planta que purifica el agua de la comunidad, reconocible por su cartel y su amplia cubierta.',
      descripcion:
        'La planta de purificación de agua es una construcción de amplia cubierta oscura, con muros bajos de color claro, puertas y ventanas en azul. Frente al edificio, un cartel vertical anuncia la «Planta de Purificación de Agua», y a un costado se suman otras construcciones del conjunto.\n\n' +
        'La vegetación crece alta alrededor y en el frente, mientras la calle empedrada con su línea blanca marca el paso hacia la planta. Al fondo, los árboles cierran el paisaje y un vehículo espera estacionado sobre un costado.\n\n' +
        'Es uno de los servicios esenciales de Senda B: el lugar donde el agua de la comunidad se prepara para el consumo diario.',
      importancia:
        'El agua tratada es un servicio esencial para la salud y la vida diaria de las familias de Senda B, y esta planta es parte de la infraestructura que lo hace posible.',
      destacado: false,
      orden: 11
    },
    {
      id: 'rio-la-j',
      titulo: 'Río La J',
      categoria: 'paisajes',
      imagen: 'imagenes/rio-la-j.jpg',
      alt: 'Río de aguas tranquilas y color tierra rodeado de vegetación densa, visto desde lo alto de un puente.',
      resumen: 'Un río de aguas tranquilas entre vegetación densa, uno de los paisajes naturales que rodean a Senda B.',
      descripcion:
        'El río La J corre entre dos orillas cubiertas de vegetación. El agua, de color tierra, avanza despacio y refleja el cielo y los árboles que la rodean; una rama caída descansa sobre la superficie y marca la quietud del lugar.\n\n' +
        'La fotografía está tomada desde lo alto de un puente, con el borde de concreto en el primer plano. A ambos lados, la vegetación se cierra sobre el cauce y forma un corredor verde que acompaña el recorrido del agua.\n\n' +
        'Es uno de los paisajes naturales de Senda B: un lugar de calma y de vida que forma parte del entorno de la comunidad.',
      importancia:
        'El río forma parte del paisaje y del entorno natural de Senda B; conocerlo es también entender la relación de la comunidad con la naturaleza que la rodea.',
      destacado: false,
      orden: 12
    }
  ]
};
