'use client';

import { Badge } from '@/components/ui/badge';

interface QuestionData {
  section?: string;
  marks: number;
}

interface SectionSummaryProps {
  questions: QuestionData[];
  title?: string;
}

export function SectionSummary({
  questions,
  title = 'Questions by Section',
}: SectionSummaryProps) {
  const questionsBySection = questions.reduce((acc, question) => {
    const section = question.section || 'Uncategorized';
    if (!acc[section]) {
      acc[section] = { count: 0, marks: 0 };
    }
    acc[section].count += 1;
    acc[section].marks += question.marks || 0;
    return acc;
  }, {} as Record<string, { count: number; marks: number }>);

  const sections = Object.entries(questionsBySection).sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  if (sections.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map(([section, stats]) => (
          <div key={section} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {section === 'Uncategorized' ? 'General Questions' : section}
              </span>
              <Badge variant="outline" className="text-xs">
                {stats.count} q
              </Badge>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {stats.marks} marks
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
