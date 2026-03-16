'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search, GraduationCap, Check, ChevronDown } from 'lucide-react';
import { useBranches } from '@/lib/hooks/useBranches';
import { useCreateBranch } from '@/lib/hooks/useBranches';
import { Branch } from '@/lib/types/branch';
import { toast } from 'sonner';

interface BranchSelectorProps {
  selectedBranches: Array<{ name: string }>;
  onBranchesChange: (branches: Array<{ name: string }>) => void;
  label?: string;
}

export function BranchSelector({
  selectedBranches,
  onBranchesChange,
  label = 'Branches',
}: BranchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: branches, isLoading } = useBranches({
    search: searchTerm.length >= 2 ? searchTerm : undefined,
    limit: 50,
  });
  const createBranchMutation = useCreateBranch();

  const filteredBranches = (
    Array.isArray(branches) ? branches : branches?.data || []
  ).filter(
    (branch) =>
      !selectedBranches.some((selected) => selected.name === branch.name)
  );

  const handleAddExistingBranch = (branch: Branch) => {
    const newBranches = [...selectedBranches, { name: branch.name }];
    onBranchesChange(newBranches);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemoveBranch = (branchName: string) => {
    const newBranches = selectedBranches.filter(
      (branch) => branch.name !== branchName
    );
    onBranchesChange(newBranches);
  };

  const handleAddNewBranch = async () => {
    if (!newBranchName.trim()) return;

    const branchName = newBranchName.trim();

    // Check if branch already exists
    if (selectedBranches.some((branch) => branch.name === branchName)) {
      toast.error('Branch already added');
      return;
    }

    try {
      // Try to create the branch first
      await createBranchMutation.mutateAsync({ name: branchName });

      // Add to selected branches
      const newBranches = [...selectedBranches, { name: branchName }];
      onBranchesChange(newBranches);

      setNewBranchName('');
      setIsAddingNew(false);
      toast.success('Branch created and added successfully');
    } catch (error) {
      // If creation fails, just add it locally (it might already exist)
      const newBranches = [...selectedBranches, { name: branchName }];
      onBranchesChange(newBranches);
      setNewBranchName('');
      setIsAddingNew(false);
      toast.success('Branch added successfully');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      setShowDropdown(true);
    } else if (value.length === 0) {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Label */}
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-orange-400" />
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </Label>
        <span className="text-xs text-sky-400 font-medium">*</span>
      </div>
      
      <p className="text-xs text-gray-500 -mt-2 ml-6">
        Search existing branches or add new ones. Click on branches to add them.
      </p>

      {/* Selected Branches Display */}
      {selectedBranches.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-xl border border-sky-100">
          {selectedBranches.map((branch, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border border-sky-200 hover:from-sky-200 hover:to-sky-100 rounded-lg text-xs font-medium"
            >
              <Check className="h-3 w-3 text-sky-500" />
              {branch.name}
              <button
                type="button"
                onClick={() => handleRemoveBranch(branch.name)}
                className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search and Add Existing Branches */}
      <div className="relative space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
          <Input
            placeholder={
              searchTerm.length >= 2
                ? 'Search branches...'
                : 'Search or click to see all branches...'
            }
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm"
            onFocus={() => setShowDropdown(true)}
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setShowDropdown(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Show All Branches Button - only when dropdown is closed */}
        {!searchTerm && !showDropdown && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDropdown(true)}
            className="w-full border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse All Branches
          </Button>
        )}

        {/* Dropdown for existing branches */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm border border-sky-100 rounded-xl shadow-lg max-h-72 overflow-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="relative inline-flex">
                  <div className="h-8 w-8 rounded-full border-3 border-sky-100 border-t-sky-500 animate-spin"></div>
                  <GraduationCap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-sky-300" />
                </div>
                <p className="text-sm text-gray-500 mt-2">Loading branches...</p>
              </div>
            ) : filteredBranches.length > 0 ? (
              <>
                <div className="p-2 text-xs font-medium text-sky-600 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-orange-50/30 sticky top-0">
                  {searchTerm.length >= 2
                    ? `Found ${filteredBranches.length} branch${
                        filteredBranches.length === 1 ? '' : 'es'
                      }`
                    : `${filteredBranches.length} available branch${
                        filteredBranches.length === 1 ? '' : 'es'
                      }`}
                </div>
                <div className="p-1">
                  {filteredBranches.map((branch) => (
                    <button
                      key={branch._id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-gradient-to-r hover:from-sky-50 hover:to-orange-50/30 rounded-lg transition-colors flex items-center justify-between group"
                      onClick={() => handleAddExistingBranch(branch)}
                    >
                      <span className="text-sm text-gray-700">{branch.name}</span>
                      <Plus className="h-4 w-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6 text-center">
                <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="h-6 w-6 text-sky-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {searchTerm.length >= 2
                    ? 'No branches found'
                    : 'No branches available'}
                </p>
                <p className="text-xs text-gray-500">
                  {searchTerm.length >= 2
                    ? `Try a different search term or add "${searchTerm}" as a new branch`
                    : 'Add a new branch to get started'}
                </p>
                {searchTerm.length >= 2 && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => {
                      setNewBranchName(searchTerm);
                      setIsAddingNew(true);
                      setShowDropdown(false);
                    }}
                    className="text-sky-600 hover:text-sky-700 text-sm mt-2"
                  >
                    Add "{searchTerm}" as new branch
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Branch Section */}
      {!isAddingNew ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAddingNew(true)}
          className="w-full border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl py-2.5 text-sm font-medium transition-all group"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Create New Branch
        </Button>
      ) : (
        <div className="p-4 bg-gradient-to-r from-sky-50/30 to-orange-50/30 border border-sky-100 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Branch Details</span>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
              <Input
                placeholder="Enter branch name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewBranch();
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm"
                autoFocus
              />
            </div>
            <Button
              type="button"
              onClick={handleAddNewBranch}
              disabled={!newBranchName.trim() || createBranchMutation.isPending}
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm min-w-[80px]"
            >
              {createBranchMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              ) : (
                'Add'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewBranchName('');
              }}
              className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
          </div>
          
          {createBranchMutation.isPending && (
            <p className="text-xs text-sky-600 flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-sky-400 animate-pulse"></div>
              Creating branch...
            </p>
          )}
        </div>
      )}

      {/* Helper Text */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="h-1 w-1 rounded-full bg-sky-300"></div>
        <span>At least one branch is required</span>
        <div className="h-1 w-1 rounded-full bg-orange-300"></div>
        <span>Click on branches to select them</span>
      </div>
    </div>
  );
}