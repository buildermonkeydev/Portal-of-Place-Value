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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useBulkImportColleges,
  useBulkImportFromFile,
} from '@/lib/hooks/useColleges';
import { toast } from 'sonner';

const bulkImportSchema = z.object({
  colleges: z.string().min(1, 'Please enter college names'),
});

type BulkImportFormData = z.infer<typeof bulkImportSchema>;

interface CollegeBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollegeBulkImportModal({
  isOpen,
  onClose,
}: CollegeBulkImportModalProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const bulkImportMutation = useBulkImportColleges();
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
    const colleges = data.colleges
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(',').map((part) => part.trim());
        const collegeName = parts[0];
        const branches = parts.slice(1).filter((branch) => branch.length > 0);

        return {
          name: collegeName,
          branches: branches.map((branch) => ({ name: branch })),
        };
      })
      .filter((college) => college.branches.length > 0);

    if (colleges.length === 0) {
      toast.error('Please enter at least one valid college with branches');
      return;
    }

    // Check if any college is missing branches
    const invalidColleges = colleges.filter(
      (college) => college.branches.length === 0
    );
    if (invalidColleges.length > 0) {
      toast.error('Each college must have at least one branch');
      return;
    }

    setIsSubmitting(true);
    try {
      await bulkImportMutation.mutateAsync(colleges);
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
      'Computer Science,Computer Science,Software Engineering,Data Science\n' +
      'Electrical Engineering,Electrical Engineering,Electronics,Power Systems\n' +
      'Mechanical Engineering,Mechanical Engineering,Automotive,Robotics\n' +
      'Civil Engineering,Civil Engineering,Structural Engineering,Transportation\n' +
      'Information Technology,Information Technology,Cybersecurity,Web Development';

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'college-import-template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Colleges</DialogTitle>
          <DialogDescription>
            Import multiple colleges at once using text input or file upload.
            Each college must have at least one branch.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="colleges">
                  College Names and Branches (one per line)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
              </div>
              <Textarea
                id="colleges"
                {...register('colleges')}
                placeholder="Enter college names and branches in format: CollegeName,Branch1,Branch2,Branch3 (one per line)..."
                rows={8}
                className={errors.colleges ? 'border-red-500' : ''}
              />
              {errors.colleges && (
                <p className="text-sm text-red-500">
                  {errors.colleges.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter college names and branches in the format:
                CollegeName,Branch1,Branch2,Branch3 (one college per line). Each
                college must have at least one branch.
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
                onClick={handleSubmit(handleTextSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Importing...' : 'Import Colleges'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <input
                  id="file"
                  type="file"
                  accept=".txt,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: .txt, .xlsx, .xls, .csv
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Selected file:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>File Format Requirements</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    • <strong>TXT:</strong> Format:
                    CollegeName,Branch1,Branch2,Branch3 (one college per line)
                  </p>
                  <p>
                    • <strong>Excel:</strong> First column: college names,
                    subsequent columns: branches (skip header row)
                  </p>
                  <p>
                    • <strong>CSV:</strong> First column: college names,
                    subsequent columns: branches (skip header row)
                  </p>
                  <p className="text-red-600 font-medium">
                    • Each college must have at least one branch
                  </p>
                </div>
              </div>
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
                onClick={handleFileSubmit}
                disabled={isSubmitting || !selectedFile}
              >
                {isSubmitting ? 'Importing...' : 'Import from File'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
