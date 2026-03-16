'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Download,
  Mail,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  GraduationCap,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { AssessmentResultWithCollegeInfo } from '@/lib/types';
import { assessmentResultAPI } from '@/lib/api/assessmentResults';
import { toast } from 'sonner';
import Link from 'next/link';

// Interface for section-wise scores
interface SectionScore {
  sectionName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  questionsCount: number;
}

const IndividualAssessmentResultPage = () => {
  const params = useParams();
  const resultId = params.id as string;
  const [result, setResult] = useState<AssessmentResultWithCollegeInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isRecalculateDialogOpen, setIsRecalculateDialogOpen] = useState(false);

const LANGUAGE_MAP: Record<number, string> = {
  63: 'JavaScript (Node.js)',
  74: 'TypeScript',
  71: 'Python 3',
  62: 'Java 13',
  50: 'C (GCC 9.2.0)',
  48: 'C (GCC 7.4.0)',
  54: 'C++ (GCC 9.2.0)',
  52: 'C++ (GCC 7.4.0)',
  51: 'C# (Mono)',
  60: 'Go',
  68: 'PHP',
  72: 'Ruby',
  70: 'Python 2',
};

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setIsLoading(true);
      const response = await assessmentResultAPI.getDetailedResult(resultId);
      setResult(response);
      setEmail(response.user.email); // Pre-fill with user's email
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error('Failed to fetch assessment result');
    } finally {
      setIsLoading(false);
    }
  };

  // Get section-wise scores (use stored scores if available, otherwise calculate)
  const getSectionScores = (): SectionScore[] => {
    if (!result) return [];

    // If section scores are already stored in the result, use them
    if (result.sectionScores && result.sectionScores.length > 0) {
      return result.sectionScores;
    }

    // Fallback: Calculate section scores from responses (for backward compatibility)
    const sectionMap = new Map<string, SectionScore>();

    result.responses.forEach((response) => {
      const sectionName =
        response.question?.section || response.section || 'General';
      const questionMarks = response.question?.marks || 0;
      const obtainedMarks = response.marksObtained || 0;

      if (sectionMap.has(sectionName)) {
        const existing = sectionMap.get(sectionName)!;
        existing.marksObtained += obtainedMarks;
        existing.totalMarks += questionMarks;
        existing.questionsCount += 1;
        existing.percentage =
          existing.totalMarks > 0
            ? (existing.marksObtained / existing.totalMarks) * 100
            : 0;
      } else {
        sectionMap.set(sectionName, {
          sectionName,
          marksObtained: obtainedMarks,
          totalMarks: questionMarks,
          percentage:
            questionMarks > 0 ? (obtainedMarks / questionMarks) * 100 : 0,
          questionsCount: 1,
        });
      }
    });

    return Array.from(sectionMap.values()).sort((a, b) =>
      a.sectionName.localeCompare(b.sectionName)
    );
  };

  const exportIndividualResult = () => {
    if (!result) return;

    const sectionScores = getSectionScores();

    const csvContent = [
      ['Assessment Result Report'],
      [''],
      ['Student Information'],
      ['Name', `${result.user.firstName} ${result.user.lastName}`],
      ['Email', result.user.email],
      ['Registration No', result.user.registrationNo.toString()],
      ['College', result.user.collegeName],
      ['Branch', result.user.branchName],
      [''],
      ['Assessment Information'],
      ['Title', result.assessment.title],
      ['Description', result.assessment.description],
      ['Total Marks', result.assessment.totalMarks.toString()],
      ['Duration', `${result.assessment.duration} minutes`],
      [''],
      ['Result Summary'],
      ['Score', `${result.percentage}%`],
      ['Marks Obtained', result.totalMarksObtained.toString()],
      ['Total Marks', result.totalMarksPossible.toString()],
      ['Status', result.status],
      ['Duration Taken', `${result.duration} seconds`],
      [
        'Submitted At',
        new Date(result.endTime || result.createdAt).toLocaleString(),
      ],
      [''],
      ['Section-wise Performance'],
      [
        'Section',
        'Marks Obtained',
        'Total Marks',
        'Percentage',
        'Questions Count',
      ],
      ...sectionScores.map((section) => [
        section.sectionName,
        section.marksObtained.toString(),
        section.totalMarks.toString(),
        `${section.percentage.toFixed(1)}%`,
        section.questionsCount.toString(),
      ]),
      [''],
      ['Question-wise Results'],
      [
        'Question',
        'Section',
        'Your Answer',
        'Correct Answer',
        'Is Correct',
        'Marks Obtained',
        'Time Spent (s)',
      ],
    ];

    // Add question data
    result.responses.forEach((response, index) => {
      const question = response.question;
      if (question) {
        csvContent.push([
          `Q${index + 1}: ${question.text.replace(/,/g, ';')}`,
          question.section || response.section || 'General',
          response.selectedOptions.join('; '),
          question.correctAnswer.join('; '),
          response.isCorrect ? 'Yes' : 'No',
          response.marksObtained.toString(),
          response.timeSpent.toString(),
        ]);
      }
    });

    const csv = csvContent
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-result-${result.user.firstName}-${result.user.lastName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Individual result exported successfully');
  };

  const sendReport = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setIsSendingReport(true);
      await assessmentResultAPI.sendIndividualReport(resultId, email);
      toast.success('Report sent successfully');
      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Failed to send report');
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      setIsRecalculateDialogOpen(false);
      await assessmentResultAPI.recalculateResult(resultId);
      toast.success('Score recalculation started! Refreshing result...');
      // Refresh the result after a short delay
      setTimeout(() => {
        fetchResult();
      }, 2000);
    } catch (error: any) {
      console.error('Error recalculating result:', error);
      toast.error(error.response?.data?.message || 'Failed to recalculate score');
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Result Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested assessment result could not be found.
          </p>
          <Link href="/admin/assessments">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/assessments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {result.assessment.title} - Result
            </h1>
            <p className="text-gray-600">
              {result.user.firstName} {result.user.lastName}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={exportIndividualResult}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Result
          </Button>
          <Button
            onClick={() => setIsRecalculateDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Recalculate Score
              </>
            )}
          </Button>
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Report via Email</DialogTitle>
                <DialogDescription>
                  Enter the email address where you want to send the assessment
                  report.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={sendReport} disabled={isSendingReport}>
                  {isSendingReport ? 'Sending...' : 'Send Report'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isRecalculateDialogOpen} onOpenChange={setIsRecalculateDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600">
                  <RefreshCw className="h-5 w-5" />
                  Confirm Recalculation
                </DialogTitle>
                <DialogDescription className="whitespace-pre-wrap text-left pt-4">
                  {result?.status === 'in_progress'
                    ? `⚠️ WARNING: This assessment is IN PROGRESS for this user!\n\nRecalculating will:\n• SUBMIT their current responses immediately\n• PREVENT them from continuing the assessment\n• Calculate the score based on answers given so far\n\nThe user will NOT be able to continue after this action!\n\nThis action cannot be undone.`
                    : `Are you sure you want to recalculate the score for this result?\n\nThis will regrade all responses and update the final score.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsRecalculateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecalculate}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Confirm Recalculation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Name</Label>
              <p className="text-lg font-semibold">
                {result.user.firstName} {result.user.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-lg">{result.user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Registration No
              </Label>
              <p className="text-lg font-mono">{result.user.registrationNo}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                College
              </Label>
              <p className="text-lg flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {result.user.collegeName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Branch
              </Label>
              <p className="text-lg flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {result.user.branchName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {result.percentage.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {result.totalMarksObtained}/{result.totalMarksPossible}
              </div>
              <div className="text-sm text-gray-500">Marks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.floor(result.duration / 60)}m {result.duration % 60}s
              </div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
            <div className="text-center">
              <Badge
                variant={
                  result.status === 'completed'
                    ? 'default'
                    : result.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-lg px-4 py-2"
              >
                {result.status
                  .replace('_', ' ')
                  .toUpperCase()}
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Assessment Title
              </Label>
              <p className="text-lg">{result.assessment.title}</p>
            </div>
            {result.endTime && (
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Submitted At
                </Label>
                <p className="text-lg">
                  {new Date(result.endTime).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour12: true,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Section-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Section</th>
                  <th className="text-center p-3 font-semibold">Questions</th>
                  <th className="text-center p-3 font-semibold">
                    Marks Obtained
                  </th>
                  <th className="text-center p-3 font-semibold">Total Marks</th>
                  <th className="text-center p-3 font-semibold">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {getSectionScores().map((section, index) => (
                  <tr
                    key={section.sectionName}
                    className={index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}
                  >
                    <td className="p-3 font-medium">{section.sectionName}</td>
                    <td className="p-3 text-center">
                      {section.questionsCount}
                    </td>
                    <td className="p-3 text-center font-semibold text-green-600">
                      {section.marksObtained}
                    </td>
                    <td className="p-3 text-center">{section.totalMarks}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <div
                          className={`px-2 py-1 rounded-full text-sm font-semibold ${
                            section.percentage >= 80
                              ? 'bg-green-100 text-green-800'
                              : section.percentage >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {section.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Row */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-lg">Overall Performance</div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalMarksObtained}
                  </div>
                  <div className="text-sm text-gray-600">Marks Obtained</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalMarksPossible}
                  </div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold px-3 py-1 rounded-full ${
                      result.percentage >= 80
                        ? 'bg-green-100 text-green-800'
                        : result.percentage >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question-wise Results */}
      <Card>
        <CardHeader>
          <CardTitle>Question-wise Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {result.responses.map((response, index) => {
              const question = response.question;
              if (!question) return null;

              return (
                <div key={response._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Question {index + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      {response.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <Badge
                        variant={response.isCorrect ? 'default' : 'destructive'}
                      >
                        {response.marksObtained}/{question.marks} marks
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-900 font-medium">{question.text}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Your Answer
                      </Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {response.selectedOptions.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {response.selectedOptions.map((option, idx) => (
                              <li key={idx}>{option}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500 italic">
                            No answer provided
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Correct Answer
                      </Label>
                      <div className="mt-1 p-3 bg-green-50 rounded-md">
                        <ul className="list-disc list-inside">
                          {question.correctAnswer.map((answer, idx) => (
                            <li key={idx} className="text-green-800">
                              {answer}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {/* <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time spent: {response.timeSpent}s
                    </div> */}
                    {question.explanation && (
                      <div className="text-blue-600">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coding Questions Results */}
      {result.codingQuestions && result.codingQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Coding Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {result.codingQuestions.map((codingQ, index) => {
                const testTitle = typeof codingQ.testId === 'object' && codingQ.testId ? (codingQ.testId as any).title : `Coding Question ${index + 1}`;
                const testDescription = typeof codingQ.testId === 'object' && codingQ.testId ? (codingQ.testId as any).problemStatement : null;
                
                return (
                <div key={codingQ._id || index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {testTitle}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">
                        Language: {codingQ.languageId ? (LANGUAGE_MAP[codingQ.languageId] || `ID: ${codingQ.languageId}`) : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {codingQ.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <Badge
                        variant={codingQ.isCorrect ? 'default' : 'destructive'}
                      >
                        {codingQ.marksObtained || 0}/{codingQ.score || 0} marks
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={codingQ.isCorrect ? 'default' : 'secondary'}
                        className={codingQ.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {codingQ.isCorrect ? 'All Tests Passed' : 'Test Cases Failed'}
                      </Badge>
                    </div>
                  </div>

                  {testDescription && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-500">
                        Problem Statement
                      </Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {testDescription}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-500">
                      User's Code
                    </Label>
                    <div className="mt-1 p-4 bg-gray-900 rounded-md overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                        {codingQ.sourceCode || 'No code submitted'}
                      </pre>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndividualAssessmentResultPage;
