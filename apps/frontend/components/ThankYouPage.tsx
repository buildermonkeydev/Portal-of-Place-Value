'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Clock } from 'lucide-react';

interface ThankYouPageProps {
  googleFormUrl?: string;
  assessmentTitle?: string;
  onRedirect?: () => void;
}

export function ThankYouPage({
  googleFormUrl,
  assessmentTitle = 'Assessment',
  onRedirect,
}: ThankYouPageProps) {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!googleFormUrl) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          // Redirect to Google Form
          window.open(googleFormUrl, '_blank');
          if (onRedirect) {
            onRedirect();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [googleFormUrl, onRedirect]);

  const handleManualRedirect = () => {
    if (googleFormUrl) {
      window.open(googleFormUrl, '_blank');
      if (onRedirect) {
        onRedirect();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Thank You!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You have successfully completed the{' '}
            <strong>{assessmentTitle}</strong>.
          </p>

          {googleFormUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Please take a moment to provide your feedback:
              </p>

              {countdown > 0 && !isRedirecting ? (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Redirecting to feedback form in {countdown} second
                    {countdown !== 1 ? 's' : ''}...
                  </span>
                </div>
              ) : isRedirecting ? (
                <div className="text-green-600 text-sm">
                  Redirecting to feedback form...
                </div>
              ) : null}

              <Button
                onClick={handleManualRedirect}
                className="w-full"
                disabled={isRedirecting}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {isRedirecting
                  ? 'Opening Feedback Form...'
                  : 'Open Feedback Form'}
              </Button>

              <p className="text-xs text-gray-400">
                The feedback form will open in a new tab
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600">
                Your assessment has been submitted successfully.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can now close this window.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
