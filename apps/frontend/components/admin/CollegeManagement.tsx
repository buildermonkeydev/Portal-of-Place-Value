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
  MoreHorizontal,
  Eye,
  Filter,
  Sun,
  Cloud,
  GraduationCap,
  X,
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
  DialogTrigger,
} from '@/components/ui/dialog';

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

  const {
    data: collegesData,
    isLoading,
    error,
  } = useColleges({
    ...(searchTerm.trim() && { search: searchTerm.trim() }),
    limit: 100,
  });

  // Ensure collegesData is always an array for safety
  const safeCollegesData = Array.isArray(collegesData?.data)
    ? collegesData.data
    : [];

  const deleteCollegeMutation = useDeleteCollege();

  const handleDelete = async (college: College) => {
    try {
      await deleteCollegeMutation.mutateAsync(college._id);
      setIsDeleteDialogOpen(false);
      setSelectedCollege(null);
    } catch (error) {
      // Error is handled by the mutation hook
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
        <AlertDescription>
          Failed to load colleges:{' '}
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Card with Sky/Sunset Theme */}
      <Card className="border-sky-100 shadow-lg overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-sky-50 via-white to-orange-50 px-6 py-5 border-b border-sky-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                  College Management
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Manage all colleges in the system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Decorative Icons */}
              <Cloud className="h-5 w-5 text-sky-200" />
              <Sun className="h-5 w-5 text-orange-200" />
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
              <Input
                placeholder="Search colleges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600"
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
                <SelectTrigger className="w-[140px] border-sky-200 focus:border-sky-400 rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => setIsBulkImportModalOpen(true)}
              className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add College
            </Button>
          </div>

          {/* Colleges Table */}
          <div className="rounded-xl border border-sky-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50">
                <TableRow className="hover:bg-transparent border-sky-100">
                  <TableHead
                    className="cursor-pointer hover:bg-sky-100/50 text-sky-700 font-semibold"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-sky-400" />
                      College Name
                      {sortBy === 'name' && (
                        <span className="text-xs text-sky-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-sky-700 font-semibold">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-orange-400" />
                      Branches
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-sky-100/50 text-sky-700 font-semibold"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sky-400" />
                      Created Date
                      {sortBy === 'createdAt' && (
                        <span className="text-xs text-sky-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-sky-700 font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin"></div>
                          <Cloud className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-sky-300" />
                        </div>
                        <p className="text-sm text-sky-600">Loading colleges...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedColleges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
                          <Building2 className="h-8 w-8 text-sky-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {searchTerm
                            ? 'No colleges found matching your search.'
                            : 'No colleges found.'}
                        </p>
                        {searchTerm && (
                          <Button
                            variant="link"
                            onClick={() => setSearchTerm('')}
                            className="text-sky-600 hover:text-sky-700"
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedColleges.map((college) => (
                    <TableRow 
                      key={college._id} 
                      className="hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors border-sky-100"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-sky-100 to-sky-50 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-sky-500" />
                          </div>
                          <span className="text-gray-700">{college.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {college.branches && college.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {college.branches
                              .slice(0, 3)
                              .map((branch, index) => (
                                <span
                                  key={branch._id}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-sky-50 to-sky-100 text-sky-700 border border-sky-200"
                                >
                                  {branch.name}
                                </span>
                              ))}
                            {college.branches.length > 3 && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                +{college.branches.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No branches
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-sky-400" />
                          {formatDate(college.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(college)}
                            className="hover:bg-sky-50 text-gray-500 hover:text-sky-600 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(college)}
                            className="hover:bg-sky-50 text-gray-500 hover:text-sky-600 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCollege(college);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg"
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

          {/* Results Count */}
          {!isLoading && safeCollegesData.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {sortedColleges.length} of {safeCollegesData.length} colleges
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-sky-200 text-sky-600 hover:bg-sky-50 rounded-lg" disabled>
                  Previous
                </Button>
                <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg">1</Button>
                <Button variant="outline" size="sm" className="border-sky-200 text-sky-600 hover:bg-sky-50 rounded-lg">2</Button>
                <Button variant="outline" size="sm" className="border-sky-200 text-sky-600 hover:bg-sky-50 rounded-lg">3</Button>
                <Button variant="outline" size="sm" className="border-sky-200 text-sky-600 hover:bg-sky-50 rounded-lg">Next</Button>
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
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-red-50 to-orange-50">
            <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-red-400 to-orange-400 rounded-full"></div>
              Delete College
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">"{selectedCollege?.name}"</span>? 
              This will permanently remove the college and all associated data.
            </p>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-gray-100">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteCollegeMutation.isPending}
                className="border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium"
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
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete College'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View College Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 to-orange-50">
            <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              College Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              View detailed information about the college.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCollege && (
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">College Name</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-sky-400" />
                    {selectedCollege.name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">College ID</Label>
                  <p className="text-sm font-mono text-gray-600 mt-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                    {selectedCollege._id}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</Label>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    {formatDate(selectedCollege.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</Label>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    {formatDate(selectedCollege.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Branches Section */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-orange-400" />
                  Branches ({selectedCollege.branches?.length || 0})
                </Label>
                {selectedCollege.branches && selectedCollege.branches.length > 0 ? (
                  <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-xl">
                    {selectedCollege.branches.map((branch) => (
                      <span
                        key={branch._id}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-sky-50 to-sky-100 text-sky-700 border border-sky-200"
                      >
                        {branch.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl">
                    No branches assigned to this college
                  </p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="p-6 pt-4 border-t border-gray-100">
            <Button 
              onClick={() => setIsViewDialogOpen(false)}
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}