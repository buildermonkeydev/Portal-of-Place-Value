'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Edit,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { QuestionForm } from './QuestionForm';
import { debounce } from '@/lib/utils';
import { assessmentAPI } from '@/lib/api';
import { AssessmentType } from '@/lib/types/assessment';

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

interface EditQuestionsManagementProps {
  assessmentId: string;
  editableQuestions: EditableQuestion[];
  setEditableQuestions: (questions: EditableQuestion[]) => void;
  sections: string[];
  isEditingQuestions: boolean;
  setIsEditingQuestions: (value: boolean) => void;
  editingQuestionIndex: number | null;
  setEditingQuestionIndex: (index: number | null) => void;
  questionSaveStatus: {
    [key: string]: 'saved' | 'saving' | 'error' | 'pending';
  };
  assessmentType: AssessmentType;

  onAddNewQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  onQuestionChange: (
    index: number,
    field: keyof EditableQuestion,
    value: any
  ) => void;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    field: 'text' | 'isCorrect',
    value: any
  ) => void;
  onAddOption: (questionIndex: number) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;

  onUpdateQuestion: (question: EditableQuestion) => Promise<void>;
}

export function EditQuestionsManagement({
  assessmentId,
  editableQuestions,
  setEditableQuestions,
  sections,
  isEditingQuestions,
  setIsEditingQuestions,
  editingQuestionIndex,
  setEditingQuestionIndex,
  questionSaveStatus,
  assessmentType,

  onAddNewQuestion,
  onRemoveQuestion,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,

  onUpdateQuestion,
}: EditQuestionsManagementProps) {
  // Always call hooks consistently
  const [localQuestion, setLocalQuestion] = useState<EditableQuestion | null>(
    null
  );
  const [localEditingIndex, setLocalEditingIndex] = useState<number | null>(
    null
  );
  const [isAddingNewQuestion, setIsAddingNewQuestion] = useState(false);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);

  const {
    updateQuestion: updateQuestionInAssessment,
    createQuestionInAssessment,
  } = assessmentAPI;

  const [newQuestion, setNewQuestion] = useState<EditableQuestion>({
    _id: `temp_${Date.now()}`,
    text: '',
    section: sections.length > 0 ? sections[0] : '',
    type: 'single_choice',
    marks: 1,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ],
    explanation: '',
  });
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Group questions by section
  const questionsBySection = sections.reduce((acc, section) => {
    acc[section] = editableQuestions.filter((q) => q.section === section);
    return acc;
  }, {} as Record<string, EditableQuestion[]>);

  // Questions without section
  const questionsWithoutSection = editableQuestions.filter((q) => !q.section);

  const handleAddQuestionToSection = (section: string) => {
    setNewQuestion({
      _id: `temp_${Date.now()}`,
      text: '',
      section: section,
      type: 'single_choice',
      marks: 1,
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
      explanation: '',
    });
    setAddingToSection(section);
    setIsAddingNewQuestion(true);
  };

  const startEditingQuestion = (index: number) => {
    setLocalEditingIndex(index);
    setLocalQuestion({ ...editableQuestions[index] });
  };

  const saveEditedQuestion = () => {
    if (localQuestion && localEditingIndex !== null) {
      console.log('localQuestion', localQuestion);

      const newQuestions = [...editableQuestions];
      newQuestions[localEditingIndex] = localQuestion;
      setEditableQuestions(newQuestions);
      setLocalEditingIndex(null);
      setLocalQuestion(null);
      updateQuestionInAssessment(localQuestion._id, localQuestion);
    }
  };

  const cancelEditingQuestion = () => {
    setLocalEditingIndex(null);
    setLocalQuestion(null);
  };

  const handleLocalQuestionChange = (
    field: keyof EditableQuestion,
    value: any
  ) => {
    if (localQuestion) {
      const updatedQuestion = { ...localQuestion, [field]: value };

      // Handle question type change specifically
      if (field === 'type') {
        // When changing question type, reset all options to false first
        updatedQuestion.options = updatedQuestion.options.map((opt) => ({
          ...opt,
          isCorrect: false,
        }));

        // Then handle the specific type logic
        if (value === 'single_choice') {
          // For single choice, set the first option as correct
          updatedQuestion.options[0].isCorrect = true;
        } else if (value === 'multiple_choice') {
          // For multiple choice, set the first option as correct
          updatedQuestion.options[0].isCorrect = true;
        }
      }

      setLocalQuestion(updatedQuestion);
    }
  };

  const handleLocalOptionChange = (
    optionIndex: number,
    field: 'text' | 'isCorrect',
    value: any
  ) => {
    if (localQuestion) {
      // For multiple choice questions, prevent unchecking the last correct option
      if (field === 'isCorrect' && value === false) {
        const correctOptions = localQuestion.options.filter(
          (opt) => opt.isCorrect
        );
        if (
          correctOptions.length === 1 &&
          localQuestion.options[optionIndex].isCorrect
        ) {
          toast.error('At least one option must be marked as correct');
          return;
        }
      }

      const newOptions = [...localQuestion.options];
      if (field === 'isCorrect') {
        if (localQuestion.type === 'single_choice') {
          // For single choice, ensure only one option is correct
          // Always allow changing the correct answer
          newOptions.forEach((opt, i) => {
            opt.isCorrect = i === optionIndex;
          });
        } else if (localQuestion.type === 'multiple_choice') {
          // For multiple choice, directly set the value (true/false)
          newOptions[optionIndex] = {
            ...newOptions[optionIndex],
            isCorrect: value,
          };
        }
      } else {
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          [field]: value,
        };
      }

      const updatedQuestion = { ...localQuestion, options: newOptions };
      setLocalQuestion(updatedQuestion);
    }
  };

  const addLocalOption = () => {
    if (localQuestion) {
      setLocalQuestion({
        ...localQuestion,
        options: [...localQuestion.options, { text: '', isCorrect: false }],
      });
    }
  };

  const removeLocalOption = (optionIndex: number) => {
    if (localQuestion && localQuestion.options.length > 2) {
      const newOptions = localQuestion.options.filter(
        (_, i) => i !== optionIndex
      );
      // Ensure at least one option remains correct
      if (!newOptions.some((opt) => opt.isCorrect)) {
        newOptions[0].isCorrect = true;
      }
      setLocalQuestion({ ...localQuestion, options: newOptions });
    }
  };

  const handleNewQuestionChange = (question: EditableQuestion) => {
    setNewQuestion(question);
  };

  const handleAddNewQuestion = async () => {
    if (
      newQuestion.text.trim() &&
      newQuestion.section &&
      newQuestion.options.length >= 2
    ) {
      // Add the question locally without calling the API
      const questionToAdd = {
        ...newQuestion,
        _id: `temp_${Date.now()}`,
      };

      // Add to local questions state
      const res = await createQuestionInAssessment(assessmentId, questionToAdd);
      console.log('responseQuestionCrated', res);
      if (res._id) {
        setEditableQuestions([...editableQuestions, res._id]);
      }

      // Reset the form
      setIsAddingNewQuestion(false);
      setAddingToSection(null);
      setNewQuestion({
        _id: `temp_${Date.now()}`,
        text: '',
        section: sections.length > 0 ? sections[0] : '',
        type: 'single_choice',
        marks: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
        explanation: '',
      });

      toast.success('Question added successfully');
    }
  };

  const handleCancelNewQuestion = () => {
    setIsAddingNewQuestion(false);
    setAddingToSection(null);
    // Reset new question form
    setNewQuestion({
      _id: `temp_${Date.now()}`,
      text: '',
      section: sections.length > 0 ? sections[0] : '',
      type: 'single_choice',
      marks: 1,
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
      explanation: '',
    });
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

  // Debounced function to automatically update questions
  const debouncedUpdateQuestion = useCallback(
    async (question: EditableQuestion) => {
      if (question._id && !question._id.startsWith('temp_')) {
        try {
          await onUpdateQuestion(question);
        } catch (error) {
          console.error('Error auto-updating question:', error);
          // Don't show error toast for auto-updates to avoid spam
        }
      }
    },
    [onUpdateQuestion]
  );

  // Create debounced version outside of useCallback to avoid dependency issues
  const debouncedUpdateQuestionWithDelay = debounce(
    debouncedUpdateQuestion,
    1000
  );

  // Auto-update question when it changes
  useEffect(() => {
    if (editableQuestions.length > 0) {
      editableQuestions.forEach((question) => {
        if (
          question._id &&
          !question._id.startsWith('temp_') &&
          questionSaveStatus[question._id] === 'pending'
        ) {
          debouncedUpdateQuestionWithDelay(question);
        }
      });
    }
  }, [editableQuestions, questionSaveStatus, debouncedUpdateQuestionWithDelay]);

  // Conditional rendering - always return JSX, never early return after hooks
  return (
    <>
      {assessmentType !== AssessmentType.CODING && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Questions ({editableQuestions.length || 0})
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  Total Marks:{' '}
                  {editableQuestions.reduce((sum, q) => sum + q.marks, 0)}
                </Badge>
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
                  variant={isEditingQuestions ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditingQuestions(!isEditingQuestions)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingQuestions ? 'Done Editing' : 'Edit Questions'}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Manage assessment questions. Questions are automatically saved as
              you type (when auto-save is enabled).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingQuestions && (
              <div className="flex justify-between items-center">
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
                      setIsAddingNewQuestion(true);
                    }
                  }}
                  disabled={sections.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Question
                </Button>
                {sections.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Create sections first to add questions
                  </p>
                )}
              </div>
            )}

            {/* Questions by Section */}
            {sections.length > 0 && (
              <div className="space-y-6">
                {sections.map((section) => {
                  const sectionQuestions = questionsBySection[section] || [];
                  const sectionMarks = sectionQuestions.reduce(
                    (sum, q) => sum + q.marks || 0,
                    0
                  );

                  return (
                    <div
                      key={section}
                      className="border rounded-lg p-4 space-y-4"
                    >
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
                          disabled={!isEditingQuestions}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </div>

                      {!collapsedSections.has(section) && (
                        <>
                          {/* Add Question Form for this section */}
                          {isAddingNewQuestion &&
                            addingToSection === section && (
                              <QuestionForm
                                question={newQuestion}
                                onQuestionChange={handleNewQuestionChange}
                                onSave={handleAddNewQuestion}
                                onCancel={handleCancelNewQuestion}
                                sections={sections}
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
                                  editableQuestions.findIndex(
                                    (q) => q === question
                                  );
                                const isEditing =
                                  localEditingIndex === questionIndex;

                                if (isEditing && localQuestion) {
                                  return (
                                    <div
                                      key={`edit-${questionIndex}`}
                                      className="border rounded-lg p-4 space-y-4 bg-gray-50"
                                    >
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium">
                                          Editing Question....
                                        </h4>
                                        <div className="flex space-x-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={saveEditedQuestion}
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelEditingQuestion}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Question Text */}
                                      <div className="space-y-2">
                                        <Label>Question Text *</Label>
                                        <textarea
                                          className="w-full p-2 border rounded-md"
                                          placeholder="Enter your question..."
                                          value={localQuestion.text}
                                          onChange={(e) =>
                                            handleLocalQuestionChange(
                                              'text',
                                              e.target.value
                                            )
                                          }
                                          rows={3}
                                        />
                                      </div>

                                      {/* Section */}
                                      <div className="space-y-2">
                                        <Label>Section *</Label>
                                        <select
                                          className="w-full p-2 border rounded-md"
                                          value={localQuestion.section || ''}
                                          onChange={(e) =>
                                            handleLocalQuestionChange(
                                              'section',
                                              e.target.value
                                            )
                                          }
                                        >
                                          {sections.map((s) => (
                                            <option key={s} value={s}>
                                              {s}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Question Type and Marks */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Question Type *</Label>
                                          <select
                                            className="w-full p-2 border rounded-md"
                                            value={localQuestion.type}
                                            onChange={(e) =>
                                              handleLocalQuestionChange(
                                                'type',
                                                e.target.value
                                              )
                                            }
                                          >
                                            <option value="single_choice">
                                              Single Choice
                                            </option>
                                            <option value="multiple_choice">
                                              Multiple Choice
                                            </option>
                                          </select>
                                        </div>

                                        <div className="space-y-2">
                                          <label>Marks *</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="w-full p-2 border rounded-md"
                                            value={localQuestion.marks}
                                            onChange={(e) =>
                                              handleLocalQuestionChange(
                                                'marks',
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                          />
                                        </div>
                                      </div>

                                      {/* Options */}
                                      <div className="space-y-2">
                                        <Label>Options *</Label>
                                        <div className="space-y-2">
                                          {localQuestion.options.map(
                                            (option, optIndex) => (
                                              <div
                                                key={optIndex}
                                                className="flex items-center space-x-2"
                                              >
                                                <input
                                                  className="flex-1 p-2 border rounded-md"
                                                  placeholder={`Option ${
                                                    optIndex + 1
                                                  }`}
                                                  value={option.text}
                                                  onChange={(e) =>
                                                    handleLocalOptionChange(
                                                      optIndex,
                                                      'text',
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                                {localQuestion.type ===
                                                'single_choice' ? (
                                                  <input
                                                    type="radio"
                                                    name={`correctOption${questionIndex}_radio`}
                                                    checked={
                                                      localQuestion.options[
                                                        optIndex
                                                      ].isCorrect
                                                    }
                                                    onChange={() =>
                                                      handleLocalOptionChange(
                                                        optIndex,
                                                        'isCorrect',
                                                        true
                                                      )
                                                    }
                                                  />
                                                ) : (
                                                  <input
                                                    type="checkbox"
                                                    name={`correctOption${questionIndex}_${optIndex}`}
                                                    checked={
                                                      localQuestion.options[
                                                        optIndex
                                                      ].isCorrect
                                                    }
                                                    onChange={(e) =>
                                                      handleLocalOptionChange(
                                                        optIndex,
                                                        'isCorrect',
                                                        e.target.checked
                                                      )
                                                    }
                                                  />
                                                )}
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    removeLocalOption(optIndex)
                                                  }
                                                  disabled={
                                                    localQuestion.options
                                                      .length <= 2
                                                  }
                                                >
                                                  Remove
                                                </Button>
                                              </div>
                                            )
                                          )}
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addLocalOption}
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Option
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Explanation */}
                                      <div className="space-y-2">
                                        <Label>Explanation (Optional)</Label>
                                        <textarea
                                          className="w-full p-2 border rounded-md"
                                          placeholder="Explain the correct answer..."
                                          value={localQuestion.explanation}
                                          onChange={(e) =>
                                            handleLocalQuestionChange(
                                              'explanation',
                                              e.target.value
                                            )
                                          }
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={`display-${questionIndex}`}
                                    className="border rounded-lg p-4 space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-gray-900">
                                          Question {questionIndex + 1}
                                        </h4>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {question.section}
                                        </Badge>

                                        {/* Save Status Indicator */}
                                        {isEditingQuestions && (
                                          <div className="flex items-center space-x-2">
                                            {questionSaveStatus[
                                              question._id
                                            ] === 'saving' && (
                                              <div className="flex items-center space-x-1 text-blue-600">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span className="text-xs">
                                                  Saving...
                                                </span>
                                              </div>
                                            )}
                                            {questionSaveStatus[
                                              question._id
                                            ] === 'saved' && (
                                              <div className="flex items-center space-x-2 text-green-600">
                                                <CheckCircle className="h-3 w-3" />
                                                <span className="text-xs">
                                                  Saved
                                                </span>
                                              </div>
                                            )}
                                            {questionSaveStatus[
                                              question._id
                                            ] === 'error' && (
                                              <div className="flex items-center space-x-1 text-red-600">
                                                <AlertCircle className="h-3 w-3" />
                                                <span className="text-xs">
                                                  Error
                                                </span>
                                              </div>
                                            )}
                                            {questionSaveStatus[
                                              question._id
                                            ] === 'pending' && (
                                              <div className="flex items-center space-x-1 text-yellow-600">
                                                <span className="text-xs">
                                                  Pending
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline">
                                          {question.type === 'single_choice'
                                            ? 'Single Choice'
                                            : 'Multiple Choice'}
                                        </Badge>
                                        <Badge variant="outline">
                                          {question.marks} marks
                                        </Badge>
                                        {isEditingQuestions && (
                                          <>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                startEditingQuestion(
                                                  questionIndex
                                                )
                                              }
                                              className="text-blue-600 hover:text-blue-700"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                onRemoveQuestion(questionIndex)
                                              }
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              Remove
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {question.text}
                                      </p>

                                      <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">
                                          Options:
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                          {question.options?.map(
                                            (option, optIndex) => (
                                              <div
                                                key={optIndex}
                                                className="flex items-center space-x-2 text-sm"
                                              >
                                                <div
                                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                    option.isCorrect
                                                      ? 'border-green-500 bg-green-100'
                                                      : 'border-gray-300'
                                                  }`}
                                                >
                                                  {option.isCorrect && (
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                  )}
                                                </div>
                                                <span
                                                  className={
                                                    option.isCorrect
                                                      ? 'text-green-700 font-medium'
                                                      : 'text-gray-600'
                                                  }
                                                >
                                                  {option.text}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {question.explanation && (
                                        <div className="text-sm text-gray-600">
                                          <strong>Explanation:</strong>{' '}
                                          <span className="whitespace-pre-wrap">
                                            {question.explanation}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Manual Save Button */}
                                  </div>
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
                    <h3 className="text-lg font-semibold text-amber-600">
                      Unassigned Questions
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {questionsWithoutSection.length} questions •{' '}
                      {questionsWithoutSection.reduce(
                        (sum, q) => sum + q.marks || 0,
                        0
                      )}{' '}
                      marks
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {questionsWithoutSection.map((question, index) => {
                    const questionIndex = editableQuestions.findIndex(
                      (q) => q === question
                    );
                    const isEditing = localEditingIndex === questionIndex;

                    if (isEditing && localQuestion) {
                      return (
                        <div
                          key={`edit-${questionIndex}`}
                          className="border rounded-lg p-4 space-y-4 bg-gray-50"
                        >
                          {/* Same editing form as above */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Editing Question</h4>
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={saveEditedQuestion}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingQuestion}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>

                          {/* Question Text */}
                          <div className="space-y-2">
                            <Label>Question Text *</Label>
                            <textarea
                              className="w-full p-2 border rounded-md"
                              placeholder="Enter your question..."
                              value={localQuestion.text}
                              onChange={(e) =>
                                handleLocalQuestionChange(
                                  'text',
                                  e.target.value
                                )
                              }
                              rows={3}
                            />
                          </div>

                          {/* Section */}
                          <div className="space-y-2">
                            <Label>Section *</Label>
                            <select
                              className="w-full p-2 border rounded-md"
                              value={localQuestion.section || ''}
                              onChange={(e) =>
                                handleLocalQuestionChange(
                                  'section',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select a section</option>
                              {sections.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Question Type and Marks */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Question Type *</Label>
                              <select
                                className="w-full p-2 border rounded-md"
                                value={localQuestion.type}
                                onChange={(e) =>
                                  handleLocalQuestionChange(
                                    'type',
                                    e.target.value
                                  )
                                }
                              >
                                <option value="single_choice">
                                  Single Choice
                                </option>
                                <option value="multiple_choice">
                                  Multiple Choice
                                </option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>Marks *</Label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                className="w-full p-2 border rounded-md"
                                value={localQuestion.marks}
                                onChange={(e) =>
                                  handleLocalQuestionChange(
                                    'marks',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                            </div>
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <Label>Options *</Label>
                            <div className="space-y-2">
                              {localQuestion.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    className="flex-1 p-2 border rounded-md"
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={option.text}
                                    onChange={(e) =>
                                      handleLocalOptionChange(
                                        optIndex,
                                        'text',
                                        e.target.value
                                      )
                                    }
                                  />

                                  {localQuestion.type === 'single_choice' ? (
                                    <>
                                      <input
                                        type={'radio'}
                                        name={`correctOption${questionIndex}_radio`}
                                        checked={
                                          localQuestion.options[optIndex]
                                            .isCorrect
                                        }
                                        onChange={(e) => {
                                          handleLocalOptionChange(
                                            optIndex,
                                            'isCorrect',
                                            true
                                          );
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <input
                                        type="checkbox"
                                        name={`correctOption${questionIndex}_${optIndex}`}
                                        checked={
                                          localQuestion.options[optIndex]
                                            .isCorrect
                                        }
                                        onChange={(e) => {
                                          handleLocalOptionChange(
                                            optIndex,
                                            'isCorrect',
                                            e.target.checked
                                          );
                                        }}
                                      />
                                    </>
                                  )}

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLocalOption(optIndex)}
                                    disabled={localQuestion.options.length <= 2}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addLocalOption}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          </div>

                          {/* Explanation */}
                          <div className="space-y-2">
                            <Label>Explanation (Optional)</Label>
                            <textarea
                              className="w-full p-2 border rounded-md"
                              placeholder="Explain the correct answer..."
                              value={localQuestion.explanation}
                              onChange={(e) =>
                                handleLocalQuestionChange(
                                  'explanation',
                                  e.target.value
                                )
                              }
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`display-${questionIndex}`}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              Question {questionIndex + 1}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              Unassigned
                            </Badge>

                            {/* Save Status Indicator */}
                            {isEditingQuestions && (
                              <div className="flex items-center space-x-2">
                                {questionSaveStatus[question._id] ===
                                  'saving' && (
                                  <div className="flex items-center space-x-1 text-blue-600">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span className="text-xs">Saving...</span>
                                  </div>
                                )}
                                {questionSaveStatus[question._id] ===
                                  'saved' && (
                                  <div className="flex items-center space-x-2 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span className="text-xs">Saved</span>
                                  </div>
                                )}
                                {questionSaveStatus[question._id] ===
                                  'error' && (
                                  <div className="flex items-center space-x-1 text-red-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-xs">Error</span>
                                  </div>
                                )}
                                {questionSaveStatus[question._id] ===
                                  'pending' && (
                                  <div className="flex items-center space-x-1 text-yellow-600">
                                    <span className="text-xs">Pending</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {question.type === 'single_choice'
                                ? 'Single Choice'
                                : 'Multiple Choice'}
                            </Badge>
                            <Badge variant="outline">
                              {question.marks} marks
                            </Badge>
                            {isEditingQuestions && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    startEditingQuestion(questionIndex)
                                  }
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onRemoveQuestion(questionIndex)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {question.text}
                          </p>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Options:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {question.options?.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2 text-sm"
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      option.isCorrect
                                        ? 'border-green-500 bg-green-100'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {option.isCorrect && (
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    )}
                                  </div>
                                  <span
                                    className={
                                      option.isCorrect
                                        ? 'text-green-700 font-medium'
                                        : 'text-gray-600'
                                    }
                                  >
                                    {option.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {question.explanation && (
                            <div className="text-sm text-gray-600">
                              <strong>Explanation:</strong>{' '}
                              <span className="whitespace-pre-wrap">
                                {question.explanation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No questions message */}
            {editableQuestions.length === 0 && sections.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>
                  No questions added yet. Click "Add Question" in any section to
                  get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
