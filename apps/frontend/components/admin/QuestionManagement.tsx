'use client';

import { useState } from 'react';
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '@/lib/hooks/useQuestions';
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
import {
  Question,
  QuestionType,
  CreateQuestionData,
  UpdateQuestionData,
} from '@/lib/types';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  Trash2 as TrashIcon,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const questionSchema = z
  .object({
    text: z.string().min(1, 'Question text is required'),
    type: z.nativeEnum(QuestionType),
    options: z
      .array(
        z.object({
          text: z.string().min(1, 'Option text is required'),
          isCorrect: z.boolean(),
        })
      )
      .min(2, 'At least 2 options are required'),
    marks: z.number().min(1, 'Marks must be at least 1'),
    explanation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === QuestionType.SINGLE_CHOICE) {
        return data.options.filter((opt) => opt.isCorrect).length === 1;
      }
      if (data.type === QuestionType.MULTIPLE_CHOICE) {
        return data.options.filter((opt) => opt.isCorrect).length > 0;
      }
      return true;
    },
    {
      message:
        'Single choice questions must have exactly one correct answer. Multiple choice questions must have at least one correct answer.',
    }
  );

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionManagementProps {
  searchQuery?: string;
}

export function QuestionManagement({
  searchQuery = '',
}: QuestionManagementProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );

  const {
    data: questionsData,
    isLoading,
    error,
  } = useQuestions({
    search: searchTerm,
    limit: 50,
  });

  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: QuestionType.SINGLE_CHOICE,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      marks: 1,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'options',
  });

  const questionType = watch('type');

  const handleCreateQuestion = (data: QuestionFormData) => {
    createQuestionMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        reset();
        toast.success('Question created successfully');
      },
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question._id);
    setValue('text', question.text);
    setValue('type', question.type as QuestionType);
    setValue('marks', question.marks);
    setValue('explanation', question.explanation || '');

    // Reset options array
    remove();
    question.options.forEach((option, index) => {
      append({ text: option.text, isCorrect: option.isCorrect });
    });
  };

  const handleSaveQuestion = (questionId: string) => {
    const formData = watch();

    // Validate form data
    try {
      questionSchema.parse(formData);
    } catch (error) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    const updateData: UpdateQuestionData = {
      text: formData.text,
      type: formData.type,
      options: formData.options,
      marks: formData.marks,
      explanation: formData.explanation,
    };

    updateQuestionMutation.mutate(
      { id: questionId, data: updateData },
      {
        onSuccess: () => {
          setEditingQuestionId(null);
          reset();
          toast.success('Question updated successfully');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    reset();
  };

  const handleDeleteQuestion = () => {
    if (selectedQuestion) {
      deleteQuestionMutation.mutate(selectedQuestion._id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedQuestion(null);
          toast.success('Question deleted successfully');
        },
      });
    }
  };

  const addOption = () => {
    append({ text: '', isCorrect: false });
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  const handleOptionChange = (
    index: number,
    field: 'text' | 'isCorrect',
    value: string | boolean
  ) => {
    update(index, { ...fields[index], [field]: value });
  };

  const handleCorrectAnswerChange = (index: number) => {
    if (questionType === QuestionType.SINGLE_CHOICE) {
      // For single choice, only one option can be correct
      fields.forEach((_, i) => {
        update(i, { ...fields[i], isCorrect: i === index });
      });
    } else {
      // For multiple choice, toggle the current option
      update(index, { ...fields[index], isCorrect: !fields[index].isCorrect });
    }
  };

  const getQuestionTypeBadgeVariant = (type: QuestionType) => {
    return type === QuestionType.SINGLE_CHOICE ? 'default' : 'secondary';
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
          Failed to load questions. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const questions = questionsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {questions.length} questions
          </Badge>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Question</span>
        </Button>
      </div>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => {
                  const isEditing = editingQuestionId === question._id;

                  return (
                    <TableRow
                      key={question._id}
                      className={
                        isEditing
                          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300'
                          : ''
                      }
                    >
                      <TableCell className="max-w-md">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                Editing
                              </Badge>
                            </div>
                            <Textarea
                              placeholder="Enter your question here..."
                              {...register('text')}
                              className={errors.text ? 'border-red-500' : ''}
                              rows={3}
                            />
                            {errors.text && (
                              <p className="text-sm text-red-500">
                                {errors.text.message}
                              </p>
                            )}
                            <Textarea
                              placeholder="Explanation (optional)..."
                              {...register('explanation')}
                              rows={2}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="font-medium line-clamp-2">
                              {question.text}
                            </p>
                            {question.explanation && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={questionType}
                            onValueChange={(value) =>
                              setValue('type', value as QuestionType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={QuestionType.SINGLE_CHOICE}>
                                Single Choice
                              </SelectItem>
                              <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                                Multiple Choice
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={getQuestionTypeBadgeVariant(
                              question.type as QuestionType
                            )}
                          >
                            {question.type === QuestionType.SINGLE_CHOICE
                              ? 'Single Choice'
                              : 'Multiple Choice'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Options</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {fields.map((field, index) => (
                                <div
                                  key={field.id}
                                  className="flex items-center space-x-2"
                                >
                                  <div className="flex-1">
                                    <Input
                                      placeholder={`Option ${index + 1}`}
                                      value={field.text}
                                      onChange={(e) =>
                                        handleOptionChange(
                                          index,
                                          'text',
                                          e.target.value
                                        )
                                      }
                                      className={
                                        errors.options?.[index]?.text
                                          ? 'border-red-500'
                                          : ''
                                      }
                                      size={1}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant={
                                      field.isCorrect ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                      handleCorrectAnswerChange(index)
                                    }
                                    className="min-w-[80px] text-xs"
                                  >
                                    {field.isCorrect ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Correct
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Wrong
                                      </>
                                    )}
                                  </Button>
                                  {fields.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeOption(index)}
                                      className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {errors.options && (
                              <p className="text-sm text-red-500">
                                {errors.options.message}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {question.options.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 text-sm"
                              >
                                {option.isCorrect ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-gray-400" />
                                )}
                                <span
                                  className={
                                    option.isCorrect
                                      ? 'font-medium'
                                      : 'text-gray-600'
                                  }
                                >
                                  {option.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            {...register('marks', { valueAsNumber: true })}
                            className={errors.marks ? 'border-red-500' : ''}
                          />
                        ) : (
                          <Badge variant="outline">
                            {question.marks} mark
                            {question.marks !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={question.isActive ? 'default' : 'secondary'}
                        >
                          {question.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSaveQuestion(question._id)}
                                disabled={updateQuestionMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                {updateQuestionMutation.isPending
                                  ? 'Saving...'
                                  : 'Save'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Question Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
            <DialogDescription>
              Create a new MCQ question with options and marks.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleCreateQuestion)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Question Text</Label>
                <Textarea
                  id="text"
                  placeholder="Enter your question here..."
                  {...register('text')}
                  className={errors.text ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.text && (
                  <p className="text-sm text-red-500">{errors.text.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Question Type</Label>
                  <Select
                    value={questionType}
                    onValueChange={(value) =>
                      setValue('type', value as QuestionType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QuestionType.SINGLE_CHOICE}>
                        Single Choice
                      </SelectItem>
                      <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                        Multiple Choice
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    min="1"
                    {...register('marks', { valueAsNumber: true })}
                    className={errors.marks ? 'border-red-500' : ''}
                  />
                  {errors.marks && (
                    <p className="text-sm text-red-500">
                      {errors.marks.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  placeholder="Provide an explanation for the correct answer..."
                  {...register('explanation')}
                  rows={2}
                />
                {errors.explanation && (
                  <p className="text-sm text-red-500">
                    {errors.explanation.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
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

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={field.text}
                        onChange={(e) =>
                          handleOptionChange(index, 'text', e.target.value)
                        }
                        className={
                          errors.options?.[index]?.text ? 'border-red-500' : ''
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant={field.isCorrect ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCorrectAnswerChange(index)}
                      className="min-w-[100px]"
                    >
                      {field.isCorrect ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Incorrect
                        </>
                      )}
                    </Button>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {errors.options && (
                <p className="text-sm text-red-500">{errors.options.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createQuestionMutation.isPending}>
                {createQuestionMutation.isPending
                  ? 'Creating...'
                  : 'Create Question'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Question: <strong>{selectedQuestion?.text}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Type:{' '}
              <strong>
                {selectedQuestion?.type === QuestionType.SINGLE_CHOICE
                  ? 'Single Choice'
                  : 'Multiple Choice'}
              </strong>
            </p>
            <p className="text-sm text-gray-600">
              Marks: <strong>{selectedQuestion?.marks}</strong>
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
              onClick={handleDeleteQuestion}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending
                ? 'Deleting...'
                : 'Delete Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Question Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>
              Detailed view of the question and its options.
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Question
                </Label>
                <p className="text-lg mt-1">{selectedQuestion.text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Type
                  </Label>
                  <Badge
                    variant={getQuestionTypeBadgeVariant(
                      selectedQuestion.type as QuestionType
                    )}
                    className="mt-1"
                  >
                    {selectedQuestion.type === QuestionType.SINGLE_CHOICE
                      ? 'Single Choice'
                      : 'Multiple Choice'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Marks
                  </Label>
                  <p className="text-lg mt-1">{selectedQuestion.marks}</p>
                </div>
              </div>

              {selectedQuestion.explanation && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Explanation
                  </Label>
                  <p className="text-lg mt-1">{selectedQuestion.explanation}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Options
                </Label>
                <div className="space-y-2 mt-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      {option.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span
                        className={
                          option.isCorrect ? 'font-medium' : 'text-gray-600'
                        }
                      >
                        {option.text}
                      </span>
                    </div>
                  ))}
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
