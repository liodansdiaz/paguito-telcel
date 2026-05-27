// Servicios Corporativos - Contenido copiado de Cencel.com.mx

export interface ServicioCorporativo {
  id: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  beneficios: string[];
  icono: string; // Nombre del icono de react-icons
}

export const serviciosCorporativos: ServicioCorporativo[] = [
  {
    id: 'conectividad',
    titulo: 'Conectividad Telcel',
    descripcionCorta: 'Colaboración y flujo de información sin límites.',
    descripcionLarga:
      'Asegura que tu empresa permanezca siempre conectada, con cobertura nacional y velocidad confiable, garantizando que tus equipos, sistemas y dispositivos estén comunicados sin interrupciones. Al implementar estas soluciones, tu empresa podrá automatizar procesos con IoT y M2M, gestionar dispositivos de manera centralizada con eSIM, y mantener la información crítica protegida a través de redes privadas de datos. Esto se traduce en operaciones más eficientes, reducción de tiempos de inactividad y continuidad de negocio, permitiéndote enfocarte en crecer y atender a tus clientes con mayor rapidez y confiabilidad.',
    beneficios: [
      'Cobertura nacional confiable',
      'Conectividad IoT y M2M',
      'Red privada segura',
      'Continuidad operativa',
    ],
    icono: 'FaNetworkWired',
  },
  {
    id: 'comunicacion',
    titulo: 'Comunicación Empresarial',
    descripcionCorta: 'Procesos eficientes con comunicación segura.',
    descripcionLarga:
      'Optimiza la colaboración interna de tu empresa con herramientas de comunicación empresarial que permiten intercambiar información en tiempo real de manera segura y eficiente. Con soluciones como mensajería instantánea segura y Push-to-Talk, tus equipos podrán coordinar operaciones, recibir actualizaciones y tomar decisiones al instante, sin importar su ubicación. Esto incrementa la productividad, reduce errores de comunicación y permite reaccionar rápidamente ante cualquier situación, asegurando que tu empresa siempre tenga control total de sus operaciones y la información necesaria para crecer con confianza.',
    beneficios: [
      'Mensajería segura',
      'Push-to-Talk',
      'Comunicación inmediata',
      'Mayor eficiencia',
    ],
    icono: 'FaComments',
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad',
    descripcionCorta: 'Protección total para tu información e infraestructura.',
    descripcionLarga:
      'Protege los activos y la información de tu empresa con soluciones de seguridad integral que previenen riesgos internos y externos. Al contratar estos servicios, tu organización obtiene protección frente a ciberamenazas, control automatizado de accesos y cumplimiento de estándares corporativos, lo que garantiza que la información sensible esté siempre segura. Esto permite operar con confianza, mantener la continuidad del negocio y minimizar impactos por incidentes de seguridad, asegurando que tu empresa esté preparada para cualquier eventualidad y pueda enfocarse en sus objetivos estratégicos.',
    beneficios: [
      'Protección de datos',
      'Prevención de ciberataques',
      'Cumplimiento normativo',
      'Continuidad del negocio',
    ],
    icono: 'FaShieldAlt',
  },
  {
    id: 'localizacion',
    titulo: 'Localización y Rastreo',
    descripcionCorta: 'Eficiencia y seguridad en cada movimiento.',
    descripcionLarga:
      'Controla y optimiza tu flotilla con soluciones de rastreo en tiempo real, permitiendo supervisar ubicación, rutas, consumo de combustible y hábitos de conducción. Esto no solo mejora la eficiencia operativa y reduce costos logísticos, sino que también incrementa la seguridad de tus vehículos y activos, y permite responder rápidamente ante cualquier incidencia en terreno. Al contar con esta herramienta, tu empresa obtiene mayor visibilidad, control total y decisiones más informadas, fundamentales para empresas de transporte, logística o servicios móviles.',
    beneficios: [
      'Rastreo en tiempo real',
      'Optimización de rutas',
      'Control de activos',
      'Reducción de costos',
    ],
    icono: 'FaMapMarkerAlt',
  },
  {
    id: 'cloud',
    titulo: 'Servicios Cloud',
    descripcionCorta: 'Innova y aumenta tu productividad en la nube.',
    descripcionLarga:
      'Transforma tu empresa con servicios en la nube que facilitan colaboración remota, acceso seguro a documentos y aplicaciones y escalabilidad tecnológica. Con herramientas como Microsoft 365, Google Workspace y almacenamiento seguro, tu equipo puede trabajar desde cualquier lugar, colaborar en tiempo real y reducir la necesidad de infraestructura física costosa. Esto incrementa la productividad, optimiza los procesos internos y permite a tu empresa crecer sin limitaciones tecnológicas, asegurando que tu operación se mantenga ágil, flexible y lista para los retos digitales del futuro.',
    beneficios: [
      'Trabajo remoto seguro',
      'Colaboración en tiempo real',
      'Escalabilidad',
      'Optimización de procesos',
    ],
    icono: 'FaCloud',
  },
  {
    id: 'gestion-vehicular',
    titulo: 'Gestión Vehicular',
    descripcionCorta: 'Monitoreo logístico de flotillas en tiempo real.',
    descripcionLarga:
      'Nuestra solución de Localización Vehicular te ofrece una plataforma integral para localizar, rastrear y gestionar tus unidades en tiempo real, con acceso desde web y app móvil. Permite visualizar trayectos, crear alertas inteligentes y obtener métricas operativas que aumentan la productividad, reducen costos y mejoran la toma de decisiones. Con herramientas de telemetría, módulo de ruteo, medición de combustible y video a bordo, tendrás un control completo de tu flotilla sin importar su tamaño.',
    beneficios: [
      'Alertas inteligentes',
      'Telemetría avanzada',
      'Planeación de rutas',
      'Video a bordo',
    ],
    icono: 'FaTruck',
  },
  {
    id: 'fuerza-campo',
    titulo: 'Fuerza en Campo',
    descripcionCorta: 'Operaciones eficientes con soluciones digitales.',
    descripcionLarga:
      'Gestiona y supervisa el desempeño de tus equipos externos con plataformas que permiten asignar tareas, dar seguimiento en tiempo real y generar reportes automáticos. Esto asegura que cada actividad se cumpla de manera eficiente, optimizando tiempos y recursos. Al implementar esta solución, tu empresa obtiene mayor control operativo, reducción de errores y mejora en la productividad, lo que se traduce en mejores resultados, clientes más satisfechos y operación más rentable.',
    beneficios: [
      'Asignación de tareas',
      'Supervisión en tiempo real',
      'Reportes automáticos',
      'Mayor productividad',
    ],
    icono: 'FaUsers',
  },
  {
    id: 'mobile-marketing',
    titulo: 'Mobile Marketing',
    descripcionCorta: 'Estrategias de mercadotecnia de alto impacto.',
    descripcionLarga:
      'Aumenta tus ventas y fideliza clientes mediante campañas de marketing móvil personalizadas, automatizadas y medibles. Con herramientas como SMS, notificaciones y promociones digitales, tu empresa puede generar engagement directo con los clientes, aumentar conversiones y mejorar la experiencia de usuario. Esto permite tomar decisiones basadas en datos, optimizar estrategias comerciales y fortalecer la relación con el cliente, asegurando que tus campañas sean efectivas y medibles.',
    beneficios: [
      'Campañas personalizadas',
      'Comunicación directa',
      'Métricas en tiempo real',
      'Mayor conversión',
    ],
    icono: 'FaMobileAlt',
  },
  {
    id: 'soluciones-it',
    titulo: 'Soluciones IT',
    descripcionCorta: 'Operación optimizada con soluciones a medida.',
    descripcionLarga:
      'Optimiza tu infraestructura tecnológica con soluciones de TI que permiten integrar sistemas, automatizar procesos y contar con soporte especializado. Esto garantiza que tu operación funcione con mayor eficiencia, menor carga operativa y respuesta rápida ante incidencias, alineando la tecnología a los objetivos estratégicos de tu empresa. Al implementar estas soluciones, tu empresa obtiene agilidad operativa, reducción de riesgos y capacidad de crecimiento sostenido, manteniéndose competitiva en el entorno digital.',
    beneficios: [
      'Integración tecnológica',
      'Automatización',
      'Soporte confiable',
      'Escalabilidad',
    ],
    icono: 'FaLaptopCode',
  },
];
