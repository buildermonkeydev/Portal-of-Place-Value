'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useBulkImportBranches,
  useBulkImportFromFile,
} from '@/lib/hooks/useBranches';
import { CreateBranchData } from '@/lib/types/branch';
import { Upload, FileText, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const bulkImportSchema = z.object({
  branches: z.string().min(1, 'Please enter branch names'),
});

type BulkImportFormData = z.infer<typeof bulkImportSchema>;

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const bulkImportMutation = useBulkImportBranches();
  const fileImportMutation = useBulkImportFromFile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BulkImportFormData>({
    resolver: zodResolver(bulkImportSchema),
  });

  const handleTextSubmit = async (data: BulkImportFormData) => {
    const branchNames = data.branches
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((name) => ({ name }));

    if (branchNames.length === 0) {
      toast.error('Please enter at least one valid branch name');
      return;
    }

    setIsSubmitting(true);
    try {
      await bulkImportMutation.mutateAsync(branchNames);
      reset();
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsSubmitting(true);
    try {
      await fileImportMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedFile(null);
      onClose();
    }
  };

  const downloadTemplate = () => {
    const template =
      'Computer Science\nInformation Technology\nElectronics\nMechanical\nCivil';
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branch-import-template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Branches</DialogTitle>
          <DialogDescription>
            Import multiple branches at once using text input or file upload.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <form
              onSubmit={handleSubmit(handleTextSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="branches">Branch Names (one per line)</Label>
                <Textarea
                  id="branches"
                  placeholder="Enter branch names, one per line&#10;Computer Science&#10;Information Technology&#10;Electronics"
                  rows={8}
                  {...register('branches')}
                  className={errors.branches ? 'border-red-500' : ''}
                />
                {errors.branches && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>
                      {errors.branches.message}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-muted-foreground">
                  Enter one branch name per line. Empty lines will be ignored.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedFile
                        ? selectedFile.name
                        : 'Click to select file or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Supports .txt and .csv files
                    </span>
                  </label>
                </div>
                {selectedFile && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <p className="text-sm text-muted-foreground">
                  Download a template file to see the expected format.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleFileSubmit}
                  disabled={!selectedFile || isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
