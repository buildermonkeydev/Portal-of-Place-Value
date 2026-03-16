'use client';

import { useState } from 'react';
import {
  useAssessments,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment,
} from '@/lib/hooks/useAssessments';
import { useQuestions } from '@/lib/hooks/useQuestions';
import { useUsers } from '@/lib/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import {
  Assessment,
  AssessmentStatus,
  AssessmentType,
  CreateAssessmentData,
  UpdateAssessmentData,
  Question,
  User,
} from '@/lib/types';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  FileText,
  Users,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Send,
  Copy,
  Trash2 as TrashIcon,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

const assessmentSchema = z.object({
  title: z.string().min(1, 'Assessment title is required'),
  description: z.string().optional(),
  type: z.enum(['mcq', 'coding', 'mixed']),
  instruction: z.string().optional(),
  questions: z.array(z.string()).min(1, 'At least one question is required'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignedUsers: z.array(z.string()).optional(),
  colleges: z
    .array(
      z.object({
        _id: z.string(),
        branches: z
          .array(
            z.object({
              _id: z.string(),
              name: z.string(),
            })
          )
          .optional(),
        year: z.array(z.number().min(1).max(5)).optional(),
      })
    )
    .optional(),
  showResultsToUsers: z.boolean().default(false),
});

type RawAssessmentFormData = z.infer<typeof assessmentSchema>;

type AssessmentFormData = Omit<RawAssessmentFormData, 'showResultsToUsers'> & {
  showResultsToUsers?: boolean;
};

interface AssessmentManagementProps {
  searchQuery?: string;
}

export function AssessmentManagement({
  searchQuery = '',
}: AssessmentManagementProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const {
    data: assessmentsData,
    isLoading,
    error,
  } = useAssessments({
    search: searchTerm,
    limit: 50,
  });

  const { data: questionsData } = useQuestions({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const createAssessmentMutation = useCreateAssessment();
  const updateAssessmentMutation = useUpdateAssessment();
  const deleteAssessmentMutation = useDeleteAssessment();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      type: 'mcq' as AssessmentType,
      questions: [],
      assignedUsers: [],
      totalMarks: 0,
      duration: 60,
      instruction: '',
      showResultsToUsers: false,
    },
  });

  const typedControl = control as any;

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestionField,
  } = useFieldArray({
    control: typedControl,
    name: 'questions',
  });

  const {
    fields: userFields,
    append: appendUser,
    remove: removeUserField,
  } = useFieldArray({
    control: typedControl,
    name: 'assignedUsers',
  });

  const questions = questionsData?.data || [];
  const users = usersData?.data || [];

  const handleToggleResultsVisibility = (assessment: Assessment) => {
    const currentlyVisible = assessment.showResultsToUsers === true;
    const nextVisibility = !currentlyVisible;
    updateAssessmentMutation.mutate(
      {
        id: assessment._id,
        data: { showResultsToUsers: nextVisibility },
      },
      {
        onSuccess: () => {
          toast.success(
            nextVisibility
              ? 'Assessment results are now visible to users.'
              : 'Assessment results are now hidden from users.'
          );
        },
        onError: () => {
          toast.error('Failed to update results visibility');
        },
      }
    );
  };

  const handleCreateAssessment = (data: AssessmentFormData) => {
    createAssessmentMutation.mutate(
      {
        ...data,
        type: (data.type as AssessmentType) || AssessmentType.MCQ,
        assignedUsers: data.assignedUsers || [],
      },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          reset();
          toast.success('Assessment created successfully');
        },
      }
    );
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setValue('title', assessment.title);
    setValue('description', assessment.description || '');
    setValue('instruction', assessment.instruction || '');
    setValue('totalMarks', assessment.totalMarks);
    setValue('duration', assessment.duration);
    setValue('startDate', assessment.startDate || '');
    setValue('endDate', assessment.endDate || '');
    setValue('showResultsToUsers', assessment.showResultsToUsers ?? false);

    // Reset arrays
    removeQuestionField();
    removeUserField();
    assessment.questions.forEach((questionId) => appendQuestion(questionId));
    assessment.assignedUsers.forEach((userId) => appendUser(userId));

    setIsEditDialogOpen(true);
  };

  const handleUpdateAssessment = (data: AssessmentFormData) => {
    if (selectedAssessment) {
      const updateData: UpdateAssessmentData = {
        title: data.title,
        description: data.description,
        instruction: data.instruction,
        questions: data.questions,
        totalMarks: data.totalMarks,
        duration: data.duration,
        startDate: data.startDate,
        endDate: data.endDate,
        assignedUsers: data.assignedUsers,
        showResultsToUsers: data.showResultsToUsers === true,
      };

      updateAssessmentMutation.mutate(
        { id: selectedAssessment._id, data: updateData },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedAssessment(null);
            reset();
            toast.success('Assessment updated successfully');
          },
        }
      );
    }
  };

  const handleDeleteAssessment = () => {
    if (selectedAssessment) {
      deleteAssessmentMutation.mutate(selectedAssessment._id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedAssessment(null);
          toast.success('Assessment deleted successfully');
        },
      });
    }
  };

  const addQuestion = () => {
    if (questions.length > 0) {
      appendQuestion(questions[0]._id);
    }
  };

  const removeQuestionAtIndex = (index: number) => {
    removeQuestionField(index);
  };

  const addUser = () => {
    if (users.length > 0) {
      appendUser(users[0]._id);
    }
  };

  const removeUserAtIndex = (index: number) => {
    removeUserField(index);
  };

  const getStatusBadgeVariant = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.ACTIVE:
        return 'default';
      case AssessmentStatus.DRAFT:
        return 'secondary';
      case AssessmentStatus.INACTIVE:
        return 'destructive';
      case AssessmentStatus.COMPLETED:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const calculateTotalMarks = (questionIds: string[]) => {
    return questionIds.reduce((total, questionId) => {
      const question = questions.find((q) => q._id === questionId);
      return total + (question?.marks || 0);
    }, 0);
  };

  const handleQuestionChange = (index: number, questionId: string) => {
    const currentQuestions = watch('questions');
    const newQuestions = [...currentQuestions];
    newQuestions[index] = questionId;
    setValue('questions', newQuestions);

    // Auto-calculate total marks
    const totalMarks = calculateTotalMarks(newQuestions);
    setValue('totalMarks', totalMarks);
  };

  const handleSendAssessment = (assessment: Assessment) => {
    // This would integrate with your email service
    toast.success(
      `Assessment "${assessment.title}" sent to ${assessment.assignedUsers.length} users`
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load assessments. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const assessments = assessmentsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {assessments.length} assessments
        </Badge>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment._id}>
                    <TableCell className="max-w-md">
                      <div className="space-y-2">
                        <p className="font-medium">{assessment.title}</p>
                        {assessment.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {assessment.description}
                          </p>
                        )}
                        <div
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            assessment.showResultsToUsers === true
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {assessment.showResultsToUsers === true
                            ? 'Results visible to users'
                            : 'Results hidden from users'}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {assessment.startDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Start:{' '}
                              {new Date(
                                assessment.startDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {assessment.endDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              End:{' '}
                              {new Date(
                                assessment.endDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assessment.questions.length} questions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assessment.totalMarks} marks
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {assessment.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(assessment.status)}>
                        {assessment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <Badge variant="outline">
                          {assessment.assignedUsers.length} users
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAssessment(assessment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendAssessment(assessment)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleResultsVisibility(assessment)
                          }
                          className={
                            assessment.showResultsToUsers === true
                              ? 'text-emerald-600 hover:text-emerald-700'
                              : 'text-slate-500 hover:text-slate-700'
                          }
                          title={
                            assessment.showResultsToUsers === true
                              ? 'Hide results from users'
                              : 'Show results to users'
                          }
                        >
                          {assessment.showResultsToUsers === true ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/admin/assessments/results/${assessment._id}`,
                              '_blank'
                            )
                          }
                          className="text-green-500 hover:text-green-700"
                          title="View Results"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-700"
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
        </CardContent>
      </Card>

      {/* Create Assessment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
            <DialogDescription>
              Create a new assessment with questions and assign it to users.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleCreateAssessment)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assessment Title</Label>
                <Input
                  id="title"
                  placeholder="Enter assessment title..."
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  {...register('duration', { valueAsNumber: true })}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">
                    {errors.duration.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Assessment Type</Label>
              <Select
                value={watch('type') || 'mcq'}
                onValueChange={(value) =>
                  setValue('type', value as AssessmentType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">
                    MCQ Only - Multiple Choice Questions
                  </SelectItem>
                  <SelectItem value="coding">
                    Coding Only - Programming Tests
                  </SelectItem>
                  <SelectItem value="mixed">
                    Mixed - MCQ + Coding Questions
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter assessment description..."
                {...register('description')}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="pr-4">
                <Label className="text-sm font-semibold text-gray-900">
                  Show results to participants after submission
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Toggle whether learners can view their scores once they finish
                  this assessment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {watch('showResultsToUsers') === true ? 'Visible' : 'Hidden'}
                </span>
                <Switch
                  checked={watch('showResultsToUsers') === true}
                  onCheckedChange={(checked) =>
                    setValue('showResultsToUsers', checked, {
                      shouldDirty: true,
                    })
                  }
                  aria-label="Toggle result visibility"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instruction">Instructions (Optional)</Label>
              <Textarea
                id="instruction"
                placeholder="Enter assessment instructions for students..."
                {...register('instruction')}
                rows={4}
              />
              {errors.instruction && (
                <p className="text-sm text-red-500">
                  {errors.instruction.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-3">
                {questionFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Select
                        value={watch(`questions.${index}`)}
                        onValueChange={(value) =>
                          handleQuestionChange(index, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a question" />
                        </SelectTrigger>
                        <SelectContent>
                          {questions.map((question) => (
                            <SelectItem key={question._id} value={question._id}>
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">
                                  {question.text}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {question.marks} marks
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestionAtIndex(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {errors.questions && (
                <p className="text-sm text-red-500">
                  {errors.questions.message}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <Label>Total Marks:</Label>
                <Badge variant="outline">{watch('totalMarks')} marks</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Assigned Users</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUser}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              <div className="space-y-3">
                {userFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Select
                        value={watch(`assignedUsers.${index}`)}
                        onValueChange={(value) => {
                          const currentUsers = watch('assignedUsers') || [];
                          const newUsers = [...currentUsers];
                          newUsers[index] = value;
                          setValue('assignedUsers', newUsers);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUserAtIndex(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {errors.assignedUsers && (
                <p className="text-sm text-red-500">
                  {errors.assignedUsers.message}
                </p>
              )}
            </div>

            {/* <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendEmails"
                  {...register('sendEmails')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="sendEmails">
                  Send email invitations to assigned users
                </Label>
              </div>
            </div> */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAssessmentMutation.isPending}
              >
                {createAssessmentMutation.isPending
                  ? 'Creating...'
                  : 'Create Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Assessment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
            <DialogDescription>
              Update the assessment information, questions, and assigned users.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleUpdateAssessment)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Assessment Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter assessment title..."
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  {...register('duration', { valueAsNumber: true })}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">
                    {errors.duration.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter assessment description..."
                {...register('description')}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="pr-4">
                <Label className="text-sm font-semibold text-gray-900">
                  Show results to participants after submission
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Toggle whether learners can view their scores once they finish
                  this assessment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {watch('showResultsToUsers') === true ? 'Visible' : 'Hidden'}
                </span>
                <Switch
                  checked={watch('showResultsToUsers') === true}
                  onCheckedChange={(checked) =>
                    setValue('showResultsToUsers', checked, {
                      shouldDirty: true,
                    })
                  }
                  aria-label="Toggle result visibility"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instruction">Instructions (Optional)</Label>
              <Textarea
                id="edit-instruction"
                placeholder="Enter assessment instructions for students..."
                {...register('instruction')}
                rows={4}
              />
              {errors.instruction && (
                <p className="text-sm text-red-500">
                  {errors.instruction.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date (Optional)</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-3">
                {questionFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Select
                        value={watch(`questions.${index}`)}
                        onValueChange={(value) =>
                          handleQuestionChange(index, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a question" />
                        </SelectTrigger>
                        <SelectContent>
                          {questions.map((question) => (
                            <SelectItem key={question._id} value={question._id}>
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">
                                  {question.text}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {question.marks} marks
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestionAtIndex(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {errors.questions && (
                <p className="text-sm text-red-500">
                  {errors.questions.message}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <Label>Total Marks:</Label>
                <Badge variant="outline">{watch('totalMarks')} marks</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Assigned Users</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUser}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              <div className="space-y-3">
                {userFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Select
                        value={watch(`assignedUsers.${index}`)}
                        onValueChange={(value) => {
                          const currentUsers = watch('assignedUsers') || [];
                          const newUsers = [...currentUsers];
                          newUsers[index] = value;
                          setValue('assignedUsers', newUsers);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUserAtIndex(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {errors.assignedUsers && (
                <p className="text-sm text-red-500">
                  {errors.assignedUsers.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateAssessmentMutation.isPending}
              >
                {updateAssessmentMutation.isPending
                  ? 'Updating...'
                  : 'Update Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Assessment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Assessment: <strong>{selectedAssessment?.title}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Questions: <strong>{selectedAssessment?.questions.length}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Assigned Users:{' '}
              <strong>{selectedAssessment?.assignedUsers.length}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAssessment}
              disabled={deleteAssessmentMutation.isPending}
            >
              {deleteAssessmentMutation.isPending
                ? 'Deleting...'
                : 'Delete Assessment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Assessment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
            <DialogDescription>
              Detailed view of the assessment, questions, and assigned users.
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Title
                    </Label>
                    <p className="text-lg font-medium">
                      {selectedAssessment.title}
                    </p>
                  </div>
                  {selectedAssessment.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Description
                      </Label>
                      <p className="text-lg">
                        {selectedAssessment.description}
                      </p>
                    </div>
                  )}
                  {selectedAssessment.instruction && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Instructions
                      </Label>
                      <p className="text-lg">
                        {selectedAssessment.instruction}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge
                      variant={getStatusBadgeVariant(selectedAssessment.status)}
                      className="mt-1"
                    >
                      {selectedAssessment.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Total Marks
                    </Label>
                    <p className="text-lg">{selectedAssessment.totalMarks}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Duration
                    </Label>
                    <p className="text-lg">
                      {selectedAssessment.duration} minutes
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Questions
                    </Label>
                    <p className="text-lg">
                      {selectedAssessment.questions.length}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedAssessment.startDate || selectedAssessment.endDate) && (
                <div className="grid grid-cols-2 gap-6">
                  {selectedAssessment.startDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Start Date
                      </Label>
                      <p className="text-lg">
                        {new Date(
                          selectedAssessment.startDate
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {selectedAssessment.endDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        End Date
                      </Label>
                      <p className="text-lg">
                        {new Date(
                          selectedAssessment.endDate
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Questions
                </Label>
                <div className="space-y-2 mt-2">
                  {selectedAssessment.questions.map((questionId, index) => {
                    const question = questions.find(
                      (q) => q._id === questionId
                    );
                    return question ? (
                      <div
                        key={questionId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{question.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{question.type}</Badge>
                            <Badge variant="outline">
                              {question.marks} marks
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Assigned Users
                </Label>
                <div className="space-y-2 mt-2">
                  {selectedAssessment.assignedUsers.map((userId) => {
                    const user = users.find((u) => u._id === userId);
                    return user ? (
                      <div
                        key={userId}
                        className="flex items-center space-x-3 p-3 border rounded-lg"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
