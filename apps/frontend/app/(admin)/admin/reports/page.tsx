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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Calendar,
  FileText,
  Loader2,
  Search,
  User,
  X,
  ClipboardList,
  ArrowLeft,
  BarChart,
  Users,
  Filter,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  PieChart,
  Clock,
} from 'lucide-react';
import { assessmentResultAPI } from '@/lib/api/assessmentResults';
import { assessmentAPI } from '@/lib/api/assessments';
import { userAPI } from '@/lib/api/users';
import { toast } from 'sonner';
import {
  AssessmentResult,
  User as UserType,
  Assessment,
  AssessmentResultWithCollegeInfo,
} from '@/lib/types';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IndividualAssessmentReport,
  ConsolidatedReport,
  transformToConsolidatedResults,
} from '@/components/reports';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
type ReportType = 'individual' | 'consolidated';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('individual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserType[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Assessment selection
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);

  // Results
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [individualResult, setIndividualResult] =
    useState<AssessmentResultWithCollegeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch assessments for selected user
  useEffect(() => {
    if (selectedUser) {
      fetchAssessmentsForUser(selectedUser._id);
    } else {
      setAssessments([]);
      setSelectedAssessmentId('');
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedAssessmentId && assessments.length > 0) {
      const assessmentExists = assessments.some(
        (a) => a._id === selectedAssessmentId
      );
      if (!assessmentExists) {
        setSelectedAssessmentId('');
      }
    }
  }, [assessments, selectedAssessmentId]);

  const fetchAssessmentsForUser = async (userId: string) => {
    try {
      setIsLoadingAssessments(true);
      const assessmentsData =
        await assessmentResultAPI.getAssessmentsForUser(userId);
      const uniqueAssessments = Array.from(
        new Map(
          assessmentsData.map((assessment) => [assessment._id, assessment])
        ).values()
      );
      setAssessments(uniqueAssessments);
      if (uniqueAssessments.length === 0) {
        toast.info('No completed assessments found for this user');
      }
    } catch (error) {
      console.error('Error fetching assessments for user:', error);
      toast.error('Failed to load assessments for this user');
      setAssessments([]);
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  // Debounced user search
  useEffect(() => {
    if (!userSearchTerm.trim()) {
      setUserSearchResults([]);
      return;
    }
    if (userSearchTerm.length < 2) return;

    const timer = setTimeout(() => {
      handleUserSearch(userSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  const handleUserSearch = async (query: string) => {
    try {
      setIsSearchingUsers(true);
      const response = await userAPI.searchUsers({
        search: query.trim(),
        limit: 20,
      });
      const results = response?.data || [];
      setUserSearchResults(results);
      setShowUserDropdown(true);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setUserSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSelectUser = (user: UserType) => {
    setSelectedUser(user);
    setUserSearchTerm(`${user.firstName} ${user.lastName} (${user.email})`);
    setShowUserDropdown(false);
    setUserSearchResults([]);
    setResults([]);
    setIndividualResult(null);
    setSelectedAssessmentId('');
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setUserSearchTerm('');
    setUserSearchResults([]);
    setShowUserDropdown(false);
    setResults([]);
    setIndividualResult(null);
    setAssessments([]);
    setSelectedAssessmentId('');
  };

  const handleGenerateIndividualReport = async () => {
    if (!selectedUser) {
      toast.error('Please select a student');
      return;
    }
    if (!selectedAssessmentId) {
      toast.error('Please select an assessment');
      return;
    }

    const assessmentId = Array.isArray(selectedAssessmentId)
      ? selectedAssessmentId[0]
      : selectedAssessmentId;

    try {
      setIsLoading(true);
      const detailedResult =
        await assessmentResultAPI.getResultByUserAndAssessment(
          selectedUser._id,
          assessmentId
        );
      setIndividualResult(detailedResult);
      toast.success('Individual report generated');
    } catch (error: any) {
      console.error('Error generating individual report:', error);
      const errorMessage =
        error?.response?.data?.message || 'Failed to generate report';
      if (error?.response?.status === 404) {
        toast.error(
          `No result found for ${selectedUser.firstName} ${selectedUser.lastName} in the selected assessment.`
        );
      } else {
        toast.error(errorMessage);
      }
      setIndividualResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateConsolidatedReport = async () => {
    if (!selectedUser) {
      toast.error('Please select a student');
      return;
    }
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
      const data =
        await assessmentResultAPI.getResultsByUserAndDateRangeForReports(
          selectedUser._id,
          start.toISOString(),
          end.toISOString()
        );
      setResults(data);
      if (data.length === 0) {
        toast.info(`No assessment results found in the selected date range`);
      } else {
        toast.success(`Found ${data.length} assessment result(s)`);
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
    if (!selectedUser) {
      toast.error('Please select a student');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
      setIsExporting(true);
      const blob = await assessmentResultAPI.exportResultsByUserAndDateRange(
        selectedUser._id,
        start.toISOString(),
        end.toISOString()
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-assessment-results-${selectedUser.firstName}-${selectedUser.lastName}-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
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

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const setDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  const initials = selectedUser
    ? `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`
    : '';

  return (
      <DashboardLayout>
    <div className="h-screen w-screen bg-[#0C0C10] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full w-full overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          
          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                      Analytics & Reports
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Student Assessment Reports
                </h1>
                <p className="mt-2 text-zinc-400 text-sm lg:text-base">
                  Generate individual or consolidated assessment reports
                </p>
              </div>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-5 py-2.5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-white">Report Type</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1 ml-6">
                Choose between individual assessment report or consolidated date range report
              </p>
            </div>
            <div className="p-5">
              <Tabs
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-white/5 rounded-xl">
                  <TabsTrigger 
                    value="individual"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-orange-500 data-[state=active]:text-white text-zinc-400 transition-all"
                  >
                    Individual Report
                  </TabsTrigger>
                  <TabsTrigger 
                    value="consolidated"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-orange-500 data-[state=active]:text-white text-zinc-400 transition-all"
                  >
                    Consolidated Report
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Student Selection */}
          <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-white">Select Student</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1 ml-6">
                Search and select a student to generate their assessment report
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      if (!e.target.value) handleClearUser();
                    }}
                    onFocus={() => {
                      if (userSearchResults.length > 0) setShowUserDropdown(true);
                    }}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                  />
                  {selectedUser && (
                    <button
                      onClick={handleClearUser}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* User Search Results Dropdown */}
                {showUserDropdown && userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1A1A2A] border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto">
                    <ScrollArea className="h-full">
                      {isSearchingUsers ? (
                        <div className="p-6 text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
                          <p className="text-sm text-zinc-500 mt-2">Searching...</p>
                        </div>
                      ) : (
                        userSearchResults.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/10 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-white">
                              {`${user.firstName} ${user.lastName}`}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {user.email}
                            </div>
                            {user.registrationNo && (
                              <div className="text-xs text-zinc-600">
                                Reg: {user.registrationNo}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>

              {selectedUser && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{initials}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {`${selectedUser.firstName} ${selectedUser.lastName}`}
                        </p>
                        <p className="text-sm text-zinc-500">{selectedUser.email}</p>
                        {selectedUser.registrationNo && (
                          <p className="text-xs text-zinc-600">
                            Registration: {selectedUser.registrationNo}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleClearUser}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Individual Report - Assessment Selection */}
          {reportType === 'individual' && (
            <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-medium text-white">Select Assessment</h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Choose an assessment to generate the individual report
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">
                    Assessment
                  </Label>
                  <Select
                    value={selectedAssessmentId}
                    onValueChange={setSelectedAssessmentId}
                    disabled={isLoadingAssessments}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                      <SelectValue
                        placeholder={
                          isLoadingAssessments
                            ? 'Loading assessments...'
                            : assessments.length === 0 && selectedUser
                            ? 'No completed assessments'
                            : 'Select an assessment'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                      {assessments.map((assessment) => (
                        <SelectItem key={assessment._id} value={assessment._id}>
                          {assessment.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateIndividualReport}
                  disabled={isLoading || !selectedUser || !selectedAssessmentId}
                  className="w-full bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl py-2.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Individual Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Consolidated Report - Date Range Selection */}
          {reportType === 'consolidated' && (
            <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-medium text-white">Select Date Range</h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  Choose a date range to generate a consolidated report of all assessments
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-500">
                      Start Date & Time
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      <Input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-500">
                      End Date & Time
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      <Input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={setDefaultDates}
                    variant="outline"
                    className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    onClick={handleGenerateConsolidatedReport}
                    disabled={isLoading || !startDate || !endDate || !selectedUser}
                    className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-5 py-2.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Consolidated Report
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    disabled={
                      isExporting ||
                      !startDate ||
                      !endDate ||
                      !selectedUser ||
                      results.length === 0
                    }
                    variant="outline"
                    className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
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
          {reportType === 'consolidated' && results.length > 0 && selectedUser && (
            <div className="mt-6">
              <ConsolidatedReport
                results={transformToConsolidatedResults(results)}
                studentInfo={{
                  name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                  registrationNo:
                    selectedUser.registrationNo?.toUpperCase?.() ??
                    selectedUser.registrationNo,
                  email: selectedUser.email,
                  mobileNumber: selectedUser.mobileNumber,
                  branch: selectedUser.branch?.name || 'N/A',
                  year: selectedUser.collegeYear,
                }}
                dateRange={{ startDate, endDate }}
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
            endDate &&
            selectedUser && (
              <div className="bg-white/5 rounded-xl border border-white/10 text-center py-12 mt-6">
                <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-zinc-500" />
                </div>
                <p className="text-zinc-400 font-medium mb-2">
                  No assessment results found
                </p>
                <p className="text-sm text-zinc-500">
                  {selectedUser.firstName} {selectedUser.lastName} has no completed assessments in the selected date range.
                </p>
              </div>
            )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
              <span className="text-xs text-zinc-500">Reports Module v1.0</span>
              <span className="h-1 w-1 rounded-full bg-orange-400"></span>
            </div>
            <span className="text-xs text-zinc-500">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
        </DashboardLayout>
  );
}