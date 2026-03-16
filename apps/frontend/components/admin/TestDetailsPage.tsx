'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  HardDrive,
  Code,
  Users,
  BarChart3,
  Loader2,
  Sun,
  Cloud,
  BookOpen,
  GraduationCap,
  Tag,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import { Test, TestDifficulty, TestStatus } from '@/lib/types/test';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TestCaseDisplay } from './TestCaseDisplay';

interface TestDetailsPageProps {
  testId: string;
}

export function TestDetailsPage({ testId }: TestDetailsPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<Test | null>(null);

  const loadTest = useCallback(async () => {
    try {
      setLoading(true);
      const testData = await testAPI.getTestById(testId);
      setTest(testData);
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('Failed to load test');
      router.push('/admin/tests');
    } finally {
      setLoading(false);
    }
  }, [testId, router]);

  const handleDelete = async () => {
    if (!test) return;

    if (
      !confirm(
        `Are you sure you want to delete "${test.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await testAPI.deleteTest(testId);
      toast.success('Test deleted successfully');
      router.push('/admin/tests');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  const getDifficultyColor = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case TestDifficulty.EASY:
        return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200';
      case TestDifficulty.MEDIUM:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-200';
      case TestDifficulty.HARD:
        return 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case TestStatus.DRAFT:
        return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200';
      case TestStatus.PUBLISHED:
        return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200';
      case TestStatus.ARCHIVED:
        return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200';
    }
  };

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
            <Code className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
          </div>
          <p className="text-gray-500">Loading test details...</p>
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
            Test not found or you don't have permission to view it.
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
                Test Details
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
                  {test.title}
                </h1>
                <p className="text-gray-500 mt-1">
                  Detailed view of test configuration and test cases
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/tests/${testId}/edit`}>
                <Button 
                  variant="outline"
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Test
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Test
              </Button>
            </div>
          </div>
        </div>

        {/* Test Status Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              test.status === TestStatus.PUBLISHED ? 'bg-green-500' :
              test.status === TestStatus.DRAFT ? 'bg-blue-500' : 'bg-orange-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Badge className={getStatusColor(test.status)} variant="outline">
              {test.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Created {new Date(test.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Title
                    </h4>
                    <p className="text-base font-medium text-gray-900">{test.title}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Difficulty
                    </h4>
                    <Badge className={getDifficultyColor(test.difficulty)} variant="outline">
                      {test.difficulty}
                    </Badge>
                  </div>
                </div>

                {test.description && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Description
                    </h4>
                    <p className="text-sm text-gray-600 bg-white/80 p-3 rounded-lg border border-sky-100">
                      {test.description}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    Problem Statement
                  </h4>
                  <div className="bg-gradient-to-r from-sky-50 to-orange-50 p-4 rounded-xl border border-sky-100">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {test.problemStatement}
                    </pre>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    Constraints
                  </h4>
                  <div className="bg-gradient-to-r from-sky-50 to-orange-50 p-4 rounded-xl border border-sky-100">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {test.constraints}
                    </pre>
                  </div>
                </div>

                {test.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {test.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline"
                          className="bg-gradient-to-r from-sky-50 to-orange-50 text-sky-700 border-sky-200 px-3 py-1 rounded-lg"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
                  Test cases used to validate user solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {test.testCases.map((testCase, index) => (
                  <div key={index} className="relative border border-sky-100 rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    <TestCaseDisplay
                      testCase={testCase}
                      index={index}
                      languageNames={{}}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status and Settings */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Status & Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <Badge className={getStatusColor(test.status)} variant="outline">
                      {test.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Execute Code Name</span>
                    <span className="text-sm font-mono text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">
                      {test.executeCodeName || 'solution'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allowed Languages */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Allowed Languages</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2">
                  {test.allowedLanguages.map((languageId) => (
                    <div key={languageId} className="flex items-center gap-3 p-2 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-lg border border-sky-100">
                      <Code className="w-4 h-4 text-sky-500" />
                      <span className="text-sm text-gray-700">Language ID: {languageId}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-500" />
                      <span className="text-sm text-gray-600">Test Cases</span>
                    </div>
                    <span className="font-medium text-gray-900">{test.testCases.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Languages</span>
                    </div>
                    <span className="font-medium text-gray-900">{test.allowedLanguages.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-500" />
                      <span className="text-sm text-gray-600">Submissions</span>
                    </div>
                    <span className="font-medium text-gray-400">—</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <CardTitle className="text-sm font-semibold text-gray-700">Metadata</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 border-b border-sky-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created:
                    </span>
                    <span className="text-sm text-gray-700">{new Date(test.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b border-sky-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated:
                    </span>
                    <span className="text-sm text-gray-700">{new Date(test.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Created By:
                    </span>
                    <span className="text-sm text-gray-700 font-mono">
                      {typeof test.createdBy === 'string'
                        ? test.createdBy.slice(0, 8) + '...'
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Test Details v1.0</span>
            <span className="h-1 w-1 rounded-full bg-orange-300"></span>
          </div>
          <span className="text-xs text-gray-400">
            Test ID: {testId.slice(0, 8)}...{testId.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}