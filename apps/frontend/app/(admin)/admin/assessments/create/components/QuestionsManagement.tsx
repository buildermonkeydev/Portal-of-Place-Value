'use client';

import { useState } from 'react';
import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AssessmentFormData, User, QuestionFormData } from '../types';
import { AssessmentType } from '@/lib/types/assessment';
import { QuestionForm } from './QuestionForm';
import { QuestionDisplay } from './QuestionDisplay';

interface QuestionsManagementProps {
  form: UseFormReturn<AssessmentFormData>;
  questionArray: UseFieldArrayReturn<
    AssessmentFormData,
    'questionsToCreate',
    'id'
  >;
  sections: string[];
  isAddingQuestion: boolean;
  setIsAddingQuestion: (value: boolean) => void;
  newQuestion: QuestionFormData;
  setNewQuestion: (question: QuestionFormData) => void;
  editingQuestionIndex: number | null;
  setEditingQuestionIndex: (index: number | null) => void;
  editingQuestion: QuestionFormData;
  setEditingQuestion: (question: QuestionFormData) => void;
  totalMarksError: string | null;
  calculateTotalMarks: () => number;
  remainingMarks: number;
  onAddQuestion: () => void;
  onSaveEditedQuestion: () => void;
  onCancelEditingQuestion: () => void;
  onStartEditingQuestion: (index: number) => void;
  onRemoveQuestion: (index: number) => void;
}

export function QuestionsManagement({
  form,
  questionArray,
  sections,
  isAddingQuestion,
  setIsAddingQuestion,
  newQuestion,
  setNewQuestion,
  editingQuestionIndex,
  setEditingQuestionIndex,
  editingQuestion,
  setEditingQuestion,
  totalMarksError,
  calculateTotalMarks,
  remainingMarks,
  onAddQuestion,
  onSaveEditedQuestion,
  onCancelEditingQuestion,
  onStartEditingQuestion,
  onRemoveQuestion,
}: QuestionsManagementProps) {
  const { watch } = form;
  const watchedQuestionsToCreate = watch('questionsToCreate') || [];
  const assessmentType = watch('type');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [addingToSection, setAddingToSection] = useState<string | null>(null);

  // Group questions by section
  const questionsBySection = sections.reduce((acc, section) => {
    acc[section] = watchedQuestionsToCreate.filter(
      (q) => q.section === section
    );
    return acc;
  }, {} as Record<string, QuestionFormData[]>);

  // Questions without section
  const questionsWithoutSection = watchedQuestionsToCreate.filter(
    (q) => !q.section
  );

  const handleAddQuestionToSection = (section: string) => {
    setNewQuestion({
      ...newQuestion,
      section: section,
    });
    setAddingToSection(section);
    setIsAddingQuestion(true);
  };

  const toggleSectionCollapse = (section: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const collapseAllSections = () => {
    setCollapsedSections(new Set(sections));
  };

  const expandAllSections = () => {
    setCollapsedSections(new Set());
  };

  // Don't render if assessment type is CODING only
  if (assessmentType === AssessmentType.CODING) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Questions
          <div className="flex items-center space-x-2">
            {sections.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={collapseAllSections}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Collapse All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={expandAllSections}
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Expand All
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (sections.length > 0) {
                  setNewQuestion({
                    ...newQuestion,
                    section: sections[0],
                  });
                  setAddingToSection(sections[0]);
                  setIsAddingQuestion(true);
                }
              }}
              disabled={totalMarksError !== null || sections.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Question
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {sections.length === 0
            ? 'Create sections first to add questions'
            : 'Questions organized by sections'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Marks Validation Error */}
        {totalMarksError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{totalMarksError}</AlertDescription>
          </Alert>
        )}

        {/* Questions by Section */}
        {sections.length > 0 && (
          <div className="space-y-6">
            {sections.map((section) => {
              const sectionQuestions = questionsBySection[section] || [];
              const sectionMarks = sectionQuestions.reduce(
                (sum, q) => sum + (q.marks || 0),
                0
              );

              return (
                <div key={section} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSectionCollapse(section)}
                        className="p-1"
                      >
                        {collapsedSections.has(section) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                      <h3 className="text-lg font-semibold">{section}</h3>
                      <Badge variant="outline" className="text-xs">
                        {sectionQuestions.length} questions • {sectionMarks}{' '}
                        marks
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestionToSection(section)}
                      disabled={totalMarksError !== null}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {!collapsedSections.has(section) && (
                    <>
                      {/* Add Question Form for this section */}
                      {isAddingQuestion && addingToSection === section && (
                        <QuestionForm
                          question={newQuestion}
                          onQuestionChange={setNewQuestion}
                          onSave={onAddQuestion}
                          onCancel={() => {
                            setIsAddingQuestion(false);
                            setAddingToSection(null);
                          }}
                          sections={sections}
                          remainingMarks={remainingMarks}
                        />
                      )}

                      {sectionQuestions.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No questions in this section yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sectionQuestions.map((question, index) => {
                            const questionIndex =
                              watchedQuestionsToCreate.findIndex(
                                (q) => q === question
                              );
                            const isEditing =
                              editingQuestionIndex === questionIndex;

                            if (isEditing) {
                              return (
                                <QuestionForm
                                  key={`edit-${questionIndex}`}
                                  question={editingQuestion}
                                  onQuestionChange={setEditingQuestion}
                                  onSave={onSaveEditedQuestion}
                                  onCancel={onCancelEditingQuestion}
                                  sections={sections}
                                  remainingMarks={
                                    remainingMarks + (question?.marks || 0)
                                  }
                                  isEditing={true}
                                />
                              );
                            }

                            return (
                              <QuestionDisplay
                                key={`display-${questionIndex}`}
                                question={question}
                                index={questionIndex}
                                onEdit={() =>
                                  onStartEditingQuestion(questionIndex)
                                }
                                onDelete={() => onRemoveQuestion(questionIndex)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Questions without section */}
        {questionsWithoutSection.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSectionCollapse('unassigned')}
                  className="p-1"
                >
                  {collapsedSections.has('unassigned') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
                <h3 className="text-lg font-semibold text-amber-600">
                  Unassigned Questions
                </h3>
                <Badge variant="outline" className="text-xs">
                  {questionsWithoutSection.length} questions •{' '}
                  {questionsWithoutSection.reduce(
                    (sum, q) => sum + (q.marks || 0),
                    0
                  )}{' '}
                  marks
                </Badge>
              </div>
            </div>

            {!collapsedSections.has('unassigned') && (
              <div className="space-y-3">
                {questionsWithoutSection.map((question, index) => {
                  const questionIndex = watchedQuestionsToCreate.findIndex(
                    (q) => q === question
                  );
                  const isEditing = editingQuestionIndex === questionIndex;

                  if (isEditing) {
                    return (
                      <QuestionForm
                        key={`edit-${questionIndex}`}
                        question={editingQuestion}
                        onQuestionChange={setEditingQuestion}
                        onSave={onSaveEditedQuestion}
                        onCancel={onCancelEditingQuestion}
                        sections={sections}
                        remainingMarks={remainingMarks + (question?.marks || 0)}
                        isEditing={true}
                      />
                    );
                  }

                  return (
                    <QuestionDisplay
                      key={`display-${questionIndex}`}
                      question={question}
                      index={questionIndex}
                      onEdit={() => onStartEditingQuestion(questionIndex)}
                      onDelete={() => onRemoveQuestion(questionIndex)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No questions message */}
        {questionArray.fields.length === 0 && sections.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>
              No questions added yet. Click "Add Question" in any section to get
              started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
