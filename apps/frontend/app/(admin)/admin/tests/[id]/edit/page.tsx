

import React from 'react';
import { EditTestPage } from '@/components/admin/EditTestPage';

interface EditTestPageRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTestPageRoute({
  params,
}: EditTestPageRouteProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6">
      <EditTestPage testId={id} />
    </div>
  );
}
