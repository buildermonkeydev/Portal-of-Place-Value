import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { TestInputFormData } from '@/lib/types/test';

interface TestInputEditorProps {
  inputs: TestInputFormData[];
  onChange: (inputs: TestInputFormData[]) => void;
  allowedLanguages: number[];
  languageNames: Record<number, string>;
}

export function TestInputEditor({
  inputs,
  onChange,
  allowedLanguages,
  languageNames,
}: TestInputEditorProps) {
  const addInput = () => {
    const newOrder = Math.max(...inputs.map((i) => i.order), 0) + 1;
    const newInput: TestInputFormData = {
      value: '',
      order: newOrder,
      inputFormat: 'array',
      applicableLanguages: [],
    };
    onChange([...inputs, newInput]);
  };

  const removeInput = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    // Reorder remaining inputs
    const reorderedInputs = newInputs.map((input, i) => ({
      ...input,
      order: i + 1,
    }));
    onChange(reorderedInputs);
  };

  const updateInput = (
    index: number,
    field: keyof TestInputFormData,
    value: any
  ) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    onChange(newInputs);
  };

  const moveInput = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= inputs.length) return;

    const newInputs = [...inputs];
    const [movedInput] = newInputs.splice(fromIndex, 1);
    newInputs.splice(toIndex, 0, movedInput);

    // Update order numbers
    const reorderedInputs = newInputs.map((input, i) => ({
      ...input,
      order: i + 1,
    }));
    onChange(reorderedInputs);
  };

  const toggleLanguage = (inputIndex: number, languageId: number) => {
    const input = inputs[inputIndex];
    const currentLanguages = input.applicableLanguages || [];

    let newLanguages: number[];
    if (currentLanguages.includes(languageId)) {
      newLanguages = currentLanguages.filter((id) => id !== languageId);
    } else {
      newLanguages = [...currentLanguages, languageId];
    }

    updateInput(inputIndex, 'applicableLanguages', newLanguages);
  };

  const getApplicableLanguagesText = (applicableLanguages: number[]) => {
    if (
      applicableLanguages.length === 0 ||
      (applicableLanguages.length === allowedLanguages.length &&
        applicableLanguages.every((langId) =>
          allowedLanguages.includes(langId)
        ))
    ) {
      return 'All Languages';
    }
    return applicableLanguages
      .map((id) => languageNames[id] || `Language ${id}`)
      .join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Test Inputs</h3>
        <Button onClick={addInput} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Input
        </Button>
      </div>

      {inputs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No inputs added yet. Click "Add Input" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inputs.map((input, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Input {input.order}</span>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    Order {input.order}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {index > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveInput(index, index - 1)}
                    >
                      ↑
                    </Button>
                  )}
                  {index < inputs.length - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveInput(index, index + 1)}
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeInput(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`input-value-${index}`}>Value *</Label>
                  <Input
                    id={`input-value-${index}`}
                    value={input.value}
                    onChange={(e) =>
                      updateInput(index, 'value', e.target.value)
                    }
                    placeholder="Enter input value (e.g., 1,2,3 or hello)"
                  />
                </div>

                <div>
                  <Label htmlFor={`input-order-${index}`}>Order *</Label>
                  <Input
                    id={`input-order-${index}`}
                    type="number"
                    min="1"
                    value={input.order}
                    onChange={(e) =>
                      updateInput(index, 'order', parseInt(e.target.value) || 1)
                    }
                    placeholder="Input order (1, 2, 3...)"
                  />
                </div>

                <div>
                  <Label htmlFor={`input-format-${index}`}>Input Format</Label>
                  <Select
                    value={input.inputFormat}
                    onValueChange={(value: any) =>
                      updateInput(index, 'inputFormat', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="array">Array</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Applicable Languages</Label>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {getApplicableLanguagesText(
                        input.applicableLanguages || []
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allowedLanguages.map((languageId) => (
                        <Button
                          key={languageId}
                          variant={
                            input.applicableLanguages?.includes(languageId)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => toggleLanguage(index, languageId)}
                        >
                          {languageNames[languageId] ||
                            `Language ${languageId}`}
                        </Button>
                      ))}
                      <Button
                        variant={
                          input.applicableLanguages?.length === 0 ||
                          (input.applicableLanguages &&
                            input.applicableLanguages.length ===
                              allowedLanguages.length &&
                            input.applicableLanguages.every((langId) =>
                              allowedLanguages.includes(langId)
                            ))
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          updateInput(
                            index,
                            'applicableLanguages',
                            allowedLanguages
                          )
                        }
                      >
                        All Languages
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
