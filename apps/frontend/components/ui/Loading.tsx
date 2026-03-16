import { Logo } from './logo';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  message = 'Loading... Behave Like Compiler',
  size = 'md',
  fullScreen = false,
  className = '',
}: LoadingProps) {
  const sizeClasses = {
    sm: {
      logo: 'h-8 w-8',
      spinner: 'h-6 w-6',
      text: 'text-sm',
    },
    md: {
      logo: 'h-12 w-12',
      spinner: 'h-8 w-8',
      text: 'text-base',
    },
    lg: {
      logo: 'h-16 w-16',
      spinner: 'h-12 w-12',
      text: 'text-lg',
    },
  };

  const currentSize = sizeClasses[size];

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center py-10';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo size={size} showText={true} />
        </div>

        {/* Loading Spinner */}
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={`${currentSize.spinner} animate-spin text-blue-600`}
          />
          <p className={`${currentSize.text} text-gray-600 font-medium`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
