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
  Sparkles,
  BarChart,
  ArrowLeft,
  FileBarChart,
  AlertCircle,
  Scroll,
  Sword,
  Shield,
  Crown,
  Trophy,
  Map,
  Compass,
  ScrollText,
  BookOpen,
  Crosshair,
  Target,
  Gem,
  Swords,
  Flag,
  Award,
  History,
  Clock,
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
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

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
      toast.error('Failed to load your battle records');
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleGenerateIndividualReport = async () => {
    if (!selectedAssessmentId) {
      toast.error('Please select a battle to analyze');
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
        toast.success('Battle report generated successfully');
      } else {
        toast.error('Battle record not found');
        setIndividualResult(null);
      }
    } catch (error: any) {
      console.error('Error generating individual report:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to generate battle report'
      );
      setIndividualResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateConsolidatedReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates for your campaign');
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
        toast.info('No battle records found for the selected campaign period');
      } else {
        toast.success(`Found ${visibleResults.length} battle record(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch battle records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      window.print();
      toast.success('Scroll ready for printing');
    } catch (error) {
      toast.error('Failed to prepare scroll');
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
      a.download = `battle-records-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Battle records exported successfully');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error(error?.response?.data?.message || 'Failed to export battle records');
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
    <DashboardLayout>
    <div className="min-h-screen w-full bg-[#0C0C10] relative overflow-x-hidden">
      {/* Complex layered background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          
          {/* Header - War Council Chamber */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-orange-500 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Scroll className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  War Council · Battle Records
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 bg-white/5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Return to Command Center
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Battle Reports
                  </h1>
                  <p className="mt-1 text-zinc-400">
                    Analyze your victories and review battle strategies
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Type Selection - Choose Your Scroll */}
          <Card className="bg-white/5 border-white/10 overflow-hidden mb-6">
            <div className="bg-white/5 px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-zinc-300">Choose Your Scroll</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1 ml-6">
                Select between individual battle analysis or campaign overview
              </p>
            </div>
            <CardContent className="p-6">
              <Tabs
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-white/5 rounded-xl">
                  <TabsTrigger 
                    value="individual"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=inactive]:text-zinc-400 transition-all"
                  >
                    <Sword className="h-4 w-4 mr-2" />
                    Single Battle
                  </TabsTrigger>
                  <TabsTrigger 
                    value="consolidated"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=inactive]:text-zinc-400 transition-all"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Campaign Overview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Individual Report - Single Battle Analysis */}
          {reportType === 'individual' && (
            <Card className="bg-white/5 border-white/10 overflow-hidden mb-6">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-medium text-zinc-300">Select Battle</h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Choose a completed battle to analyze your performance
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                {completedAssessments.length === 0 && !isLoadingAssessments ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Trophy className="h-8 w-8 text-indigo-400" />
                    </div>
                    <p className="text-zinc-300 font-medium mb-2">No battle records found</p>
                    <p className="text-sm text-zinc-500">
                      Complete some battles to view your war chronicles
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="assessment" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Sword className="h-3.5 w-3.5 text-indigo-400" />
                        Battle
                      </Label>
                      <Select
                        value={selectedAssessmentId}
                        onValueChange={setSelectedAssessmentId}
                        disabled={isLoadingAssessments}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl py-2.5 h-auto text-white">
                          <SelectValue
                            placeholder={
                              isLoadingAssessments
                                ? 'Loading battle records...'
                                : 'Select a battle'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                          {completedAssessments.map((assessment) => (
                            <SelectItem 
                              key={assessment._id} 
                              value={assessment._id}
                              className="hover:bg-white/5 focus:bg-white/5"
                            >
                              <div className="flex items-center gap-2">
                                <Flag className="h-3 w-3 text-indigo-400" />
                                {assessment.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGenerateIndividualReport}
                      disabled={isLoading || !selectedAssessmentId}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2 w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Summoning Records...
                        </>
                      ) : (
                        <>
                          <ScrollText className="h-4 w-4" />
                          Generate Battle Report
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Consolidated Report - Campaign Overview */}
          {reportType === 'consolidated' && (
            <Card className="bg-white/5 border-white/10 overflow-hidden mb-6">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-medium text-zinc-300">Campaign Period</h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Select a date range to review your entire campaign history
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-xs font-medium text-zinc-400">
                      Campaign Start
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-xs font-medium text-zinc-400">
                      Campaign End
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400 pointer-events-none" />
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={setDefaultDates}
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
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
                        Gathering Intel...
                      </>
                    ) : (
                      <>
                        <Map className="h-4 w-4" />
                        Generate Campaign Overview
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    disabled={
                      isExporting || !startDate || !endDate || results.length === 0
                    }
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl px-5 py-2.5 text-sm font-medium flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparing Scroll...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Export as Scroll
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Report Display - Battle Chronicle */}
          {reportType === 'individual' && individualResult && (
            <div className="mt-6">
              <IndividualAssessmentReport
                result={individualResult}
                onExportPDF={handleExportPDF}
                isExporting={isExporting}
              />
            </div>
          )}

          {/* Consolidated Report Display - Campaign Summary */}
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
              <Card className="bg-white/5 border-white/10 overflow-hidden mt-6">
                <CardContent className="py-12 text-center">
                  <div className="h-20 w-20 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Compass className="h-10 w-10 text-indigo-400" />
                  </div>
                  <p className="text-zinc-300 font-medium mb-2">
                    No battle records found
                  </p>
                  <p className="text-sm text-zinc-500">
                    No victories recorded for this campaign period
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Footer - War Room Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
              <span className="text-xs text-zinc-500">War Council Archives</span>
              <span className="h-1 w-1 rounded-full bg-orange-500"></span>
            </div>
            <span className="text-xs text-zinc-500">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
     </DashboardLayout>
  );
}