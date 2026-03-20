'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Cloud, FileText, XCircle, Sparkles, Layers, Plus, Settings } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
      <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0C0C10] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full w-full overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          
          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                      Assessment Builder
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-4 py-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Create Assessment
                    </h1>
                    <p className="mt-1 text-zinc-400 text-sm lg:text-base">
                      Create a new assessment with questions and assign it to users
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-zinc-400">Draft saved automatically</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6 lg:mb-8 bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
                <span className="text-xs text-zinc-500">Step 1: Basic Info</span>
              </div>
              <div className="h-0.5 w-12 bg-gradient-to-r from-indigo-400 to-orange-400"></div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                <span className="text-xs text-zinc-500">Step 2: Questions</span>
              </div>
              <div className="h-0.5 w-12 bg-gradient-to-r from-indigo-400 to-orange-400"></div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
                <span className="text-xs text-zinc-500">Step 3: Assignment</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(handleCreateAssessment)}
            className="space-y-6"
          >
            {/* Basic Information Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">Basic Information</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Enter the core details of your assessment
                </p>
              </div>
              <div className="p-5">
                <BasicInformationForm form={form} />
              </div>
            </div>

            {/* Section Management Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-400" />
                  <h2 className="text-sm font-semibold text-white">Section Management</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Organize questions into sections
                </p>
              </div>
              <div className="p-5">
                <SectionManagement
                  sections={sections}
                  onSectionsChange={setSections}
                  questionsUsingSections={form.watch('questionsToCreate') || []}
                />
              </div>
            </div>

            {/* Questions Management Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">MCQ Questions</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Add multiple choice questions to your assessment
                </p>
              </div>
              <div className="p-5">
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
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-400" />
                  <h2 className="text-sm font-semibold text-white">Coding Questions</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Add programming questions to your assessment
                </p>
              </div>
              <div className="p-5">
                <CodingQuestionsManagement form={form} sections={sections} />
              </div>
            </div>

            {/* Assessment Summary Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">Assessment Summary</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Review your assessment details
                </p>
              </div>
              <div className="p-5">
                <AssessmentSummary
                  form={form}
                  totalMarks={calculateTotalMarks()}
                  totalMarksError={totalMarksError}
                />
              </div>
            </div>

            {/* User Assignment Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-400" />
                  <h2 className="text-sm font-semibold text-white">User Assignment</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Assign this assessment to users
                </p>
              </div>
              <div className="p-5">
                <UserAssignmentForm form={form} users={users} colleges={colleges} />
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <FormActions
                isPending={createAssessmentMutation.isPending}
                errors={createButtonErrors}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
              <span className="text-xs text-zinc-500">Assessment Builder v1.0</span>
              <span className="h-1 w-1 rounded-full bg-orange-400"></span>
            </div>
            <span className="text-xs text-zinc-500">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}