# 📷 Instrucciones para Configurar el Logo

## 🚨 INSTRUCCIONES RÁPIDAS

Tu logo debe ir en: **`frontend/public/logo.svg`**

---

## 📁 ESTRUCTURA ACTUAL

```
frontend/
├── public/
│   └── logo.svg  ← TU LOGO VA AQUÍ
└── src/
    ├── config/
    │   └── logo-config.ts  ← Configuración de logo
    └── components/
        ├── ui/
        │   └── Logo.tsx  ← Componente de logo
        └── layout/
            ├── PublicLayout.tsx
            ├── AdminLayout.tsx
            └── VendorLayout.tsx
```

---

## 📝 PASO A PASO

### **Opción 1: Logo SVG (Recomendado)**

1. **Prepara tu logo en formato SVG**
   - Hazlo cuadrado (ej: 200x200px)
   - Usa los colores corporativos si es posible

2. **Reemplaza el archivo actual**
   ```bash
   # Elimina el logo placeholder
   rm frontend/public/logo.svg
   
   # Copia tu logo SVG a la carpeta public
   # (Hazlo manualmente o usa tu editor)
   cp /ruta/a/tu/logo.svg frontend/public/logo.svg
   ```

3. **Verifica que funciona**
   - Abre `http://localhost:5173`
   - Deberías ver tu logo en el header

### **Opción 2: Logo PNG/JPG**

1. **Prepara tu logo en formato PNG o JPG**
   - Resolución mínima: 200x200px
   - Fondo transparente (si es PNG)

2. **Copia el archivo**
   ```bash
   cp /ruta/a/tu/logo.png frontend/public/logo.png
   ```

3. **Actualiza la configuración**
   Abre `frontend/src/config/logo-config.ts` y cambia:
   ```typescript
   export const logoConfig = {
     mainLogo: '/logo.png',  // Cambiar de .svg a .png
     // ... resto de configuración
   };
   ```

4. **También actualiza index.html**
   Abre `frontend/index.html` y cambia:
   ```html
   <link rel="icon" type="image/png" href="/logo.png" />
   ```

---

## 🎨 ESPECIFICACIONES TÉCNICAS

### **Formatos Soportados:**
- ✅ **SVG** (Vectorial, recomendado)
- ✅ **PNG** (Con fondo transparente)
- ✅ **JPG** (Fondo sólido)
- ✅ **WebP** (Modern, optimizado)

### **Tamaño Recomendado:**
- **Dimensiones:** 200x200px a 512x512px
- **Formato:** Cuadrado (relación 1:1)
- **Fondo:** Transparente para PNG/WebP

### **Colores Corporativos:**
Si tu logo usa colores corporativos:
- Azul oscuro: `#002f87`
- Azul principal: `#0f49bd`
- Verde neón: `#13ec6d`
- Navy: `#002a5c`

---

## 📍 UBICACIONES DONDE SE USA EL LOGO

### **1. Favicon (Navegador)**
- Archivo: `frontend/index.html`
- Uso: Icono de la pestaña del navegador
- Tamaño: 32x32px (mostrado)

### **2. Header Público**
- Archivo: `frontend/src/components/layout/PublicLayout.tsx`
- Uso: Navbar principal
- Tamaño: 40x40px (`w-10 h-10`)

### **3. Footer Público**
- Archivo: `frontend/src/components/layout/PublicLayout.tsx`
- Uso: Pie de página
- Tamaño: 48x48px (`w-12 h-12`)

### **4. Sidebar Admin**
- Archivo: `frontend/src/components/layout/AdminLayout.tsx`
- Uso: Panel administrativo
- Tamaño: 48x48px (`w-12 h-12`)

### **5. Header Vendedor**
- Archivo: `frontend/src/components/layout/VendorLayout.tsx`
- Uso: Portal de vendedores
- Tamaño: 40x40px (`w-10 h-10`)

### **6. Login Page**
- Archivo: `frontend/src/pages/auth/Login.tsx`
- Uso: Portal de autenticación
- Tamaño: 56x56px (`w-14 h-14`)

### **7. Hero Nosotros**
- Archivo: `frontend/src/pages/public/Nosotros.tsx`
- Uso: Sección "Quiénes somos"
- Tamaño: 64x64px (`w-16 h-16`)

---

## ✅ VERIFICACIÓN POST-CAMBIO

### **Paso 1: Guardar el logo**
- Guarda tu logo como `frontend/public/logo.svg` (o .png)
- Verifica que el archivo exista en la carpeta `public`

### **Paso 2: Reiniciar el servidor**
```bash
cd frontend
npm run dev
```

### **Paso 3: Probar en el navegador**
- Abre `http://localhost:5173`
- Limpia caché: `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)

### **Paso 4: Verificar todas las secciones**
- ✅ Header público
- ✅ Footer público  
- ✅ Login page
- ✅ Admin layout
- ✅ Vendor layout
- ✅ Página "Quiénes somos"

---

## 🔧 PROBLEMAS COMUNES Y SOLUCIONES

### **Problema: El logo no se ve**
**Solución:**
1. Verifica que el archivo está en `frontend/public/`
2. Verifica el nombre exacto (`logo.svg` o `logo.png`)
3. Revisa la consola del navegador por errores 404
4. Asegúrate de que el servidor está corriendo

### **Problema: El logo se ve pixelado**
**Solución:**
- Usa formato SVG (vectorial, escala perfectamente)
- Si es PNG/JPG, usa mayor resolución (mínimo 200x200px)

### **Problema: El logo no se ajusta bien**
**Solución:**
- Editar el tamaño en los archivos de layout
- Buscar la clase `w-10 h-10` y cambiar a `w-12 h-12` (más grande) o viceversa
- Añadir `object-contain` si el logo se recorta

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] Logo guardado en `frontend/public/logo.svg` (o .png)
- [ ] Archivo con tamaño adecuado (200-512px)
- [ ] Formato correcto (SVG recomendado)
- [ ] Fondo transparente (si es PNG/JPG)
- [ ] Servidor de desarrollo reiniciado
- [ ] Logo visible en header público
- [ ] Logo visible en footer público
- [ ] Logo visible en admin/vendedor
- [ ] Favicon actualizado en navegador

---

## 🎨 EJEMPLOS DE LOGOS SVG

### **Ejemplo 1: Logo con texto**
```xml
<svg viewBox="0 0 200 50">
  <!-- Icono -->
  <circle cx="25" cy="25" r="20" fill="#002f87"/>
  <!-- Texto -->
  <text x="55" y="32" font-family="Arial" font-size="18" font-weight="bold" fill="#002f87">
    Amigo Paguitos Telcel
  </text>
</svg>
```

### **Ejemplo 2: Logo con círculo**
```xml
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#002f87"/>
  <circle cx="50" cy="50" r="35" fill="#13ec6d"/>
  <text x="50" y="58" text-anchor="middle" font-family="Arial" font-size="20" fill="#002f87">
    AP
  </text>
</svg>
```

---

## 🚀 PASO FINAL: COMPARTIR TU LOGO

**Si necesitas ayuda para integrar tu logo específico:**

1. **Comparte la imagen aquí** (arrástrala o pega el enlace)
2. **Describe tu logo** y te ayudo a crear un SVG similar
3. **Dame el código SVG** si lo tienes listo

**¿Cuál es el formato de tu logo actual?**

- [ ] SVG (vectorial)
- [ ] PNG (con fondo transparente)
- [ ] JPG (con fondo sólido)
- [ ] Otro formato

---

## ⏭️ PRÓXIMOS PASOS

Una vez que configures tu logo:
1. ✅ El logo aparecerá en todas las secciones
2. ✅ El favicon se actualizará en el navegador
3. ✅ Podemos probar en producción
4. ✅ Puedes ajustar tamaños si es necesario

**¿Tienes el logo listo para compartirlo o necesitas ayuda para crear uno?** 🎨
