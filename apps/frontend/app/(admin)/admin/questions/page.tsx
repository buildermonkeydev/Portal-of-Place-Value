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
  Sun,
  Cloud,
  BarChart,
  FileText,
  Plus
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

export default function AdminQuestionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [questionType, setQuestionType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch questions with filters
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
    if (
      confirm(
        'Are you sure you want to delete this question? This action cannot be undone.'
      )
    ) {
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
    // Invalidate queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const handleFilterChange = () => {
    // Invalidate queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const questions = questionsData?.data || [];
  const totalQuestions = questionsData?.pagination?.total || 0;

  // Stats calculations
  const activeQuestions = questions.filter(q => q.isActive).length;
  const singleChoiceQuestions = questions.filter(q => q.type === QuestionType.SINGLE_CHOICE).length;
  const multipleChoiceQuestions = questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length;

  if (error) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-8 text-center max-w-md">
              <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-600 mb-4 font-medium">Error loading questions</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium"
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
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
          {/* Decorative Elements */}
          <div className="fixed top-20 right-10 opacity-10 pointer-events-none">
            <Sun className="h-40 w-40 text-orange-300" />
          </div>
          <div className="fixed bottom-20 left-10 opacity-10 pointer-events-none">
            <Cloud className="h-40 w-40 text-sky-300" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-sky-500" />
                  <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                    Question Bank
                  </span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Question Management
                </span>
              </h1>
              
              <p className="mt-2 text-gray-500 text-lg">
                Manage and organize all MCQ questions in the system
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Questions</p>
                    <p className="text-3xl font-bold text-gray-900">{totalQuestions}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-100">
                  <span className="text-xs text-sky-600 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                    In the question bank
                  </span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Active Questions</p>
                    <p className="text-3xl font-bold text-gray-900">{activeQuestions}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-100">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-green-400"></span>
                    Currently available
                  </span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Single Choice</p>
                    <p className="text-3xl font-bold text-gray-900">{singleChoiceQuestions}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-100">
                  <span className="text-xs text-orange-600 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                    One correct answer
                  </span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Multiple Choice</p>
                    <p className="text-3xl font-bold text-gray-900">{multipleChoiceQuestions}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-100">
                  <span className="text-xs text-purple-600 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-purple-400"></span>
                    Multiple correct answers
                  </span>
                </div>
              </div>
            </div>

            {/* Search and Filters Card */}
            <Card className="border-sky-100 shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-medium text-gray-700">Search & Filters</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                    <Input
                      placeholder="Search questions by text..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm"
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
                      <SelectTrigger className="w-[180px] border-sky-200 focus:border-sky-400 rounded-xl">
                        <SelectValue placeholder="Question Type" />
                      </SelectTrigger>
                      <SelectContent>
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
                      <SelectTrigger className="w-[140px] border-sky-200 focus:border-sky-400 rounded-xl">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-100">
                    <HelpCircle className="h-4 w-4 text-sky-500" />
                    <span className="text-sm font-medium text-gray-700">{totalQuestions}</span>
                    <span className="text-xs text-gray-500">questions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Table Card */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-sky-500" />
                      Question List
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Manage and edit questions in the system
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsEditModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="relative inline-flex mb-4">
                        <div className="h-12 w-12 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
                        <HelpCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-sky-300" />
                      </div>
                      <p className="text-sm text-gray-500">Loading questions...</p>
                    </div>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="h-10 w-10 text-sky-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">No questions found</p>
                    <p className="text-sm text-gray-400 mb-4">
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
                        className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-sky-50/30 to-orange-50/30">
                          <TableHead className="text-sky-700 font-semibold">Question</TableHead>
                          <TableHead className="text-sky-700 font-semibold">Type</TableHead>
                          <TableHead className="text-sky-700 font-semibold">Marks</TableHead>
                          <TableHead className="text-sky-700 font-semibold">Options</TableHead>
                          <TableHead className="text-sky-700 font-semibold">Status</TableHead>
                          <TableHead className="text-sky-700 font-semibold">Created By</TableHead>
                          <TableHead className="text-sky-700 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((question) => (
                          <TableRow 
                            key={question._id} 
                            className="hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors"
                          >
                            <TableCell className="max-w-xs">
                              <div className="truncate font-medium text-gray-700" title={question.text}>
                                {question.text}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  question.type === QuestionType.SINGLE_CHOICE
                                    ? 'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200'
                                }
                                variant="outline"
                              >
                                {question.type === QuestionType.SINGLE_CHOICE
                                  ? 'Single Choice'
                                  : 'Multiple Choice'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-gray-700">{question.marks}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">{question.options.length}</span>
                                <span className="text-xs text-gray-400">options</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleToggleStatus(question._id)}
                                className="focus:outline-none"
                              >
                                <Badge
                                  variant={question.isActive ? 'default' : 'outline'}
                                  className={
                                    question.isActive
                                      ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 cursor-pointer hover:from-green-200 hover:to-green-100'
                                      : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 border-gray-200 cursor-pointer hover:from-gray-200 hover:to-gray-100'
                                  }
                                >
                                  {question.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {typeof question.createdBy === 'object' && question.createdBy !== null
                                  ? `${(question.createdBy as any).firstName} ${(question.createdBy as any).lastName}`
                                  : question.createdBy || 'Unknown'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(question)}
                                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(question._id)}
                                  disabled={deleteQuestion.isPending}
                                  className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                <span className="text-xs text-gray-400">Question Bank v1.0</span>
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
              </div>
              <span className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}