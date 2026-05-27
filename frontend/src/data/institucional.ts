// Contenido institucional ACXOCEL

export const institucional = {
  nombre: 'ACXOCEL',
  nombreCompleto: 'ACXOCEL S.A. de C.V.',
  slogan: 'Distribuidor Autorizado Telcel Región 8',
  region: 'Región 8 - Sureste de México',
  estados: ['Quintana Roo', 'Chiapas', 'Yucatán', 'Campeche'],

  // Misión (corregida)
  mision:
    'Ofrecer a nuestros clientes bienes y servicios, contando con el respaldo de marcas de prestigio, que garanticen la máxima satisfacción con la finalidad de crecer juntos.',

  // Visión (corregida)
  vision:
    'Posicionarnos como la empresa líder en el mercado de las telecomunicaciones de la Región 8, ofreciendo en un solo lugar soluciones rápidas e inteligentes a través de la mejora continua.',

  // Nuestra Historia (adaptado de Cencel)
  historia: {
    parrafo1:
      'En ACXOCEL, el distribuidor autorizado Telcel de mayor prestigio en la Región 8, somos tus asesores estratégicos en telecomunicaciones. Nuestro compromiso es brindar soluciones integrales para mantener tu empresa y familia siempre comunicadas con el respaldo de La mejor Cobertura.',
    parrafo2:
      'Queremos optimizar tu conectividad para que siempre estés un paso adelante. Maximiza la eficiencia de tus operaciones diarias apoyándote en La Red 5G Mas rápida de México.',
    cierre: 'Recuerda que Telcel es la red.',
  },

  // Compromiso ACXOCEL (como "Compromiso Cencel")
  compromiso: [
    'Atención inmediata',
    'Ventas efectivas según necesidad',
    'Eficiencia en atención',
    'Servicio regional de calidad',
    'Las mejores promociones',
    'Cobertura en el sureste',
  ],

  // Valores (opcional)
  valores: [
    {
      nombre: 'Compromiso',
      descripcion: 'Con nuestros clientes y su satisfacción',
    },
    {
      nombre: 'Calidad',
      descripcion: 'En cada producto y servicio que ofrecemos',
    },
    {
      nombre: 'Innovación',
      descripcion: 'Adoptando la mejor tecnología del mercado',
    },
    {
      nombre: 'Cercanía',
      descripcion: 'Presencia local en toda la Región 8',
    },
  ],

  // Hero carousel slides
  heroSlides: [
    {
      id: 1,
      titulo: 'RE CONECTAMOS AL SURESTE',
      subtitulo:
        'Expertos en comunicación. Líderes en la Región 8. Descubre por qué miles eligen a ACXOCEL como su aliado de confianza para navegar con la Red 5G de Telcel.',
      ctas: [
        { texto: 'Encontrar Sucursal', url: '/sucursales' },
        { texto: 'Ver Planes', url: '/planes' },
      ],
      imagen: 'hero-slide-1.jpg', // Placeholder
      tipo: 'institucional',
    },
    {
      id: 2,
      titulo: 'LA MAYOR COBERTURA',
      subtitulo:
        'Navega con la velocidad de la Red 5G de Telcel. Planes a tu medida en Quintana Roo, Chiapas, Yucatán y Campeche.',
      ctas: [{ texto: 'Comparar Planes', url: '/planes-comparativa' }],
      imagen: 'hero-slide-2.jpg', // Placeholder
      tipo: '5g',
    },
    {
      id: 3,
      titulo: 'AMIGO PAGUITOS',
      subtitulo:
        'Tu celular sin buró ni aval. Crédito semanal + Entrega a domicilio en toda la Región 8.',
      badge: '⭐ SERVICIO MÁS SOLICITADO',
      ctas: [
        { texto: 'Ver Catálogo', url: '/amigo-paguitos/catalogo' },
        { texto: 'Reservar Ahora', url: '/amigo-paguitos/catalogo' },
      ],
      imagen: 'hero-slide-3.jpg', // Placeholder
      tipo: 'amigo-paguitos',
    },
  ],
};
