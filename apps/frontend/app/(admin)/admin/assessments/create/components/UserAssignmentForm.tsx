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
} from 'lucide-react';
import { AssessmentFormData, User, College } from '../types';
import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '@/lib/api/users';

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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  // Map to store user details for users found via search
  const [userDetailsMap, setUserDetailsMap] = useState<Map<string, User>>(
    new Map()
  );

  // Debounced search function
  const handleSearchChange = useCallback(
    (query: string) => {
      if (!query.trim()) {
        // If no search query, show default users (excluding already assigned ones)
        const availableUsers = users.filter(
          (user) => !assignedUsers.includes(user._id)
        );
        setSearchResults(availableUsers);
        return;
      }

      if (query.length >= 2) {
        // Reduced from 3 to 2 characters
        setIsSearching(true);
        // Call API search
        userAPI
          .searchUsers({ search: query, limit: 50 })
          .then((response) => {
            // Filter out already assigned users
            const availableUsers = (response.data || []).filter(
              (user) => !assignedUsers.includes(user._id)
            );
            setSearchResults(availableUsers);

            // Store user details in map
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

  // Load default users when component mounts or users/assignedUsers changes
  useEffect(() => {
    if (users && !userSearchQuery.trim()) {
      const availableUsers = users.filter(
        (user) => !assignedUsers.includes(user._id)
      );
      setSearchResults(availableUsers);

      // Store user details in map for default users
      setUserDetailsMap((prevMap) => {
        const newMap = new Map(prevMap);
        users.forEach((user) => {
          newMap.set(user._id, user);
        });
        return newMap;
      });
    }
  }, [users, assignedUsers, userSearchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const addUser = (userId: string, userData?: User) => {
    setIsSelectingUser(true);

    if (!assignedUsers.includes(userId)) {
      setValue('assignedUsers', [...assignedUsers, userId]);

      // Store user data in map if provided
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

    // Reset selection state after a short delay
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

  const handleUserSearchFocus = () => {
    setIsUserSearchOpen(true);
    // If there's already a search query, perform the search
    if (userSearchQuery.trim()) {
      handleSearchChange(userSearchQuery);
    } else {
      // Load default users when focusing
      const availableUsers = users.filter(
        (user) => !assignedUsers.includes(user._id)
      );
      setSearchResults(availableUsers);
    }
  };

  const handleUserSearchBlur = () => {
    // After a short delay, close if no interaction
    setTimeout(() => {
      if (
        !isSelectingUser &&
        (!document.activeElement ||
          !document.activeElement.closest('.relative'))
      ) {
        setIsUserSearchOpen(false);
        setSearchResults([]);
      }
    }, 200); // Increased delay to allow click events to process
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* College Selection with Table UI */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <Label>College-Based Assignment (Optional)</Label>
          </div>
          <p className="text-sm text-gray-600">
            Select colleges and optionally filter by specific branches and
            years. Users matching the criteria will be automatically assigned.
          </p>

          {/* College Selection Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 font-medium text-sm">
                <div className="col-span-1">Select</div>
                <div className="col-span-4">College Name</div>
                <div className="col-span-4">Branches (Optional)</div>
                <div className="col-span-3">Years (Optional)</div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {colleges.map((college) => {
                const isSelected = selectedColleges.some(
                  (sc) => sc._id === college._id
                );
                const selectedCollege = selectedColleges.find(
                  (sc) => sc._id === college._id
                );

                return (
                  <div
                    key={college._id}
                    className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
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
                        />
                      </div>

                      {/* College Name */}
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{college.name}</p>
                            <p className="text-xs text-gray-500">
                              {college.branches.length} branches available
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
                                const currentBranches =
                                  selectedCollege?.branches || [];
                                const branch = college.branches.find(
                                  (b) => b._id === branchId
                                );
                                if (
                                  branch &&
                                  !currentBranches.some(
                                    (b) => b._id === branchId
                                  )
                                ) {
                                  const updatedColleges = selectedColleges.map(
                                    (sc) =>
                                      sc._id === college._id
                                        ? {
                                            ...sc,
                                            branches: [
                                              ...currentBranches,
                                              {
                                                _id: branch._id,
                                                name: branch.name,
                                              },
                                            ],
                                          }
                                        : sc
                                  );
                                  setValue('colleges', updatedColleges);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="All branches" />
                              </SelectTrigger>
                              <SelectContent>
                                {college.branches.map((branch) => (
                                  <SelectItem
                                    key={branch._id}
                                    value={branch._id}
                                  >
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Selected Branches */}
                            {selectedCollege?.branches &&
                              selectedCollege.branches.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {selectedCollege.branches.map((branch) => (
                                    <div
                                      key={branch._id}
                                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                    >
                                      <span>{branch.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updatedColleges =
                                            selectedColleges.map((sc) =>
                                              sc._id === college._id
                                                ? {
                                                    ...sc,
                                                    branches:
                                                      sc.branches?.filter(
                                                        (b) =>
                                                          b._id !== branch._id
                                                      ) || [],
                                                  }
                                                : sc
                                            );
                                          setValue('colleges', updatedColleges);
                                        }}
                                        className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Select college first
                          </span>
                        )}
                      </div>

                      {/* Year Selection */}
                      <div className="col-span-3">
                        {isSelected ? (
                          <div className="space-y-2">
                            <Select
                              onValueChange={(year) => {
                                const yearNum = parseInt(year);
                                const currentYears =
                                  selectedCollege?.year || [];
                                if (!currentYears.includes(yearNum)) {
                                  const updatedColleges = selectedColleges.map(
                                    (sc) =>
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
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="All years" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((year) => (
                                  <SelectItem
                                    key={year}
                                    value={year.toString()}
                                  >
                                    Year {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Selected Years */}
                            {selectedCollege?.year &&
                              selectedCollege.year.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {selectedCollege.year.map((year) => (
                                    <div
                                      key={year}
                                      className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                                    >
                                      <span>Year {year}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updatedColleges =
                                            selectedColleges.map((sc) =>
                                              sc._id === college._id
                                                ? {
                                                    ...sc,
                                                    year:
                                                      sc.year?.filter(
                                                        (y) => y !== year
                                                      ) || [],
                                                  }
                                                : sc
                                            );
                                          setValue('colleges', updatedColleges);
                                        }}
                                        className="ml-1 h-4 w-4 p-0 hover:bg-green-200"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Select college first
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary of Selected Colleges */}
          {selectedColleges.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Assignment Summary
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Users from the following colleges will be automatically assigned
                to this assessment:
              </p>
              <div className="space-y-2">
                {selectedColleges.map((selectedCollege) => {
                  const college = colleges.find(
                    (c) => c._id === selectedCollege._id
                  );
                  return college ? (
                    <div
                      key={selectedCollege._id}
                      className="bg-white p-3 rounded border"
                    >
                      <div className="font-medium">{college.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>Branches: </span>
                        {selectedCollege.branches &&
                        selectedCollege.branches.length > 0 ? (
                          <span>
                            {selectedCollege.branches
                              .map((branch) => branch.name)
                              .join(', ')}
                          </span>
                        ) : (
                          <span className="text-blue-600">All branches</span>
                        )}
                        <span className="mx-2">|</span>
                        <span>Years: </span>
                        {selectedCollege.year &&
                        selectedCollege.year.length > 0 ? (
                          <span>
                            {selectedCollege.year
                              .map((y) => `Year ${y}`)
                              .join(', ')}
                          </span>
                        ) : (
                          <span className="text-blue-600">All years</span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Assignment */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <Label>User Assignment</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="assignAllUsers"
              checked={watchedAssignAllUsers}
              onCheckedChange={handleAssignAllUsers}
            />
            <Label
              htmlFor="assignAllUsers"
              className="flex items-center space-x-2"
            >
              Assign to all users
            </Label>
          </div>

          {!watchedAssignAllUsers && (
            <>
              <div className="flex items-center justify-between">
                <Label>Assign Specific Users</Label>
                <div className="relative w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search users or browse all available users..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setUserSearchQuery(query);

                        // Clear existing timeout
                        if (searchTimeout) {
                          clearTimeout(searchTimeout);
                        }

                        // Set new timeout for debounced search
                        const timeout = setTimeout(() => {
                          handleSearchChange(query);
                        }, 200); // 200ms delay

                        setSearchTimeout(timeout);
                      }}
                      onFocus={handleUserSearchFocus}
                      onBlur={handleUserSearchBlur}
                      className="pl-10 pr-10"
                    />
                    {userSearchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserSearchQuery('');
                          setSearchResults([]);
                          setIsUserSearchOpen(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {isUserSearchOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.length > 0 && (
                        <>
                          {!userSearchQuery.trim() && (
                            <div className="p-2 bg-gray-50 border-b border-gray-200">
                              <p className="text-xs text-gray-500 font-medium">
                                Available Users
                              </p>
                            </div>
                          )}
                          {searchResults.map((user) => (
                            <div
                              key={user._id}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addUser(user._id, user);
                              }}
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.firstName[0]}
                                  {user.lastName[0]}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Loading State */}
                      {isSearching && (
                        <div className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-500">Searching...</span>
                          </div>
                        </div>
                      )}

                      {/* No Results Message */}
                      {!isSearching &&
                        userSearchQuery &&
                        searchResults.length === 0 && (
                          <div className="p-3">
                            <p className="text-gray-500 text-center">
                              No users found
                            </p>
                          </div>
                        )}

                      {/* Show message when no users available */}
                      {!isSearching &&
                        !userSearchQuery.trim() &&
                        searchResults.length === 0 && (
                          <div className="p-3">
                            <p className="text-gray-500 text-center">
                              No available users to assign
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Users List */}
              {assignedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Users ({assignedUsers.length})</Label>
                  <div className="space-y-2">
                    {assignedUsers.map((userId, index) => {
                      // First try to find user in the users list
                      let user = users.find((u) => u._id === userId);
                      // If not found, try to get from userDetailsMap (from search results)
                      if (!user) {
                        user = userDetailsMap.get(userId);
                      }
                      return user ? (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUser(userId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-500">
                                ?
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">
                                User ID: {userId}
                              </p>
                              <p className="text-sm text-gray-400">
                                User details not available
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUser(userId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {errors.assignedUsers && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.assignedUsers.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Invited Users Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <Label>Invite Users by Email</Label>
          </div>

          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={newInvitedEmail}
              onChange={(e) => setNewInvitedEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addInvitedUser}
              disabled={!newInvitedEmail}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {invitedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Invited Users:</Label>
              {invitedUsers.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{email}</p>
                      <p className="text-sm text-gray-500">
                        Will receive invitation email
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInvitedUser(email)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.invitedUsers && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.invitedUsers.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
