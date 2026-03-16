'use client';

import React, { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  AlertCircle,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Edit,
  Users,
  Building2,
  Search,
  Sun,
  Cloud,
  Code,
  BookOpen,
  GraduationCap,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings,
  Tag,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import { codeExecutionApi } from '@/lib/api/codeExecution';
import { userAPI } from '@/lib/api/users';
import { collegesApi } from '@/lib/api/colleges';
import {
  CreateTestData,
  TestDifficulty,
  TestStatus,
  TestCaseFormData,
  TestInputFormData,
  Language,
} from '@/lib/types/test';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TestInputEditor } from './TestInputEditor';
import { TestCaseDisplay } from './TestCaseDisplay';

// Error types for better error handling
interface FieldError {
  field: string;
  message: string;
}

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

interface ErrorState {
  general: string | null;
  fieldErrors: FieldError[];
  apiError: ApiError | null;
  isNetworkError: boolean;
  isOffline: boolean;
}

export function CreateTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [formData, setFormData] = useState<CreateTestData>({
    title: '',
    problemStatement: '',
    difficulty: TestDifficulty.EASY,
    tags: [],
    colleges: [],
    assignedUsers: [],
    assignAllUsers: false,
    testCases: [],
    constraints: '',
    allowedLanguages: [],
    starterCode: {},
    executeCodeName: '',
    status: TestStatus.DRAFT,
  });
  const [newTag, setNewTag] = useState('');
  const [newTestCase, setNewTestCase] = useState<TestCaseFormData>({
    inputs: [],
    expectedOutput: '',
    isHidden: false,
    outputFormat: 'array',
  });

  // Edit test case state
  const [editingTestCaseIndex, setEditingTestCaseIndex] = useState<
    number | null
  >(null);
  const [editingTestCase, setEditingTestCase] = useState<TestCaseFormData>({
    inputs: [],
    expectedOutput: '',
    isHidden: false,
    outputFormat: 'array',
  });
  const [starterCode, setStarterCode] = useState<Record<string, string>>({});

  // Error state management
  const [errorState, setErrorState] = useState<ErrorState>({
    general: null,
    fieldErrors: [],
    apiError: null,
    isNetworkError: false,
    isOffline: false,
  });

  // User assignment state
  const [users, setUsers] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);

  // Online/offline detection
  React.useEffect(() => {
    const handleOnline = () => {
      setErrorState((prev) => ({
        ...prev,
        isOffline: false,
        isNetworkError: false,
      }));
    };

    const handleOffline = () => {
      setErrorState((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    loadLanguages();
    loadUsers();
    loadColleges();
  }, []);

  // Initialize starter code for selected languages
  React.useEffect(() => {
    if (languages.length > 0 && formData.allowedLanguages.length > 0) {
      const newStarterCode: Record<string, string> = {};
      formData.allowedLanguages.forEach((languageId) => {
        const languageIdStr = languageId.toString();
        if (!starterCode[languageIdStr]) {
          newStarterCode[languageIdStr] = getDefaultStarterCode(languageId);
        }
      });

      if (Object.keys(newStarterCode).length > 0) {
        setStarterCode((prev) => ({ ...prev, ...newStarterCode }));
        setFormData((prev) => ({
          ...prev,
          starterCode: { ...prev.starterCode, ...newStarterCode },
        }));
      }
    }
  }, [languages, formData.allowedLanguages]);

  // Error handling utilities
  const clearErrors = () => {
    setErrorState({
      general: null,
      fieldErrors: [],
      apiError: null,
      isNetworkError: false,
      isOffline: false,
    });
  };

  const setFieldError = (field: string, message: string) => {
    setErrorState((prev) => ({
      ...prev,
      fieldErrors: prev.fieldErrors
        .filter((e) => e.field !== field)
        .concat({ field, message }),
    }));
  };

  const clearFieldError = (field: string) => {
    setErrorState((prev) => ({
      ...prev,
      fieldErrors: prev.fieldErrors.filter((e) => e.field !== field),
    }));
  };

  const getFieldError = (field: string) => {
    return errorState.fieldErrors.find((e) => e.field === field)?.message;
  };

  const handleApiError = (error: any) => {
    console.error('API Error:', error);

    let errorMessage = 'An unexpected error occurred';
    let isNetworkError = false;
    let apiError: ApiError | null = null;

    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      isNetworkError = true;
      errorMessage =
        'Network connection failed. Please check your internet connection.';
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      if (status === 400) {
        errorMessage =
          data?.message || 'Invalid request. Please check your input.';
        if (data?.errors) {
          const fieldErrors = Object.entries(data.errors).map(
            ([field, messages]) => ({
              field,
              message: Array.isArray(messages) ? messages[0] : messages,
            })
          );
          setErrorState((prev) => ({ ...prev, fieldErrors }));
        }
      } else if (status === 401) {
        errorMessage = 'You are not authorized to perform this action.';
      } else if (status === 403) {
        errorMessage =
          'Access denied. You do not have permission to create tests.';
      } else if (status === 409) {
        errorMessage =
          'A test with this title already exists. Please choose a different title.';
      } else if (status === 422) {
        errorMessage = 'Validation failed. Please check your input.';
        if (data?.errors) {
          const fieldErrors = Object.entries(data.errors).map(
            ([field, messages]) => ({
              field,
              message: Array.isArray(messages) ? messages[0] : messages,
            })
          );
          setErrorState((prev) => ({ ...prev, fieldErrors }));
        }
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = data?.message || `Request failed with status ${status}`;
      }

      apiError = {
        message: errorMessage,
        code: status.toString(),
        details: data,
      };
    } else if (error.message) {
      errorMessage = error.message;
    }

    setErrorState((prev) => ({
      ...prev,
      general: errorMessage,
      apiError,
      isNetworkError,
    }));

    toast.error(errorMessage);
  };

  const loadLanguages = async () => {
    try {
      clearErrors();
      const languagesData = await codeExecutionApi.getLanguages();
      setLanguages(languagesData);
    } catch (error) {
      handleApiError(error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({ limit: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const loadColleges = async () => {
    try {
      const response = await collegesApi.getColleges({ limit: 100 });
      setColleges(response.data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const validateForm = (): boolean => {
    clearErrors();
    const fieldErrors: FieldError[] = [];

    if (!formData.title.trim()) {
      fieldErrors.push({ field: 'title', message: 'Title is required' });
    } else if (formData.title.trim().length < 3) {
      fieldErrors.push({
        field: 'title',
        message: 'Title must be at least 3 characters long',
      });
    }

    if (!formData.problemStatement.trim()) {
      fieldErrors.push({
        field: 'problemStatement',
        message: 'Problem statement is required',
      });
    } else if (formData.problemStatement.trim().length < 20) {
      fieldErrors.push({
        field: 'problemStatement',
        message: 'Problem statement must be at least 20 characters long',
      });
    }

    if (!formData.constraints.trim()) {
      fieldErrors.push({
        field: 'constraints',
        message: 'Constraints are required',
      });
    }

    if (formData.testCases.length === 0) {
      fieldErrors.push({
        field: 'testCases',
        message: 'At least one test case is required',
      });
    }

    if (formData.allowedLanguages.length === 0) {
      fieldErrors.push({
        field: 'allowedLanguages',
        message: 'At least one programming language must be allowed',
      });
    }

    // Check for empty starter code
    const emptyStarterCode = formData.allowedLanguages.some((langId) => {
      const code = formData.starterCode?.[langId.toString()];
      return !code || code.trim() === '';
    });

    if (emptyStarterCode) {
      fieldErrors.push({
        field: 'starterCode',
        message: 'Starter code is required for all selected languages',
      });
    }

    if (fieldErrors.length > 0) {
      setErrorState((prev) => ({ ...prev, fieldErrors }));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      clearErrors();

      // Validate form
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Check if offline
      if (errorState.isOffline) {
        setErrorState((prev) => ({
          ...prev,
          general:
            'You are currently offline. Please check your internet connection and try again.',
        }));
        setLoading(false);
        return;
      }

      // Normalize applicableLanguages: empty array means all languages
      const normalizedFormData = {
        ...formData,
        testCases: formData.testCases.map((testCase) => ({
          ...testCase,
          inputs: testCase.inputs.map((input) => ({
            ...input,
            applicableLanguages:
              !input.applicableLanguages ||
              input.applicableLanguages.length === 0
                ? formData.allowedLanguages
                : input.applicableLanguages,
          })),
        })),
      };

      await testAPI.createTest(normalizedFormData);
      toast.success('Test created successfully! 🎉');
      router.push('/admin/tests');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const retrySubmit = () => {
    handleSubmit();
  };

  const retryLoadLanguages = () => {
    loadLanguages();
  };

  // Real-time validation
  const validateField = (field: string, value: string) => {
    clearFieldError(field);

    switch (field) {
      case 'title':
        if (!value.trim()) {
          setFieldError(field, 'Title is required');
        } else if (value.trim().length < 3) {
          setFieldError(field, 'Title must be at least 3 characters long');
        }
        break;
      case 'description':
        if (!value.trim()) {
          setFieldError(field, 'Description is required');
        } else if (value.trim().length < 10) {
          setFieldError(
            field,
            'Description must be at least 10 characters long'
          );
        }
        break;
      case 'problemStatement':
        if (!value.trim()) {
          setFieldError(field, 'Problem statement is required');
        } else if (value.trim().length < 20) {
          setFieldError(
            field,
            'Problem statement must be at least 20 characters long'
          );
        }
        break;
      case 'constraints':
        if (!value.trim()) {
          setFieldError(field, 'Constraints are required');
        }
        break;
      case 'executeCodeName':
        if (!value.trim()) {
          setFieldError(field, 'Execute code name is required');
        } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value.trim())) {
          setFieldError(
            field,
            'Execute code name must be a valid identifier (letters, numbers, underscore, starting with letter or underscore)'
          );
        }
        break;
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addTestCase = () => {
    if (newTestCase.inputs.length > 0 && newTestCase.expectedOutput.trim()) {
      setFormData((prev) => ({
        ...prev,
        testCases: [
          ...prev.testCases,
          {
            inputs: newTestCase.inputs,
            expectedOutput: newTestCase.expectedOutput.trim(),
            isHidden: newTestCase.isHidden,
            outputFormat: newTestCase.outputFormat,
          },
        ],
      }));
      setNewTestCase({
        inputs: [],
        expectedOutput: '',
        isHidden: false,
        outputFormat: 'array',
      });
    }
  };

  const removeTestCase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const startEditingTestCase = (index: number) => {
    const testCase = formData.testCases[index];
    if (testCase) {
      setEditingTestCaseIndex(index);
      setEditingTestCase({
        inputs: (testCase.inputs || []).map((input) => ({
          value: input.value,
          order: input.order,
          inputFormat: (input.inputFormat || 'array') as
            | 'array'
            | 'string'
            | 'number'
            | 'object'
            | 'mixed',
          applicableLanguages: input.applicableLanguages || [],
        })),
        expectedOutput: testCase.expectedOutput,
        isHidden: testCase.isHidden,
        outputFormat: testCase.outputFormat || 'array',
      });
    }
  };

  const saveEditingTestCase = () => {
    if (
      editingTestCaseIndex !== null &&
      editingTestCase.inputs.length > 0 &&
      editingTestCase.expectedOutput.trim()
    ) {
      setFormData((prev) => ({
        ...prev,
        testCases: prev.testCases.map((tc, index) =>
          index === editingTestCaseIndex ? editingTestCase : tc
        ),
      }));
      setEditingTestCaseIndex(null);
      setEditingTestCase({
        inputs: [],
        expectedOutput: '',
        isHidden: false,
        outputFormat: 'array',
      });
    }
  };

  const cancelEditingTestCase = () => {
    setEditingTestCaseIndex(null);
    setEditingTestCase({
      inputs: [],
      expectedOutput: '',
      isHidden: false,
      outputFormat: 'array',
    });
  };
  const toggleLanguage = (languageId: number) => {
    setFormData((prev) => {
      const isCurrentlySelected = prev.allowedLanguages.includes(languageId);
      const newAllowedLanguages = isCurrentlySelected
        ? prev.allowedLanguages.filter((id) => id !== languageId)
        : [...prev.allowedLanguages, languageId];

      // If adding a new language, initialize its starter code
      if (!isCurrentlySelected) {
        const defaultCode = getDefaultStarterCode(languageId);
        setStarterCode((starterPrev) => ({
          ...starterPrev,
          [languageId.toString()]: defaultCode,
        }));
      }

      return {
        ...prev,
        allowedLanguages: newAllowedLanguages,
        starterCode: {
          ...prev.starterCode,
          ...(isCurrentlySelected
            ? {}
            : { [languageId.toString()]: getDefaultStarterCode(languageId) }),
        },
      };
    });
  };

  const updateStarterCode = (languageId: number, code: string) => {
    const languageIdStr = languageId.toString();
    setStarterCode((prev) => ({
      ...prev,
      [languageIdStr]: code,
    }));
    setFormData((prev) => ({
      ...prev,
      starterCode: {
        ...prev.starterCode,
        [languageIdStr]: code,
      },
    }));
  };

  const getDefaultStarterCode = (languageId: number): string => {
    // Get the function name from executeCodeName, default to 'solution'
    const functionName = formData.executeCodeName || 'solution';

    switch (languageId) {
      case 71: // Python
        return `class Solution:
    def ${functionName}(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        return []`;

      case 63: // JavaScript (Node.js)
        return `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var ${functionName} = function(nums, target) {
    // Write your code here
    return [];
};`;

      case 62: // Java
        return `class Solution {
    public int[] ${functionName}(int[] nums, int target) {
        // Write your code here
        return new int[0];
    }
}`;

      case 52: // C++
        return `class Solution {
public:
    vector<int> ${functionName}(vector<int>& nums, int target) {
        // Write your code here
        return {};
    }
};`;

      case 48: // C
        return `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* ${functionName}(int* nums, int numsSize, int target, int* returnSize) {
    // Write your code here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    return result;
}`;

      default:
        const language = languages.find((lang) => lang.id === languageId);
        return language?.sample_code || '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
        <Sun className="h-40 w-40 text-orange-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
        <Cloud className="h-40 w-40 text-sky-300" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                Test Creation
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/tests">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Tests
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Create New Test
                </h1>
                <p className="text-gray-500 mt-1">
                  Create a new coding test with test cases and examples
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/tests')}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || errorState.isOffline}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errorState.general && (
          <Alert
            variant="destructive"
            className="mb-6 animate-in slide-in-from-top-2 duration-300 border-red-200 bg-red-50"
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between text-red-700">
              <span>{errorState.general}</span>
              <div className="flex gap-2">
                {errorState.isNetworkError && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retrySubmit}
                    className="h-8 border-red-200 hover:bg-red-100 text-red-700 rounded-lg"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearErrors}
                  className="h-8 p-1 text-red-700 hover:bg-red-100 rounded-lg"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Warning */}
        {errorState.isOffline && (
          <Alert className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <WifiOff className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-800">You're offline</AlertTitle>
            <AlertDescription className="text-orange-700">
              Please check your internet connection. Some features may not be
              available.
            </AlertDescription>
          </Alert>
        )}

        {/* Network Error */}
        {errorState.isNetworkError && !errorState.isOffline && (
          <Alert
            variant="destructive"
            className="mb-6 animate-in slide-in-from-top-2 duration-300 border-red-200 bg-red-50"
          >
            <Wifi className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-800">Network Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between text-red-700">
              <span>
                Unable to connect to the server. Please check your connection and
                try again.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={retrySubmit}
                className="h-8 border-red-200 hover:bg-red-100 text-red-700 rounded-lg"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Languages Loading Error */}
        {languages.length === 0 && errorState.apiError && (
          <Alert
            variant="destructive"
            className="mb-6 animate-in slide-in-from-top-2 duration-300 border-red-200 bg-red-50"
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-800">Failed to load programming languages</AlertTitle>
            <AlertDescription className="flex items-center justify-between text-red-700">
              <span>
                Unable to load the list of supported programming languages.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={retryLoadLanguages}
                className="h-8 border-red-200 hover:bg-red-100 text-red-700 rounded-lg"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Basic Information</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                  Provide the basic details for your test
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      Title <span className="text-sky-400">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }));
                        validateField('title', e.target.value);
                      }}
                      placeholder="Enter test title"
                      className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm ${
                        getFieldError('title') ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                    />
                    {getFieldError('title') && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError('title')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      Difficulty <span className="text-sky-400">*</span>
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: value as TestDifficulty,
                        }))
                      }
                    >
                      <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TestDifficulty.EASY}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            Easy
                          </div>
                        </SelectItem>
                        <SelectItem value={TestDifficulty.MEDIUM}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value={TestDifficulty.HARD}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Hard
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemStatement" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    Problem Statement <span className="text-sky-400">*</span>
                  </Label>
                  <Textarea
                    id="problemStatement"
                    value={formData.problemStatement}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        problemStatement: e.target.value,
                      }));
                      validateField('problemStatement', e.target.value);
                    }}
                    placeholder="Enter the problem statement"
                    rows={8}
                    className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none ${
                      getFieldError('problemStatement') ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {getFieldError('problemStatement') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getFieldError('problemStatement')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constraints" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    Constraints <span className="text-sky-400">*</span>
                  </Label>
                  <Textarea
                    id="constraints"
                    value={formData.constraints}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        constraints: e.target.value,
                      }));
                      validateField('constraints', e.target.value);
                    }}
                    placeholder="Enter constraints (e.g., 1 <= n <= 1000)"
                    rows={3}
                    className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none ${
                      getFieldError('constraints') ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {getFieldError('constraints') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getFieldError('constraints')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="executeCodeName" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    Execute Code Name <span className="text-sky-400">*</span>
                  </Label>
                  <Input
                    id="executeCodeName"
                    type="text"
                    value={formData.executeCodeName}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        executeCodeName: e.target.value,
                      }));
                      validateField('executeCodeName', e.target.value);
                    }}
                    placeholder="e.g., threeSum, Solution"
                    className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm ${
                      getFieldError('executeCodeName') ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {getFieldError('executeCodeName') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getFieldError('executeCodeName')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                    The name of the function or class that will be executed for testing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-sky-400" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button 
                      onClick={addTag} 
                      size="sm"
                      className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-4"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-gradient-to-r from-sky-50 to-orange-50 text-sky-700 border-sky-200 cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors px-3 py-1 rounded-lg"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Cases */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Test Cases</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                  Add test cases to validate user solutions
                </CardDescription>
                {getFieldError('testCases') && (
                  <Alert variant="destructive" className="mt-2 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs text-red-700">
                      {getFieldError('testCases')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Add new test case */}
                <Card className="border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30 overflow-hidden">
                  <CardHeader className="py-3 px-4 border-b border-sky-100">
                    <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 text-sky-500" />
                      Add Test Case
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <TestInputEditor
                      inputs={newTestCase.inputs}
                      onChange={(inputs) =>
                        setNewTestCase((prev) => ({
                          ...prev,
                          inputs,
                        }))
                      }
                      allowedLanguages={formData.allowedLanguages}
                      languageNames={languages.reduce(
                        (acc, lang) => {
                          acc[lang.id] = lang.name;
                          return acc;
                        },
                        {} as Record<number, string>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="testCaseOutput" className="text-xs font-medium text-gray-500">
                          Expected Output *
                        </Label>
                        <Textarea
                          id="testCaseOutput"
                          value={newTestCase.expectedOutput}
                          onChange={(e) =>
                            setNewTestCase((prev) => ({
                              ...prev,
                              expectedOutput: e.target.value,
                            }))
                          }
                          placeholder="Expected output"
                          rows={3}
                          className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="outputFormat" className="text-xs font-medium text-gray-500">
                          Output Format
                        </Label>
                        <Select
                          value={newTestCase.outputFormat}
                          onValueChange={(
                            value:
                              | 'array'
                              | 'string'
                              | 'number'
                              | 'boolean'
                              | 'object'
                          ) =>
                            setNewTestCase((prev) => ({
                              ...prev,
                              outputFormat: value,
                            }))
                          }
                        >
                          <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                            <SelectValue placeholder="Select output format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="array">Array</SelectItem>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isHidden"
                          checked={newTestCase.isHidden}
                          onCheckedChange={(checked) =>
                            setNewTestCase((prev) => ({
                              ...prev,
                              isHidden: checked as boolean,
                            }))
                          }
                          className="rounded border-sky-300 text-sky-500"
                        />
                        <Label htmlFor="isHidden" className="text-xs text-gray-600">Hidden test case</Label>
                      </div>
                    </div>

                    <Button 
                      onClick={addTestCase} 
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl py-2.5 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Test Case
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing test cases */}
                {formData.testCases.map((testCase, index) => (
                  <div key={index} className="relative border border-sky-100 rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    {editingTestCaseIndex === index ? (
                      // Edit form
                      <div className="p-4 space-y-4">
                        <TestInputEditor
                          inputs={editingTestCase.inputs}
                          onChange={(inputs) =>
                            setEditingTestCase((prev) => ({
                              ...prev,
                              inputs,
                            }))
                          }
                          allowedLanguages={formData.allowedLanguages}
                          languageNames={languages.reduce(
                            (acc, lang) => {
                              acc[lang.id] = lang.name;
                              return acc;
                            },
                            {} as Record<number, string>
                          )}
                        />
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-expected-output-${index}`} className="text-xs font-medium text-gray-500">
                              Expected Output *
                            </Label>
                            <Input
                              id={`edit-expected-output-${index}`}
                              value={editingTestCase.expectedOutput}
                              onChange={(e) =>
                                setEditingTestCase((prev) => ({
                                  ...prev,
                                  expectedOutput: e.target.value,
                                }))
                              }
                              placeholder="Enter expected output"
                              className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-hidden-${index}`}
                              checked={editingTestCase.isHidden}
                              onCheckedChange={(checked) =>
                                setEditingTestCase((prev) => ({
                                  ...prev,
                                  isHidden: checked as boolean,
                                }))
                              }
                              className="rounded border-sky-300 text-sky-500"
                            />
                            <Label htmlFor={`edit-hidden-${index}`} className="text-xs text-gray-600">
                              Hidden test case
                            </Label>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-output-format-${index}`} className="text-xs font-medium text-gray-500">
                              Output Format
                            </Label>
                            <Select
                              value={editingTestCase.outputFormat}
                              onValueChange={(value: any) =>
                                setEditingTestCase((prev) => ({
                                  ...prev,
                                  outputFormat: value,
                                }))
                              }
                            >
                              <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="array">Array</SelectItem>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={saveEditingTestCase} 
                              size="sm"
                              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg px-4 py-2 text-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelEditingTestCase}
                              size="sm"
                              className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg px-4 py-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <>
                        <TestCaseDisplay
                          testCase={testCase}
                          index={index}
                          languageNames={languages.reduce(
                            (acc, lang) => {
                              acc[lang.id] = lang.name;
                              return acc;
                            },
                            {} as Record<number, string>
                          )}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingTestCase(index)}
                            className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg h-8 w-8 p-0"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTestCase(index)}
                            className="border-red-200 hover:bg-red-50 text-red-600 rounded-lg h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Settings</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                  Configure test settings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-medium text-gray-500">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as TestStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TestStatus.DRAFT}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          Draft
                        </div>
                      </SelectItem>
                      <SelectItem value={TestStatus.PUBLISHED}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Published
                        </div>
                      </SelectItem>
                      <SelectItem value={TestStatus.ARCHIVED}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                          Archived
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Allowed Languages */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Allowed Programming Languages</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                  Select which languages users can use
                </CardDescription>
                {getFieldError('allowedLanguages') && (
                  <Alert variant="destructive" className="mt-2 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs text-red-700">
                      {getFieldError('allowedLanguages')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2">
                  {languages.map((language) => (
                    <div
                      key={language.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 rounded-lg transition-colors"
                    >
                      <Checkbox
                        id={`lang-${language.id}`}
                        checked={formData.allowedLanguages.includes(language.id)}
                        onCheckedChange={() => toggleLanguage(language.id)}
                        className="rounded border-sky-300 text-sky-500"
                      />
                      <Label htmlFor={`lang-${language.id}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                        {language.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Starter Code */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Starter Code</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                  Provide starter code for each programming language.
                </CardDescription>
                <Alert className="mt-3 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-xs font-medium text-amber-800">Important Guidelines for Starter Code:</AlertTitle>
                  <AlertDescription className="mt-1 text-xs text-amber-700">
                    <div className="space-y-1">
                      <p>• <strong>Python/JavaScript/C++/C:</strong> Use function named exactly as specified in "Execute Code Name"</p>
                      <p>• <strong>Java:</strong> Always use "Solution" class with method named as "Execute Code Name"</p>
                      <p className="mt-1 font-medium">Note: The "Execute Code Name" field determines which function/method will be called during test execution.</p>
                    </div>
                  </AlertDescription>
                </Alert>
                {getFieldError('starterCode') && (
                  <Alert variant="destructive" className="mt-2 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs text-red-700">
                      {getFieldError('starterCode')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {formData.allowedLanguages.map((languageId) => {
                  const language = languages.find(
                    (lang) => lang.id === languageId
                  );
                  if (!language) return null;

                  return (
                    <div key={languageId} className="space-y-2">
                      <Label htmlFor={`starter-${languageId}`} className="text-xs font-medium text-gray-500">
                        {language.name} Starter Code
                      </Label>
                      <Textarea
                        id={`starter-${languageId}`}
                        value={
                          starterCode[languageId.toString()] ||
                          getDefaultStarterCode(languageId)
                        }
                        onChange={(e) =>
                          updateStarterCode(languageId, e.target.value)
                        }
                        placeholder={`Enter starter code for ${language.name}...`}
                        rows={6}
                        className="font-mono text-xs border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 resize-none"
                      />
                    </div>
                  );
                })}
                {formData.allowedLanguages.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Select programming languages first to add starter code.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-sky-100">
                    <span className="text-gray-500">Test Cases:</span>
                    <span className="font-medium text-gray-700">{formData.testCases.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-sky-100">
                    <span className="text-gray-500">Tags:</span>
                    <span className="font-medium text-gray-700">{formData.tags.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-sky-100">
                    <span className="text-gray-500">Languages:</span>
                    <span className="font-medium text-gray-700">{formData.allowedLanguages.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-sky-100">
                    <span className="text-gray-500">Colleges:</span>
                    <span className="font-medium text-gray-700">{formData.colleges?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Assigned Users:</span>
                    <span className="font-medium text-gray-700">
                      {formData.assignAllUsers
                        ? 'All Users'
                        : `${formData.assignedUsers?.length || 0} selected`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Assignment Card */}
        <Card className="border-sky-100 shadow-sm overflow-hidden mt-6">
          <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-500" />
              <CardTitle className="text-sm font-semibold text-gray-700">Test Assignment</CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
              Assign this test to users by college, branch, year, or specific users
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* College Selection with Table UI */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-sky-500" />
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College-Based Assignment (Optional)
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Select colleges and optionally filter by specific branches and years. Users matching the criteria will be automatically assigned.
              </p>

              {/* College Selection Table */}
              <div className="border border-sky-100 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-4 py-3 border-b border-sky-100">
                  <div className="grid grid-cols-12 gap-4 font-medium text-xs text-sky-700">
                    <div className="col-span-1">Select</div>
                    <div className="col-span-4">College Name</div>
                    <div className="col-span-4">Branches (Optional)</div>
                    <div className="col-span-3">Years (Optional)</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-sky-100">
                  {colleges.map((college) => {
                    const isSelected =
                      formData.colleges?.some((sc) => sc._id === college._id) ||
                      false;
                    const selectedCollege = formData.colleges?.find(
                      (sc) => sc._id === college._id
                    );

                    return (
                      <div
                        key={college._id}
                        className="px-4 py-3 hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Select Checkbox */}
                          <div className="col-span-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    colleges: [
                                      ...(prev.colleges || []),
                                      {
                                        _id: college._id,
                                        branches: [],
                                        year: [],
                                      },
                                    ],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    colleges: (prev.colleges || []).filter(
                                      (sc) => sc._id !== college._id
                                    ),
                                  }));
                                }
                              }}
                              className="rounded border-sky-300 text-sky-500"
                            />
                          </div>

                          {/* College Name */}
                          <div className="col-span-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-sky-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{college.name}</p>
                                <p className="text-xs text-gray-400">
                                  {college.branches?.length || 0} branches available
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
                                      const updatedColleges = (
                                        formData.colleges || []
                                      ).map((sc) =>
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
                                      setFormData((prev) => ({
                                        ...prev,
                                        colleges: updatedColleges,
                                      }));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8 text-xs border-sky-200 focus:border-sky-400 rounded-lg bg-white/80">
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
                                            className="flex items-center bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 px-2 py-1 rounded-lg text-xs border border-sky-200"
                                          >
                                            <span>{branch.name}</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const updatedColleges = (
                                                  formData.colleges || []
                                                ).map((sc) =>
                                                  sc._id === college._id
                                                    ? {
                                                        ...sc,
                                                        branches:
                                                          sc.branches?.filter(
                                                            (b) =>
                                                              b._id !== branch._id
                                                          ) || [],
                                                      }
                                                    : sc
                                                );
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  colleges: updatedColleges,
                                                }));
                                              }}
                                              className="ml-1 h-4 w-4 p-0 hover:bg-sky-200 rounded-full"
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
                              <span className="text-xs text-gray-400 italic">
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
                                      const updatedColleges = (
                                        formData.colleges || []
                                      ).map((sc) =>
                                        sc._id === college._id
                                          ? {
                                              ...sc,
                                              year: [...currentYears, yearNum],
                                            }
                                          : sc
                                      );
                                      setFormData((prev) => ({
                                        ...prev,
                                        colleges: updatedColleges,
                                      }));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8 text-xs border-sky-200 focus:border-sky-400 rounded-lg bg-white/80">
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
                                            className="flex items-center bg-gradient-to-r from-green-100 to-green-50 text-green-700 px-2 py-1 rounded-lg text-xs border border-green-200"
                                          >
                                            <span>Year {year}</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const updatedColleges = (
                                                  formData.colleges || []
                                                ).map((sc) =>
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
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  colleges: updatedColleges,
                                                }));
                                              }}
                                              className="ml-1 h-4 w-4 p-0 hover:bg-green-200 rounded-full"
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
                              <span className="text-xs text-gray-400 italic">
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
              {formData.colleges && formData.colleges.length > 0 && (
                <div className="bg-gradient-to-r from-sky-50 to-orange-50 p-4 rounded-xl border border-sky-100">
                  <h4 className="text-xs font-medium text-sky-700 mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Assignment Summary
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Users from the following colleges will be automatically assigned to this test:
                  </p>
                  <div className="space-y-2">
                    {formData.colleges.map((selectedCollege) => {
                      const college = colleges.find(
                        (c) => c._id === selectedCollege._id
                      );
                      return college ? (
                        <div
                          key={selectedCollege._id}
                          className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-sky-100"
                        >
                          <div className="text-sm font-medium text-gray-700">{college.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span>Branches: </span>
                            {selectedCollege.branches &&
                            selectedCollege.branches.length > 0 ? (
                              <span className="text-sky-600">
                                {selectedCollege.branches
                                  .map((branch: any) => branch.name)
                                  .join(', ')}
                              </span>
                            ) : (
                              <span className="text-sky-600">All branches</span>
                            )}
                            <span className="mx-2">|</span>
                            <span>Years: </span>
                            {selectedCollege.year &&
                            selectedCollege.year.length > 0 ? (
                              <span className="text-orange-600">
                                {selectedCollege.year
                                  .map((y: number) => `Year ${y}`)
                                  .join(', ')}
                              </span>
                            ) : (
                              <span className="text-orange-600">All years</span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Individual User Assignment */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-orange-500" />
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Individual User Assignment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignAllUsers"
                  checked={formData.assignAllUsers || false}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      assignAllUsers: checked as boolean,
                      assignedUsers: checked ? [] : prev.assignedUsers,
                    }));
                  }}
                  className="rounded border-sky-300 text-sky-500"
                />
                <Label
                  htmlFor="assignAllUsers"
                  className="text-sm text-gray-600 flex items-center gap-2"
                >
                  Assign to all users
                </Label>
              </div>

              {!formData.assignAllUsers && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">
                    Assigned Users: <span className="font-medium text-gray-700">{formData.assignedUsers?.length || 0} selected</span>
                  </Label>
                  <p className="text-xs text-gray-400">
                    Users will be assigned based on college selection above, or you can assign specific users here.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Test Creation v1.0</span>
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