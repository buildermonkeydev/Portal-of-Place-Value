'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Code, AlertCircle } from 'lucide-react';
import { AssessmentFormData } from '../types';
import { useState, useEffect } from 'react';
import { testAPI } from '@/lib/api/tests';
import { AssessmentType } from '@/lib/types/assessment';
import { TestStatus } from '@/lib/types/test';

interface CodingQuestionsManagementProps {
  form: UseFormReturn<AssessmentFormData>;
  sections: string[];
}

interface Test {
  _id: string;
  title: string;
  difficulty: string;
  tags: string[];
  status: string;
}

export function CodingQuestionsManagement({
  form,
  sections,
}: CodingQuestionsManagementProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [score, setScore] = useState<number>(10);

  const assessmentType = watch('type');
  const codingQuestions = watch('codingQuestions') || [];

  // Load tests when component mounts
  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await testAPI.getAllTests({
        limit: 100,
        status: TestStatus.PUBLISHED,
      });
      setTests(response.data || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCodingQuestion = () => {
    if (!selectedTest || !selectedSection || score <= 0) {
      return;
    }

    const existingQuestions = codingQuestions || [];
    const isAlreadyAdded = existingQuestions.some(
      (cq) => cq._id === selectedTest
    );

    if (isAlreadyAdded) {
      return;
    }

    const newCodingQuestion = {
      _id: selectedTest,
      section: selectedSection,
      score: score,
    };

    setValue('codingQuestions', [...existingQuestions, newCodingQuestion]);
    setSelectedTest('');
    setSelectedSection('');
    setScore(10);
  };

  const removeCodingQuestion = (index: number) => {
    const updatedQuestions = codingQuestions.filter((_, i) => i !== index);
    setValue('codingQuestions', updatedQuestions);
  };

  const getTestById = (testId: string) => {
    return tests.find((test) => test._id === testId);
  };

  // Don't render if assessment type is MCQ only
  if (assessmentType === AssessmentType.MCQ) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Coding Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Coding Question */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <Label className="font-medium">Add Coding Question</Label>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Test *</Label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test._id} value={test._id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{test.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {test.difficulty}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Score *</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                placeholder="Enter score"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={addCodingQuestion}
                disabled={!selectedTest || !selectedSection || score <= 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Coding Questions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Added Coding Questions</Label>
            <Badge variant="outline">{codingQuestions.length} questions</Badge>
          </div>

          {codingQuestions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No coding questions added yet. Add tests to include coding
                challenges in your assessment.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {codingQuestions.map((codingQuestion, index) => {
                const test = getTestById(codingQuestion._id);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Code className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {test?.title || 'Unknown Test'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">
                              {codingQuestion.section}
                            </Badge>
                            <Badge variant="outline">
                              {codingQuestion.score} points
                            </Badge>
                            {test && (
                              <Badge variant="secondary">
                                {test.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCodingQuestion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total Score Summary */}
        {codingQuestions.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">
                Total Coding Score:
              </span>
              <Badge className="bg-blue-600">
                {codingQuestions.reduce((sum, cq) => sum + cq.score, 0)} points
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
