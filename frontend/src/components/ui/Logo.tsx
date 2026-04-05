import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
  '2xl': 'h-14'
};

// Logo SVG con isotipo + texto
export const LogoSVG = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' }) => (
  <svg 
    viewBox="0 0 220 32" 
    className={sizeClasses[size]}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Amigo Paguitos Telcel"
  >
    {/* Isotipo: círculo azul con celular simplificado */}
    <g transform="translate(2, 2)">
      <circle cx="12" cy="12" r="11" fill="#0f49bd" />
      <rect x="7.5" y="5" width="9" height="14" rx="1.5" fill="white" />
      <rect x="9" y="6.5" width="6" height="10" rx="1" fill="#0f49bd" />
      <rect x="9.5" y="16" width="5" height="1.5" rx="0.5" fill="#0f49bd" />
    </g>
    
    {/* Texto: Amigo Paguitos Telcel */}
    <text x="28" y="20" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">
      <tspan fill="#0f49bd">AMIGO</tspan>
      <tspan fill="white">PAGUITOS</tspan>
      <tspan fill="#0f49bd">TELCEL</tspan>
    </text>
  </svg>
);

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoSVG size={size} />
    </div>
  );
};

export const LogoLink = ({ className, size }: LogoProps) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <LogoSVG size={size} />
    </Link>
  );
};

export default Logo;