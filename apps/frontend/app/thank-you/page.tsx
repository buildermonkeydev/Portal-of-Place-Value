'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function ThankYouPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToDashboard = () => {
    setIsRedirecting(true);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Thank You!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-lg text-gray-700">
                    Thank you for taking the assessment!
                  </p>
                  <p className="text-gray-600">
                    Your responses have been successfully submitted and
                    recorded.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>What happens next?</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left list-disc list-inside">
                      <li>Your assessment results will be reviewed</li>
                      <li>
                        You can view your results in the dashboard once they are
                        available
                      </li>
                      <li>Check your email for any updates or notifications</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  {countdown > 0 && !isRedirecting ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-blue-600">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="text-lg font-medium">
                          Redirecting to dashboard in {countdown} second
                          {countdown !== 1 ? 's' : ''}...
                        </span>
                      </div>
                      <Button
                        onClick={handleGoToDashboard}
                        className="w-full sm:w-auto"
                        variant="outline"
                      >
                        Go to Dashboard Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-lg font-medium">
                        Redirecting...
                      </span>
                    </div>
                  )}
                </div>

                {/* Logo Footer */}
                <div className="pt-6 border-t flex justify-center">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/logo.png"
                      alt="Behave Like Compiler Logo"
                      width={120}
                      height={60}
                      className="object-contain opacity-60"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
