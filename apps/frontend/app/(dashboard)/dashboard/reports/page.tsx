'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Calendar,
  FileText,
  Loader2,
  ClipboardList,
  Sun,
  Cloud,
  Sparkles,
  BarChart,
  ArrowLeft,
  FileBarChart,
  AlertCircle,
} from 'lucide-react';
import { assessmentResultAPI } from '@/lib/api/assessmentResults';
import { toast } from 'sonner';
import {
  AssessmentResult,
  AssessmentResultWithCollegeInfo,
  UserAssessment,
} from '@/lib/types';
import Link from 'next/link';
import {
  IndividualAssessmentReport,
  ConsolidatedReport,
  transformToConsolidatedResults,
} from '@/components/reports';
import { useAuth } from '@/lib/hooks/useAuth';

type ReportType = 'individual' | 'consolidated';

interface CompletedAssessment {
  _id: string;
  title: string;
  resultId: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('individual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Completed assessments for individual report
  const [completedAssessments, setCompletedAssessments] = useState<
    CompletedAssessment[]
  >([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);

  // Results
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [individualResult, setIndividualResult] =
    useState<AssessmentResultWithCollegeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch user's completed assessments with visible results
  useEffect(() => {
    fetchCompletedAssessments();
  }, []);

  const fetchCompletedAssessments = async () => {
    try {
      setIsLoadingAssessments(true);
      // Get user's results for reports (with populated assessmentId objects)
      const userResults = await assessmentResultAPI.getMyResultsForReports();

      // Filter to only completed assessments where results are visible
      const completedWithVisible = userResults
        .filter((result) => {
          const assessment = result.assessmentId as any;
          // Only show if assessment has showResultsToUsers enabled and status is completed
          return (
            result.status === 'completed' &&
            assessment?.showResultsToUsers === true
          );
        })
        .map((result) => {
          const assessment = result.assessmentId as any;
          return {
            _id: assessment._id,
            title: assessment.title,
            resultId: result._id,
          };
        });

      setCompletedAssessments(completedWithVisible);
    } catch (error) {
      console.error('Error fetching completed assessments:', error);
      toast.error('Failed to load your assessments');
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleGenerateIndividualReport = async () => {
    if (!selectedAssessmentId) {
      toast.error('Please select an assessment');
      return;
    }

    try {
      setIsLoading(true);
      // Find the result ID for this assessment
      const assessment = completedAssessments.find(
        (a) => a._id === selectedAssessmentId
      );

      if (assessment) {
        const detailedResult = await assessmentResultAPI.getDetailedResult(
          assessment.resultId
        );
        setIndividualResult(detailedResult);
        toast.success('Report generated successfully');
      } else {
        toast.error('Assessment not found');
        setIndividualResult(null);
      }
    } catch (error: any) {
      console.error('Error generating individual report:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to generate report'
      );
      setIndividualResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateConsolidatedReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }

    try {
      setIsLoading(true);
      const data = await assessmentResultAPI.getMyResultsByDateRange(
        start.toISOString(),
        end.toISOString()
      );

      // Filter to only show results where showResultsToUsers is true
      const visibleResults = data.filter((result) => {
        const assessment = result.assessmentId as any;
        return assessment?.showResultsToUsers === true;
      });

      setResults(visibleResults);

      if (visibleResults.length === 0) {
        toast.info('No assessment results found for the selected date range');
      } else {
        toast.success(`Found ${visibleResults.length} assessment result(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      window.print();
      toast.success('Print dialog opened');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
      setIsExporting(true);
      const blob = await assessmentResultAPI.exportMyResultsByDateRange(
        start.toISOString(),
        end.toISOString()
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-assessment-results-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error(error?.response?.data?.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to format date for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set default dates (last 30 days)
  const setDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

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
              <BarChart className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                Analytics & Reports
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                    Assessment Reports
                  </span>
                </h1>
                <p className="mt-1 text-gray-500">
                  Generate reports for your assessment results
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-medium text-gray-700">Report Type</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Choose between individual assessment report or consolidated date range report
            </p>
          </div>
          <CardContent className="p-6">
            <Tabs
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-sky-50/50 rounded-xl">
                <TabsTrigger 
                  value="individual"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all"
                >
                  Individual Report
                </TabsTrigger>
                <TabsTrigger 
                  value="consolidated"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all"
                >
                  Consolidated Report
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Individual Report - Assessment Selection */}
        {reportType === 'individual' && (
          <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-medium text-gray-700">Select Assessment</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Choose an assessment you have completed to view the detailed report
              </p>
            </div>
            <CardContent className="p-6 space-y-4">
              {completedAssessments.length === 0 && !isLoadingAssessments ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-sky-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">No completed assessments with visible results found.</p>
                  <p className="text-sm text-gray-400">
                    Complete some assessments to generate reports.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="assessment" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-sky-400" />
                      Assessment
                    </Label>
                    <Select
                      value={selectedAssessmentId}
                      onValueChange={setSelectedAssessmentId}
                      disabled={isLoadingAssessments}
                    >
                      <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                        <SelectValue
                          placeholder={
                            isLoadingAssessments
                              ? 'Loading assessments...'
                              : 'Select an assessment'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {completedAssessments.map((assessment) => (
                          <SelectItem key={assessment._id} value={assessment._id}>
                            {assessment.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerateIndividualReport}
                    disabled={isLoading || !selectedAssessmentId}
                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate Individual Report
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Consolidated Report - Date Range Selection */}
        {reportType === 'consolidated' && (
          <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-medium text-gray-700">Select Date Range</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Choose a date range to generate a consolidated report of all your assessments
              </p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-xs font-medium text-gray-500">
                    Start Date & Time
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400 pointer-events-none" />
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-xs font-medium text-gray-500">
                    End Date & Time
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400 pointer-events-none" />
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={setDefaultDates}
                  variant="outline"
                  size="sm"
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                >
                  Last 30 Days
                </Button>
                <Button
                  onClick={handleGenerateConsolidatedReport}
                  disabled={isLoading || !startDate || !endDate}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate Consolidated Report
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExportCSV}
                  disabled={
                    isExporting || !startDate || !endDate || results.length === 0
                  }
                  variant="outline"
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Report Display */}
        {reportType === 'individual' && individualResult && (
          <div className="mt-6">
            <IndividualAssessmentReport
              result={individualResult}
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
            />
          </div>
        )}

        {/* Consolidated Report Display */}
        {reportType === 'consolidated' && results.length > 0 && user && (
          <div className="mt-6">
            <ConsolidatedReport
              results={transformToConsolidatedResults(results)}
              studentInfo={{
                name: `${user.firstName} ${user.lastName}`,
                registrationNo: user.registrationNo,
                email: user.email,
                mobileNumber: user.mobileNumber,
                branch: user.branch?.name || 'N/A',
                year: user.collegeYear,
              }}
              dateRange={{
                startDate,
                endDate,
              }}
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
            />
          </div>
        )}

        {/* Empty State for Consolidated */}
        {reportType === 'consolidated' &&
          results.length === 0 &&
          !isLoading &&
          startDate &&
          endDate && (
            <Card className="border-sky-100 shadow-sm overflow-hidden mt-6">
              <CardContent className="py-12 text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-sky-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  No assessment results found
                </p>
                <p className="text-sm text-gray-400">
                  No results found for the selected date range.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Reports Module</span>
            <span className="h-1 w-1 rounded-full bg-orange-300"></span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
}