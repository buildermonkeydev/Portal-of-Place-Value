'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, X, Loader2, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormActionsProps {
  isPending: boolean;
  errors: string[];
}

export function FormActions({ isPending, errors }: FormActionsProps) {
  const router = useRouter();

  const hasErrors = errors.length > 0;
  const isValid = !hasErrors && !isPending;

  return (
    <div className="space-y-5">
      {/* Validation Errors Display */}
      {hasErrors && (
        <Alert className="border-red-500/50 bg-red-500/10 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1">
              <AlertDescription className="text-red-400">
                <p className="text-sm font-medium text-red-400 mb-2">
                  Cannot create assessment because:
                </p>
                <ul className="space-y-1.5">
                  {errors.map((error, index) => (
                    <li key={index} className="text-xs text-red-400/80 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0"></span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Success Indicator (when valid) */}
      {!hasErrors && !isPending && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
          <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-xs text-emerald-400">
            Assessment is ready to be created
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-5 py-2.5 transition-all duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || hasErrors}
          className={cn(
            "bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-6 py-2.5 transition-all duration-200",
            (isPending || hasErrors) && "opacity-50 cursor-not-allowed hover:from-indigo-500 hover:to-orange-500"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Assessment...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Assessment
            </>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <Shield className="h-3 w-3 text-indigo-400" />
          <p className="text-xs text-zinc-500">
            All fields marked with <span className="text-indigo-400 font-medium">*</span> are required
          </p>
        </div>
      </div>
    </div>
  );
}