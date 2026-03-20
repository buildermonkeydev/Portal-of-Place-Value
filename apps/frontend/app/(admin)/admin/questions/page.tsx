'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { QuestionEditModal } from '@/components/admin/QuestionEditModal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart,
  FileText,
  Plus,
  Sparkles,
  BookOpen,
  Layers,
  Zap,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/Loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useQuestions,
  useDeleteQuestion,
  useToggleQuestionStatus,
} from '@/lib/hooks/useQuestions';
import { Question, QuestionType } from '@/lib/types';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function AdminQuestionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [questionType, setQuestionType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: questionsData,
    isLoading,
    error,
  } = useQuestions({
    search: searchTerm || undefined,
    type: questionType !== 'all' ? (questionType as QuestionType) : undefined,
    isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
  });

  const deleteQuestion = useDeleteQuestion();
  const toggleStatus = useToggleQuestionStatus();

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await deleteQuestion.mutateAsync(questionId);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const handleToggleStatus = async (questionId: string) => {
    try {
      await toggleStatus.mutateAsync(questionId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const handleFilterChange = () => {
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const questions = questionsData?.data || [];
  const totalQuestions = questionsData?.pagination?.total || 0;

  const activeQuestions = questions.filter(q => q.isActive).length;
  const singleChoiceQuestions = questions.filter(q => q.type === QuestionType.SINGLE_CHOICE).length;
  const multipleChoiceQuestions = questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length;

  if (error) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-400 mb-4 font-medium">Error loading questions</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl"
              >
                Retry
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
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

          <div className="relative z-10 h-full w-full overflow-y-auto custom-scrollbar">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {/* Header */}
              <div className="mb-8 lg:mb-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                          Question Bank
                        </span>
                      </div>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Question Management
                    </h1>
                    <p className="mt-2 text-zinc-400 text-sm lg:text-base">
                      Manage and organize all MCQ questions in the system
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsEditModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-5 py-2.5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Question
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <HelpCircle className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{totalQuestions}</p>
                  <p className="text-xs text-zinc-500 mt-1">in question bank</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{activeQuestions}</p>
                  <p className="text-xs text-zinc-500 mt-1">currently available</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <BarChart className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Single Choice</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{singleChoiceQuestions}</p>
                  <p className="text-xs text-zinc-500 mt-1">one correct answer</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Multiple Choice</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{multipleChoiceQuestions}</p>
                  <p className="text-xs text-zinc-500 mt-1">multiple correct answers</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-medium text-white">Search & Filters</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        placeholder="Search questions by text..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Select
                        value={questionType}
                        onValueChange={(value) => {
                          setQuestionType(value);
                          handleFilterChange();
                        }}
                      >
                        <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white rounded-xl">
                          <SelectValue placeholder="Question Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value={QuestionType.SINGLE_CHOICE}>
                            Single Choice
                          </SelectItem>
                          <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                            Multiple Choice
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          handleFilterChange();
                        }}
                      >
                        <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white rounded-xl">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <HelpCircle className="h-4 w-4 text-indigo-400" />
                      <span className="text-sm font-medium text-white">{totalQuestions}</span>
                      <span className="text-xs text-zinc-500">questions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions Table */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Question List</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 ml-6">
                    Manage and edit questions in the system
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">Loading questions...</p>
                      </div>
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <HelpCircle className="h-6 w-6 text-zinc-500" />
                      </div>
                      <p className="text-zinc-400 font-medium mb-2">No questions found</p>
                      <p className="text-sm text-zinc-500 mb-4">
                        {searchTerm || questionType !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Get started by creating your first question'}
                      </p>
                      {(searchTerm || questionType !== 'all' || statusFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('');
                            setQuestionType('all');
                            setStatusFilter('all');
                          }}
                          className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Question</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Marks</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Options</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Created By</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {questions.map((question) => (
                          <tr key={question._id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4">
                              <div className="max-w-md">
                                <p className="text-sm text-white line-clamp-2" title={question.text}>
                                  {question.text}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <Badge className={cn(
                                "border",
                                question.type === QuestionType.SINGLE_CHOICE
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              )}>
                                {question.type === QuestionType.SINGLE_CHOICE
                                  ? 'Single Choice'
                                  : 'Multiple Choice'}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm text-white font-medium">{question.marks}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-zinc-300">{question.options.length}</span>
                                <span className="text-xs text-zinc-500">options</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => handleToggleStatus(question._id)}
                                className="focus:outline-none"
                              >
                                <Badge
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    question.isActive
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                                  )}
                                >
                                  {question.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm text-zinc-400">
                                {typeof question.createdBy === 'object' && question.createdBy !== null
                                  ? `${(question.createdBy as any).firstName} ${(question.createdBy as any).lastName}`
                                  : question.createdBy || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(question)}
                                  className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors"
                                  title="Edit question"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(question._id)}
                                  disabled={deleteQuestion.isPending}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                  title="Delete question"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  <span className="text-xs text-zinc-500">Question Bank v1.0</span>
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                </div>
                <span className="text-xs text-zinc-500">
                  Last updated: {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <QuestionEditModal
          question={editingQuestion}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingQuestion(null);
          }}
        />

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
      </DashboardLayout>
    </ProtectedRoute>
  );
}