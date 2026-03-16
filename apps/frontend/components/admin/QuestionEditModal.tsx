import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Question, UpdateQuestionData, QuestionType } from '@/lib/types';
import { useUpdateQuestion } from '@/lib/hooks/useQuestions';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  HelpCircle, 
  Award, 
  FileText, 
  CheckCircle,
  XCircle,
  Sun,
  Cloud,
  AlertCircle
} from 'lucide-react';

interface QuestionEditModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionEditModal({
  question,
  isOpen,
  onClose,
}: QuestionEditModalProps) {
  const [formData, setFormData] = useState<UpdateQuestionData>({
    text: '',
    type: QuestionType.SINGLE_CHOICE,
    options: [],
    marks: 0,
    explanation: '',
  });

  const [options, setOptions] = useState<
    { text: string; isCorrect: boolean }[]
  >([]);
  const updateQuestion = useUpdateQuestion();

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text,
        type: question.type as QuestionType,
        options: question.options,
        marks: question.marks,
        explanation: question.explanation || '',
      });
      setOptions(
        question.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        }))
      );
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question) return;

    // Validate options
    if (options.length < 2) {
      toast.error('Question must have at least 2 options');
      return;
    }

    if (options.every((opt) => !opt.isCorrect)) {
      toast.error('Question must have at least one correct answer');
      return;
    }

    if (
      formData.type === QuestionType.SINGLE_CHOICE &&
      options.filter((opt) => opt.isCorrect).length > 1
    ) {
      toast.error('Single choice questions can only have one correct answer');
      return;
    }

    try {
      await updateQuestion.mutateAsync({
        id: question._id,
        data: {
          ...formData,
          options: options,
        },
      });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Question must have at least 2 options');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (
    index: number,
    field: 'text' | 'isCorrect',
    value: string | boolean
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // For single choice, ensure only one option is correct
    if (
      field === 'isCorrect' &&
      formData.type === QuestionType.SINGLE_CHOICE &&
      value === true
    ) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setOptions(newOptions);
  };

  const handleTypeChange = (type: QuestionType) => {
    setFormData({ ...formData, type });
    // Reset options to have only one correct answer for single choice
    if (type === QuestionType.SINGLE_CHOICE) {
      const hasCorrect = options.some(opt => opt.isCorrect);
      if (!hasCorrect && options.length > 0) {
        setOptions(options.map((opt, i) => ({ ...opt, isCorrect: i === 0 })));
      } else {
        setOptions(options.map(opt => ({ ...opt, isCorrect: false })));
      }
    }
  };

  if (!question) return null;

  const correctCount = options.filter(opt => opt.isCorrect).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-sky-100 shadow-xl">
        {/* Decorative Elements */}
        <div className="fixed top-10 right-10 opacity-5 pointer-events-none">
          <Sun className="h-20 w-20 text-orange-300" />
        </div>
        <div className="fixed bottom-10 left-10 opacity-5 pointer-events-none">
          <Cloud className="h-20 w-20 text-sky-300" />
        </div>

        {/* Header with Gradient */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 via-white to-orange-50 border-b border-sky-100">
          <div className="flex items-start gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <div>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-sky-500" />
                Edit Question
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Update the question details and options
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="text" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              Question Text <span className="text-sky-400">*</span>
            </Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter the question text..."
              className="min-h-[100px] border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm resize-none"
              required
            />
          </div>

          {/* Type and Marks Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${
                  formData.type === QuestionType.SINGLE_CHOICE 
                    ? 'bg-sky-500' 
                    : 'bg-orange-500'
                }`}></span>
                Question Type <span className="text-sky-400">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value as QuestionType)}
              >
                <SelectTrigger className="w-full border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionType.SINGLE_CHOICE}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                      Single Choice
                    </div>
                  </SelectItem>
                  <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      Multiple Choice
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marks" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-orange-400" />
                Marks <span className="text-sky-400">*</span>
              </Label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400 pointer-events-none" />
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                  className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
              Explanation <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explain why this answer is correct..."
              className="min-h-[80px] border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm resize-none"
            />
          </div>

          {/* Options Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-sky-400" />
                Options <span className="text-sky-400">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            {/* Options Count Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-gradient-to-r from-sky-200 to-orange-200 rounded-full">
                <div 
                  className="h-1 bg-gradient-to-r from-sky-500 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (options.length / 6) * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {options.length} options • {correctCount} correct
              </span>
            </div>

            {/* Options List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {options.map((option, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    option.isCorrect 
                      ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-green-50/30' 
                      : 'border-sky-100 bg-white/50'
                  }`}
                >
                  <Checkbox
                    id={`correct-${index}`}
                    checked={option.isCorrect}
                    onCheckedChange={(checked) =>
                      updateOption(index, 'isCorrect', checked as boolean)
                    }
                    className={`rounded border-2 ${
                      option.isCorrect 
                        ? 'border-green-500 bg-green-500 data-[state=checked]:bg-green-500' 
                        : 'border-sky-300'
                    }`}
                  />
                  <div className="relative flex-1">
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className={`w-full pl-4 pr-4 py-2 ${
                        option.isCorrect 
                          ? 'border-green-200 focus:border-green-400 bg-white' 
                          : 'border-sky-200 focus:border-sky-400'
                      } rounded-xl text-sm`}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className="border-red-200 hover:bg-red-50 text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Validation Hints */}
            <div className="mt-3 p-3 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-sky-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Option Requirements:</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                      At least 2 options required
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                      At least one correct answer
                    </li>
                    {formData.type === QuestionType.SINGLE_CHOICE && (
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                        Single choice: exactly one correct answer
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-sky-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateQuestion.isPending}
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm min-w-[140px]"
            >
              {updateQuestion.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Question'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}