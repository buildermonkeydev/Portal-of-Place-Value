import { CodingTestInterface } from '@/components/CodingTestInterface';

interface TestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestPage({ params }: TestPageProps) {
  const { id } = await params;

  return (
    <div className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] h-[calc(100vh-3rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
      <CodingTestInterface testId={id} />
    </div>
  );
}
