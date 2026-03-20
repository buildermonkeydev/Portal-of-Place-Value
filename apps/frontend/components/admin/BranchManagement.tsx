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
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateBranchModal } from './CreateBranchModal';
import { EditBranchModal } from './EditBranchModal';
import { BulkImportModal } from './BulkImportModal';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

  const safeBranchesData = branchesData?.data || [];
  const totalBranches = branchesData?.total || 0;
  const totalPages = branchesData?.totalPages || Math.ceil(totalBranches / pageSize);
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
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const sortedBranches = !isLoading && safeBranchesData.length > 0
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
      <Alert className="border-red-500/50 bg-red-500/10 m-6">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-sm text-red-400">
          Failed to load branches: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Branch Directory</h3>
          </div>
          <p className="text-xs text-zinc-500">Manage all branches in the system</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkImportModalOpen(true)}
            className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: 'name' | 'createdAt') => setSortBy(value)}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
              <SelectItem value="name">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  Name
                </div>
              </SelectItem>
              <SelectItem value="createdAt">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  Created Date
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th 
                  className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Branch Name
                    {sortBy === 'name' && (
                      <span className="text-xs text-indigo-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created Date
                    {sortBy === 'createdAt' && (
                      <span className="text-xs text-indigo-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                      <p className="text-sm text-zinc-500">Loading branches...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedBranches.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mb-3">
                        <BookOpen className="h-6 w-6 text-zinc-500" />
                      </div>
                      <p className="text-sm text-zinc-400 mb-1">
                        {searchTerm ? 'No branches found matching your search.' : 'No branches found.'}
                      </p>
                      {searchTerm && (
                        <Button
                          variant="link"
                          onClick={() => handleSearchChange('')}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedBranches.map((branch) => (
                  <tr key={branch._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{branch.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(branch.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(branch)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors"
                          title="View branch"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(branch)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors"
                          title="Edit branch"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBranch(branch);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete branch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalBranches > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <div className="text-sm text-zinc-500 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
            Showing{' '}
            <span className="font-medium text-white">
              {safeBranchesData.length > 0 ? (currentPageNum - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-medium text-white">
              {Math.min(currentPageNum * pageSize, totalBranches)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-white">{totalBranches}</span>{' '}
            branches
            <span className="h-1 w-1 rounded-full bg-orange-400"></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-zinc-500">Per page:</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[80px] bg-white/5 border-white/10 text-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageNum - 1)}
                disabled={currentPageNum === 1}
                className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 disabled:opacity-50 rounded-lg"
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
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "min-w-[36px] h-9 rounded-lg text-sm transition-all",
                        currentPageNum === pageNum
                          ? "bg-gradient-to-r from-indigo-500 to-orange-500 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageNum + 1)}
                disabled={currentPageNum === totalPages}
                className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 disabled:opacity-50 rounded-lg"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateBranchModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditBranchModal branch={selectedBranch} isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
      <BulkImportModal isOpen={isBulkImportModalOpen} onClose={() => setIsBulkImportModalOpen(false)} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0C0C10] border-white/10 rounded-2xl max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Branch</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete{' '}
            <span className="font-medium text-white">"{selectedBranch?.name}"</span>? 
            This will permanently remove the branch from the system.
          </p>
          <DialogFooter className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBranch && handleDelete(selectedBranch)}
              disabled={deleteBranchMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Branch Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-[#0C0C10] border-white/10 rounded-2xl max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
              Branch Details
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              View detailed information about the branch.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBranch && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Branch Name</Label>
                  <p className="text-sm font-medium text-white mt-1 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                    {selectedBranch.name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Branch ID</Label>
                  <p className="text-sm font-mono text-zinc-400 mt-1 bg-white/5 px-3 py-1.5 rounded-lg">
                    {selectedBranch._id.slice(0, 8)}...{selectedBranch._id.slice(-4)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Created Date</Label>
                  <p className="text-sm text-zinc-300 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    {formatDate(selectedBranch.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Updated</Label>
                  <p className="text-sm text-zinc-300 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    {formatDate(selectedBranch.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button 
              onClick={() => setIsViewDialogOpen(false)}
              className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}