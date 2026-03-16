'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/useAuth';
import { CheckCircle, XCircle, Loader2, Sparkles, Mail, Lock } from 'lucide-react';
import Image from 'next/image';

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
      <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
        {/* Decorative Elements */}
        <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
          <Sparkles className="h-40 w-40 text-sky-300" />
        </div>
        <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
          <Lock className="h-40 w-40 text-orange-300" />
        </div>

        <div className="w-full max-w-md mx-auto my-8 px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
            <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
            
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <Image
                    src="/logo.png"
                    alt="Place Values"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-red-600">
                  Invalid Link
                </h2>
                <p className="text-gray-500 text-sm">
                  This verification link is invalid or has expired.
                </p>
              </div>

              <Button
                onClick={() => router.push('/login')}
                className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium"
              >
                Go to Login
              </Button>

              <p className="text-xs text-gray-400 pt-2">
                <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                  Place Values
                </span>{' '}
                · secure verification
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
        <Sparkles className="h-40 w-40 text-sky-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
        <Lock className="h-40 w-40 text-orange-300" />
      </div>

      <div className="w-full max-w-md mx-auto my-8 px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
          <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
          
          <div className="p-8 text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <Image
                  src="/logo.png"
                  alt="Place Values"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                  Email Verification
                </span>
              </h2>
              <p className="text-gray-500 text-sm">
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
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Please wait while we verify your email...</p>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="bg-gradient-to-br from-sky-50 to-orange-50 rounded-xl p-6 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-green-700 font-medium">Success!</p>
                    <p className="text-sm text-gray-600">
                      Your email has been verified successfully. You can now login to your account.
                    </p>
                  </div>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="bg-red-50 rounded-xl p-6 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-red-700 font-medium">Verification Failed</p>
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                </div>
              )}

              {verificationStatus !== 'idle' && (
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium"
                >
                  Go to Login
                </Button>
              )}
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-400 pt-2">
              <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                Place Values
              </span>{' '}
              · secure email verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
          <div className="w-full max-w-md mx-auto my-8 px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
              <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
              <div className="p-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400 blur-lg opacity-20"></div>
                  <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">Loading verification page...</p>
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