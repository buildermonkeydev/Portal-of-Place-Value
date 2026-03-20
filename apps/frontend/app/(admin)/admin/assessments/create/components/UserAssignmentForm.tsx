'use client';

import { UseFormReturn, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trash2,
  Users,
  AlertCircle,
  Mail,
  Plus,
  Building2,
  Search,
  X,
  Loader2,
  UserPlus,
  Send,
  Filter,
  ChevronDown,
  ChevronUp,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { AssessmentFormData, User, College } from '../types';
import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '@/lib/api/users';
import { cn } from '@/lib/utils';

interface UserAssignmentFormProps {
  form: UseFormReturn<AssessmentFormData>;
  users: User[];
  colleges: College[];
}

export function UserAssignmentForm({
  form,
  users,
  colleges,
}: UserAssignmentFormProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedAssignAllUsers = watch('assignAllUsers');
  const assignedUsers = watch('assignedUsers') || [];
  const invitedUsers = watch('invitedUsers') || [];
  const selectedColleges = watch('colleges') || [];
  const [newInvitedEmail, setNewInvitedEmail] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userDetailsMap, setUserDetailsMap] = useState<Map<string, User>>(new Map());
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());

  // Debounced search function
  const handleSearchChange = useCallback(
    (query: string) => {
      if (!query.trim()) {
        const availableUsers = users.filter(
          (user) => !assignedUsers.includes(user._id)
        );
        setSearchResults(availableUsers);
        return;
      }

      if (query.length >= 2) {
        setIsSearching(true);
        userAPI
          .searchUsers({ search: query, limit: 50 })
          .then((response) => {
            const availableUsers = (response.data || []).filter(
              (user) => !assignedUsers.includes(user._id)
            );
            setSearchResults(availableUsers);
            setUserDetailsMap((prevMap) => {
              const newMap = new Map(prevMap);
              availableUsers.forEach((user) => {
                newMap.set(user._id, user);
              });
              return newMap;
            });
          })
          .catch((error) => {
            console.error('Error searching users:', error);
            setSearchResults([]);
          })
          .finally(() => {
            setIsSearching(false);
          });
      } else {
        setSearchResults([]);
      }
    },
    [assignedUsers, users]
  );

  // Load default users when component mounts
  useEffect(() => {
    if (users && !userSearchQuery.trim()) {
      const availableUsers = users.filter(
        (user) => !assignedUsers.includes(user._id)
      );
      setSearchResults(availableUsers);
      setUserDetailsMap((prevMap) => {
        const newMap = new Map(prevMap);
        users.forEach((user) => {
          newMap.set(user._id, user);
        });
        return newMap;
      });
    }
  }, [users, assignedUsers, userSearchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const toggleCollegeExpand = (collegeId: string) => {
    setExpandedColleges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(collegeId)) {
        newSet.delete(collegeId);
      } else {
        newSet.add(collegeId);
      }
      return newSet;
    });
  };

  const addUser = (userId: string, userData?: User) => {
    setIsSelectingUser(true);
    if (!assignedUsers.includes(userId)) {
      setValue('assignedUsers', [...assignedUsers, userId]);
      if (userData) {
        setUserDetailsMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(userId, userData);
          return newMap;
        });
      }
      setUserSearchQuery('');
      setSearchResults([]);
      setIsUserSearchOpen(false);
    }
    setTimeout(() => {
      setIsSelectingUser(false);
    }, 100);
  };

  const removeUser = (userId: string) => {
    const newUsers = assignedUsers.filter((id) => id !== userId);
    setValue('assignedUsers', newUsers);
  };

  const handleAssignAllUsers = (checked: boolean) => {
    setValue('assignAllUsers', checked);
    if (checked) {
      setValue('assignedUsers', []);
    }
  };

  const addInvitedUser = () => {
    if (newInvitedEmail && !invitedUsers.includes(newInvitedEmail)) {
      setValue('invitedUsers', [...invitedUsers, newInvitedEmail]);
      setNewInvitedEmail('');
    }
  };

  const removeInvitedUser = (email: string) => {
    const newEmails = invitedUsers.filter((e) => e !== email);
    setValue('invitedUsers', newEmails);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInvitedUser();
    }
  };

  // Helper function to check if college has branches or years selected
  const hasSelectedFilters = (college: typeof selectedColleges[0]) => {
    return (college.branches && college.branches.length > 0) || 
           (college.year && college.year.length > 0);
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">User Assignment</h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1 ml-6">
          Assign this assessment to users, colleges, or invite new participants
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* College-Based Assignment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-400" />
            <Label className="text-sm font-medium text-white">College-Based Assignment</Label>
          </div>
          <p className="text-xs text-zinc-500">
            Select colleges and optionally filter by specific branches and years.
          </p>

          {/* College Selection Table */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-zinc-400">
              <div className="col-span-1">Select</div>
              <div className="col-span-4">College Name</div>
              <div className="col-span-4">Branches</div>
              <div className="col-span-3">Years</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {colleges.map((college) => {
                const isSelected = selectedColleges.some(
                  (sc) => sc._id === college._id
                );
                const selectedCollege = selectedColleges.find(
                  (sc) => sc._id === college._id
                );
                const isExpanded = expandedColleges.has(college._id);

                return (
                  <div key={college._id} className="border-b border-white/10 last:border-b-0">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors">
                      {/* Select Checkbox */}
                      <div className="col-span-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue('colleges', [
                                ...selectedColleges,
                                { _id: college._id, branches: [], year: [] },
                              ]);
                            } else {
                              setValue(
                                'colleges',
                                selectedColleges.filter(
                                  (sc) => sc._id !== college._id
                                )
                              );
                            }
                          }}
                          className="border-white/30 data-[state=checked]:bg-indigo-500"
                        />
                      </div>

                      {/* College Name */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{college.name}</p>
                            <p className="text-xs text-zinc-500">
                              {college.branches.length} branches
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Branch Selection */}
                      <div className="col-span-4">
                        {isSelected ? (
                          <div className="space-y-2">
                            <Select
                              onValueChange={(branchId) => {
                                const currentBranches = selectedCollege?.branches || [];
                                const branch = college.branches.find(
                                  (b) => b._id === branchId
                                );
                                if (branch && !currentBranches.some((b) => b._id === branchId)) {
                                  const updatedColleges = selectedColleges.map((sc) =>
                                    sc._id === college._id
                                      ? {
                                          ...sc,
                                          branches: [...currentBranches, { _id: branch._id, name: branch.name }],
                                        }
                                      : sc
                                  );
                                  setValue('colleges', updatedColleges);
                                }
                              }}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8 rounded-lg">
                                <SelectValue placeholder="All branches" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                                {college.branches.map((branch) => (
                                  <SelectItem key={branch._id} value={branch._id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {selectedCollege?.branches && selectedCollege.branches.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {selectedCollege.branches.map((branch) => (
                                  <div
                                    key={branch._id}
                                    className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full text-xs"
                                  >
                                    <span>{branch.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedColleges = selectedColleges.map((sc) =>
                                          sc._id === college._id
                                            ? {
                                                ...sc,
                                                branches: sc.branches?.filter(
                                                  (b) => b._id !== branch._id
                                                ) || [],
                                              }
                                            : sc
                                        );
                                        setValue('colleges', updatedColleges);
                                      }}
                                      className="ml-1 hover:text-indigo-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">Select college first</span>
                        )}
                      </div>

                      {/* Year Selection */}
                      <div className="col-span-3">
                        {isSelected ? (
                          <div className="space-y-2">
                            <Select
                              onValueChange={(year) => {
                                const yearNum = parseInt(year);
                                const currentYears = selectedCollege?.year || [];
                                if (!currentYears.includes(yearNum)) {
                                  const updatedColleges = selectedColleges.map((sc) =>
                                    sc._id === college._id
                                      ? {
                                          ...sc,
                                          year: [...currentYears, yearNum],
                                        }
                                      : sc
                                  );
                                  setValue('colleges', updatedColleges);
                                }
                              }}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8 rounded-lg">
                                <SelectValue placeholder="All years" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                                {[1, 2, 3, 4].map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    Year {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {selectedCollege?.year && selectedCollege.year.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {selectedCollege.year.map((year) => (
                                  <div
                                    key={year}
                                    className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-2 py-1 rounded-full text-xs"
                                  >
                                    <span>Year {year}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedColleges = selectedColleges.map((sc) =>
                                          sc._id === college._id
                                            ? {
                                                ...sc,
                                                year: sc.year?.filter((y) => y !== year) || [],
                                              }
                                            : sc
                                        );
                                        setValue('colleges', updatedColleges);
                                      }}
                                      className="ml-1 hover:text-orange-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">Select college first</span>
                        )}
                      </div>
                    </div>

                    {/* Expand/Collapse Button for Details - Fixed null check */}
                    {isSelected && selectedCollege && hasSelectedFilters(selectedCollege) && (
                      <button
                        onClick={() => toggleCollegeExpand(college._id)}
                        className="w-full px-4 py-2 text-xs text-zinc-500 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Show selected filters
                          </>
                        )}
                      </button>
                    )}

                    {/* Expanded Details - Fixed null checks */}
                    {isExpanded && isSelected && selectedCollege && hasSelectedFilters(selectedCollege) && (
                      <div className="px-4 py-3 bg-white/5 border-t border-white/10">
                        <div className="space-y-2">
                          {selectedCollege.branches && selectedCollege.branches.length > 0 && (
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Selected Branches:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedCollege.branches.map((branch) => (
                                  <span key={branch._id} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                                    {branch.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedCollege.year && selectedCollege.year.length > 0 && (
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Selected Years:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedCollege.year.map((year) => (
                                  <span key={year} className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">
                                    Year {year}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary of Selected Colleges */}
          {selectedColleges.length > 0 && (
            <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                <h4 className="text-sm font-medium text-white">Assignment Summary</h4>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Users from the following colleges will be automatically assigned:
              </p>
              <div className="space-y-2">
                {selectedColleges.map((selectedCollege) => {
                  const college = colleges.find((c) => c._id === selectedCollege._id);
                  return college ? (
                    <div key={selectedCollege._id} className="bg-white/5 rounded-lg p-3">
                      <div className="font-medium text-white text-sm">{college.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 space-y-1">
                        {selectedCollege.branches && selectedCollege.branches.length > 0 && (
                          <div>
                            <span className="text-zinc-400">Branches:</span>{' '}
                            {selectedCollege.branches.map((b) => b.name).join(', ')}
                          </div>
                        )}
                        {selectedCollege.year && selectedCollege.year.length > 0 && (
                          <div>
                            <span className="text-zinc-400">Years:</span>{' '}
                            {selectedCollege.year.map((y) => `Year ${y}`).join(', ')}
                          </div>
                        )}
                        {(!selectedCollege.branches || selectedCollege.branches.length === 0) &&
                          (!selectedCollege.year || selectedCollege.year.length === 0) && (
                            <span className="text-indigo-400">All students</span>
                          )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rest of the component remains the same */}
        {/* User Assignment Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <Label className="text-sm font-medium text-white">Direct User Assignment</Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="assignAllUsers"
              checked={watchedAssignAllUsers}
              onCheckedChange={handleAssignAllUsers}
              className="border-white/30 data-[state=checked]:bg-indigo-500"
            />
            <Label htmlFor="assignAllUsers" className="text-sm text-white cursor-pointer">
              Assign to all users
            </Label>
          </div>

          {!watchedAssignAllUsers && (
            <>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setUserSearchQuery(query);
                      if (searchTimeout) clearTimeout(searchTimeout);
                      const timeout = setTimeout(() => {
                        handleSearchChange(query);
                      }, 200);
                      setSearchTimeout(timeout);
                    }}
                    onFocus={() => setIsUserSearchOpen(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!isSelectingUser) setIsUserSearchOpen(false);
                      }, 200);
                    }}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                  />
                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchQuery('');
                        setSearchResults([]);
                        setIsUserSearchOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {isUserSearchOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-[#1A1A2A] border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.length > 0 && (
                      <>
                        {!userSearchQuery.trim() && (
                          <div className="px-3 py-2 border-b border-white/10">
                            <p className="text-xs text-zinc-500">Available Users</p>
                          </div>
                        )}
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addUser(user._id, user);
                            }}
                          >
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-400">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                            </div>
                            <UserPlus className="h-4 w-4 text-zinc-500" />
                          </div>
                        ))}
                      </>
                    )}

                    {isSearching && (
                      <div className="p-4 text-center">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400 mx-auto" />
                        <p className="text-xs text-zinc-500 mt-2">Searching...</p>
                      </div>
                    )}

                    {!isSearching && userSearchQuery && searchResults.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-zinc-500">No users found</p>
                      </div>
                    )}

                    {!isSearching && !userSearchQuery.trim() && searchResults.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-zinc-500">No available users to assign</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Assigned Users List */}
              {assignedUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <Label className="text-xs text-zinc-400">
                      Assigned Users ({assignedUsers.length})
                    </Label>
                  </div>
                  <div className="space-y-2">
                    {assignedUsers.map((userId) => {
                      let user = users.find((u) => u._id === userId);
                      if (!user) user = userDetailsMap.get(userId);
                      return user ? (
                        <div
                          key={userId}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-emerald-400">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-zinc-500">{user.email}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUser(userId)}
                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div key={userId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-zinc-500">?</span>
                            </div>
                            <div>
                              <p className="text-sm text-zinc-500">User ID: {userId}</p>
                              <p className="text-xs text-zinc-600">Details not available</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUser(userId)}
                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {errors.assignedUsers && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-xs text-red-400">
                {errors.assignedUsers.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Invited Users Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-orange-400" />
            <Label className="text-sm font-medium text-white">Invite Users by Email</Label>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                placeholder="Enter email address"
                value={newInvitedEmail}
                onChange={(e) => setNewInvitedEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
              />
            </div>
            <Button
              type="button"
              onClick={addInvitedUser}
              disabled={!newInvitedEmail}
              className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {invitedUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-orange-400" />
                <Label className="text-xs text-zinc-400">Invited Users ({invitedUsers.length})</Label>
              </div>
              <div className="space-y-2">
                {invitedUsers.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{email}</p>
                        <p className="text-xs text-zinc-500">Will receive invitation email</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInvitedUser(email)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.invitedUsers && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-xs text-red-400">
                {errors.invitedUsers.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}