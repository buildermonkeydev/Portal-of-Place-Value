'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SectionManagementProps {
  sections: string[];
  onSectionsChange: (sections: string[]) => void;
  questionsUsingSections?: Array<{ section?: string }>;
}

export function SectionManagement({
  sections,
  onSectionsChange,
  questionsUsingSections = [],
}: SectionManagementProps) {
  const [newSection, setNewSection] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const addSection = () => {
    if (newSection.trim() && !sections.includes(newSection.trim())) {
      onSectionsChange([...sections, newSection.trim()]);
      setNewSection('');
      setIsAddingSection(false);
    }
  };

  const removeSection = (sectionToRemove: string) => {
    // Check if any questions are using this section
    const questionsUsingSection = questionsUsingSections.filter(
      (q) => q.section === sectionToRemove
    );

    if (questionsUsingSection.length > 0) {
      toast.error(
        `Cannot remove section "${sectionToRemove}" - ${questionsUsingSection.length} questions are using it. Please reassign or remove those questions first.`
      );
      return;
    }

    onSectionsChange(sections.filter((s) => s !== sectionToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Assessment Sections
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingSection(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardTitle>
        <CardDescription>
          Create sections to organize your questions by topic or subject area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Section Form */}
        {isAddingSection && (
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
            <Input
              placeholder="Enter section name (e.g., Mathematics, Physics)"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSection()}
            />
            <Button
              type="button"
              size="sm"
              onClick={addSection}
              disabled={!newSection.trim()}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingSection(false);
                setNewSection('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Sections List */}
        {sections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.map((section) => (
              <div
                key={section}
                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
              >
                <span className="font-medium text-blue-900">{section}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(section)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>No sections created yet.</p>
            <p className="text-sm">
              Create sections to organize your questions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
