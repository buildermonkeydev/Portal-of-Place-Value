'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Filter,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AssessmentResultWithCollegeInfo } from '@/lib/types';
import { assessmentResultAPI } from '@/lib/api/assessmentResults';
import { collegesApi } from '@/lib/api/colleges';
import { branchesApi } from '@/lib/api/branches';
import { toast } from 'sonner';

// Interface for section-wise scores
interface SectionScore {
  sectionName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  questionsCount: number;
}

// Interface for college data
interface College {
  _id: string;
  name: string;
  branches: Array<{
    _id: string;
    name: string;
  }>;
}

interface AssessmentResultsTableProps {
  assessmentId: string;
  assessmentTitle?: string;
}

export function AssessmentResultsTable({
  assessmentId,
  assessmentTitle,
}: AssessmentResultsTableProps) {
  const [results, setResults] = useState<AssessmentResultWithCollegeInfo[]>([]);
  const [filteredResults, setFilteredResults] = useState<
    AssessmentResultWithCollegeInfo[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showOnlyAllowedColleges, setShowOnlyAllowedColleges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [allowedColleges, setAllowedColleges] = useState<string[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [allBranches, setAllBranches] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('all');
  const [availableBranchesForCollege, setAvailableBranchesForCollege] =
    useState<Array<{ _id: string; name: string }>>([]);
  const [isSendingReport, setIsSendingReport] = useState<string | null>(null);
  const [emailForReport, setEmailForReport] = useState('');
  const [reportResultId, setReportResultId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(50);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculatingResultId, setRecalculatingResultId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'recalculate-all' | 'recalculate-individual';
    resultId?: string;
    status?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchResults();
    fetchColleges();
    fetchBranches();
  }, [assessmentId]);

  // Initialize available branches when allBranches is loaded
  useEffect(() => {
    // console.log('Branch initialization effect:', {
    //   allBranchesLength: allBranches.length,
    //   selectedCollegeId,
    //   availableBranchesLength: availableBranchesForCollege.length,
    // });

    if (allBranches.length > 0 && selectedCollegeId === 'all') {
      // console.log('Initializing with all branches');
      setAvailableBranchesForCollege(allBranches);
    }
  }, [allBranches, selectedCollegeId]);

  const fetchColleges = async () => {
    try {
      const response = await collegesApi.getColleges({ limit: 100 });
      // console.log('Fetched colleges:', response.data);
      setColleges(response.data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast.error('Failed to fetch colleges');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches({ limit: 100 });
      // console.log('Fetched all branches:', response.data);
      setAllBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch branches');
    }
  };

  const fetchResults = async (filterParams?: {
    college?: string;
    branch?: string;
    year?: string;
  }, page = 1) => {
    try {
      // console.log('Fetching results with params:', filterParams, 'page:', page);
      setIsLoading(true);
      const response = await assessmentResultAPI.getResultsByAssessmentWithCollegeInfo(
        assessmentId,
        filterParams,
        { page, limit: itemsPerPage }
      ) as { results: AssessmentResultWithCollegeInfo[]; pagination: any };
      
      setResults(response.results);
      setFilteredResults(response.results);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);

      // Extract unique colleges from results
      const colleges = [
        ...new Set(response.results.map((result) => result.user.collegeName)),
      ];
      setAvailableColleges(colleges);

      // Extract unique branches from results
      const branches = [
        ...new Set(
          response.results.map((result) => result.user.branchName).filter(Boolean)
        ),
      ];
      setAvailableBranches(branches);

      // Extract unique years from results
      const years = [
        ...new Set(
          response.results.map((result) => result.user.collegeYear).filter(Boolean)
        ),
      ].sort((a, b) => a! - b!);
      setAvailableYears(years as number[]);

      // Extract allowed colleges from assessment
      if (response.results.length > 0 && response.results[0].assessment.allowedColleges) {
        setAllowedColleges(response.results[0].assessment.allowedColleges);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch assessment results');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle college selection and update available branches
  const handleCollegeChange = (collegeId: string) => {
    // console.log('College changed to:', collegeId);
    setSelectedCollegeId(collegeId);
    setCollegeFilter(collegeId);
    setBranchFilter('all'); // Reset branch filter when college changes
    setYearFilter('all'); // Reset year filter when college changes

    if (collegeId === 'all') {
      // console.log('Setting all branches:', allBranches.length, 'branches');
      setAvailableBranchesForCollege(allBranches); // Show all branches when no college selected
    } else {
      const selectedCollege = colleges.find((c) => c._id === collegeId);
      // console.log(
      //   'Selected college:',
      //   selectedCollege?.name,
      //   'with',
      //   selectedCollege?.branches?.length,
      //   'branches'
      // );
      setAvailableBranchesForCollege(selectedCollege?.branches || []);
    }

    // Fetch results with new college filter
    const filterParams = {
      college: collegeId === 'all' ? undefined : collegeId, // Pass college ID, not name
      branch: undefined,
      year: undefined,
    };
    // console.log('College change - calling fetchResults with:', filterParams);
    setCurrentPage(1); // Reset to first page on filter change
    fetchResults(filterParams, 1);
  };

  // Handle branch filter change
  const handleBranchChange = (branchId: string) => {
    // console.log(
    //   'Branch changed to:',
    //   branchId,
    //   'with college:',
    //   selectedCollegeId
    // );
    setBranchFilter(branchId);

    const filterParams = {
      college: selectedCollegeId === 'all' ? undefined : selectedCollegeId, // Pass college ID
      branch: branchId === 'all' ? undefined : branchId, // Pass branch ID
      year: yearFilter === 'all' ? undefined : yearFilter,
    };
    // console.log('Branch change - calling fetchResults with:', filterParams);
    setCurrentPage(1); // Reset to first page on filter change
    fetchResults(filterParams, 1);
  };

  // Handle year filter change
  const handleYearChange = (year: string) => {
    // console.log(
    //   'Year changed to:',
    //   year,
    //   'with college:',
    //   selectedCollegeId,
    //   'and branch:',
    //   branchFilter
    // );
    setYearFilter(year);

    const filterParams = {
      college: selectedCollegeId === 'all' ? undefined : selectedCollegeId, // Pass college ID
      branch: branchFilter === 'all' ? undefined : branchFilter,
      year: year === 'all' ? undefined : year,
    };
    // console.log('Year change - calling fetchResults with:', filterParams);
    setCurrentPage(1); // Reset to first page on filter change
    fetchResults(filterParams, 1);
  };

  useEffect(() => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.user.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          result.user.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          result.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.user.collegeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          result.user.registrationNo.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((result) => result.status === statusFilter);
    }

    // College, branch, and year filtering is now handled by backend API calls

    if (showOnlyAllowedColleges && allowedColleges.length > 0) {
      filtered = filtered.filter((result) =>
        allowedColleges.some(
          (allowedCollege) =>
            result.user.collegeName === allowedCollege ||
            result.assessment.allowedColleges.includes(result.user.collegeName)
        )
      );
    }

    setFilteredResults(filtered);
  }, [
    results,
    searchTerm,
    statusFilter,
    showOnlyAllowedColleges,
    allowedColleges,
  ]);

  // Get section-wise scores for a result (use stored scores if available, otherwise calculate)
  const getSectionScores = (
    result: AssessmentResultWithCollegeInfo
  ): SectionScore[] => {
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

  const handleDeleteResult = async (resultId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this result? This action cannot be undone.'
      )
    ) {
      try {
        await assessmentResultAPI.deleteResult(resultId);
        await fetchResults(); // Refresh the list
        toast.success('Result deleted successfully');
      } catch (error) {
        console.error('Error deleting result:', error);
        toast.error('Failed to delete result');
      }
    }
  };

  const exportResults = async () => {
    try {
      // Call backend API to generate CSV with current filters
      const filters = {
        college: selectedCollegeId === 'all' ? undefined : selectedCollegeId,
        branch: branchFilter === 'all' ? undefined : branchFilter,
        year: yearFilter === 'all' ? undefined : yearFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      };
      
      const blob = await assessmentResultAPI.exportResults(assessmentId, filters);
      
      // Download the CSV
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed-assessment-results-${
        assessmentTitle || 'results'
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Detailed results exported successfully');
    } catch (error) {
      console.error('Error exporting results:', error);
      toast.error('Failed to export results');
    }
  };

  const handleRecalculateScores = () => {
    const message = `Are you sure you want to recalculate scores for all results in this assessment?

 WARNING: Some users might be currently taking this assessment.

Recalculating scores will:
• SUBMIT their responses immediately
• PREVENT them from continuing
• Calculate scores based on current answers

This action cannot be undone!

This will update all existing scores and may take a few minutes.`;
    
    setConfirmAction({
      type: 'recalculate-all',
      message
    });
    setConfirmModalOpen(true);
  };

  const executeRecalculateScores = async () => {

    try {
      setIsRecalculating(true);
      const result = await assessmentResultAPI.recalculateScores(assessmentId);
      
      toast.success('Score recalculation started! The process is running in the background. Please refresh the page in a few minutes to see updated scores.');
      
    } catch (error: any) {
      console.error('Error recalculating scores:', error);
      toast.error(error.response?.data?.message || 'Failed to start recalculation');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleRecalculateResult = (resultId: string, status: string) => {
    let message = `Are you sure you want to recalculate the score for this result?`;
    
    if (status === 'in_progress') {
      message = ` WARNING: This assessment is IN PROGRESS for this user!

Recalculating will:
• SUBMIT their current responses immediately
• PREVENT them from continuing the assessment
• Calculate the score based on answers given so far

The user will NOT be able to continue after this action!

This action cannot be undone.`;
    }
    
    setConfirmAction({
      type: 'recalculate-individual',
      resultId,
      status,
      message
    });
    setConfirmModalOpen(true);
  };

  const executeRecalculateResult = async (resultId: string) => {

    try {
      setRecalculatingResultId(resultId);
      await assessmentResultAPI.recalculateResult(resultId);
      toast.success('Score recalculation started! The process is running in the background.');
      // Optionally refresh results after a delay or let the user refresh manually
    } catch (error: any) {
      console.error('Error recalculating result score:', error);
      toast.error(error.response?.data?.message || 'Failed to start recalculation');
    } finally {
      setRecalculatingResultId(null);
    }
  };

  const handleConfirmAction = async () => {
    setConfirmModalOpen(false);
    
    if (!confirmAction) return;
    
    if (confirmAction.type === 'recalculate-all') {
      await executeRecalculateScores();
    } else if (confirmAction.type === 'recalculate-individual' && confirmAction.resultId) {
      await executeRecalculateResult(confirmAction.resultId);
    }
    
    setConfirmAction(null);
  };

  const handleCancelAction = () => {
    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      in_progress: 'secondary',
      completed: 'default',
      abandoned: 'outline',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const filterParams = {
      college: selectedCollegeId === 'all' ? undefined : selectedCollegeId,
      branch: branchFilter === 'all' ? undefined : branchFilter,
      year: yearFilter === 'all' ? undefined : yearFilter,
    };
    
    setCurrentPage(newPage);
    fetchResults(filterParams, newPage);
  };

  const viewPersonalResult = (resultId: string) => {
    // Navigate to personal result view
    window.open(`/admin/assessment-results/${resultId}`, '_blank');
  };

  const sendReport = async (resultId: string, email: string) => {
    try {
      setIsSendingReport(resultId);
      await assessmentResultAPI.sendIndividualReport(resultId, email);
      toast.success('Report sent successfully');
      setEmailForReport('');
      setReportResultId(null);
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Failed to send report');
    } finally {
      setIsSendingReport(null);
    }
  };

  const openSendReportDialog = (resultId: string, userEmail: string) => {
    setReportResultId(resultId);
    setEmailForReport(userEmail);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {assessmentTitle
              ? `${assessmentTitle} - Results`
              : 'Assessment Results'}
          </h2>
        </div>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {assessmentTitle
            ? `${assessmentTitle} - Results`
            : 'Assessment Results'}
        </h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleRecalculateScores} 
            className="flex items-center gap-2"
            variant="outline"
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
                Recalculate All Scores
              </>
            )}
          </Button>
          <Button onClick={exportResults} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, college, or registration number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCollegeId} onValueChange={handleCollegeChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by college" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colleges</SelectItem>
            {colleges.map((college) => (
              <SelectItem key={college._id} value={college._id}>
                {college.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={handleBranchChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {availableBranchesForCollege.map((branch) => (
              <SelectItem key={branch._id} value={branch._id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={handleYearChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {[1, 2, 3, 4, 5].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>College Name</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registration No</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Overall Score</TableHead>
              <TableHead>Section Scores</TableHead>
              <TableHead>Coding Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow key={result._id}>
                <TableCell className="font-medium">
                  {result.user.collegeName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">
                        {result.user.firstName} {result.user.lastName}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{result.user.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-mono">
                    {result.user.registrationNo}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{result.user.branchName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {result.user.collegeYear
                      ? `Year ${result.user.collegeYear}`
                      : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-semibold">
                    {result.percentage.toFixed(2)}%
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.totalMarksObtained}/{result.totalMarksPossible}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getSectionScores(result).map((section) => (
                      <div
                        key={section.sectionName}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-medium">
                          {section.sectionName}:
                        </span>
                        <div className="flex items-center gap-2">
                          <span>
                            {section.marksObtained}/{section.totalMarks}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              section.percentage >= 80
                                ? 'text-green-600'
                                : section.percentage >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {section.percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {result.codingQuestions && result.codingQuestions.length > 0 ? (
                    <div className="space-y-1">
                      {result.codingQuestions.map((cq, index) => (
                        <div key={cq.testId || index} className="text-xs">
                          <Badge
                            variant="outline"
                            className={cq.isCorrect ? 'text-green-600' : 'text-red-600'}
                          >
                            C{index + 1}: {cq.isCorrect ? 'Passed' : 'Failed'}
                          </Badge>
                          <span className="ml-1 text-gray-500">
                            {cq.marksObtained || 0}/{cq.score || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(result.status)}</TableCell>
                <TableCell>{result.duration}s</TableCell>
                <TableCell>
                  {result.endTime
                    ? new Date(result.endTime).toLocaleDateString()
                    : new Date(result.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Result Details</DialogTitle>
                          <DialogDescription>
                            Detailed view of the assessment result
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>User:</strong> {result.user.firstName}{' '}
                              {result.user.lastName}
                            </div>
                            <div>
                              <strong>Email:</strong> {result.user.email}
                            </div>
                            <div>
                              <strong>College:</strong>{' '}
                              {result.user.collegeName}
                            </div>
                            <div>
                              <strong>Branch:</strong> {result.user.branchName}
                            </div>
                            <div>
                              <strong>Registration No:</strong>{' '}
                              {result.user.registrationNo}
                            </div>
                            <div>
                              <strong>Score:</strong> {result.percentage}%
                            </div>
                            <div>
                              <strong>Marks Obtained:</strong>{' '}
                              {result.totalMarksObtained}/
                              {result.totalMarksPossible}
                            </div>
                            <div>
                              <strong>Status:</strong> {result.status}
                            </div>
                            <div>
                              <strong>Duration:</strong> {result.duration}{' '}
                              seconds
                            </div>
                            <div>
                              <strong>Submitted:</strong>{' '}
                              {result.endTime
                                ? new Date(result.endTime).toLocaleDateString()
                                : new Date(
                                    result.createdAt
                                  ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewPersonalResult(result._id)}
                      className="text-blue-600 hover:text-blue-700"
                      title="View Detailed Result"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openSendReportDialog(result._id, result.user.email)
                      }
                      className="text-green-600 hover:text-green-700"
                      title="Send Report"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteResult(result._id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Result"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecalculateResult(result._id, result.status)}
                      className="text-orange-600 hover:text-orange-700"
                      title="Recalculate Score"
                      disabled={recalculatingResultId === result._id}
                    >
                      {recalculatingResultId === result._id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              title="First Page"
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              <span className="text-sm font-medium">Page</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                  }
                }}
                className="h-8 w-16 text-center mx-1"
              />
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              title="Last Page"
            >
              »
            </Button>
          </div>
        </div>
      )}

      {filteredResults.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">
            {results.length === 0
              ? 'No results found for this assessment.'
              : 'No results match your search criteria.'}
          </p>
        </div>
      )}

      {/* Send Report Dialog */}
      <Dialog
        open={!!reportResultId}
        onOpenChange={() => setReportResultId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Individual Report</DialogTitle>
            <DialogDescription>
              Enter the email address where you want to send the assessment
              report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-email">Email Address</Label>
              <Input
                id="report-email"
                type="email"
                value={emailForReport}
                onChange={(e) => setEmailForReport(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportResultId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                reportResultId && sendReport(reportResultId, emailForReport)
              }
              disabled={
                isSendingReport === reportResultId || !emailForReport.trim()
              }
            >
              {isSendingReport === reportResultId
                ? 'Sending...'
                : 'Send Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <RefreshCw className="h-5 w-5" />
              Confirm Recalculation
            </DialogTitle>
            <DialogDescription className="whitespace-pre-wrap text-left pt-4">
              {confirmAction?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelAction}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm Recalculation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
