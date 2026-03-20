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
import { Plus, Trash2, Layers, X, FolderOpen, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      toast.success(`Section "${newSection.trim()}" added`);
    } else if (sections.includes(newSection.trim())) {
      toast.error('Section already exists');
    }
  };

  const removeSection = (sectionToRemove: string) => {
    // Check if any questions are using this section
    const questionsUsingSection = questionsUsingSections.filter(
      (q) => q.section === sectionToRemove
    );

    if (questionsUsingSection.length > 0) {
      toast.error(
        `Cannot remove section "${sectionToRemove}" - ${questionsUsingSection.length} question(s) are using it. Please reassign or remove those questions first.`
      );
      return;
    }

    onSectionsChange(sections.filter((s) => s !== sectionToRemove));
    toast.success(`Section "${sectionToRemove}" removed`);
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Assessment Sections</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1 ml-6">
              Create sections to organize your questions by topic or subject area
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingSection(true)}
            className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Section
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Add Section Form */}
        {isAddingSection && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <Input
                  placeholder="Enter section name (e.g., Mathematics, Physics)"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSection()}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                  autoFocus
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addSection}
                disabled={!newSection.trim()}
                className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white"
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
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2 ml-1">
              Sections help organize questions. Students will see sections grouped together.
            </p>
          </div>
        )}

        {/* Sections List */}
        {sections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.map((section) => {
              const questionCount = questionsUsingSections.filter(
                (q) => q.section === section
              ).length;
              
              return (
                <div
                  key={section}
                  className="group relative p-4 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-sm font-medium text-white">{section}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs"
                        >
                          {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Layers className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-500">No sections created yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Create sections to organize your questions
            </p>
          </div>
        )}

        {/* Info message when sections exist */}
        {sections.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
              Total: {sections.length} section{sections.length !== 1 ? 's' : ''}
              {questionsUsingSections.length > 0 && (
                <span className="ml-2">
                  • {questionsUsingSections.length} question(s) assigned
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}