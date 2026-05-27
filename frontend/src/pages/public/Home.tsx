import {
  HeroCarousel,
  NuestraHistoria,
  PlanesComparador,
  PlanesCalculadora,
  ServiciosCorp,
  TrabajaConNosotros,
} from '../../components/home';

// ════════════════════════════════════════════════════════════════════════════
// HOME CORPORATIVA ACXOCEL - Estructura completa como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* 1. Hero Carousel (3 slides) */}
      <HeroCarousel />

      {/* 2. Nuestra Historia (texto institucional + misión/visión + compromiso) */}
      <NuestraHistoria />

      {/* 3. Planes Telcel Libre (tabla comparativa) */}
      <PlanesComparador />

      {/* 4. Calculadora de Plan Ideal (filtros interactivos) */}
      <PlanesCalculadora />

      {/* TODO: 5. Buscador de Equipos (implementar en Sprint 3) */}

      {/* 6. Servicios Corporativos (grid 3x3 con modals) */}
      <ServiciosCorp />

      {/* 7. Trabaja con Nosotros */}
      <TrabajaConNosotros />
    </div>
  );
};

export default Home;
