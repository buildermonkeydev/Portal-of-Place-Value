import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  className = '',
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center justify-center  gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="Behave Like Compiler Logo"
        // width={size === 'sm' ? 100 : size === 'md' ? 100 : 100}
        // height={size === 'sm' ? 100 : size === 'md' ? 100 : 100}
        width={100}
        height={50}
        className={'w-fit'}
      />
      {/* {showText && (
        <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
          Behave Like Compiler
        </span>
      )} */}
    </div>
  );
}
