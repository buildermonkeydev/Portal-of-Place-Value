'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AssessmentResultsTable } from '@/components/admin/AssessmentResultsTable';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Assessment } from '@/lib/types';
import { assessmentAPI } from '@/lib/api/assessments';
import { Loading } from '@/components/ui/Loading';

const AssessmentResultsPage = () => {
  const params = useParams();
  const assessmentId = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await assessmentAPI.getAssessmentById(assessmentId);
        setAssessment(response);
      } catch (error) {
        console.error('Error fetching assessment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Loading
            message="Loading results... "
            size="md"
            fullScreen={true}
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <div>
      <div className="container mx-auto py-6">
        <AssessmentResultsTable
          assessmentId={assessmentId}
          assessmentTitle={assessment?.title}
        />
      </div>
    </div>
  );
};

export default AssessmentResultsPage;
