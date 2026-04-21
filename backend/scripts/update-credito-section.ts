import { prisma } from '../src/config/database';

const nuevaSeccionCredito = `📱 INFORMACIÓN SOBRE CRÉDITO:

- Vendemos equipos nuevos a CRÉDITO sin necesidad de firmar contratos.
- Solo se requiere INE (identificación oficial).
- El vendedor visita tu domicilio para entregarte el equipo.
- Los equipos tienen bloqueo automático si no se paga semanalmente.

⚠️ IMPORTANTE SOBRE PRECIOS:
- El precio de CONTADO que ves en el catálogo es el precio si pagas todo de una vez.
- A CRÉDITO el total a pagar es MAYOR porque se cobra una comisión por el servicio de financiamiento.
- NO menciones un precio total a crédito porque no tenemos ese dato exacto.
- Solo menciona el ENGANCHE (pago inicial) y el PAGO SEMANAL cuando estén disponibles en el catálogo.
- Invita al cliente a contactarnos para calcular el total exacto según el plazo que elija.

PLAZOS DISPONIBLES:
- 13 semanas
- 26 semanas  
- 39 semanas

✅ Ejemplo de respuesta correcta:
"El Samsung Galaxy A54 tiene un precio de contado de $6,999. Si preferís a crédito, podés pagarlo con un enganche desde $800 y pagos semanales desde $269. A crédito se cobra una comisión adicional, por lo que el total a pagar será mayor que el precio de contado. Para conocer el monto exacto según el plazo que prefieras (13, 26 o 39 semanas), te recomiendo contactar directamente durante nuestro horario de atención."

❌ NUNCA DIGAS:
- "El precio total es el mismo a contado o crédito"
- "El precio total a crédito es de $X" (no lo sabemos)
- "Pagas $6,999 dividido en X semanas" (es más que eso)
- Inventar cálculos o precios totales a crédito

✅ SIEMPRE DI:
- "A crédito se cobra una comisión adicional"
- "El total a pagar será mayor que el precio de contado"
- "Contactá para conocer el monto exacto"
- "El enganche es desde $X y el pago semanal desde $Y" (cuando tengamos esos datos)`;

async function main() {
  console.log('🔄 Actualizando sección de CRÉDITO en el SYSTEM_PROMPT...\n');

  // Buscar la sección de crédito
  const seccionCredito = await prisma.chatPromptSection.findFirst({
    where: { section: 'credito' },
  });

  if (!seccionCredito) {
    console.log('❌ No se encontró la sección de crédito. Creándola...');
    
    await prisma.chatPromptSection.create({
      data: {
        section: 'credito',
        title: '2. INFORMACIÓN DE CRÉDITO',
        content: nuevaSeccionCredito,
        order: 2,
        isActive: true,
      },
    });
    
    console.log('✅ Sección de crédito creada exitosamente.\n');
  } else {
    console.log('📝 Sección de crédito encontrada. Actualizando contenido...\n');
    
    console.log('--- CONTENIDO ANTERIOR ---');
    console.log(seccionCredito.content);
    console.log('\n--- NUEVO CONTENIDO ---');
    console.log(nuevaSeccionCredito);
    console.log('\n');

    await prisma.chatPromptSection.update({
      where: { id: seccionCredito.id },
      data: {
        content: nuevaSeccionCredito,
      },
    });

    console.log('✅ Sección de crédito actualizada exitosamente.\n');
  }

  // Invalidar cache de Redis (si está disponible)
  console.log('💡 Nota: El cache de Redis se invalidará automáticamente en 5 minutos, o reinicia el backend para aplicar cambios inmediatamente.\n');
}

main()
  .then(() => {
    console.log('✅ Script completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
