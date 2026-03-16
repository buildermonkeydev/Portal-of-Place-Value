'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface EditableQuestion {
  _id: string;
  text: string;
  section?: string;
  type: 'single_choice' | 'multiple_choice';
  marks: number;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
}

interface QuestionFormProps {
  question: EditableQuestion;
  onQuestionChange: (question: EditableQuestion) => void;
  onSave: () => void;
  onCancel: () => void;
  sections: string[];
  isEditing?: boolean;
  isSubmitting?: boolean;
}

export function QuestionForm({
  question,
  onQuestionChange,
  onSave,
  onCancel,
  sections,
  isEditing = false,
  isSubmitting = false,
}: QuestionFormProps) {
  const [localQuestion, setLocalQuestion] =
    useState<EditableQuestion>(question);

  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const updateLocalQuestion = (field: keyof EditableQuestion, value: any) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onQuestionChange(updated);
  };

  const updateOption = (
    index: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    // For multiple choice questions, prevent unchecking the last correct option
    if (field === 'isCorrect' && value === false) {
      const correctOptions = localQuestion.options.filter(
        (opt) => opt.isCorrect
      );
      if (
        correctOptions.length === 1 &&
        localQuestion.options[index].isCorrect
      ) {
        toast.error('At least one option must be marked as correct');
        return;
      }
    }

    const newOptions = [...localQuestion.options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // Handle correct option logic
    if (field === 'isCorrect') {
      if (localQuestion.type === 'single_choice') {
        // For single choice, ensure only one option is correct
        // Always allow changing the correct answer
        newOptions.forEach((opt, i) => {
          opt.isCorrect = i === index;
        });
      } else if (localQuestion.type === 'multiple_choice') {
        // For multiple choice, the value is already set correctly above
        // No additional logic needed
      }
    }

    updateLocalQuestion('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [
      ...localQuestion.options,
      { text: '', isCorrect: false },
    ];
    updateLocalQuestion('options', newOptions);
  };

  const removeOption = (index: number) => {
    if (localQuestion.options.length > 2) {
      const newOptions = localQuestion.options.filter((_, i) => i !== index);
      // Ensure at least one option remains correct
      if (!newOptions.some((opt) => opt.isCorrect)) {
        newOptions[0].isCorrect = true;
      }
      updateLocalQuestion('options', newOptions);
    }
  };

  const handleTypeChange = (type: 'single_choice' | 'multiple_choice') => {
    // When changing question type, reset all options to false first
    const newOptions = localQuestion.options.map((opt) => ({
      ...opt,
      isCorrect: false,
    }));

    // Then handle the specific type logic
    if (type === 'single_choice') {
      // For single choice, set the first option as correct
      newOptions[0].isCorrect = true;
    } else if (type === 'multiple_choice') {
      // For multiple choice, set the first option as correct
      newOptions[0].isCorrect = true;
    }

    // Update options first, then type
    updateLocalQuestion('options', newOptions);
    updateLocalQuestion('type', type);
  };

  const isValid = () => {
    return (
      localQuestion.text.trim().length >= 10 &&
      localQuestion.section &&
      localQuestion.options.every((opt) => opt.text.trim()) &&
      localQuestion.options.some((opt) => opt.isCorrect) &&
      localQuestion.marks > 0 &&
      localQuestion.marks <= 100
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h4 className="font-medium">
            {isEditing ? 'Editing Question' : 'New Question'}
          </h4>
          <Badge variant="outline" className="text-xs">
            {localQuestion.marks} marks
          </Badge>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label>Question Text *</Label>
          <Textarea
            placeholder="Enter your question..."
            value={localQuestion.text}
            onChange={(e) => updateLocalQuestion('text', e.target.value)}
            rows={3}
            className={
              localQuestion.text.length > 0 && localQuestion.text.length < 10
                ? 'border-red-500'
                : ''
            }
          />
          {localQuestion.text.length > 0 && localQuestion.text.length < 10 && (
            <p className="text-sm text-red-500">
              Question text must be at least 10 characters
            </p>
          )}
        </div>

        {/* Section */}
        <div className="space-y-2">
          <Label>Section *</Label>
          <Select
            value={localQuestion.section || ''}
            onValueChange={(value) => updateLocalQuestion('section', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose a section to organize this question
          </p>
        </div>

        {/* Question Type and Marks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Question Type *</Label>
            <Select value={localQuestion.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_choice">Single Choice</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Note: Single choice questions can have only one correct option.
              Multiple choice questions can have multiple correct options.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Marks *</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={localQuestion.marks}
                onChange={(e) => {
                  const marks = parseInt(e.target.value) || 1;
                  const updatedMarks = Math.min(marks, 100);
                  updateLocalQuestion('marks', updatedMarks);
                }}
                className={localQuestion.marks > 100 ? 'border-red-500' : ''}
              />
              <span className="text-sm text-gray-500">(Max: 100)</span>
            </div>
            {localQuestion.marks > 100 && (
              <p className="text-sm text-red-500">Marks cannot exceed 100</p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <Label>Options *</Label>
          <div className="space-y-2">
            {localQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  className={option.text.length === 0 ? 'border-red-500' : ''}
                />
                <input
                  type={
                    localQuestion.type === 'single_choice'
                      ? 'radio'
                      : 'checkbox'
                  }
                  name={
                    localQuestion.type === 'single_choice'
                      ? 'correctOption'
                      : `correctOption${index}`
                  }
                  checked={option.isCorrect}
                  onChange={(e) => {
                    if (localQuestion.type === 'single_choice') {
                      // For radio buttons, always pass true since clicking a radio button means selecting it
                      updateOption(index, 'isCorrect', true);
                    } else {
                      // For checkboxes, use the checked value
                      updateOption(index, 'isCorrect', e.target.checked);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={localQuestion.options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
          {!localQuestion.options.some((opt) => opt.isCorrect) && (
            <p className="text-sm text-red-500">
              At least one option must be marked as correct
            </p>
          )}
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Label>Explanation (Optional)</Label>
          <Textarea
            placeholder="Explain the correct answer..."
            value={localQuestion.explanation}
            onChange={(e) => updateLocalQuestion('explanation', e.target.value)}
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!isValid() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Add Question'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
