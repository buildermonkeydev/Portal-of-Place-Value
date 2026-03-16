'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle } from 'lucide-react';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface QuestionDisplayData {
  text: string;
  section?: string;
  type: 'single_choice' | 'multiple_choice';
  options: QuestionOption[];
  marks: number;
  explanation?: string;
}

interface QuestionDisplayProps {
  question: QuestionDisplayData;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  showActions?: boolean;
}

export function QuestionDisplay({
  question,
  index,
  onEdit,
  onDelete,
  showActions = true,
}: QuestionDisplayProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {question.section && (
            <Badge variant="secondary" className="text-xs">
              {question.section}
            </Badge>
          )}
          <Badge variant="outline">{question.type}</Badge>
          <Badge variant="outline">{question.marks} marks</Badge>
        </div>
        {showActions && (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="font-medium whitespace-pre-wrap">{question.text}</p>

      <div className="space-y-1">
        {question.options.map((option, optIndex) => (
          <div
            key={optIndex}
            className={`flex items-center space-x-2 text-sm ${
              option.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'
            }`}
          >
            <CheckCircle
              className={`h-4 w-4 ${
                option.isCorrect ? 'text-green-600' : 'text-gray-400'
              }`}
            />
            <span>{option.text}</span>
          </div>
        ))}
      </div>

      {question.explanation && (
        <div className="text-sm text-gray-600">
          <strong>Explanation:</strong>{' '}
          <span className="whitespace-pre-wrap">{question.explanation}</span>
        </div>
      )}
    </div>
  );
}
