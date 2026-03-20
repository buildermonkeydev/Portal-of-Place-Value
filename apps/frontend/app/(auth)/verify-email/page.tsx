'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Sparkles, 
  Mail, 
  Lock, 
  Zap, 
  Shield,
  ChevronLeft 
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, isVerifying } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(
        { token },
        {
          onSuccess: () => {
            setVerificationStatus('success');
          },
          onError: (error: any) => {
            setVerificationStatus('error');
            setErrorMessage(
              error?.response?.data?.message || 'Verification failed'
            );
          },
        }
      );
    }
  }, [token, verifyEmail]);

  if (!token) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Code Snippet Decorations */}
        <div className="absolute top-[15%] right-[5%] opacity-10 hidden xl:block">
          <pre className="text-sky-400 text-xs lg:text-sm">
            {`function verify() {
  return 'authentic';
}`}
          </pre>
        </div>
        <div className="absolute bottom-[15%] left-[5%] opacity-10 hidden xl:block">
          <pre className="text-orange-400 text-xs lg:text-sm transform rotate-6">
            {`const validate = () => {
  while(!verified) { check(); }
}`}
          </pre>
        </div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
          {/* Decorative Elements */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
          
          <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
            <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
            
            <div className="p-6 lg:p-8 text-center space-y-5">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="relative w-14 h-14 lg:w-16 lg:h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl rotate-6"></div>
                  <div className="absolute inset-0 bg-slate-900 rounded-xl -rotate-3 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Place Values"
                      width={60}
                      height={60}
                      className="object-contain w-8 h-8 lg:w-10 lg:h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl lg:text-2xl font-bold">
                  <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Invalid Link
                  </span>
                </h2>
                <p className="text-xs lg:text-sm text-slate-400">
                  This verification link is invalid or has expired.
                </p>
              </div>

              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <XCircle className="h-8 w-8 lg:h-10 lg:w-10 text-red-400" />
              </div>

              <Button
                onClick={() => router.push('/login')}
                className="w-full h-10 lg:h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-xs lg:text-sm"
              >
                Go to Login
              </Button>

              {/* Trust Badge */}
              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                  <Shield className="h-3 w-3 text-orange-400" />
                  <p className="text-[10px] lg:text-xs text-slate-300">
                    <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                      Place Values
                    </span>{' '}
                    · secure verification
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Code Snippet Decorations */}
      <div className="absolute top-[15%] right-[5%] opacity-10 hidden xl:block">
        <pre className="text-sky-400 text-xs lg:text-sm">
          {`function verify() {
  return 'authentic';
}`}
        </pre>
      </div>
      <div className="absolute bottom-[15%] left-[5%] opacity-10 hidden xl:block">
        <pre className="text-orange-400 text-xs lg:text-sm transform rotate-6">
          {`const validate = () => {
  while(!verified) { check(); }
}`}
        </pre>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
        {/* Decorative Elements */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
        
        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
          <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
          
          <div className="p-6 lg:p-8 text-center space-y-5">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-14 h-14 lg:w-16 lg:h-16">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl rotate-6"></div>
                <div className="absolute inset-0 bg-slate-900 rounded-xl -rotate-3 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Place Values"
                    width={60}
                    height={60}
                    className="object-contain w-8 h-8 lg:w-10 lg:h-10"
                  />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-xl lg:text-2xl font-bold">
                <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                  Email Verification
                </span>
              </h2>
              <p className="text-xs lg:text-sm text-slate-400">
                {verificationStatus === 'idle' && 'Verifying your email...'}
                {verificationStatus === 'success' && 'Your email has been verified!'}
                {verificationStatus === 'error' && 'Verification failed'}
              </p>
            </div>

            {/* Status Content */}
            <div className="space-y-4">
              {verificationStatus === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400 blur-lg opacity-20"></div>
                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600">
                      <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-sky-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs lg:text-sm text-slate-300 font-medium">Please wait</p>
                    <p className="text-[10px] lg:text-xs text-slate-400">Verifying your email address...</p>
                  </div>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="bg-slate-700/30 rounded-xl p-5 lg:p-6 border border-slate-600/50 space-y-4">
                  <div className="mx-auto w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm lg:text-base text-green-400 font-medium">Success!</p>
                    <p className="text-[10px] lg:text-xs text-slate-300">
                      Your email has been verified successfully. You can now login to your account.
                    </p>
                  </div>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="bg-red-500/10 rounded-xl p-5 lg:p-6 border border-red-500/20 space-y-4">
                  <div className="mx-auto w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <XCircle className="h-6 w-6 lg:h-8 lg:w-8 text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm lg:text-base text-red-400 font-medium">Verification Failed</p>
                    <p className="text-[10px] lg:text-xs text-red-300/80">{errorMessage}</p>
                  </div>
                </div>
              )}

              {verificationStatus !== 'idle' && (
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full h-10 lg:h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-xs lg:text-sm"
                  >
                    Go to Login
                  </Button>
                  
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-[10px] lg:text-xs text-sky-400 hover:text-orange-400 transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Back to Login
                  </Link>
                </div>
              )}
            </div>

            {/* Trust Badge */}
            <div className="pt-2 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                <Shield className="h-3 w-3 text-orange-400" />
                <p className="text-[10px] lg:text-xs text-slate-300">
                  <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                    Place Values
                  </span>{' '}
                  · secure email verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          {/* Main Container */}
          <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
            
            <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
              <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
              
              <div className="p-8 lg:p-10 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400 blur-lg opacity-20"></div>
                  <div className="relative w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                    <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-sky-400" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm lg:text-base text-white font-medium">Loading verification page...</p>
                  <p className="text-xs lg:text-sm text-slate-400">Please wait a moment</p>
                </div>

                {/* Trust Badge */}
                <div className="mt-6 flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                    <Zap className="h-3 w-3 text-orange-400" />
                    <p className="text-[10px] lg:text-xs text-slate-300">
                      <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                        Place Values
                      </span>{' '}
                      · secure verification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}