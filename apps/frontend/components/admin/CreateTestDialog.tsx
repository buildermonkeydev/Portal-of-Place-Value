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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import { codeExecutionApi } from '@/lib/api/codeExecution';
import {
  CreateTestData,
  TestDifficulty,
  TestStatus,
  TestCaseFormData,
  Language,
} from '@/lib/types/test';
import { toast } from 'sonner';

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTestDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [formData, setFormData] = useState<CreateTestData>({
    title: '',
    problemStatement: '',
    difficulty: TestDifficulty.EASY,
    tags: [],
    testCases: [],
    constraints: '',
    allowedLanguages: [],
    executeCodeName: '',
    status: TestStatus.DRAFT,
  });
  const [newTag, setNewTag] = useState('');
  const [newTestCase, setNewTestCase] = useState<TestCaseFormData>({
    inputs: [
      {
        value: '',
        order: 1,
        inputFormat: 'array',
        applicableLanguages: [],
      },
    ],
    expectedOutput: '',
    isHidden: false,
    outputFormat: 'array',
  });

  React.useEffect(() => {
    if (open) {
      loadLanguages();
    }
  }, [open]);

  const loadLanguages = async () => {
    try {
      const languagesData = await codeExecutionApi.getLanguages();
      setLanguages(languagesData);
    } catch (error) {
      console.error('Error loading languages:', error);
      toast.error('Failed to load programming languages');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
      }

      if (!formData.problemStatement.trim()) {
        toast.error('Problem statement is required');
        return;
      }
      if (!formData.executeCodeName.trim()) {
        toast.error('Function name is required');
        return;
      }
      if (formData.testCases.length === 0) {
        toast.error('At least one test case is required');
        return;
      }
      if (formData.allowedLanguages.length === 0) {
        toast.error('At least one programming language must be allowed');
        return;
      }

      await testAPI.createTest(formData);
      toast.success('Test created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
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
    if (
      newTestCase.inputs[0]?.value.trim() &&
      newTestCase.expectedOutput.trim()
    ) {
      setFormData((prev) => ({
        ...prev,
        testCases: [
          ...prev.testCases,
          {
            inputs: newTestCase.inputs.map((input, index) => ({
              ...input,
              value: input.value.trim(),
              order: index + 1,
            })),
            expectedOutput: newTestCase.expectedOutput.trim(),
            isHidden: newTestCase.isHidden,
            outputFormat: newTestCase.outputFormat,
          },
        ],
      }));
      setNewTestCase({
        inputs: [
          {
            value: '',
            order: 1,
            inputFormat: 'array',
            applicableLanguages: [],
          },
        ],
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

  const toggleLanguage = (languageId: number) => {
    setFormData((prev) => ({
      ...prev,
      allowedLanguages: prev.allowedLanguages.includes(languageId)
        ? prev.allowedLanguages.filter((id) => id !== languageId)
        : [...prev.allowedLanguages, languageId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
          <DialogDescription>
            Create a new coding test with test cases
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="testcases">Test Cases</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter test title"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: value as TestDifficulty,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TestDifficulty.EASY}>Easy</SelectItem>
                    <SelectItem value={TestDifficulty.MEDIUM}>
                      Medium
                    </SelectItem>
                    <SelectItem value={TestDifficulty.HARD}>Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="problemStatement">Problem Statement *</Label>
              <Textarea
                id="problemStatement"
                value={formData.problemStatement}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    problemStatement: e.target.value,
                  }))
                }
                placeholder="Enter the problem statement"
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="constraints">Constraints *</Label>
              <Textarea
                id="constraints"
                value={formData.constraints}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    constraints: e.target.value,
                  }))
                }
                placeholder="Enter constraints (e.g., 1 <= n <= 1000)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="executeCodeName">Function Name *</Label>
              <Input
                id="executeCodeName"
                value={formData.executeCodeName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    executeCodeName: e.target.value,
                  }))
                }
                placeholder="Enter function name (e.g., threeSum, twoSum)"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testcases" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Cases</h3>
                <span className="text-sm text-muted-foreground">
                  {formData.testCases.length} test case(s)
                </span>
              </div>

              {/* Add new test case */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Test Case</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="testCaseInput">Input *</Label>
                      <Textarea
                        id="testCaseInput"
                        value={newTestCase.inputs[0]?.value || ''}
                        onChange={(e) =>
                          setNewTestCase((prev) => ({
                            ...prev,
                            inputs: [
                              {
                                ...prev.inputs[0],
                                value: e.target.value,
                              },
                            ],
                          }))
                        }
                        placeholder="Test case input"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="testCaseOutput">Expected Output *</Label>
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
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isHidden"
                        checked={newTestCase.isHidden}
                        onChange={(e) =>
                          setNewTestCase((prev) => ({
                            ...prev,
                            isHidden: e.target.checked,
                          }))
                        }
                      />
                      <Label htmlFor="isHidden">Hidden test case</Label>
                    </div>
                  </div>
                  <Button onClick={addTestCase} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test Case
                  </Button>
                </CardContent>
              </Card>

              {/* Existing test cases */}
              {formData.testCases.map((testCase, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      Test Case {index + 1}
                      {testCase.isHidden && (
                        <Badge variant="secondary" className="ml-2">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTestCase(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Input</Label>
                        <pre className="bg-muted p-2 rounded text-sm whitespace-pre-wrap">
                          {testCase.inputs?.map((input, idx) => (
                            <div key={idx}>{input.value}</div>
                          )) || 'No inputs'}
                        </pre>
                      </div>
                      <div>
                        <Label>Expected Output</Label>
                        <pre className="bg-muted p-2 rounded text-sm whitespace-pre-wrap">
                          {testCase.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div>
              <Label>Allowed Programming Languages</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {languages.map((language) => (
                  <div
                    key={language.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`lang-${language.id}`}
                      checked={formData.allowedLanguages.includes(language.id)}
                      onChange={() => toggleLanguage(language.id)}
                    />
                    <Label htmlFor={`lang-${language.id}`}>
                      {language.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as TestStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TestStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={TestStatus.PUBLISHED}>
                    Published
                  </SelectItem>
                  <SelectItem value={TestStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Test'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
