

import React from 'react';
import { TestDetailsPage } from '@/components/admin/TestDetailsPage';

interface TestDetailsPageRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestDetailsPageRoute({
  params,
}: TestDetailsPageRouteProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6">
      <TestDetailsPage testId={id} />
    </div>
  );
}
