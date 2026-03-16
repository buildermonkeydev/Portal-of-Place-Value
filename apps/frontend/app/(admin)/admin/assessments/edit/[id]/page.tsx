'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useAssessment, useUpdateAssessment } from '@/lib/hooks/useAssessments';
import { useUpdateQuestion } from '@/lib/hooks/useQuestions';
import { useUsers } from '@/lib/hooks/useUsers';
import { useColleges } from '@/lib/hooks/useColleges';
import { assessmentAPI } from '@/lib/api/assessments';
import { userAPI } from '@/lib/api/users';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  X,
  CheckCircle,
  Mail,
  Building2,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { EditQuestionsManagement } from './components';
import { EditCodingQuestionsManagement } from './components/EditCodingQuestionsManagement';

import { AssessmentStatus, AssessmentType } from '@/lib/types/assessment';
import { Switch } from '@/components/ui/switch';
import { QuestionType } from '@/lib/types/question';
import { debounce, formatToIndianTime, toLocalISOString } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';

interface EditAssessmentFormData {
  title: string;
  description: string;
  type: AssessmentType;
  totalMarks: number;
  duration: number;
  startDate: string;
  startDateLocal: string;
  endDate: string;
  endDateLocal: string;
  status: AssessmentStatus;
  isActive: boolean;
  assignedUsers: string[];
  invitedUsers: string[];
  googleForm: string;
  passPercentage: number;
  codingQuestions: { _id: string; section: string; score: number }[];
  colleges: {
    _id: string;
    branches?: {
      _id: string;
      name: string;
    }[];
    year?: number[];
  }[];
  showResultsToUsers: boolean;
}

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

export default function EditAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string>('');

  // Extract the ID from the params promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setAssessmentId(resolvedParams.id);
    });
  }, [params]);

  const { data: assessment, isLoading: isLoadingAssessment } =
    useAssessment(assessmentId);
  const { mutateAsync: updateAssessment, isPending: isSaving } =
    useUpdateAssessment();

  const { mutateAsync: updateQuestion, isPending: isUpdatingQuestion } =
    useUpdateQuestion();
  const { data: users } = useUsers();
  const { data: colleges } = useColleges();

  // Debug log for users data
  useEffect(() => {
    console.log('Users data loaded:', users);
    console.log('Users data structure:', users?.data);
    console.log('Number of users:', users?.data?.length);
  }, [users]);

  // Import assessment API for question operations
  const {
    updateQuestion: updateQuestionInAssessment,
    createQuestionInAssessment,
  } = assessmentAPI;

  const [formData, setFormData] = useState<EditAssessmentFormData>({
    title: '',
    description: '',
    type: AssessmentType.MCQ,
    totalMarks: 0,
    duration: 0,
    startDate: '',
    startDateLocal: '',
    endDate: '',
    endDateLocal: '',
    status: AssessmentStatus.DRAFT,
    isActive: false,
    assignedUsers: [],
    invitedUsers: [],
    googleForm: '',
    passPercentage: 60,
    codingQuestions: [],
    colleges: [],
    showResultsToUsers: false,
  });

  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [editableQuestions, setEditableQuestions] = useState<
    EditableQuestion[]
  >([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);

  // Add new state for tracking question save status
  const [questionSaveStatus, setQuestionSaveStatus] = useState<{
    [key: string]: 'saved' | 'saving' | 'error' | 'pending';
  }>({});

  useEffect(() => {
    if (formData.startDate && formData.duration > 0) {
      const start = new Date(formData.startDate);
      console.log('start', start);

      const newEndDate = new Date(
        start.getTime() + formData.duration * 60 * 1000
      );
      console.log('newEndDate', newEndDate);
      console.log(
        'newEndDate.toISOString().slice(0, 16)',
        newEndDate.toISOString().slice(0, 16)
      );
      const realEndDate = toLocalISOString(newEndDate);
      // Only update if end date is not set or if it's less than the calculated end date
      if (!formData.endDate || new Date(formData.endDate) < newEndDate) {
        handleInputChange('endDate', realEndDate);
        handleInputChange('endDateLocal', realEndDate);
      }
    }
  }, [formData.startDate, formData.duration]);

  // Section management state
  const [sections, setSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // Scroll functions
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Monitor scroll position to show/hide scroll buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show buttons if user has scrolled more than 300px from top
      setShowScrollButtons(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Invited users state
  const [newInvitedEmail, setNewInvitedEmail] = useState('');
  const [invitedUsersFile, setInvitedUsersFile] = useState<File | null>(null);

  // Handle invited users
  const addInvitedUser = () => {
    if (newInvitedEmail && !formData.invitedUsers.includes(newInvitedEmail)) {
      handleInputChange('invitedUsers', [
        ...formData.invitedUsers,
        newInvitedEmail,
      ]);
      setNewInvitedEmail('');
    }
  };

  const removeInvitedUser = (email: string) => {
    const newEmails = formData.invitedUsers.filter((e) => e !== email);
    handleInputChange('invitedUsers', newEmails);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error('Please upload a .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const emails = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && line.includes('@')) // Basic email validation
          .filter((email) => !formData.invitedUsers.includes(email)); // Remove duplicates

        if (emails.length === 0) {
          toast.error('No valid email addresses found in the file');
          return;
        }

        // Add new emails to the list
        const updatedInvitedUsers = [...formData.invitedUsers, ...emails];
        handleInputChange('invitedUsers', updatedInvitedUsers);

        toast.success(`Added ${emails.length} email addresses from file`);
      } catch (error) {
        toast.error(
          'Failed to parse file. Please ensure it contains valid email addresses.'
        );
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (assessment) {
      console.log('Setting form data with assessment:', assessment);
      console.log(
        'Assessment status:',
        assessment.status,
        'Type:',
        typeof assessment.status
      );
      console.log('Assessment type:', assessment.type);
      console.log('Assessment type typeof:', typeof assessment.type);
      console.log('AssessmentType.MCQ:', AssessmentType.MCQ);
      console.log('AssessmentType.CODING:', AssessmentType.CODING);
      console.log('AssessmentType.MIXED:', AssessmentType.MIXED);
      console.log('Assessment codingQuestions:', assessment.codingQuestions);

      setFormData({
        ...assessment,
        title: assessment.title || '',
        description: assessment.description || '',
        totalMarks: assessment.totalMarks || 0,
        duration: assessment.duration || 0,
        startDate: assessment.startDate
          ? (() => {
              // Convert UTC to Indian time for display
              const utcDate = new Date(assessment.startDate);
              const indianDate = new Date(
                utcDate.getTime() + 5.5 * 60 * 60 * 1000
              );
              return indianDate.toISOString().slice(0, 16);
            })()
          : '',
        endDate: assessment.endDate
          ? (() => {
              // Convert UTC to Indian time for display
              const utcDate = new Date(assessment.endDate);
              const indianDate = new Date(
                utcDate.getTime() + 5.5 * 60 * 60 * 1000
              );
              return indianDate.toISOString().slice(0, 16);
            })()
          : '',
        startDateLocal: assessment.startDate
          ? (() => {
              // Convert UTC to Indian time for display
              const utcDate = new Date(assessment.startDate);
              const indianDate = new Date(
                utcDate.getTime() + 5.5 * 60 * 60 * 1000
              );
              return indianDate.toISOString().slice(0, 16);
            })()
          : '',
        endDateLocal: assessment.endDate
          ? (() => {
              // Convert UTC to Indian time for display
              const utcDate = new Date(assessment.endDate);
              const indianDate = new Date(
                utcDate.getTime() + 5.5 * 60 * 60 * 1000
              );
              return indianDate.toISOString().slice(0, 16);
            })()
          : '',

        status: (() => {
          // Ensure the status is properly set from the API response
          if (assessment.status && typeof assessment.status === 'string') {
            // Map the API status to the enum value
            switch (assessment.status.toLowerCase()) {
              case 'active':
                return AssessmentStatus.ACTIVE;
              case 'draft':
                return AssessmentStatus.DRAFT;
              case 'inactive':
                return AssessmentStatus.INACTIVE;
              case 'completed':
                return AssessmentStatus.COMPLETED;
              default:
                console.warn('Unknown status value:', assessment.status);
                return AssessmentStatus.DRAFT;
            }
          }
          return AssessmentStatus.DRAFT;
        })(),
        isActive: assessment.isActive || false,
        type: assessment.type,
        assignedUsers:
          assessment.assignedUsers?.map((user: any) => user._id) || [],
        invitedUsers: assessment.invitedUsers || [],
        googleForm: assessment.googleForm || '',
        passPercentage: assessment.passPercentage ?? 60,
        codingQuestions: assessment.codingQuestions || [],
        colleges: (assessment.colleges as any) || [],
        showResultsToUsers: assessment.showResultsToUsers ?? false,
      });

      // Store assigned users details in map from assessment data
      if (assessment.assignedUsers && assessment.assignedUsers.length > 0) {
        setUserDetailsMap((prevMap) => {
          const newMap = new Map(prevMap);
          assessment.assignedUsers.forEach((user: any) => {
            newMap.set(user._id, user);
          });
          return newMap;
        });
      }

      if (assessment.questions) {
        const questions = assessment.questions.map((q: any) => ({
          _id: q._id,
          text: q.text || '',
          section: q.section || '',
          type: q.type || 'single_choice',
          marks: q.marks || 1,
          options:
            q.options?.map((opt: any) => ({
              text: opt.text || '',
              isCorrect: opt.isCorrect || false,
            })) || [],
          explanation: q.explanation || '',
        }));

        setEditableQuestions(questions);

        // Extract unique sections from questions
        const uniqueSections = [
          ...new Set(questions.map((q) => q.section).filter(Boolean)),
        ];
        setSections(uniqueSections);

        // Initialize save status for existing questions
        const initialSaveStatus: {
          [key: string]: 'saved' | 'saving' | 'error' | 'pending';
        } = {};
        questions.forEach((q) => {
          initialSaveStatus[q._id] = 'saved';
        });
        setQuestionSaveStatus(initialSaveStatus);
      }
    }
  }, [assessment]);

  // Debug formData changes
  useEffect(() => {
    console.log('FormData updated - type:', formData.type);
    console.log(
      'FormData updated - codingQuestions:',
      formData.codingQuestions
    );
  }, [formData.type, formData.codingQuestions]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue =
          'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editableQuestions, questionSaveStatus]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    console.log('handleInputChange called - field:', field, 'value:', value);

    // Safeguard: Don't allow type to be set to empty string
    if (field === 'type' && (!value || value === '')) {
      console.log('Prevented setting type to empty value:', value);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate total marks from all questions
  const calculateTotalMarks = useCallback(() => {
    // Calculate marks from MCQ questions
    const mcqMarks = editableQuestions.reduce(
      (sum, q) => sum + (q.marks || 0),
      0
    );

    // Calculate marks from coding questions
    const codingMarks = (formData.codingQuestions || []).reduce(
      (sum, cq) => sum + (cq.score || 0),
      0
    );

    return mcqMarks + codingMarks;
  }, [editableQuestions, formData.codingQuestions]);

  // Auto-update total marks when questions change
  useEffect(() => {
    const calculatedTotal = calculateTotalMarks();
    if (calculatedTotal !== formData.totalMarks) {
      setFormData((prev) => ({
        ...prev,
        totalMarks: calculatedTotal,
      }));
    }
  }, [calculateTotalMarks, formData.totalMarks]);

  // Section management functions
  const addSection = () => {
    if (newSection.trim() && !sections.includes(newSection.trim())) {
      setSections([...sections, newSection.trim()]);
      setNewSection('');
      setIsAddingSection(false);
    }
  };

  const removeSection = (sectionToRemove: string) => {
    // Check if any questions are using this section
    const questionsUsingSection = editableQuestions.filter(
      (q) => q.section === sectionToRemove
    );

    if (questionsUsingSection.length > 0) {
      toast.error(
        `Cannot remove section "${sectionToRemove}" - ${questionsUsingSection.length} questions are using it. Please reassign or remove those questions first.`
      );
      return;
    }

    setSections(sections.filter((s) => s !== sectionToRemove));
  };

  // Handle question changes with auto-save
  const handleQuestionChange = (
    index: number,
    field: keyof EditableQuestion,
    value: any
  ) => {
    setEditableQuestions((prev) => {
      const newQuestions = [...prev];
      const question = { ...newQuestions[index] };

      if (field === 'type') {
        // When changing question type, reset all options to false first
        question.options = question.options.map((opt) => ({
          ...opt,
          isCorrect: false,
        }));

        // Then handle the specific type logic
        if (value === 'single_choice') {
          // For single choice, set the first option as correct
          question.options[0].isCorrect = true;
        } else if (value === 'multiple_choice') {
          // For multiple choice, set the first option as correct
          question.options[0].isCorrect = true;
        }
      }

      (question as any)[field] = value;
      newQuestions[index] = question;

      // Mark question as pending save
      setQuestionSaveStatus((prev) => ({ ...prev, [question._id]: 'pending' }));

      // Trigger auto-save for existing questions
      if (!question._id.startsWith('temp_')) {
        debouncedSaveQuestion(question);
      }

      return newQuestions;
    });
  };

  // Auto-save question after a delay
  const debouncedSaveQuestion = useCallback(
    debounce(async (question: EditableQuestion) => {
      if (question._id.startsWith('temp_')) {
        // Don't auto-save temporary questions
        return;
      }

      try {
        setQuestionSaveStatus((prev) => ({
          ...prev,
          [question._id]: 'saving',
        }));
        await handleUpdateQuestion(question);
        // Don't show success message for auto-save to avoid spam
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error message for auto-save to avoid spam
      }
    }, 2000), // 2 second delay
    []
  );

  // Manual save question function
  const saveQuestion = async (question: EditableQuestion) => {
    if (question._id.startsWith('temp_')) {
      // Create new question
      return await handleCreateQuestion(question);
    } else {
      // Update existing question
      return await handleUpdateQuestion(question);
    }
  };

  // Save all pending questions
  const saveAllQuestions = async () => {
    const pendingQuestions = editableQuestions.filter(
      (q) =>
        questionSaveStatus[q._id] === 'pending' ||
        questionSaveStatus[q._id] === 'error'
    );

    if (pendingQuestions.length === 0) {
      toast.info('No questions to save');
      return;
    }

    try {
      toast.info(`Saving ${pendingQuestions.length} questions...`);

      for (const question of pendingQuestions) {
        await saveQuestion(question);
      }

      toast.success(`Successfully saved ${pendingQuestions.length} questions`);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save some questions');
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    // Check for question changes
    const hasQuestionChanges = editableQuestions.some(
      (q) =>
        questionSaveStatus[q._id] === 'pending' ||
        questionSaveStatus[q._id] === 'error'
    );

    // Check for form data changes
    if (!assessment) return hasQuestionChanges;

    const hasFormChanges =
      formData.title !== (assessment.title || '') ||
      formData.description !== (assessment.description || '') ||
      formData.totalMarks !== (assessment.totalMarks || 0) ||
      formData.duration !== (assessment.duration || 0) ||
      formData.status !== assessment.status ||
      formData.isActive !== (assessment.isActive || false) ||
      formData.startDate !==
        (assessment.startDate
          ? new Date(assessment.startDate).toISOString().slice(0, 16)
          : '') ||
      formData.endDate !==
        (assessment.endDate
          ? new Date(assessment.endDate).toISOString().slice(0, 16)
          : '') ||
      JSON.stringify(formData.assignedUsers.sort()) !==
        JSON.stringify(
          (assessment.assignedUsers?.map((user: any) => user._id) || []).sort()
        ) ||
      JSON.stringify(formData.invitedUsers.sort()) !==
        JSON.stringify((assessment.invitedUsers || []).sort()) ||
      JSON.stringify(formData.colleges) !==
        JSON.stringify(assessment.colleges || []);

    return hasQuestionChanges || hasFormChanges;
  };

  // Handle option changes with auto-save
  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    field: 'text' | 'isCorrect',
    value: any
  ) => {
    // For multiple choice questions, prevent unchecking the last correct option
    if (field === 'isCorrect' && value === false) {
      const question = editableQuestions[questionIndex];
      const correctOptions = question.options.filter((opt) => opt.isCorrect);
      if (
        correctOptions.length === 1 &&
        question.options[optionIndex].isCorrect
      ) {
        toast.error('At least one option must be marked as correct');
        return;
      }
    }
    setEditableQuestions((prev) => {
      const newQuestions = [...prev];
      const question = { ...newQuestions[questionIndex] };

      if (field === 'isCorrect') {
        if (question.type === 'single_choice') {
          // For single choice, ensure only one option is correct
          // If the clicked option is already correct, don't change anything
          if (!question.options[optionIndex].isCorrect) {
            question.options = question.options.map((opt, i) => ({
              ...opt,
              isCorrect: i === optionIndex,
            }));
          }
        } else if (question.type === 'multiple_choice') {
          // For multiple choice, directly set the value (true/false)
          question.options[optionIndex] = {
            ...question.options[optionIndex],
            isCorrect: value,
          };
        }
      } else {
        question.options[optionIndex] = {
          ...question.options[optionIndex],
          [field]: value,
        };
      }

      newQuestions[questionIndex] = question;

      // Mark question as pending save
      setQuestionSaveStatus((prev) => ({ ...prev, [question._id]: 'pending' }));

      // Trigger auto-save for existing questions
      if (!question._id.startsWith('temp_')) {
        debouncedSaveQuestion(question);
      }

      return newQuestions;
    });
  };

  const addOption = (questionIndex: number) => {
    setEditableQuestions((prev) => {
      const newQuestions = [...prev];
      const question = { ...newQuestions[questionIndex] };
      question.options.push({
        text: '',
        isCorrect: false,
      });
      newQuestions[questionIndex] = question;

      // Mark question as pending save
      setQuestionSaveStatus((prev) => ({ ...prev, [question._id]: 'pending' }));

      // Trigger auto-save for existing questions
      if (!question._id.startsWith('temp_')) {
        debouncedSaveQuestion(question);
      }

      return newQuestions;
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setEditableQuestions((prev) => {
      const newQuestions = [...prev];
      const question = { ...newQuestions[questionIndex] };

      if (question.options.length > 2) {
        question.options = question.options.filter((_, i) => i !== optionIndex);
        // Ensure at least one option remains correct
        if (!question.options.some((opt) => opt.isCorrect)) {
          question.options[0].isCorrect = true;
        }
        newQuestions[questionIndex] = question;

        // Mark question as pending save
        setQuestionSaveStatus((prev) => ({
          ...prev,
          [question._id]: 'pending',
        }));

        // Trigger auto-save for existing questions
        if (!question._id.startsWith('temp_')) {
          debouncedSaveQuestion(question);
        }
      }

      return newQuestions;
    });
  };

  const startEditingQuestion = (index: number) => {
    setEditingQuestionIndex(index);
  };

  const saveEditedQuestion = () => {
    setEditingQuestionIndex(null);
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionIndex(null);
  };

  const validateQuestions = () => {
    for (let i = 0; i < editableQuestions.length; i++) {
      const question = editableQuestions[i];

      if (!question.text.trim() || question.text.length < 10) {
        toast.error(`Question ${i + 1}: Text must be at least 10 characters`);
        return false;
      }

      if (!question.section || question.section.trim() === '') {
        toast.error(`Question ${i + 1}: Section is required`);
        return false;
      }

      if (question.options.length < 2) {
        toast.error(`Question ${i + 1}: Must have at least 2 options`);
        return false;
      }

      if (question.options.some((opt) => !opt.text.trim())) {
        toast.error(`Question ${i + 1}: All options must have text`);
        return false;
      }

      if (!question.options.some((opt) => opt.isCorrect)) {
        toast.error(`Question ${i + 1}: Must have at least one correct option`);
        return false;
      }

      // For single choice questions, ensure only one option is correct
      if (question.type === 'single_choice') {
        const correctOptions = question.options.filter((opt) => opt.isCorrect);
        if (correctOptions.length > 1) {
          toast.error(
            `Question ${
              i + 1
            }: Single choice questions can have only one correct option`
          );
          return false;
        }
      }

      if (question.marks < 1 || question.marks > 100) {
        toast.error(`Question ${i + 1}: Marks must be between 1 and 100`);
        return false;
      }
    }
    return true;
  };

  const addNewQuestion = () => {
    const newQuestion: EditableQuestion = {
      _id: `temp_${Date.now()}`, // Temporary ID for new questions
      text: '',
      section: sections.length > 0 ? sections[0] : '', // Default to first section if available
      type: 'single_choice',
      marks: 1,
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
      explanation: '',
    };

    setEditableQuestions((prev) => [...prev, newQuestion]);

    // Set initial save status for new question
    setQuestionSaveStatus((prev) => ({
      ...prev,
      [newQuestion._id]: 'pending',
    }));

    setIsEditingQuestions(true); // Automatically enable editing mode
  };

  const removeQuestion = (index: number) => {
    setEditableQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = async (question: EditableQuestion) => {
    if (!question.text.trim() || question.options.length < 2) {
      return; // Don't update invalid questions
    }

    if (!question.section || question.section.trim() === '') {
      return; // Don't update questions without sections
    }

    try {
      // Update the question data for the API
      const questionData = {
        text: question.text,
        section: question.section,
        type:
          question.type === 'single_choice'
            ? QuestionType.SINGLE_CHOICE
            : QuestionType.MULTIPLE_CHOICE,
        options: question.options,
        marks: question.marks,
        explanation: question.explanation,
      };

      // Call the backend API to update the question
      await updateQuestionInAssessment(question._id, questionData);

      // Update the save status
      setQuestionSaveStatus((prev) => ({
        ...prev,
        [question._id]: 'saved',
      }));

      toast.success('Question updated successfully');
    } catch (error) {
      console.error('Error updating question:', error);
      // Set error status for the question
      setQuestionSaveStatus((prev) => ({
        ...prev,
        [question._id]: 'error',
      }));
      toast.error('Failed to update question');
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleCreateQuestion = async (question: EditableQuestion) => {
    if (!question.text.trim() || question.options.length < 2) {
      return; // Don't create invalid questions
    }

    if (!question.section || question.section.trim() === '') {
      return; // Don't create questions without sections
    }

    try {
      // Prepare the question data for the API
      const questionData = {
        text: question.text,
        section: question.section,
        type:
          question.type === 'single_choice'
            ? QuestionType.SINGLE_CHOICE
            : QuestionType.MULTIPLE_CHOICE,
        options: question.options,
        marks: question.marks,
        explanation: question.explanation,
      };

      // Call the backend API to create the question
      const createdQuestion = await createQuestionInAssessment(
        assessmentId,
        questionData
      );

      // Extract the real question ID from the response
      const realQuestionId = createdQuestion._id || createdQuestion.data?._id;

      if (!realQuestionId) {
        throw new Error('Failed to get question ID from response');
      }

      // Update the question with the real ID from the backend
      setEditableQuestions((prev) => {
        const newQuestions = [...prev];
        const questionIndex = newQuestions.findIndex(
          (q) => q._id === question._id
        );
        if (questionIndex !== -1) {
          newQuestions[questionIndex] = {
            ...newQuestions[questionIndex],
            _id: realQuestionId,
          };
        }
        return newQuestions;
      });

      // Update the save status with the new ID
      setQuestionSaveStatus((prev) => {
        const newStatus = { ...prev };
        // Remove the old temporary ID status
        delete newStatus[question._id];
        // Add the new real ID status
        newStatus[realQuestionId] = 'saved';
        return newStatus;
      });

      toast.success('Question created successfully');
      return createdQuestion;
    } catch (error) {
      console.error('Error creating question:', error);
      // Set error status for the question
      setQuestionSaveStatus((prev) => ({
        ...prev,
        [question._id]: 'error',
      }));
      toast.error('Failed to create question');
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate questions if editing mode is active
    if (isEditingQuestions && !validateQuestions()) {
      return;
    }

    // Validate date constraints
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const timeGap = end.getTime() - start.getTime();
      const durationMs = formData.duration * 60 * 1000;
      const minGapMs = 30 * 60 * 1000;
    }

    try {
      // Save all pending questions first
      const pendingQuestions = editableQuestions.filter(
        (q) =>
          questionSaveStatus[q._id] === 'pending' ||
          questionSaveStatus[q._id] === 'error'
      );

      if (pendingQuestions.length > 0) {
        toast.info(`Saving ${pendingQuestions.length} pending questions...`);

        for (const question of pendingQuestions) {
          await saveQuestion(question);
        }
      }

      // Prepare the data for the API
      const updateData: any = {
        ...formData,
        totalMarks: editableQuestions.reduce((sum, q) => sum + q.marks, 0),
        invitedUsers: formData.invitedUsers,
        colleges: formData.colleges,
      };

      // Remove the time period fields since we're not using AM/PM dropdowns anymore
      delete updateData.startTimePeriod;
      delete updateData.endTimePeriod;

      // Send date and time combined in datetime-local format
      if (formData.startDate) {
        // formData.startDate is in datetime-local format (Indian time)
        // Convert from Indian time to UTC for storage
        const startDate = new Date(formData.startDate);
        const utcStartDate = new Date(
          startDate.getTime() - 5.5 * 60 * 60 * 1000
        );
        updateData.startDate = formData.startDateLocal;
      }
      if (formData.endDate) {
        // formData.endDate is in datetime-local format (Indian time)
        // Convert from Indian time to UTC for storage
        // const endDate = new Date(formData.endDate);
        // const utcEndDate = new Date(endDate.getTime() - 5.5 * 60 * 60 * 1000);
        updateData.endDate = formData.endDateLocal;
      }

      // Get question IDs for all questions (both existing and newly created)
      const questionIds = editableQuestions.map((q) => q._id);
      updateData.questions = questionIds;

      // Update the assessment
      await updateAssessment({
        id: assessmentId,
        data: updateData,
      });

      toast.success('Assessment updated successfully');
      // router.push('/admin/assessments');
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast.error('Failed to update assessment');
    }
  };

  // User Assignment State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  // Map to store user details for users found via search
  const [userDetailsMap, setUserDetailsMap] = useState<Map<string, any>>(
    new Map()
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      if (!query.trim()) {
        // If no search query, show default users (excluding already assigned ones)
        const availableUsers = (users?.data || []).filter(
          (user: any) => !formData.assignedUsers.includes(user._id)
        );
        setSearchResults(availableUsers);
        return;
      }

      if (query.length >= 2) {
        // Reduced from 3 to 2 characters
        setIsSearching(true);
        // Call API search
        userAPI
          .searchUsers({ search: query, limit: 50 })
          .then((response) => {
            console.log('Search API response:', response); // Debug log
            // Filter out already assigned users
            const availableUsers = (response.data || []).filter(
              (user: any) => !formData.assignedUsers.includes(user._id)
            );
            console.log('Filtered available users:', availableUsers); // Debug log
            setSearchResults(availableUsers);

            // Store user details in map
            setUserDetailsMap((prevMap) => {
              const newMap = new Map(prevMap);
              availableUsers.forEach((user: any) => {
                newMap.set(user._id, user);
              });
              return newMap;
            });
          })
          .catch((error) => {
            console.error('Error searching users:', error);
            setSearchResults([]);
          })
          .finally(() => {
            setIsSearching(false);
          });
      } else {
        setSearchResults([]);
      }
    },
    [users?.data, formData.assignedUsers]
  );

  // Load default users when component mounts or users/assignedUsers changes
  useEffect(() => {
    if (users?.data && !userSearchQuery.trim()) {
      const availableUsers = users.data.filter(
        (user: any) => !formData.assignedUsers.includes(user._id)
      );
      console.log('Loading default users:', availableUsers); // Debug log
      setSearchResults(availableUsers);

      // Store user details in map for default users
      setUserDetailsMap((prevMap) => {
        const newMap = new Map(prevMap);
        users.data.forEach((user: any) => {
          newMap.set(user._id, user);
        });
        return newMap;
      });
    }
  }, [users?.data, formData.assignedUsers, userSearchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleUserSearchFocus = () => {
    setIsUserSearchOpen(true);
    // If there's already a search query, perform the search
    if (userSearchQuery.trim()) {
      handleSearchChange(userSearchQuery);
    } else {
      // Load default users when focusing
      const availableUsers = (users?.data || []).filter(
        (user: any) => !formData.assignedUsers.includes(user._id)
      );
      console.log('Focus - loading default users:', availableUsers); // Debug log
      setSearchResults(availableUsers);

      // Store user details in map
      setUserDetailsMap((prevMap) => {
        const newMap = new Map(prevMap);
        (users?.data || []).forEach((user: any) => {
          newMap.set(user._id, user);
        });
        return newMap;
      });
    }
  };

  const handleUserSearchBlur = () => {
    // After a short delay, close if no interaction
    setTimeout(() => {
      if (
        !isSelectingUser &&
        (!document.activeElement ||
          !document.activeElement.closest('.relative'))
      ) {
        setIsUserSearchOpen(false);
        setSearchResults([]);
      }
    }, 200); // Increased delay to allow click events to process
  };

  const addUser = (userId: string, userData?: any) => {
    console.log('addUser called with userId:', userId); // Debug log
    setIsSelectingUser(true);

    if (!formData.assignedUsers.includes(userId)) {
      console.log('Adding user to assignedUsers'); // Debug log
      handleInputChange('assignedUsers', [...formData.assignedUsers, userId]);

      // Store user data in map if provided
      if (userData) {
        setUserDetailsMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(userId, userData);
          return newMap;
        });
      }

      setUserSearchQuery('');
      setSearchResults([]);
      setIsUserSearchOpen(false);
    } else {
      console.log('User already assigned'); // Debug log
    }

    // Reset selection state after a short delay
    setTimeout(() => {
      setIsSelectingUser(false);
    }, 100);
  };

  const removeUser = (userId: string) => {
    handleInputChange(
      'assignedUsers',
      formData.assignedUsers.filter((id) => id !== userId)
    );
  };

  if (!isAdmin) {
    console.log('IS ADMIN', isAdmin);
    return (
      <div>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!assessmentId || isLoadingAssessment) {
    return (
      <div>
        <Loading
          message="Loading assessment... Behave Like Compiler"
          size="md"
        />
      </div>
    );
  }

  if (!assessment && !formData) {
    return (
      <div>
        <div className="text-center py-10">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">
            Assessment Not Found
          </h1>
          <p className="text-gray-600">
            The assessment you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => router.push('/admin/assessments')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }
  // console.log('assessment', assessment);
  console.log('formData', formData);
  console.log('users', users);

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (hasUnsavedChanges()) {
                if (
                  confirm(
                    'You have unsaved changes. Are you sure you want to leave?'
                  )
                ) {
                  router.push('/admin/assessments');
                }
              } else {
                router.push('/admin/assessments');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Assessment
            </h1>
            <p className="text-gray-600">
              Update assessment details and settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of the assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter assessment title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Assessment Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      handleInputChange('type', value as AssessmentType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AssessmentType.MCQ}>
                        MCQ Only - Multiple Choice Questions
                      </SelectItem>
                      <SelectItem value={AssessmentType.CODING}>
                        Coding Only - Programming Tests
                      </SelectItem>
                      <SelectItem value={AssessmentType.MIXED}>
                        Mixed - MCQ + Coding Questions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      console.log(
                        'Status changed to:',
                        value,
                        'Type:',
                        typeof value
                      );
                      if (value !== '') {
                        handleInputChange('status', value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                      <div className="text-xs text-gray-500 ml-2">
                        Current: {formData.status}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AssessmentStatus.DRAFT}>
                        Draft
                      </SelectItem>
                      <SelectItem value={AssessmentStatus.ACTIVE}>
                        Active
                      </SelectItem>
                      <SelectItem value={AssessmentStatus.INACTIVE}>
                        Inactive
                      </SelectItem>
                      <SelectItem value={AssessmentStatus.COMPLETED}>
                        Completed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Enter assessment description"
                  rows={3}
                />
              </div>

              <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="pr-4">
                  <Label className="text-sm font-semibold text-gray-900">
                    Show results to participants after submission
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Toggle whether learners can view their scores once they
                    finish this assessment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {formData.showResultsToUsers ? 'Visible' : 'Hidden'}
                  </span>
                  <Switch
                    checked={formData.showResultsToUsers}
                    onCheckedChange={(checked) =>
                      handleInputChange('showResultsToUsers', checked)
                    }
                    aria-label="Toggle result visibility"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleForm">Google Form URL *</Label>
                <Input
                  id="googleForm"
                  type="url"
                  value={formData.googleForm}
                  onChange={(e) =>
                    handleInputChange('googleForm', e.target.value)
                  }
                  placeholder="https://forms.gle/..."
                  required
                />
                <p className="text-sm text-gray-500">
                  Students will be redirected to this Google Form after
                  completing the assessment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passPercentage">Pass Percentage (%)</Label>
                <Input
                  id="passPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passPercentage ?? 60}
                  onChange={(e) =>
                    handleInputChange('passPercentage', Number(e.target.value))
                  }
                  placeholder="60"
                />
                <p className="text-sm text-gray-500">
                  Minimum percentage required to pass the assessment (0-100).
                  Default: 60%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">
                    Total Marks (Auto-calculated) *
                  </Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={formData.totalMarks}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                    placeholder="Auto-calculated from questions"
                  />
                  <p className="text-xs text-gray-500">
                    Total marks are automatically calculated from MCQ questions
                    (
                    {editableQuestions.reduce(
                      (sum, q) => sum + (q.marks || 0),
                      0
                    )}{' '}
                    marks) and coding questions (
                    {(formData.codingQuestions || []).reduce(
                      (sum, cq) => sum + (cq.score || 0),
                      0
                    )}{' '}
                    marks)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <div className="space-y-2">
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        handleInputChange('duration', parseInt(e.target.value))
                      }
                      placeholder="60"
                      min="1"
                      max="480"
                      required
                    />
                    {formData.duration > 0 && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Duration:</span>{' '}
                        {formData.duration} minute
                        {formData.duration !== 1 ? 's' : ''}
                        {Math.floor(formData.duration / 60) > 0 && (
                          <span className="ml-2">
                            ({Math.floor(formData.duration / 60)} hour
                            {Math.floor(formData.duration / 60) !== 1
                              ? 's'
                              : ''}
                            {formData.duration % 60 > 0
                              ? ` ${formData.duration % 60} minute${
                                  formData.duration % 60 !== 1 ? 's' : ''
                                }`
                              : ''}
                            )
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Date Settings</CardTitle>
              <CardDescription>
                Set the start and end dates and times for the assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => {
                      handleInputChange('startDate', e.target.value);
                      handleInputChange('startDateLocal', e.target.value);
                    }}
                  />
                  {formData.startDate && (
                    <p className="text-sm text-gray-600">
                      Assessment will start at:{' '}
                      {new Date(formData.startDate).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      if (newEndDate && formData.startDate) {
                        const start = new Date(formData.startDate);
                        const end = new Date(newEndDate);
                        const timeGap = end.getTime() - start.getTime();
                        const durationMs = formData.duration * 60 * 1000;
                        const minGapMs = 30 * 60 * 1000;

                        if (timeGap < durationMs) {
                          // Auto-adjust end date to be at least duration minutes after start
                          const adjustedEnd = new Date(
                            start.getTime() + durationMs
                          );
                          handleInputChange(
                            'endDate',
                            adjustedEnd.toISOString().slice(0, 16)
                          );
                          handleInputChange(
                            'endDateLocal',
                            adjustedEnd.toISOString().slice(0, 16)
                          );
                          toast.info(
                            `End date adjusted to ${adjustedEnd.toLocaleString()} to meet duration requirement`
                          );
                          return;
                        } else if (timeGap < minGapMs) {
                          // Auto-adjust end date to have at least 30 minutes gap
                          const adjustedEnd = new Date(
                            start.getTime() + minGapMs
                          );
                          handleInputChange(
                            'endDate',
                            adjustedEnd.toISOString().slice(0, 16)
                          );
                          handleInputChange(
                            'endDateLocal',
                            adjustedEnd.toISOString().slice(0, 16)
                          );
                          toast.info(
                            `End date adjusted to ${adjustedEnd.toLocaleString()} to meet minimum gap requirement`
                          );
                          return;
                        }
                      }

                      handleInputChange('endDate', newEndDate);
                      handleInputChange('endDateLocal', newEndDate);
                    }}
                  />
                  {formData.endDate && formData.startDate && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Assessment will end at:{' '}
                        {new Date(formData.endDate).toLocaleString()}
                      </p>
                      {(() => {
                        const start = new Date(formData.startDate);
                        const end = new Date(formData.endDate);
                        const timeGap = end.getTime() - start.getTime();
                        const gapHours = Math.floor(timeGap / (60 * 60 * 1000));
                        const gapMinutes = Math.floor(
                          (timeGap % (60 * 60 * 1000)) / (60 * 1000)
                        );

                        return (
                          <p className="text-blue-600">
                            Time window: {gapHours > 0 ? `${gapHours}h ` : ''}
                            {gapMinutes}m
                            {formData.duration > 0 && (
                              <span className="text-gray-500 ml-2">
                                (Assessment duration: {formData.duration}m)
                              </span>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Requirements Info */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Date Validation Requirements:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>
                      • If both start and end dates are set, end date must be at
                      least {formData.duration || 'duration'} minute
                      {(formData.duration || 1) !== 1 ? 's' : ''} after start
                      date
                    </li>
                    <li>
                      • Minimum gap between start and end dates: 30 minutes
                    </li>
                    <li>
                      • Duration is displayed in both minutes and hours for
                      clarity
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Assessment Sections
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingSection(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </CardTitle>
              <CardDescription>
                Create sections to organize your questions by topic or subject
                area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Section Form */}
              {isAddingSection && (
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                  <Input
                    placeholder="Enter section name (e.g., Mathematics, Physics)"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSection()}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addSection}
                    disabled={!newSection.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingSection(false);
                      setNewSection('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Sections List */}
              {sections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sections.map((section) => (
                    <div
                      key={section}
                      className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                    >
                      <span className="font-medium text-blue-900">
                        {section}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(section)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No sections created yet.</p>
                  <p className="text-sm">
                    Create sections to organize your questions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Assessment Questions
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges() && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      {
                        editableQuestions.filter(
                          (q) =>
                            questionSaveStatus[q._id] === 'pending' ||
                            questionSaveStatus[q._id] === 'error'
                        ).length
                      }{' '}
                      unsaved changes
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={saveAllQuestions}
                    disabled={!hasUnsavedChanges()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save All Questions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingQuestions(!isEditingQuestions)}
                  >
                    {isEditingQuestions ? 'View Mode' : 'Edit Mode'}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Manage assessment questions and their options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditQuestionsManagement
                assessmentId={assessmentId}
                editableQuestions={editableQuestions}
                setEditableQuestions={setEditableQuestions}
                sections={sections}
                isEditingQuestions={isEditingQuestions}
                setIsEditingQuestions={setIsEditingQuestions}
                editingQuestionIndex={editingQuestionIndex}
                setEditingQuestionIndex={setEditingQuestionIndex}
                questionSaveStatus={questionSaveStatus}
                assessmentType={formData.type}
                onAddNewQuestion={addNewQuestion}
                onRemoveQuestion={removeQuestion}
                onQuestionChange={handleQuestionChange}
                onOptionChange={handleOptionChange}
                onAddOption={addOption}
                onRemoveOption={removeOption}
                onUpdateQuestion={handleUpdateQuestion}
              />
            </CardContent>
          </Card>

          {/* Coding Questions Management */}
          <EditCodingQuestionsManagement
            formData={formData}
            onInputChange={handleInputChange}
            sections={sections}
          />

          {/* User Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>User Assignment</CardTitle>
              <CardDescription>
                Select users to assign this assessment to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Assign Specific Users</Label>
                  <div className="relative w-80">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search users or browse all available users..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setUserSearchQuery(query);

                          // Clear existing timeout
                          if (searchTimeout) {
                            clearTimeout(searchTimeout);
                          }

                          // Set new timeout for debounced search
                          const timeout = setTimeout(() => {
                            handleSearchChange(query);
                          }, 200); // 200ms delay

                          setSearchTimeout(timeout);
                        }}
                        onFocus={handleUserSearchFocus}
                        onBlur={handleUserSearchBlur}
                        className="pl-10 pr-10"
                      />
                      {userSearchQuery && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserSearchQuery('');
                            setSearchResults([]);
                            setIsUserSearchOpen(false);
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {isUserSearchOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.length > 0 && (
                          <>
                            {!userSearchQuery.trim() && (
                              <div className="p-2 bg-gray-50 border-b border-gray-200">
                                <p className="text-xs text-gray-500 font-medium">
                                  Available Users
                                </p>
                              </div>
                            )}
                            {searchResults.map((user) => (
                              <div
                                key={user._id}
                                className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  addUser(user._id, user);
                                }}
                              >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {user.firstName[0]}
                                    {user.lastName[0]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {user.firstName} {user.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Loading State */}
                        {isSearching && (
                          <div className="p-3">
                            <div className="flex items-center justify-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-gray-500">
                                Searching...
                              </span>
                            </div>
                          </div>
                        )}

                        {/* No Results Message */}
                        {!isSearching &&
                          userSearchQuery &&
                          searchResults.length === 0 && (
                            <div className="p-3">
                              <p className="text-gray-500 text-center">
                                No users found
                              </p>
                            </div>
                          )}

                        {/* Show message when no users available */}
                        {!isSearching &&
                          !userSearchQuery.trim() &&
                          searchResults.length === 0 && (
                            <div className="p-3">
                              <p className="text-gray-500 text-center">
                                No available users to assign
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Users List */}
                {formData.assignedUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Assigned Users ({formData.assignedUsers.length})
                    </Label>
                    <div className="space-y-2">
                      {formData.assignedUsers.map((userId, index) => {
                        // First try to find user in the users list
                        let user: any = users?.data?.find(
                          (u: any) => u._id === userId
                        );

                        if (!user) {
                          user = userDetailsMap.get(userId);
                        }

                        if (!user && assessment?.assignedUsers) {
                          user = assessment.assignedUsers.find(
                            (u: any) => u._id === userId
                          );
                        }

                        return user ? (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
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
                                <p className="text-sm text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUser(userId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-500">
                                  ?
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500">
                                  User ID: {userId}
                                </p>
                                <p className="text-sm text-gray-400">
                                  User details not available
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUser(userId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invited Users */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Users by Email</CardTitle>
              <CardDescription>
                Invite users by email address. They will receive an invitation
                email to register and join the assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label>Add Email Address</Label>
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newInvitedEmail}
                    onChange={(e) => setNewInvitedEmail(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInvitedUser();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addInvitedUser}
                    disabled={!newInvitedEmail}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Bulk Import Emails</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    id="file-upload"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById('file-upload')?.click()
                    }
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Upload a .txt file with one email address per line
                </p>
              </div>

              {/* Invited Users List */}
              {formData.invitedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Invited Users ({formData.invitedUsers.length})</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                    {formData.invitedUsers.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg bg-blue-50"
                      >
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{email}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInvitedUser(email)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* College Selection with Table UI */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Building2 className="h-4 w-4 mr-2 text-gray-600" />
                College-Based Assignment
              </CardTitle>
              <CardDescription>
                Select colleges and optionally filter by specific branches and
                years. Users matching the criteria will be automatically
                assigned.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* College Selection Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="grid grid-cols-12 gap-4 font-medium text-sm">
                    <div className="col-span-1">Select</div>
                    <div className="col-span-4">College Name</div>
                    <div className="col-span-4">Branches (Optional)</div>
                    <div className="col-span-3">Years (Optional)</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {colleges?.data?.map((college: any) => {
                    const isSelected = formData.colleges.some(
                      (sc) => sc._id === college._id
                    );
                    const selectedCollege = formData.colleges.find(
                      (sc) => sc._id === college._id
                    );

                    return (
                      <div
                        key={college._id}
                        className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Select Checkbox */}
                          <div className="col-span-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleInputChange('colleges', [
                                    ...formData.colleges,
                                    {
                                      _id: college._id,
                                      branches: [],
                                      year: [],
                                    },
                                  ]);
                                } else {
                                  handleInputChange(
                                    'colleges',
                                    formData.colleges.filter(
                                      (sc) => sc._id !== college._id
                                    )
                                  );
                                }
                              }}
                            />
                          </div>

                          {/* College Name */}
                          <div className="col-span-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{college.name}</p>
                                <p className="text-xs text-gray-500">
                                  {college.branches?.length || 0} branches
                                  available
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Branch Selection */}
                          <div className="col-span-4">
                            {isSelected ? (
                              <div className="space-y-2">
                                <Select
                                  onValueChange={(branchId) => {
                                    const currentBranches =
                                      selectedCollege?.branches || [];
                                    const branch = college.branches?.find(
                                      (b: any) => b._id === branchId
                                    );
                                    if (
                                      branch &&
                                      !currentBranches.some(
                                        (b) => b._id === branchId
                                      )
                                    ) {
                                      const updatedColleges =
                                        formData.colleges.map((sc) =>
                                          sc._id === college._id
                                            ? {
                                                ...sc,
                                                branches: [
                                                  ...currentBranches,
                                                  {
                                                    _id: branch._id,
                                                    name: branch.name,
                                                  },
                                                ],
                                              }
                                            : sc
                                        );
                                      handleInputChange(
                                        'colleges',
                                        updatedColleges
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder="All branches" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {college.branches?.map((branch: any) => (
                                      <SelectItem
                                        key={branch._id}
                                        value={branch._id}
                                      >
                                        {branch.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* Selected Branches */}
                                {selectedCollege?.branches &&
                                  selectedCollege.branches.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {selectedCollege.branches.map(
                                        (branch: any) => (
                                          <div
                                            key={branch._id}
                                            className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                          >
                                            <span>{branch.name}</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const updatedColleges =
                                                  formData.colleges.map((sc) =>
                                                    sc._id === college._id
                                                      ? {
                                                          ...sc,
                                                          branches:
                                                            sc.branches?.filter(
                                                              (b) =>
                                                                b._id !==
                                                                branch._id
                                                            ) || [],
                                                        }
                                                      : sc
                                                  );
                                                handleInputChange(
                                                  'colleges',
                                                  updatedColleges
                                                );
                                              }}
                                              className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Select college first
                              </span>
                            )}
                          </div>

                          {/* Year Selection */}
                          <div className="col-span-3">
                            {isSelected ? (
                              <div className="space-y-2">
                                <Select
                                  onValueChange={(year) => {
                                    const yearNum = parseInt(year);
                                    const currentYears =
                                      selectedCollege?.year || [];
                                    if (!currentYears.includes(yearNum)) {
                                      const updatedColleges =
                                        formData.colleges.map((sc) =>
                                          sc._id === college._id
                                            ? {
                                                ...sc,
                                                year: [
                                                  ...currentYears,
                                                  yearNum,
                                                ],
                                              }
                                            : sc
                                        );
                                      handleInputChange(
                                        'colleges',
                                        updatedColleges
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder="All years" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map((year) => (
                                      <SelectItem
                                        key={year}
                                        value={year.toString()}
                                      >
                                        Year {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* Selected Years */}
                                {selectedCollege?.year &&
                                  selectedCollege.year.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {selectedCollege.year.map(
                                        (year: number) => (
                                          <div
                                            key={year}
                                            className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                                          >
                                            <span>Year {year}</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const updatedColleges =
                                                  formData.colleges.map((sc) =>
                                                    sc._id === college._id
                                                      ? {
                                                          ...sc,
                                                          year:
                                                            sc.year?.filter(
                                                              (y) => y !== year
                                                            ) || [],
                                                        }
                                                      : sc
                                                  );
                                                handleInputChange(
                                                  'colleges',
                                                  updatedColleges
                                                );
                                              }}
                                              className="ml-1 h-4 w-4 p-0 hover:bg-green-200"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Select college first
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary of Selected Colleges */}
              {formData.colleges.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Assignment Summary
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Users from the following colleges will be automatically
                    assigned to this assessment:
                  </p>
                  <div className="space-y-2">
                    {formData.colleges.map((selectedCollege) => {
                      const college = colleges?.data?.find(
                        (c: any) => c._id === selectedCollege._id
                      );
                      return college ? (
                        <div
                          key={selectedCollege._id}
                          className="bg-white p-3 rounded border"
                        >
                          <div className="font-medium">{college.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>Branches: </span>
                            {selectedCollege.branches &&
                            selectedCollege.branches.length > 0 ? (
                              <span>
                                {selectedCollege.branches
                                  .map((branch: any) => branch.name)
                                  .join(', ')}
                              </span>
                            ) : (
                              <span className="text-blue-600">
                                All branches
                              </span>
                            )}
                            <span className="mx-2">|</span>
                            <span>Years: </span>
                            {selectedCollege.year &&
                            selectedCollege.year.length > 0 ? (
                              <span>
                                {selectedCollege.year
                                  .map((y: number) => `Year ${y}`)
                                  .join(', ')}
                              </span>
                            ) : (
                              <span className="text-blue-600">All years</span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure additional assessment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange('isActive', checked)
                  }
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Make assessment active and available to users
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (hasUnsavedChanges()) {
                  if (
                    confirm(
                      'You have unsaved changes. Are you sure you want to leave?'
                    )
                  ) {
                    router.push('/admin/assessments');
                  }
                } else {
                  router.push('/admin/assessments');
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Floating Scroll Buttons */}
      {showScrollButtons && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          <Button
            onClick={scrollToTop}
            size="sm"
            className="rounded-full h-12 w-12 p-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
            title="Scroll to top"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            onClick={scrollToBottom}
            size="sm"
            className="rounded-full h-12 w-12 p-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
            title="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
