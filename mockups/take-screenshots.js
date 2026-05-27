const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, ".");
const BASE = "http://localhost:8082";

async function screenshot(page, name, fullPage = true) {
  const p = path.join(DIR, name + ".png");
  await page.screenshot({ path: p, fullPage }).catch(e => console.log("  ⚠️ Screenshot error:", e.message));
  console.log("  ✅ " + name + ".png");
}

async function waitAndScreenshot(page, name, delay = 2000, fullPage = true) {
  await new Promise(r => setTimeout(r, delay));
  await screenshot(page, name, fullPage);
}

async function login(page, email, password) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.type('input[type="email"]', email, { delay: 30 });
  await page.type('input[type="password"]', password, { delay: 30 });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
  const url = page.url();
  console.log("  Login result URL:", url);
  return url;
}

(async () => {
  console.log("=== INICIANDO CAPTURAS DE PANTALLA ===\n");

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // =============================================
  // 1. PÁGINAS PÚBLICAS
  // =============================================
  console.log("--- PÁGINAS PÚBLICAS ---");

  // Home
  console.log("Home...");
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "00-home");

  // Catálogo
  console.log("Catálogo...");
  await page.goto(BASE + "/catalogo", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "01-catalogo");

  // Product detail - click first product link
  console.log("Producto detalle...");
  const productLink = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href^="/producto/"]');
    return links.length > 0 ? links[0].getAttribute("href") : null;
  });
  if (productLink) {
    await page.goto(BASE + productLink, { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
    await waitAndScreenshot(page, "02-producto-detalle");
  } else {
    console.log("  ⚠️ No product links found, trying direct ID");
    // Try with a known product ID from the API
    await page.goto(BASE + "/producto/0b85f05c-8d30-49b3-90a8-2a71e558b5e5", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
    await waitAndScreenshot(page, "02-producto-detalle");
  }

  // Cart/Checkout
  console.log("Carrito...");
  await page.goto(BASE + "/carrito", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "03-carrito-checkout");

  // Mi Reserva
  console.log("Mi Reserva...");
  await page.goto(BASE + "/mi-reserva", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "04-mi-reserva");

  // FAQ
  console.log("FAQ...");
  await page.goto(BASE + "/faq", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "05-faq");

  // Nosotros
  console.log("Nosotros...");
  await page.goto(BASE + "/nosotros", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "06-nosotros");

  // Donde pagar
  console.log("Dónde pagar...");
  await page.goto(BASE + "/donde-pagar", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "07-donde-pagar");

  // Login page (before logging in)
  console.log("Login...");
  await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "08-login");

  // =============================================
  // 2. ADMIN PANEL
  // =============================================
  console.log("\n--- ADMIN PANEL ---");

  await login(page, "admin@paguito.com", "PaguitoTelcel2024!");

  // Admin Dashboard
  console.log("Admin Dashboard...");
  await page.goto(BASE + "/admin/dashboard", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "09-admin-dashboard");

  // Admin Reservas
  console.log("Admin Reservas...");
  await page.goto(BASE + "/admin/reservas", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "10-admin-reservas");

  // Admin Inventario
  console.log("Admin Inventario...");
  await page.goto(BASE + "/admin/inventario", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "11-admin-inventario");

  // Admin Clientes
  console.log("Admin Clientes...");
  await page.goto(BASE + "/admin/clientes", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "12-admin-clientes");

  // Admin Vendedores
  console.log("Admin Vendedores...");
  await page.goto(BASE + "/admin/vendedores", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "13-admin-vendedores");

  // Admin Sistema
  console.log("Admin Sistema...");
  await page.goto(BASE + "/admin/sistema", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "14-admin-sistema");

  // =============================================
  // 3. VENDOR PANEL
  // =============================================
  console.log("\n--- VENDOR PANEL ---");

  // Logout from admin and login as vendor
  await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  
  await login(page, "roberto@paguito.com", "Vend123!");

  console.log("Vendor Dashboard...");
  await page.goto(BASE + "/vendedor/dashboard", { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
  await waitAndScreenshot(page, "15-vendor-dashboard");

  await browser.close();
  console.log("\n=== CAPTURAS COMPLETADAS ===");
})().catch(e => { console.error("FATAL:", e.message, e.stack); process.exit(1); });
