'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Cloud, FileText , XCircle} from 'lucide-react';
import { useAssessmentCreation } from './hooks/useAssessmentCreation';
import {
  BasicInformationForm,
  SectionManagement,
  QuestionsManagement,
  CodingQuestionsManagement,
  AssessmentSummary,
  UserAssignmentForm,
  FormActions,
} from './components';

export default function CreateAssessmentPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const {
    form,
    questionArray,
    users,
    isAddingQuestion,
    setIsAddingQuestion,
    editingQuestionIndex,
    setEditingQuestionIndex,
    sections,
    setSections,
    newQuestion,
    setNewQuestion,
    editingQuestion,
    setEditingQuestion,
    totalMarksError,
    calculateTotalMarks,
    remainingMarks,
    createButtonErrors,
    createAssessmentMutation,
    handleCreateAssessment,
    addNewQuestion,
    startEditingQuestion,
    saveEditedQuestion,
    cancelEditingQuestion,
    removeQuestion,
    colleges,
  } = useAssessmentCreation();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-red-100 p-8 text-center max-w-md">
          <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-10 pointer-events-none">
        <Sun className="h-40 w-40 text-orange-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-10 pointer-events-none">
        <Cloud className="h-40 w-40 text-sky-300" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                Assessment Builder
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Create Assessment
                </span>
              </h1>
              <p className="mt-1 text-gray-500">
                Create a new assessment with questions and assign it to users
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400"></div>
              <span className="text-xs text-gray-500">Step 1: Basic Info</span>
            </div>
            <div className="h-0.5 w-12 bg-gradient-to-r from-sky-300 to-orange-300"></div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400"></div>
              <span className="text-xs text-gray-500">Step 2: Questions</span>
            </div>
            <div className="h-0.5 w-12 bg-gradient-to-r from-sky-300 to-orange-300"></div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400"></div>
              <span className="text-xs text-gray-500">Step 3: Assignment</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(handleCreateAssessment)}
          className="space-y-6"
        >
          {/* Basic Information Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-orange-50/50">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                Basic Information
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-5">
                Enter the core details of your assessment
              </p>
            </div>
            <div className="p-6">
              <BasicInformationForm form={form} />
            </div>
          </div>

          {/* Section Management Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-orange-50/50">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                Section Management
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-5">
                Organize questions into sections
              </p>
            </div>
            <div className="p-6">
              <SectionManagement
                sections={sections}
                onSectionsChange={setSections}
                questionsUsingSections={form.watch('questionsToCreate') || []}
              />
            </div>
          </div>

          {/* Questions Management Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-orange-50/50">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                MCQ Questions
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-5">
                Add multiple choice questions to your assessment
              </p>
            </div>
            <div className="p-6">
              <QuestionsManagement
                form={form}
                questionArray={questionArray}
                sections={sections}
                isAddingQuestion={isAddingQuestion}
                setIsAddingQuestion={setIsAddingQuestion}
                newQuestion={newQuestion}
                setNewQuestion={setNewQuestion}
                editingQuestionIndex={editingQuestionIndex}
                setEditingQuestionIndex={setEditingQuestionIndex}
                editingQuestion={editingQuestion}
                setEditingQuestion={setEditingQuestion}
                totalMarksError={totalMarksError}
                calculateTotalMarks={calculateTotalMarks}
                remainingMarks={remainingMarks}
                onAddQuestion={addNewQuestion}
                onSaveEditedQuestion={saveEditedQuestion}
                onCancelEditingQuestion={cancelEditingQuestion}
                onStartEditingQuestion={startEditingQuestion}
                onRemoveQuestion={removeQuestion}
              />
            </div>
          </div>

          {/* Coding Questions Management Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-orange-50/50">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                Coding Questions
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-5">
                Add programming questions to your assessment
              </p>
            </div>
            <div className="p-6">
              <CodingQuestionsManagement form={form} sections={sections} />
            </div>
          </div>

          {/* Assessment Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-orange-50/50">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                Assessment Summary
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-5">
                Review your assessment details
              </p>
            </div>
            <div className="p-6">
              <AssessmentSummary
                form={form}
                totalMarks={calculateTotalMarks()}
                totalMarksError={totalMarksError}
              />
            </div>
          </div>

          {/* User Assignment Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-orange-50/50">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                User Assignment
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-5">
                Assign this assessment to users
              </p>
            </div>
            <div className="p-6">
              <UserAssignmentForm form={form} users={users} colleges={colleges} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-sm p-6">
            <FormActions
              isPending={createAssessmentMutation.isPending}
              errors={createButtonErrors}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Assessment Builder v1.0</span>
            <span className="h-1 w-1 rounded-full bg-orange-300"></span>
          </div>
          <span className="text-xs text-gray-400">
            Draft saved automatically
          </span>
        </div>
      </div>
    </div>
  );
}