'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';

interface FormActionsProps {
  isPending: boolean;
  errors: string[];
}

export function FormActions({ isPending, errors }: FormActionsProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Validation Errors Display */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Cannot create assessment because:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || errors.length > 0}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Creating...' : 'Create Assessment'}
        </Button>
      </div>
    </div>
  );
}
