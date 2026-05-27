# Debug del Chat - Checklist

## Paso 1: Verificar Backend

Ejecutá:
```bash
cd backend
npm run dev
```

**¿Qué ves?**
- [ ] ✅ "Servidor corriendo en http://localhost:3000"
- [ ] ❌ Algún error (copiá el error completo)

---

## Paso 2: Verificar Frontend

Ejecutá (en OTRA terminal):
```bash
cd frontend
npm run dev
```

**¿Qué ves?**
- [ ] ✅ "Local: http://localhost:5173/"
- [ ] ❌ Algún error (copiá el error completo)

---

## Paso 3: Abrir navegador

Ve a: http://localhost:5173

**¿Qué ves?**
- [ ] ✅ La página principal del sitio carga correctamente
- [ ] ❌ Página en blanco o error

---

## Paso 4: Verificar botón del chat

**¿Ves un botón flotante azul en la esquina inferior derecha?**
- [ ] ✅ Sí, lo veo
- [ ] ❌ No aparece ningún botón

---

## Paso 5: Abrir el chat

Hacé click en el botón del chat.

**¿Qué pasa?**
- [ ] ✅ Se abre un panel de chat
- [ ] ❌ No pasa nada
- [ ] ❌ Error en consola (F12 → Console)

---

## Paso 6: Abrir DevTools

Presioná F12 y andá a la pestaña **Console**.

**¿Ves algún error en rojo?**
- [ ] ✅ No hay errores
- [ ] ❌ Sí, hay errores (copiá TODOS los errores que aparecen)

---

## Paso 7: Verificar Network

En DevTools, andá a la pestaña **Network**.

**Escribí un mensaje en el chat (por ejemplo: "hola")**

**¿Qué requests ves en la pestaña Network?**
- [ ] ✅ Aparece un request a `/api/chat` con status 200
- [ ] ❌ Aparece un request a `/api/chat` con status 400/500/otro (¿cuál?)
- [ ] ❌ No aparece ningún request

---

## Paso 8: Ver detalles del request

Si apareció el request a `/api/chat`, hacé click en él.

**Andá a la pestaña "Response"**

**¿Qué ves?**
- [ ] ✅ Texto que empieza con "data: " (streaming)
- [ ] ❌ JSON con un error (copiá el JSON completo)
- [ ] ❌ Nada / vacío

---

## Paso 9: Logs del backend

Volvé a la terminal donde está corriendo el backend.

**¿Ves algún log cuando enviás el mensaje?**
- [ ] ✅ Logs normales (info)
- [ ] ❌ Logs de error (copiá TODO lo que aparece en rojo)

---

## Paso 10: Verificar variables de entorno

**¿Tenés el archivo `.env` en la carpeta `backend/` con la variable GROQ_API_KEY?**

Ejecutá:
```bash
cd backend
cat .env | Select-String "GROQ_API_KEY"
```

**¿Qué ves?**
- [ ] ✅ `GROQ_API_KEY=gsk_...` (con una key que empieza con gsk_)
- [ ] ❌ No existe el archivo .env
- [ ] ❌ La variable está vacía o comentada

---

## Resumen

Una vez que completes TODOS estos pasos, decime:
1. ¿En qué paso encontraste el problema?
2. Copiá EXACTAMENTE el error o mensaje que aparece
3. Capturas de pantalla si es necesario

Con esa info voy a poder ayudarte a arreglarlo.
