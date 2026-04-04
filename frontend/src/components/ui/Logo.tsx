import { Link } from 'react-router-dom';
import { logoConfig } from '../../config/branding';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon-only';
  textColor?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32'
};

export const Logo = ({ className = '', size = 'md', variant = 'full', textColor = 'text-gray-900' }: LogoProps) => {
  const { mainLogo, brandName } = logoConfig;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={mainLogo} 
        alt={brandName} 
        className={`${sizeClasses[size]} object-contain`} 
      />
      
      {variant === 'full' && (
        <span className={`font-bold ${textColor} whitespace-nowrap`}>
          {brandName}
        </span>
      )}
    </div>
  );
};

export const LogoLink = ({ className, size, variant, textColor = 'text-gray-900' }: LogoProps) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} variant={variant} textColor={textColor} />
    </Link>
  );
};

export default Logo;
