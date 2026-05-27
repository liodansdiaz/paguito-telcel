const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const DIR = __dirname;
const MOCKUPS = path.join(DIR, "mockups");

async function makePPTX() {
  console.log("🎨 Generando PowerPoint con capturas REALES...\n");

  const pptx = new PptxGenJS();

  // ── Helper: slide con screenshot ──────────────────────────────────────
  function addScreenshotSlide(title, desc, imgName, opts = {}) {
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText(title, {
      x: 0.5, y: 0.15, w: 9, h: 0.55,
      fontSize: 20, color: opts.color || "0f49bd", bold: true, fontFace: "Arial",
    });
    s.addText(desc, {
      x: 0.5, y: 0.7, w: 9, h: 0.45,
      fontSize: 11, color: "6B7280", fontFace: "Arial",
    });
    const imgPath = path.join(MOCKUPS, imgName);
    if (fs.existsSync(imgPath)) {
      s.addImage({ path: imgPath, x: 0.3, y: 1.2, w: 9.4, h: 5.2 });
    } else {
      console.log("  ⚠️ Imagen no encontrada:", imgName);
    }
    return s;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 1: PORTADA
  // ═══════════════════════════════════════════════════════════════════
  let s = pptx.addSlide();
  s.background = { color: "002f87" };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 3.0, w: 10, h: 2.63, fill: { color: "0f49bd" } });
  s.addShape(pptx.ShapeType.ellipse, { x: -1.5, y: -1.5, w: 4, h: 4, fill: { color: "13ec6d", transparency: 85 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 8, y: 3.5, w: 3, h: 3, fill: { color: "13ec6d", transparency: 85 } });
  s.addText("Amigo Paguitos Telcel", {
    x: 1, y: 1.0, w: 8, h: 1.2,
    fontSize: 40, color: "FFFFFF", bold: true, align: "center", fontFace: "Arial",
  });
  s.addText("Sistema de Gestión de Ventas y Reservas", {
    x: 1, y: 2.1, w: 8, h: 0.6,
    fontSize: 16, color: "CCE0FF", align: "center", fontFace: "Arial",
  });
  s.addText("Resumen Ejecutivo · Mayo 2026", {
    x: 1, y: 3.5, w: 8, h: 0.5,
    fontSize: 13, color: "99C2FF", align: "center", fontFace: "Arial",
  });
  s.addText("Presentación Corporativa", {
    x: 1, y: 4.2, w: 8, h: 0.5,
    fontSize: 13, color: "13ec6d", align: "center", fontFace: "Arial",
  });
  console.log("  ✅ Slide 1: Portada");

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 2: ¿QUÉ ES?
  // ═══════════════════════════════════════════════════════════════════
  s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("¿Qué es Amigo Paguitos Telcel?", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 24, color: "0f49bd", bold: true, fontFace: "Arial",
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.95, w: 2.5, h: 0.05, fill: { color: "13ec6d" } });
  s.addText(
    "Es un sistema de ventas por internet diseñado para la comercialización de equipos Telcel. " +
    "Los clientes consultan el catálogo en línea, hacen una reserva y reciben la visita de un vendedor a domicilio. " +
    "Los administradores controlan el inventario, asignan vendedores y dan seguimiento a todas las reservas desde un solo lugar.",
    { x: 0.6, y: 1.3, w: 8.8, h: 1.4, fontSize: 13, color: "374151", fontFace: "Arial", lineSpacing: 20 }
  );
  const boxes = [
    { t: "🔵 Para Clientes", i: "Catálogo en línea\nReserva sin registro\nChat de atención 24/7\nPago en OXXO, bancos y tiendas", c: "0f49bd" },
    { t: "🟢 Para Vendedores", i: "Visitas asignadas automáticamente\nMapa de clientes\nActualización de estados\nNotas en cada visita", c: "002f87" },
    { t: "⚡ Para Admins", i: "Dashboard con métricas\nControl total de inventario\nReportes exportables\nConfiguración del sistema", c: "13ec6d" },
  ];
  boxes.forEach((b, i) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6 + i * 3.1, y: 3.0, w: 2.8, h: 2.3,
      fill: { color: "F9FAFB" }, line: { color: "E5E7EB", width: 1 }, rectRadius: 6,
    });
    s.addText(b.t, { x: 0.8 + i * 3.1, y: 3.15, w: 2.4, h: 0.4, fontSize: 14, color: b.c, bold: true, fontFace: "Arial" });
    s.addText(b.i, { x: 0.8 + i * 3.1, y: 3.6, w: 2.4, h: 1.5, fontSize: 11, color: "6B7280", fontFace: "Arial", lineSpacing: 16 });
  });
  console.log("  ✅ Slide 2: ¿Qué es?");

  // ═══════════════════════════════════════════════════════════════════
  // SLIDES 3-10: PANTALLAS PÚBLICAS
  // ═══════════════════════════════════════════════════════════════════
  addScreenshotSlide(
    "🏠 Página Principal",
    "Landing page con hero, productos populares, ofertas, sección 'Cómo funciona', 'Por qué elegirnos' y testimonios.",
    "00-home.png"
  );
  console.log("  ✅ Slide 3: Home");

  addScreenshotSlide(
    "📱 Catálogo de Productos",
    "Navegación de equipos con fotos, precios, colores y capacidades. Filtros por marca, precio y color. Búsqueda por nombre.",
    "01-catalogo.png"
  );
  console.log("  ✅ Slide 4: Catálogo");

  addScreenshotSlide(
    "🔍 Detalle de Producto",
    "Galería de imágenes, colores disponibles, capacidades, precio de contado o crédito, enganche y pagos semanales.",
    "02-producto-detalle.png"
  );
  console.log("  ✅ Slide 5: Detalle de Producto");

  addScreenshotSlide(
    "🛒 Carrito y Reserva",
    "El cliente agrega productos, elige método de pago, selecciona fecha y horario, y registra su dirección en el mapa.",
    "03-carrito-checkout.png"
  );
  console.log("  ✅ Slide 6: Carrito");

  addScreenshotSlide(
    "📋 Consulta de Reserva",
    "El cliente puede consultar su reserva por folio o CURP, ver el estado de cada producto, modificar fecha u horario, o cancelar.",
    "04-mi-reserva.png"
  );
  console.log("  ✅ Slide 7: Mi Reserva");

  addScreenshotSlide(
    "❓ Preguntas Frecuentes",
    "Sección informativa con respuestas sobre crédito, proceso de compra, garantía, productos y cobertura de zonas.",
    "05-faq.png"
  );
  console.log("  ✅ Slide 8: FAQ");

  addScreenshotSlide(
    "🏢 ¿Quiénes Somos?",
    "Página institucional con la historia, misión, visión y valores de Amigo Paguitos Telcel.",
    "06-nosotros.png"
  );
  console.log("  ✅ Slide 9: Nosotros");

  addScreenshotSlide(
    "💳 Dónde Pagar",
    "Información de medios de pago disponibles: bancos (Scotiabank, Santander, BBVA, Banorte), tiendas (OXXO, Elektra, Liverpool) y más.",
    "07-donde-pagar.png"
  );
  console.log("  ✅ Slide 10: Dónde Pagar");

  addScreenshotSlide(
    "🔐 Portal de Vendedores - Login",
    "Acceso seguro con correo y contraseña. Dos niveles de acceso: Administrador y Vendedor. Recuperación de contraseña.",
    "08-login.png"
  );
  console.log("  ✅ Slide 11: Login");

  // ═══════════════════════════════════════════════════════════════════
  // SLIDES 12-17: PANEL ADMIN
  // ═══════════════════════════════════════════════════════════════════
  addScreenshotSlide(
    "📊 Dashboard del Administrador",
    "Métricas en tiempo real (reservas hoy/semana/mes, activas, completadas), gráficas con Recharts, ranking de vendedores y exportación a Excel. Auto-actualizable cada 30 segundos.",
    "09-admin-dashboard.png",
    { color: "092c71" }
  );
  console.log("  ✅ Slide 12: Admin Dashboard");

  addScreenshotSlide(
    "🔒 Gestión de Reservas",
    "Tabla completa con filtros por estado, vendedor, producto y fechas. Exportación a Excel, cambio de estados y panel de control total.",
    "10-admin-reservas.png",
    { color: "092c71" }
  );
  console.log("  ✅ Slide 13: Admin Reservas");

  addScreenshotSlide(
    "📦 Gestión de Inventario",
    "CRUD completo de productos con subida de imágenes, colores, capacidades, precios y control de stock con alertas visuales.",
    "11-admin-inventario.png",
    { color: "092c71" }
  );
  console.log("  ✅ Slide 14: Admin Inventario");

  addScreenshotSlide(
    "👥 Directorio de Clientes",
    "Base de datos de clientes con búsqueda, filtro por estado, bloqueo/activación y exportación a Excel.",
    "12-admin-clientes.png",
    { color: "092c71" }
  );
  console.log("  ✅ Slide 15: Admin Clientes");

  addScreenshotSlide(
    "🧑‍💼 Gestión de Vendedores",
    "Administración de vendedores: crear, editar, activar/desactivar. Filtro por zona, consulta de reservas asignadas y exportación.",
    "13-admin-vendedores.png",
    { color: "092c71" }
  );
  console.log("  ✅ Slide 16: Admin Vendedores");

  addScreenshotSlide(
    "⚙️ Panel de Sistema",
    "Visor de logs del servidor, notificaciones enviadas (Email/WhatsApp), estado de servicios y descarga de archivos de log.",
    "14-admin-sistema.png",
    { color: "092c71" }
  );
  console.log("  ✅ Slide 17: Admin Sistema");

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 18: VENDEDOR
  // ═══════════════════════════════════════════════════════════════════
  addScreenshotSlide(
    "👤 Panel del Vendedor",
    "Dashboard personal con métricas, reservas asignadas, mapa interactivo (Leaflet) con ubicación de clientes, y modal para cambiar estados con notas.",
    "15-vendor-dashboard.png",
    { color: "002f87" }
  );
  console.log("  ✅ Slide 18: Vendor Dashboard");

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 19: RESUMEN DE FUNCIONALIDADES
  // ═══════════════════════════════════════════════════════════════════
  s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Resumen de Funcionalidades", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 22, color: "0f49bd", bold: true, fontFace: "Arial",
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.95, w: 2.5, h: 0.05, fill: { color: "13ec6d" } });
  const features = [
    ["🔵 Cliente", "Catálogo en línea · Detalle de producto · Carrito de reservas · Confirmación · Consulta de reserva · Chat con IA · FAQ · Nosotros · Dónde pagar"],
    ["🟢 Vendedor", "Dashboard personal · Lista de reservas asignadas · Mapa interactivo con clientes · Cambio de estados con notas"],
    ["🟠 Administrador", "Dashboard con métricas y gráficas · CRUD de inventario · Gestión de reservas · Directorio de clientes · Vendedores · Configuración del sistema · Chat config"],
    ["⚙️ Sistema", "Asignación Round Robin · Notificaciones Email y WhatsApp · Resúmenes automáticos · Logs del servidor · Exportación a Excel"],
  ];
  features.forEach((item, i) => {
    const y = 1.3 + i * 0.9;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: y, w: 8.8, h: 0.75,
      fill: { color: ["E6F0FF", "F0FDF4", "FEF3C7", "F3F4F6"][i] },
      line: { color: "E5E7EB", width: 0.5 }, rectRadius: 4,
    });
    s.addText(item[0], { x: 0.8, y: y, w: 2.5, h: 0.75, fontSize: 13, color: "111827", bold: true, valign: "middle", fontFace: "Arial" });
    s.addText(item[1], { x: 3.0, y: y, w: 6.2, h: 0.75, fontSize: 11, color: "6B7280", valign: "middle", fontFace: "Arial" });
  });
  console.log("  ✅ Slide 19: Resumen");

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 20: CIERRE
  // ═══════════════════════════════════════════════════════════════════
  s = pptx.addSlide();
  s.background = { color: "0f49bd" };
  s.addShape(pptx.ShapeType.ellipse, { x: 7, y: -1, w: 4, h: 4, fill: { color: "13ec6d", transparency: 85 } });
  s.addText("Amigo Paguitos Telcel", {
    x: 1, y: 1.5, w: 8, h: 1,
    fontSize: 36, color: "FFFFFF", bold: true, align: "center", fontFace: "Arial",
  });
  s.addText("Gracias", {
    x: 1, y: 2.6, w: 8, h: 0.8,
    fontSize: 30, color: "13ec6d", align: "center", fontFace: "Arial",
  });
  s.addText("Sistema de Gestión de Ventas y Reservas", {
    x: 1, y: 3.5, w: 8, h: 0.6,
    fontSize: 13, color: "CCE0FF", align: "center", fontFace: "Arial",
  });
  console.log("  ✅ Slide 20: Cierre");

  // ── Guardar ─────────────────────────────────────────────────────
  const outPath = path.join(DIR, "Paguito-Telcel-Presentacion.pptx");
  await pptx.writeFile({ fileName: outPath });
  console.log("\n📁 PPTX generado:", outPath);
  return outPath;
}

makePPTX().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
