'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useColleges, useDeleteCollege } from '@/lib/hooks/useColleges';
import { College } from '@/lib/types/college';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Upload,
  Building2,
  Calendar,
  Eye,
  Filter,
  X,
  LayoutGrid,
  Layers,
  Database,
  TrendingUp,
  Activity,
  Folder,
  Award,
  Globe,
  MapPin,
  Link2,
  ExternalLink,
  Clock,
  Hash,
  Tag,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  Copy,
  Check,
  AlertCircle,
  Shield,
  Zap,
  Target,
  PieChart,
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Library,
  School,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateCollegeModal } from './CreateCollegeModal';
import { EditCollegeModal } from './EditCollegeModal';
import { CollegeBulkImportModal } from './CollegeBulkImportModal';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CollegeManagementProps {
  searchQuery?: string;
}

export function CollegeManagement({
  searchQuery = '',
}: CollegeManagementProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    data: collegesData,
    isLoading,
    error,
  } = useColleges({
    ...(searchTerm.trim() && { search: searchTerm.trim() }),
    limit: 100,
  });

  const safeCollegesData = Array.isArray(collegesData?.data)
    ? collegesData.data
    : [];

  const deleteCollegeMutation = useDeleteCollege();

  const handleDelete = async (college: College) => {
    try {
      await deleteCollegeMutation.mutateAsync(college._id);
      setIsDeleteDialogOpen(false);
      setSelectedCollege(null);
      toast.success('Operation successful', {
        description: 'The record has been removed from the system.',
      });
    } catch (error) {
      toast.error('Operation failed', {
        description: 'Unable to complete the requested action.',
      });
    }
  };

  const handleEdit = (college: College) => {
    setSelectedCollege(college);
    setIsEditDialogOpen(true);
  };

  const handleView = (college: College) => {
    setSelectedCollege(college);
    setIsViewDialogOpen(true);
  };

  const handleSort = (field: 'name' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const sortedColleges =
    !isLoading && safeCollegesData.length > 0
      ? [...safeCollegesData].sort((a, b) => {
          let aValue: string | Date = a[sortBy];
          let bValue: string | Date = b[sortBy];

          if (sortBy === 'createdAt') {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          }

          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        })
      : [];

  // Pagination
  const totalPages = Math.ceil(sortedColleges.length / itemsPerPage);
  const paginatedColleges = sortedColleges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-300">
          System error: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Main Card */}
        <Card className="bg-white/5 border-white/10 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500/10 via-transparent to-orange-500/10 px-6 py-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-orange-500 rounded-full"></div>
                <div>
                  <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-indigo-400" />
                    Directory Management
                  </CardTitle>
                  <p className="text-sm text-zinc-400 mt-1">
                    Centralized repository for institutional records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  <Database className="h-3 w-3 mr-1" />
                  {safeCollegesData.length} records
                </Badge>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value: 'name' | 'createdAt') =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="w-[140px] bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Toggle sort order</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkImportModalOpen(true)}
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl px-5 py-2.5 text-sm font-medium"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                  <p>Bulk import records</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Record
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                  <p>Create new institution</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead
                      className="cursor-pointer hover:bg-white/5 text-zinc-300 font-semibold"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-400" />
                        Institution
                        {sortBy === 'name' && (
                          <span className="text-xs text-indigo-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-zinc-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-orange-400" />
                        Departments
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-white/5 text-zinc-300 font-semibold"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        Registered
                        {sortBy === 'createdAt' && (
                          <span className="text-xs text-indigo-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-zinc-300 font-semibold text-right">
                      Operations
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="relative">
                            <div className="h-12 w-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                            <Database className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                          </div>
                          <p className="text-sm text-zinc-400">Loading records...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedColleges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                            <Building2 className="h-8 w-8 text-indigo-400" />
                          </div>
                          <p className="text-sm font-medium text-zinc-300 mb-1">
                            {searchTerm
                              ? 'No matching records found.'
                              : 'No records available.'}
                          </p>
                          {searchTerm && (
                            <Button
                              variant="link"
                              onClick={() => setSearchTerm('')}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedColleges.map((college) => (
                      <TableRow 
                        key={college._id} 
                        className="hover:bg-white/5 transition-colors border-white/10 group"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-lg border border-indigo-500/30 flex items-center justify-center">
                              <School className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div>
                              <span className="text-white">{college.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopyId(college._id)}
                                      className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                                    >
                                      <Hash className="h-3 w-3" />
                                      {copiedId === college._id ? (
                                        <Check className="h-3 w-3 text-green-400" />
                                      ) : (
                                        'Copy ID'
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                                    <p>Copy identifier</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {college.branches && college.branches.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {college.branches
                                .slice(0, 2)
                                .map((branch) => (
                                  <span
                                    key={branch._id}
                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {branch.name}
                                  </span>
                                ))}
                              {college.branches.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-zinc-400 border border-white/10 cursor-help">
                                      +{college.branches.length - 2}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                                    <div className="space-y-1">
                                      {college.branches.slice(2).map((b) => (
                                        <p key={b._id}>{b.name}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-500 italic">
                              Not specified
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-indigo-400" />
                            {formatDate(college.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(college)}
                                  className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400 rounded-lg"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                                <p>View details</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(college)}
                                  className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400 rounded-lg"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                                <p>Edit record</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCollege(college);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="hover:bg-white/5 text-zinc-400 hover:text-red-400 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                                <p>Delete record</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!isLoading && safeCollegesData.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-zinc-500">
                  Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium text-white">
                    {Math.min(currentPage * itemsPerPage, sortedColleges.length)}
                  </span>{' '}
                  of <span className="font-medium text-white">{sortedColleges.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-white/10 hover:bg-white/5 text-zinc-300 disabled:opacity-50 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "border-white/10 rounded-lg",
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                            : 'hover:bg-white/5 text-zinc-300'
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-white/10 hover:bg-white/5 text-zinc-300 disabled:opacity-50 rounded-lg"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateCollegeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <EditCollegeModal
          college={selectedCollege}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />

        <CollegeBulkImportModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl bg-[#1A1A2A] border-white/10">
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-white/10">
              <DialogTitle className="text-lg font-medium text-white flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
                Confirm Removal
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400 mt-1">
                This action cannot be reversed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4">
              <p className="text-sm text-zinc-300">
                You are about to remove{' '}
                <span className="font-medium text-white">"{selectedCollege?.name}"</span> from the system. 
                All associated data will be permanently deleted.
              </p>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-white/10">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={deleteCollegeMutation.isPending}
                  className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedCollege && handleDelete(selectedCollege)}
                  disabled={deleteCollegeMutation.isPending}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
                >
                  {deleteCollegeMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Confirm Removal'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View College Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-2xl bg-[#1A1A2A] border-white/10">
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-indigo-500/10 to-orange-500/10 border-b border-white/10">
              <DialogTitle className="text-lg font-medium text-white flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-orange-500 rounded-full"></div>
                Institution Details
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400 mt-1">
                Complete information about the selected record.
              </DialogDescription>
            </DialogHeader>
            
            {selectedCollege && (
              <div className="px-6 py-4 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</Label>
                    <p className="text-sm font-medium text-white mt-1 flex items-center gap-2">
                      <School className="h-4 w-4 text-indigo-400" />
                      {selectedCollege.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">System ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                        {selectedCollege._id.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyId(selectedCollege._id)}
                        className="h-6 w-6 p-0 hover:bg-white/5"
                      >
                        {copiedId === selectedCollege._id ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-zinc-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</Label>
                    <p className="text-sm text-zinc-300 mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      {formatDate(selectedCollege.createdAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Updated</Label>
                    <p className="text-sm text-zinc-300 mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      {formatDate(selectedCollege.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Branches Section */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-orange-400" />
                    Departments ({selectedCollege.branches?.length || 0})
                  </Label>
                  {selectedCollege.branches && selectedCollege.branches.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 bg-white/5 p-4 rounded-xl border border-white/10">
                      {selectedCollege.branches.map((branch) => (
                        <div
                          key={branch._id}
                          className="flex items-center gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20"
                        >
                          <BookOpen className="h-3 w-3 text-indigo-400" />
                          <span className="text-sm text-zinc-300">{branch.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic bg-white/5 p-4 rounded-xl border border-white/10">
                      No departments associated with this institution
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="p-6 pt-4 border-t border-white/10">
              <Button 
                onClick={() => setIsViewDialogOpen(false)}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}