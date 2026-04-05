import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    categoria: 'Crédito y pagos',
    items: [
      {
        pregunta: '¿Necesito historial crediticio o consulta al buró?',
        respuesta: 'No. En Amigo Paguitos Telcel no consultamos el buró de crédito ni solicitamos aval. Solo necesitas una identificación oficial vigente y tu CURP para tramitar tu crédito.',
      },
      {
        pregunta: '¿Cuánto es el enganche?',
        respuesta: 'El enganche varía según el equipo que elijas. El vendedor te informará el monto exacto en la visita. En muchos modelos manejamos enganches accesibles o incluso sin enganche en promociones especiales.',
      },
      {
        pregunta: '¿Cada cuándo se realizan los pagos?',
        respuesta: 'Los pagos son semanales. El vendedor te indica el día de pago fijo al momento de firmar tu contrato. Esto te ayuda a planear mejor tu presupuesto.',
      },
      {
        pregunta: '¿Qué pasa si no puedo pagar una semana?',
        respuesta: 'Entendemos que pueden surgir imprevistos. Te recomendamos contactar a tu vendedor con anticipación para buscar una solución. La comunicación siempre es la mejor opción.',
      },
      {
        pregunta: '¿Puedo pagar al contado también?',
        respuesta: 'Sí. Puedes comprar tu celular al contado en una sola exhibición. El vendedor te lleva el equipo a tu domicilio igual que con el crédito.',
      },
    ],
  },
  {
    categoria: 'Proceso de compra',
    items: [
      {
        pregunta: '¿Qué documentos necesito para el crédito?',
        respuesta: 'Solo necesitas: identificación oficial vigente (INE o pasaporte) y tu CURP. No se requieren comprobantes de ingresos ni aval.',
      },
      {
        pregunta: '¿Cuánto tiempo tarda en llegar el vendedor?',
        respuesta: 'Tú eliges la fecha y hora de la visita al hacer tu reserva. El vendedor se presenta en el horario que acordaron. Los horarios de atención son de lunes a viernes de 9:30 a 16:30 y sábados de 9:30 a 14:30.',
      },
      {
        pregunta: '¿Me entregan el celular el mismo día de la visita?',
        respuesta: 'Sí. Si el equipo está disponible en inventario y se concreta la venta, el vendedor te lo entrega ese mismo día. No tienes que esperar envíos.',
      },
      {
        pregunta: '¿Puedo cancelar o cambiar mi reserva?',
        respuesta: 'Sí, puedes comunicarte con nosotros para reagendar o cancelar tu visita sin ningún problema. No hay penalización por cancelación.',
      },
    ],
  },
  {
    categoria: 'Productos y garantía',
    items: [
      {
        pregunta: '¿Los celulares son originales y nuevos?',
        respuesta: 'Sí. Todos los equipos que vendemos son 100% originales, nuevos y con garantía Telcel incluida. No vendemos equipos reacondicionados ni de segunda mano.',
      },
      {
        pregunta: '¿Qué garantía tienen los celulares?',
        respuesta: 'Los celulares cuentan con la garantía oficial del fabricante, que varía entre 1 y 2 años según la marca. Además, al ser equipos Telcel, tienes respaldo de la red y soporte oficial.',
      },
      {
        pregunta: '¿Puedo elegir el color o versión que quiero?',
        respuesta: 'Sí, sujeto a disponibilidad de inventario. En el catálogo puedes ver los modelos disponibles. Si tienes una preferencia específica, coméntalo en tu reserva o al vendedor durante la visita.',
      },
    ],
  },
  {
    categoria: 'Zonas y cobertura',
    items: [
      {
        pregunta: '¿En qué zonas hacen entregas?',
        respuesta: 'Actualmente atendemos varias colonias y municipios de la zona. Al hacer tu reserva registramos tu ubicación para asignarte al vendedor más cercano. Si tienes dudas sobre tu zona, puedes contactarnos directamente.',
      },
      {
        pregunta: '¿Tienen costo adicional por la visita a domicilio?',
        respuesta: 'No. El servicio de visita a domicilio es completamente gratuito. El vendedor va a tu casa sin costo adicional, ya sea que concluyas la compra o no.',
      },
    ],
  },
];

const FAQItem = ({ pregunta, respuesta }: { pregunta: string; respuesta: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-[primary-500]' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{pregunta}</span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${open ? 'bg-[primary-500] text-white rotate-45' : 'bg-gray-100 text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3">{respuesta}</p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-500 to-primary-500 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="bg-accent-500 text-secondary-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 inline-block">
            Centro de ayuda
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            Preguntas frecuentes
          </h1>
          <p className="text-blue-100 text-base max-w-xl mx-auto">
            Encuentra respuesta a las dudas más comunes sobre nuestro proceso de compra, crédito y entregas a domicilio.
          </p>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-10">
          {faqs.map((grupo) => (
            <div key={grupo.categoria}>
              <h2 className="text-xs font-bold text-[primary-500] uppercase tracking-widest mb-4">
                {grupo.categoria}
              </h2>
              <div className="space-y-2">
                {grupo.items.map((item) => (
                  <FAQItem key={item.pregunta} pregunta={item.pregunta} respuesta={item.respuesta} />
                ))}
              </div>
            </div>
          ))}

          {/* ¿No encontraste tu respuesta? */}
          <div className="bg-gradient-to-br from-[secondary-500] to-[primary-500] rounded-2xl p-8 text-center text-white">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[accent-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">¿No encontraste tu respuesta?</h3>
            <p className="text-blue-200 text-sm mb-6">
              Agenda una visita sin compromiso y el vendedor resolverá todas tus dudas en persona.
            </p>
            <Link
              to="/catalogo"
              className="inline-block bg-[accent-500] text-[secondary-500] px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-400 transition-all"
            >
              Ver catálogo y reservar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
