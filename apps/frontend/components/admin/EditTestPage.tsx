'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  Edit,
  AlertCircle,
  Users,
  Building2,
  Search,
  X,
  Sun,
  Cloud,
  Code,
  BookOpen,
  GraduationCap,
  Tag,
  Settings,
  FileText,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import { codeExecutionApi } from '@/lib/api/codeExecution';
import { userAPI } from '@/lib/api/users';
import { collegesApi } from '@/lib/api/colleges';
import {
  Test,
  UpdateTestData,
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
import { Loading } from '@/components/ui/Loading';

interface EditTestPageProps {
  testId: string;
}

export function EditTestPage({ testId }: EditTestPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [test, setTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<UpdateTestData>({
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  // User assignment state
  const [users, setUsers] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    loadTest();
    loadLanguages();
    loadUsers();
    loadColleges();
  }, [testId]);

  // Initialize starter code when test data and languages are loaded
  useEffect(() => {
    // console.log('useEffect triggered:', {
    //   test: !!test,
    //   languagesLength: languages.length,
    //   allowedLanguages: formData.allowedLanguages,
    //   currentStarterCode: starterCode,
    //   formStarterCode: formData.starterCode,
    // });

    if (
      test &&
      languages.length > 0 &&
      formData.allowedLanguages &&
      formData.allowedLanguages.length > 0
    ) {
      const newStarterCode: Record<string, string> = {};
      let hasNewStarterCode = false;

      formData.allowedLanguages.forEach((languageId) => {
        const languageIdStr = languageId.toString();
        if (
          !starterCode[languageIdStr] &&
          !formData.starterCode?.[languageIdStr]
        ) {
          const defaultCode = getDefaultStarterCode(languageId);
          newStarterCode[languageIdStr] = defaultCode;
          hasNewStarterCode = true;
          // console.log(
          //   `Initializing starter code for language ${languageId}:`,
          //   defaultCode
          // );
        }
      });

      if (hasNewStarterCode) {
        // console.log('Setting new starter code:', newStarterCode);
        setStarterCode((prev) => ({ ...prev, ...newStarterCode }));
        setFormData((prev) => ({
          ...prev,
          starterCode: { ...prev.starterCode, ...newStarterCode },
        }));
      }
    }
  }, [test, languages, formData.allowedLanguages]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const testData = await testAPI.getTestById(testId);
      setTest(testData);
      setFormData({
        title: testData.title,
        problemStatement: testData.problemStatement,
        difficulty: testData.difficulty,
        tags: testData.tags,
        testCases: testData.testCases.map((tc) => {
          // Handle migration from old single input format to new multiple inputs format
          if (tc.inputs && Array.isArray(tc.inputs)) {
            // New format - already migrated
            return {
              inputs: tc.inputs.map((input) => ({
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
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
              outputFormat: tc.outputFormat || 'array',
            };
          } else {
            // Old format - migrate to new format
            return {
              inputs: [
                {
                  value: (tc as any).input || '',
                  order: 1,
                  inputFormat: (tc as any).inputFormat || 'array',
                  applicableLanguages: [],
                },
              ],
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
              outputFormat: tc.outputFormat || 'array',
            };
          }
        }),
        constraints: testData.constraints,
        allowedLanguages: testData.allowedLanguages,
        starterCode: testData.starterCode || {},
        executeCodeName: testData.executeCodeName || '',
        status: testData.status,
        colleges: (testData.colleges as any) || [],
        assignedUsers: testData.assignedUsers || [],
        assignAllUsers: testData.assignAllUsers || false,
      });

      // Initialize starter code state
      setStarterCode(testData.starterCode || {});
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('Failed to load test');
      router.push('/admin/tests');
    } finally {
      setLoading(false);
    }
  };

  const loadLanguages = async () => {
    try {
      const languagesData = await codeExecutionApi.getLanguages();
      setLanguages(languagesData);
    } catch (error) {
      console.error('Error loading languages:', error);
      toast.error('Failed to load programming languages');
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
    const newErrors: Record<string, string> = {};

    // Debug: Log form data
    // console.log('Validating form data:', formData);
    // console.log('Form data keys:', Object.keys(formData));
    // console.log('Form data values:', Object.values(formData));

    // Basic information validation
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.problemStatement?.trim()) {
      newErrors.problemStatement = 'Problem statement is required';
    } else if (formData.problemStatement.trim().length < 20) {
      newErrors.problemStatement =
        'Problem statement must be at least 20 characters long';
    }

    if (!formData.constraints?.trim()) {
      newErrors.constraints = 'Constraints are required';
    } else if (formData.constraints.trim().length < 10) {
      newErrors.constraints = 'Constraints must be at least 10 characters long';
    }

    if (!formData.executeCodeName?.trim()) {
      newErrors.executeCodeName = 'Execute code name is required';
    } else if (
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.executeCodeName.trim())
    ) {
      newErrors.executeCodeName =
        'Execute code name must be a valid identifier (letters, numbers, underscore, starting with letter or underscore)';
    }

    // Test cases validation
    if (!formData.testCases || formData.testCases.length === 0) {
      newErrors.testCases = 'At least one test case is required';
    } else {
      formData.testCases.forEach((testCase, index) => {
        if (!testCase.inputs || testCase.inputs.length === 0) {
          newErrors[`testCase_${index}_inputs`] = `Test case ${
            index + 1
          } must have at least one input`;
        }
        if (!testCase.expectedOutput.trim()) {
          newErrors[`testCase_${index}_output`] = `Test case ${
            index + 1
          } expected output is required`;
        }
      });
    }

    // Allowed languages validation
    if (!formData.allowedLanguages || formData.allowedLanguages.length === 0) {
      newErrors.allowedLanguages =
        'At least one programming language must be allowed';
    }

    // Tags validation
    if (formData.tags && formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }

    // Debug: Log validation errors
    // console.log('Validation errors:', newErrors);
    // console.log('Number of errors:', Object.keys(newErrors).length);

    // Show toast for each validation error
    if (Object.keys(newErrors).length > 0) {
      const fieldLabels: Record<string, string> = {
        title: 'Title',
        problemStatement: 'Problem Statement',
        constraints: 'Constraints',
        executeCodeName: 'Execute Code Name',
        testCases: 'Test Cases',
        allowedLanguages: 'Allowed Languages',
        tags: 'Tags',
      };

      Object.entries(newErrors).forEach(([field, message]) => {
        const fieldLabel = fieldLabels[field] || field;
        toast.error(`${fieldLabel}: ${message}`);
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
    setApiError('');
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      clearErrors();

      // Validate form before API call
      if (!validateForm()) {
        toast.error('Please fix the validation errors before saving');
        return;
      }

      // Ensure we always send assignment fields to trigger proper recalculation
      // If colleges are being managed, clear individual assignedUsers to avoid conflicts
      // The backend will recalculate users based on college criteria only
      // Normalize applicableLanguages: empty array means all languages
      const updateData = {
        ...formData,
        colleges: formData.colleges || [],
        assignedUsers: [], // Clear individual users when managing college assignments
        assignAllUsers: formData.assignAllUsers || false,
        testCases: (formData.testCases || []).map((testCase) => ({
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

      // console.log('Sending test update with assignment data:', {
      //   colleges: updateData.colleges,
      //   assignedUsers: updateData.assignedUsers,
      //   assignAllUsers: updateData.assignAllUsers,
      // });

      await testAPI.updateTest(testId, updateData);
      toast.success('Test updated successfully!');
      router.push('/admin/tests');
    } catch (error: any) {
      console.error('Error updating test:', error);

      // Handle API errors
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
        toast.error(`API Error: ${error.response.data.message}`);
      } else if (error.message) {
        setApiError(error.message);
        toast.error(`Error: ${error.message}`);
      } else {
        setApiError('An unexpected error occurred while updating the test');
        toast.error('Failed to update test');
      }
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const addTestCase = () => {
    // Validate new test case
    if (newTestCase.inputs.length === 0) {
      toast.error('At least one input is required');
      return;
    }
    if (!newTestCase.expectedOutput.trim()) {
      toast.error('Test case expected output is required');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      testCases: [
        ...(prev.testCases || []),
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
    clearErrors();
  };

  const removeTestCase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases?.filter((_, i) => i !== index) || [],
    }));
  };

  const startEditingTestCase = (index: number) => {
    const testCase = formData.testCases?.[index];
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
    // Validate editing test case
    if (editingTestCase.inputs.length === 0) {
      toast.error('At least one input is required');
      return;
    }
    if (!editingTestCase.expectedOutput.trim()) {
      toast.error('Test case expected output is required');
      return;
    }

    if (editingTestCaseIndex !== null) {
      setFormData((prev) => ({
        ...prev,
        testCases:
          prev.testCases?.map((tc, index) =>
            index === editingTestCaseIndex
              ? {
                  inputs: editingTestCase.inputs,
                  expectedOutput: editingTestCase.expectedOutput.trim(),
                  isHidden: editingTestCase.isHidden,
                  outputFormat: editingTestCase.outputFormat,
                }
              : tc
          ) || [],
      }));
      setEditingTestCaseIndex(null);
      setEditingTestCase({
        inputs: [],
        expectedOutput: '',
        isHidden: false,
        outputFormat: 'array',
      });
      clearErrors();
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
      const currentLanguages = prev.allowedLanguages || [];
      const isCurrentlySelected = currentLanguages.includes(languageId);
      const newAllowedLanguages = isCurrentlySelected
        ? currentLanguages.filter((id) => id !== languageId)
        : [...currentLanguages, languageId];

      // If adding a new language, initialize its starter code
      if (!isCurrentlySelected) {
        const defaultCode = getDefaultStarterCode(languageId);
        const languageIdStr = languageId.toString();
        setStarterCode((starterPrev) => ({
          ...starterPrev,
          [languageIdStr]: defaultCode,
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
        const defaultCode = language?.sample_code || '';
        // console.log(
        //   `Getting default starter code for language ${languageId}:`,
        //   defaultCode
        // );
        return defaultCode;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
            <Code className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
          </div>
          <p className="text-gray-500">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex items-center justify-center">
        <Alert className="max-w-md border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700">
            Test not found or you don't have permission to edit it.
          </AlertDescription>
        </Alert>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                Test Editor
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
                  Edit Test
                </h1>
                <p className="text-gray-500 mt-1">
                  Editing: <span className="font-medium text-gray-700">{test.title}</span>
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
                type="button"
                variant="outline"
                onClick={() => {
                  // console.log('Manual validation triggered');
                  const isValid = validateForm();
                  if (isValid) {
                    toast.success('Form validation passed!');
                  } else {
                    toast.error(
                      'Form has validation errors. Check the error summary above.'
                    );
                  }
                }}
                disabled={saving}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                Validate Form
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={saving}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* API Error Display */}
        {apiError && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Validation Errors Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-800">Please fix the following errors:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field} className="text-sm text-red-700">
                    {message}
                  </li>
                ))}
              </ul>
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
                      value={formData.title || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }));
                        if (errors.title) {
                          setErrors((prev) => ({ ...prev, title: '' }));
                        }
                      }}
                      placeholder="Enter test title"
                      className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm ${
                        errors.title ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.title}
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
                    value={formData.problemStatement || ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        problemStatement: e.target.value,
                      }));
                      if (errors.problemStatement) {
                        setErrors((prev) => ({ ...prev, problemStatement: '' }));
                      }
                    }}
                    placeholder="Enter the problem statement"
                    rows={8}
                    className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none ${
                      errors.problemStatement ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.problemStatement && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.problemStatement}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constraints" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    Constraints <span className="text-sky-400">*</span>
                  </Label>
                  <Textarea
                    id="constraints"
                    value={formData.constraints || ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        constraints: e.target.value,
                      }));
                      if (errors.constraints) {
                        setErrors((prev) => ({ ...prev, constraints: '' }));
                      }
                    }}
                    placeholder="Enter constraints (e.g., 1 <= n <= 1000)"
                    rows={3}
                    className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none ${
                      errors.constraints ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.constraints && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.constraints}
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
                    value={formData.executeCodeName || ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        executeCodeName: e.target.value,
                      }));
                      if (errors.executeCodeName) {
                        setErrors((prev) => ({ ...prev, executeCodeName: '' }));
                      }
                    }}
                    placeholder="e.g., threeSum, Solution"
                    className={`border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm ${
                      errors.executeCodeName ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.executeCodeName && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.executeCodeName}
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
                    {formData.tags?.map((tag, index) => (
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
                  {errors.tags && (
                    <p className="text-xs text-red-500 mt-1">{errors.tags}</p>
                  )}
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
                {errors.testCases && (
                  <Alert variant="destructive" className="mt-2 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs text-red-700">
                      {errors.testCases}
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
                      allowedLanguages={formData.allowedLanguages || []}
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
                {formData.testCases?.map((testCase, index) => (
                  <Card key={index} className="border-sky-100 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-sky-500" />
                          Test Case {index + 1}
                          {testCase.isHidden && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex gap-1">
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
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {editingTestCaseIndex === index ? (
                        // Edit form
                        <div className="space-y-4">
                          <TestInputEditor
                            inputs={editingTestCase.inputs}
                            onChange={(inputs) =>
                              setEditingTestCase((prev) => ({
                                ...prev,
                                inputs,
                              }))
                            }
                            allowedLanguages={formData.allowedLanguages || []}
                            languageNames={languages.reduce(
                              (acc, lang) => {
                                acc[lang.id] = lang.name;
                                return acc;
                              },
                              {} as Record<number, string>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-output-${index}`} className="text-xs font-medium text-gray-500">
                                Expected Output *
                              </Label>
                              <Textarea
                                id={`edit-output-${index}`}
                                value={editingTestCase.expectedOutput}
                                onChange={(e) =>
                                  setEditingTestCase((prev) => ({
                                    ...prev,
                                    expectedOutput: e.target.value,
                                  }))
                                }
                                placeholder="Expected output"
                                rows={3}
                                className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-output-format-${index}`} className="text-xs font-medium text-gray-500">
                                Output Format
                              </Label>
                              <Select
                                value={editingTestCase.outputFormat}
                                onValueChange={(
                                  value:
                                    | 'array'
                                    | 'string'
                                    | 'number'
                                    | 'boolean'
                                    | 'object'
                                ) =>
                                  setEditingTestCase((prev) => ({
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
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={saveEditingTestCase} 
                              size="sm"
                              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg px-4 py-2 text-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
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
                      ) : (
                        // Read-only view
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
                      )}
                    </CardContent>
                  </Card>
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
                          <span className="h-2 w-2 rounded-full bg-orange-500"></span>
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
                {errors.allowedLanguages && (
                  <Alert variant="destructive" className="mt-2 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs text-red-700">
                      {errors.allowedLanguages}
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
                        checked={
                          formData.allowedLanguages?.includes(language.id) ||
                          false
                        }
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
                  <HelpCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-xs font-medium text-amber-800">Important Guidelines for Starter Code:</AlertTitle>
                  <AlertDescription className="mt-1 text-xs text-amber-700">
                    <div className="space-y-1">
                      <p>• <strong>Python/JavaScript/C++/C:</strong> Use function named exactly as specified in "Execute Code Name"</p>
                      <p>• <strong>Java:</strong> Always use "Solution" class with method named as "Execute Code Name"</p>
                      <p className="mt-1 font-medium">Note: The "Execute Code Name" field determines which function/method will be called during test execution.</p>
                    </div>
                  </AlertDescription>
                </Alert>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (
                      formData.allowedLanguages &&
                      formData.allowedLanguages.length > 0
                    ) {
                      const newStarterCode: Record<string, string> = {};
                      formData.allowedLanguages.forEach((languageId) => {
                        newStarterCode[languageId.toString()] =
                          getDefaultStarterCode(languageId);
                      });
                      setStarterCode(newStarterCode);
                      setFormData((prev) => ({
                        ...prev,
                        starterCode: newStarterCode,
                      }));
                      // console.log(
                      //   'Manually initialized starter code:',
                      //   newStarterCode
                      // );
                    }
                  }}
                  className="mt-3 border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Initialize Default Starter Code
                </Button>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {formData.allowedLanguages?.map((languageId) => {
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
                          formData.starterCode?.[languageId.toString()] ||
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
                {(!formData.allowedLanguages ||
                  formData.allowedLanguages.length === 0) && (
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
                    <span className="font-medium text-gray-700">{formData.testCases?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-sky-100">
                    <span className="text-gray-500">Tags:</span>
                    <span className="font-medium text-gray-700">{formData.tags?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-sky-100">
                    <span className="text-gray-500">Languages:</span>
                    <span className="font-medium text-gray-700">{formData.allowedLanguages?.length || 0}</span>
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
            <span className="text-xs text-gray-400">Test Editor v1.0</span>
            <span className="h-1 w-1 rounded-full bg-orange-300"></span>
          </div>
          <span className="text-xs text-gray-400">
            Changes saved automatically
          </span>
        </div>
      </div>
    </div>
  );
}