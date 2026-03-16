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
  Sun,
  Cloud,
  BarChart,
  Users,
  Filter,
  CheckCircle,
  AlertCircle
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
      // Clear assessments when no user is selected
      setAssessments([]);
      setSelectedAssessmentId('');
    }
  }, [selectedUser]);

  // Clear selection if selected assessment is no longer in the list
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
      // Fetch assessments that this user has completed
      const assessmentsData =
        await assessmentResultAPI.getAssessmentsForUser(userId);
      // Remove duplicates based on _id to ensure only one can be selected
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

    if (userSearchTerm.length < 2) {
      return;
    }

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
    // Reset results and assessment selection when user changes
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

    // Ensure only one assessment ID is selected (take first if somehow multiple)
    const assessmentId = Array.isArray(selectedAssessmentId)
      ? selectedAssessmentId[0]
      : selectedAssessmentId;

    try {
      setIsLoading(true);
      // Get the result directly by userId and assessmentId (no date range needed)
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
          `No result found for ${selectedUser.firstName} ${selectedUser.lastName} in the selected assessment. The student may not have completed this assessment yet.`
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
        toast.info(
          `No assessment results found for ${selectedUser.firstName} ${selectedUser.lastName} in the selected date range`
        );
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
    // For now, use print functionality
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

  // Helper to format date for input (YYYY-MM-DDTHH:mm)
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
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Student Assessment Reports
                </span>
              </h1>
              <p className="mt-2 text-gray-500 text-lg">
                Generate individual or consolidated assessment reports
              </p>
            </div>
            <Link href="/admin">
              <Button
                variant="outline"
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
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

        {/* Student Selection */}
        <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-medium text-gray-700">Select Student</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Search and select a student to generate their assessment report
            </p>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    if (!e.target.value) {
                      handleClearUser();
                    }
                  }}
                  onFocus={() => {
                    if (userSearchResults.length > 0) {
                      setShowUserDropdown(true);
                    }
                  }}
                  className="pl-10 pr-10 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                />
                {selectedUser && (
                  <button
                    onClick={handleClearUser}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* User Search Results Dropdown */}
              {showUserDropdown && userSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm border border-sky-100 rounded-xl shadow-lg max-h-60 overflow-auto">
                  <ScrollArea className="h-full">
                    {isSearchingUsers ? (
                      <div className="p-6 text-center">
                        <div className="relative inline-flex">
                          <div className="h-6 w-6 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin"></div>
                          <Search className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-sky-300" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                      </div>
                    ) : (
                      userSearchResults.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-sky-50 hover:to-orange-50 border-b border-sky-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">
                            {`${user.firstName} ${user.lastName}`.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.registrationNo && (
                            <div className="text-xs text-gray-400">
                              Reg: {user.registrationNo?.toUpperCase()}
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
              <div className="p-4 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {`${selectedUser.firstName} ${selectedUser.lastName}`.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                      {selectedUser.registrationNo && (
                        <p className="text-xs text-gray-500">
                          Registration: {selectedUser.registrationNo?.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleClearUser}
                    variant="outline"
                    size="sm"
                    className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
                Choose an assessment to generate the individual report
              </p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assessment" className="text-xs font-medium text-gray-500">
                  Assessment
                </Label>
                <Select
                  value={selectedAssessmentId}
                  onValueChange={setSelectedAssessmentId}
                  disabled={isLoadingAssessments}
                >
                  <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto">
                    <SelectValue
                      placeholder={
                        isLoadingAssessments
                          ? 'Loading assessments...'
                          : 'Select an assessment'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment, index) => (
                      <SelectItem
                        key={`${assessment._id}-${index}`}
                        value={assessment._id}
                      >
                        {assessment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateIndividualReport}
                disabled={isLoading || !selectedUser || !selectedAssessmentId}
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
                Choose a date range to generate a consolidated report of all assessments
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
                  disabled={isLoading || !startDate || !endDate || !selectedUser}
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
                    isExporting ||
                    !startDate ||
                    !endDate ||
                    !selectedUser ||
                    results.length === 0
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
        {reportType === 'consolidated' && results.length > 0 && selectedUser && (
          <div className="mt-6">
            <ConsolidatedReport
              results={transformToConsolidatedResults(results)}
              studentInfo={{
                name: `${selectedUser.firstName} ${selectedUser.lastName}`.toUpperCase(),
                registrationNo:
                  selectedUser.registrationNo?.toUpperCase?.() ??
                  selectedUser.registrationNo,
                email: selectedUser.email,
                mobileNumber: selectedUser.mobileNumber,
                branch: selectedUser.branch?.name || 'N/A',
                year: selectedUser.collegeYear,
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
          endDate &&
          selectedUser && (
            <Card className="border-sky-100 shadow-sm overflow-hidden mt-6">
              <CardContent className="py-12 text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-sky-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  No assessment results found
                </p>
                <p className="text-sm text-gray-400">
                  {selectedUser.firstName} {selectedUser.lastName} has no completed assessments in the selected date range.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Reports Module v1.0</span>
            <span className="h-1 w-1 rounded-full bg-orange-300"></span>
          </div>
          <span className="text-xs text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { 
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