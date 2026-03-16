import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EyeOff } from 'lucide-react';
import { TestCase, TestInput } from '@/lib/types/test';

interface TestCaseDisplayProps {
  testCase: TestCase;
  index: number;
  languageNames: Record<number, string>;
  currentLanguageId?: number;
}

export function TestCaseDisplay({
  testCase,
  index,
  languageNames,
  currentLanguageId,
}: TestCaseDisplayProps) {
  // Filter inputs based on current language
  const applicableInputs = testCase.inputs.filter((input) => {
    if (!input.applicableLanguages || input.applicableLanguages.length === 0) {
      return true; // Apply to all languages
    }
    return currentLanguageId
      ? input.applicableLanguages.includes(currentLanguageId)
      : true;
  });

  // Sort inputs by order
  const sortedInputs = applicableInputs.sort((a, b) => a.order - b.order);

  const getInputFormatBadge = (format?: string) => {
    const colorMap: Record<string, string> = {
      array: 'bg-blue-100 text-blue-800',
      string: 'bg-green-100 text-green-800',
      number: 'bg-purple-100 text-purple-800',
      object: 'bg-orange-100 text-orange-800',
      mixed: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colorMap[format || 'mixed'] || colorMap.mixed}>
        {format || 'mixed'}
      </Badge>
    );
  };

  const getLanguageBadges = (applicableLanguages?: number[]) => {
    if (!applicableLanguages || applicableLanguages.length === 0) {
      return <Badge variant="outline">All Languages</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {applicableLanguages.map((languageId) => (
          <Badge key={languageId} variant="secondary" className="text-xs">
            {languageNames[languageId] || `Lang ${languageId}`}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Test Case {index + 1}
          {testCase.isHidden && (
            <Badge variant="secondary" className="ml-2">
              <EyeOff className="w-3 h-3 mr-1" />
              Hidden
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs Section */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            Inputs ({sortedInputs.length})
          </h4>
          {sortedInputs.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              No inputs applicable to current language
            </div>
          ) : (
            <div className="space-y-3">
              {sortedInputs.map((input, inputIndex) => (
                <div
                  key={inputIndex}
                  className="border rounded-lg p-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        Input {input.order}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800"
                      >
                        Order {input.order}
                      </Badge>
                      {getInputFormatBadge(input.inputFormat)}
                    </div>
                    {getLanguageBadges(input.applicableLanguages)}
                  </div>
                  <pre className="text-sm whitespace-pre-wrap bg-background p-2 rounded border">
                    {input.value}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expected Output Section */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Expected Output
          </h4>
          <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
            {testCase.expectedOutput}
          </pre>
          {testCase.outputFormat && (
            <div className="mt-2">
              {getInputFormatBadge(testCase.outputFormat)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
