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
import { 
  Plus, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  HelpCircle,
  FileQuestion,
  MinusCircle,
  CheckCircle2
} from 'lucide-react';
import { AssessmentFormData, User, QuestionFormData } from '../types';
import { AssessmentType } from '@/lib/types/assessment';
import { QuestionForm } from './QuestionForm';
import { QuestionDisplay } from './QuestionDisplay';
import { cn } from '@/lib/utils';

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

  const totalQuestions = watchedQuestionsToCreate.length;
  const totalMarks = calculateTotalMarks();

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">MCQ Questions</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1 ml-6">
              Add multiple choice questions to your assessment
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Stats Badges */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                {totalQuestions} Questions
              </Badge>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                {totalMarks} Marks
              </Badge>
              {remainingMarks > 0 && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {remainingMarks} Remaining
                </Badge>
              )}
            </div>
            
            {sections.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={collapseAllSections}
                  className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Collapse All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={expandAllSections}
                  className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Expand All
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Total Marks Validation Error */}
        {totalMarksError && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-sm text-red-400">
              {totalMarksError}
            </AlertDescription>
          </Alert>
        )}

        {/* No Sections Warning */}
        {sections.length === 0 && (
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Layers className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">No sections created yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Create sections first to add questions
            </p>
          </div>
        )}

        {/* Questions by Section */}
        {sections.length > 0 && (
          <div className="space-y-4">
            {sections.map((section) => {
              const sectionQuestions = questionsBySection[section] || [];
              const sectionMarks = sectionQuestions.reduce(
                (sum, q) => sum + (q.marks || 0),
                0
              );
              const isCollapsed = collapsedSections.has(section);
              const isAddingToThisSection = isAddingQuestion && addingToSection === section;

              return (
                <div
                  key={section}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSectionCollapse(section)}
                          className="p-1 text-zinc-500 hover:text-white transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-400" />
                          <h3 className="text-sm font-semibold text-white">{section}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                            {sectionQuestions.length} Q
                          </Badge>
                          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-xs">
                            {sectionMarks} marks
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddQuestionToSection(section)}
                        disabled={totalMarksError !== null}
                        className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Question
                      </Button>
                    </div>
                  </div>

                  {/* Section Content */}
                  {!isCollapsed && (
                    <div className="p-4 space-y-3">
                      {/* Add Question Form for this section */}
                      {isAddingToThisSection && (
                        <div className="mb-4">
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
                        </div>
                      )}

                      {sectionQuestions.length === 0 && !isAddingToThisSection ? (
                        <div className="text-center py-8">
                          <div className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <HelpCircle className="h-5 w-5 text-zinc-500" />
                          </div>
                          <p className="text-xs text-zinc-500">No questions in this section yet</p>
                          <p className="text-xs text-zinc-600 mt-1">
                            Click "Add Question" to get started
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sectionQuestions.map((question, idx) => {
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Questions without section */}
        {questionsWithoutSection.length > 0 && (
          <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 overflow-hidden">
            <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('unassigned')}
                    className="p-1 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {collapsedSections.has('unassigned') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-amber-400">Unassigned Questions</h3>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                    {questionsWithoutSection.length} Q
                  </Badge>
                </div>
              </div>
            </div>

            {!collapsedSections.has('unassigned') && (
              <div className="p-4 space-y-3">
                {questionsWithoutSection.map((question, idx) => {
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
        {questionArray.fields.length === 0 && sections.length > 0 && !isAddingQuestion && (
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileQuestion className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">No questions added yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Click "Add Question" in any section to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}