'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBranches, useDeleteBranch } from '@/lib/hooks/useBranches';
import { Branch } from '@/lib/types/branch';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Upload,
  Building2,
  Calendar,
  MoreHorizontal,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Sun,
  Cloud,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateBranchModal } from './CreateBranchModal';
import { EditBranchModal } from './EditBranchModal';
import { BulkImportModal } from './BulkImportModal';
import { Label } from '@/components/ui/label';

interface BranchManagementProps {
  searchQuery?: string;
}

export function BranchManagement({ searchQuery = '' }: BranchManagementProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: branchesData,
    isLoading,
    error,
  } = useBranches({
    ...(searchTerm.trim() && { search: searchTerm.trim() }),
    page: currentPage,
    limit: pageSize,
  });

  // Extract branches array and pagination info from response
  const safeBranchesData = branchesData?.data || [];
  const totalBranches = branchesData?.total || 0;
  const totalPages =
    branchesData?.totalPages || Math.ceil(totalBranches / pageSize);
  const currentPageNum = currentPage;

  const deleteBranchMutation = useDeleteBranch();

  const handleDelete = async (branch: Branch) => {
    try {
      await deleteBranchMutation.mutateAsync(branch._id);
      setIsDeleteDialogOpen(false);
      setSelectedBranch(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsEditDialogOpen(true);
  };

  const handleView = (branch: Branch) => {
    setSelectedBranch(branch);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset to first page when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const sortedBranches =
    !isLoading && safeBranchesData.length > 0
      ? [...safeBranchesData].sort((a, b) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
        <AlertDescription className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Failed to load branches: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
        <Sun className="h-40 w-40 text-orange-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
        <Cloud className="h-40 w-40 text-sky-300" />
      </div>

      {/* Main Card */}
      <Card className="border-sky-100 shadow-sm overflow-hidden">
        {/* Card Header */}
        <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-500" />
                Branch Management
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Manage all branches in the system
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkImportModalOpen(true)}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
              <Input
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'createdAt') => setSortBy(value)}
              >
                <SelectTrigger className="w-[140px] border-sky-200 focus:border-sky-400 rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-sky-500" />
                      Name
                    </div>
                  </SelectItem>
                  <SelectItem value="createdAt">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      Created Date
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Branches Table */}
          <div className="rounded-xl border border-sky-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-sky-50/30 to-orange-50/30">
                <TableRow className="hover:bg-transparent border-sky-100">
                  <TableHead
                    className="cursor-pointer hover:bg-sky-100/50 text-sky-700 font-semibold"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-sky-400" />
                      Branch Name
                      {sortBy === 'name' && (
                        <span className="text-xs text-sky-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-sky-100/50 text-sky-700 font-semibold"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-400" />
                      Created Date
                      {sortBy === 'createdAt' && (
                        <span className="text-xs text-sky-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-sky-700 font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin"></div>
                          <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-sky-300" />
                        </div>
                        <p className="text-sm text-sky-600">Loading branches...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
                          <BookOpen className="h-8 w-8 text-sky-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {searchTerm
                            ? 'No branches found matching your search.'
                            : 'No branches found.'}
                        </p>
                        {searchTerm && (
                          <Button
                            variant="link"
                            onClick={() => handleSearchChange('')}
                            className="text-sky-600 hover:text-sky-700"
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedBranches.map((branch) => (
                    <TableRow 
                      key={branch._id} 
                      className="hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors border-sky-100"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                            <GraduationCap className="h-4 w-4 text-sky-600" />
                          </div>
                          <span className="text-gray-700">{branch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-sky-400" />
                          {formatDate(branch.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(branch)}
                            className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(branch)}
                            className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBranch(branch);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="border-red-200 hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results Count and Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            {!isLoading && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                Showing{' '}
                <span className="font-medium text-gray-700">
                  {safeBranchesData.length > 0
                    ? (currentPageNum - 1) * pageSize + 1
                    : 0}
                </span>{' '}
                to{' '}
                <span className="font-medium text-gray-700">
                  {Math.min(currentPageNum * pageSize, totalBranches)}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-700">
                  {totalBranches}
                </span>{' '}
                branches
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
              </div>
            )}

            {/* Page Size Selector */}
            {!isLoading && totalBranches > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500">Per page:</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-[80px] border-sky-200 focus:border-sky-400 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 p-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPageNum - 1)}
                  disabled={currentPageNum === 1 || isLoading}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPageNum <= 3) {
                      pageNum = i + 1;
                    } else if (currentPageNum >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPageNum - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPageNum === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[40px] rounded-lg ${
                          currentPageNum === pageNum
                            ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white'
                            : 'border-sky-200 hover:bg-sky-50 text-sky-700'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPageNum + 1)}
                  disabled={currentPageNum === totalPages || isLoading}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
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
      <CreateBranchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditBranchModal
        branch={selectedBranch}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />

      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-red-50 to-orange-50">
            <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-red-400 to-orange-400 rounded-full"></div>
              Delete Branch
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">"{selectedBranch?.name}"</span>? 
              This will permanently remove the branch from the system.
            </p>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-gray-100">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteBranchMutation.isPending}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBranch && handleDelete(selectedBranch)}
                disabled={deleteBranchMutation.isPending}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl px-4 py-2 text-sm font-medium"
              >
                {deleteBranchMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete Branch'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Branch Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 to-orange-50">
            <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              Branch Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              View detailed information about the branch.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBranch && (
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-sky-400" />
                    {selectedBranch.name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Branch ID</Label>
                  <p className="text-sm font-mono text-gray-600 mt-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                    {selectedBranch._id.slice(0, 8)}...{selectedBranch._id.slice(-4)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</Label>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    {formatDate(selectedBranch.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</Label>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    {formatDate(selectedBranch.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="p-6 pt-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
            <Button 
              onClick={() => setIsViewDialogOpen(false)}
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-6 py-2 text-sm font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}