import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { institucional } from '../../data';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// ════════════════════════════════════════════════════════════════════════════
// HERO CAROUSEL - 3 slides como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const HeroCarousel = () => {
  return (
    <div className="relative">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="hero-carousel"
      >
        {institucional.heroSlides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-[500px] md:h-[600px] bg-gradient-to-br from-primary-600 to-secondary-600">
              {/* Background overlay */}
              <div className="absolute inset-0 bg-black/30"></div>

              {/* Content */}
              <div className="relative h-full flex items-center justify-center px-4">
                <div className="max-w-4xl mx-auto text-center text-white">
                  
                  {/* Badge (solo en slide de Amigo Paguitos) */}
                  {slide.badge && (
                    <div className="mb-4">
                      <span className="inline-block bg-accent-500 text-secondary-700 font-bold px-4 py-2 rounded-full text-sm">
                        {slide.badge}
                      </span>
                    </div>
                  )}

                  {/* Logo ACXOCEL (solo en slide institucional) */}
                  {slide.tipo === 'institucional' && (
                    <div className="mb-6">
                      <div className="text-6xl md:text-7xl font-extrabold tracking-tight">
                        ACXOCEL
                      </div>
                      <div className="text-sm md:text-base text-blue-200 mt-2 tracking-wide">
                        Distribuidor Autorizado Telcel Región 8
                      </div>
                    </div>
                  )}

                  {/* Título */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
                    {slide.titulo}
                  </h1>

                  {/* Subtítulo */}
                  <p className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                    {slide.subtitulo}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    {slide.ctas.map((cta, idx) => (
                      <Link
                        key={idx}
                        to={cta.url}
                        className={`
                          px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105
                          ${idx === 0
                            ? 'bg-white text-primary-600 hover:bg-gray-100 shadow-lg'
                            : 'bg-white/20 backdrop-blur text-white hover:bg-white/30 border-2 border-white'
                          }
                        `}
                      >
                        {cta.texto}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badge flotante "Red 5G" (solo en slide de 5G) */}
              {slide.tipo === '5g' && (
                <div className="absolute bottom-8 right-8 bg-white text-primary-600 font-bold px-4 py-2 rounded-full shadow-lg">
                  Red 5G
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom CSS para navigation y pagination */}
      <style>{`
        .hero-carousel .swiper-button-next,
        .hero-carousel .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.3);
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }

        .hero-carousel .swiper-button-next:after,
        .hero-carousel .swiper-button-prev:after {
          font-size: 20px;
        }

        .hero-carousel .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
          width: 12px;
          height: 12px;
        }

        .hero-carousel .swiper-pagination-bullet-active {
          opacity: 1;
          background: white;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;
