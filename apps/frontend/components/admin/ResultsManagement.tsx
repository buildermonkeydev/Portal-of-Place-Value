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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Download, Eye, Trash2 } from 'lucide-react';
import { AssessmentResult } from '@/lib/types';
import { assessmentResultAPI } from '@/lib/api/assessmentResults';
import { Loading } from '@/components/ui/Loading';

export function ResultsManagement() {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AssessmentResult[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const response = await assessmentResultAPI.getAllResults();
      setResults(response.data || []);
      setFilteredResults(response.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter((result) =>
        result.userId?.fullName
          ? result.userId.fullName
          : result.userId.firstName +
              '' +
              result.userId.lastName

                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            result.assessmentId.title
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((result) => result.status === statusFilter);
    }

    setFilteredResults(filtered);
  }, [results, searchTerm, statusFilter]);

  const handleDeleteResult = async (resultId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this result? This action cannot be undone.'
      )
    ) {
      try {
        await assessmentResultAPI.deleteResult(resultId);
        await fetchResults(); // Refresh the list
      } catch (error) {
        console.error('Error deleting result:', error);
      }
    }
  };

  const exportResults = () => {
    const csvContent = [
      ['User', 'Assessment', 'Score', 'Status', 'Duration', 'Submitted'],
      ...filteredResults.map((result) => [
        result.userId.fullName,
        result.assessmentId.title,
        `${result.percentage}%`,
        result.status,
        `${result.duration}s`,
        new Date(result.endTime || result.createdAt).toLocaleDateString(),
      ]),
    ];

    const csv = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment-results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Assessment Results</h2>
        </div>
        <Loading message="Loading results... Behave Like Compiler" size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assessment Results</h2>
        <Button onClick={exportResults} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by user or assessment..."
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
      </div>

      {/* Results Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow key={result._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">
                        {result.userId.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.userId.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{result.assessmentId.title}</div>
                  <div className="text-sm text-gray-500">
                    {result.assessmentId.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{result.percentage}%</Badge>
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
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Result Details</DialogTitle>
                          <DialogDescription>
                            Detailed view of the assessment result
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <strong>User:</strong> {result.userId.fullName}
                          </div>
                          <div>
                            <strong>Assessment:</strong>{' '}
                            {result.assessmentId.title}
                          </div>
                          <div>
                            <strong>Score:</strong> {result.percentage}%
                          </div>
                          <div>
                            <strong>Status:</strong> {result.status}
                          </div>
                          <div>
                            <strong>Duration:</strong> {result.duration} seconds
                          </div>
                          <div>
                            <strong>Submitted:</strong>{' '}
                            {result.endTime
                              ? new Date(result.endTime).toLocaleDateString()
                              : new Date(result.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteResult(result._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">
            {results.length === 0
              ? 'No results found.'
              : 'No results match your search criteria.'}
          </p>
        </div>
      )}
    </div>
  );
}
