'use client';

import React, { useEffect, useState } from 'react';
import AceEditor from 'react-ace';
import { useCodeExecution } from '../lib/hooks/useCodeExecution';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Play,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Copy,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Terminal,
  FileText,
  Clock,
  MemoryStick,
  Code,
  Save,
  Info,
} from 'lucide-react';

// Import Ace editor themes and modes
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';

const THEMES = [
  { id: 'monokai', name: 'Monokai Dark', type: 'dark' },
  { id: 'dracula', name: 'Dracula', type: 'dark' },
  { id: 'tomorrow', name: 'Tomorrow', type: 'light' },
  { id: 'github', name: 'GitHub', type: 'light' },
  { id: 'twilight', name: 'Twilight', type: 'dark' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

interface CodeEditorTestProps {
  testId: string;
  language: string;
  code: string;
  onSubmit: (code: string) => void;
  onRun: (code: string) => void;
  onClear: () => void;
  onReset: () => void;
  onLanguageChange: (language: string) => void;
  onThemeChange: (theme: string) => void;
  onFontSizeChange: (fontSize: number) => void;
}

export const CodeEditorTest: React.FC<CodeEditorTestProps> = ({ testId, language, code, onSubmit, onRun, onClear, onReset, onLanguageChange, onThemeChange, onFontSizeChange }) => {
  const {
    state,
    languages,
    isLoadingLanguages,
    loadLanguages,
    selectLanguage,
    updateSourceCode,
    updateStdin,
    updateExpectedOutput,
    executeCode,
    submitCode,
    clearResult,
    reset,
  } = useCodeExecution();

  const [editorTheme, setEditorTheme] = useState('monokai');
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('output');

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const getStatusIcon = () => {
    if (state.isExecuting) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
    if (state.executionResult) {
      if (state.executionResult.status.id === 3) {
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      } else if (state.executionResult.status.id >= 4) {
        return <XCircle className="h-4 w-4 text-red-600" />;
      }
    }
    return <Terminal className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (state.isExecuting) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (state.executionResult) {
      if (state.executionResult.status.id === 3)
        return 'bg-green-50 text-green-700 border-green-200';
      if (state.executionResult.status.id >= 4)
        return 'bg-red-50 text-red-700 border-red-200';
    }
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getStatusText = () => {
    if (state.isExecuting) return 'Executing...';
    if (state.executionResult) {
      return state.executionResult.status.description;
    }
    return 'Ready';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.sourceCode);
  };

  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([state.sourceCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${
      state.selectedLanguage?.name.toLowerCase() || 'txt'
    }`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        updateSourceCode(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={`${
          isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-screen'
        } flex flex-col`}
      >
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    B{' '}
                  </h1>
                  <p className="text-xs text-gray-500">
                    Professional Code Editor
                  </p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <Badge variant="outline" className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Language Selector */}
              <Select
                value={state.selectedLanguage?.id.toString() || ''}
                onValueChange={(value) => {
                  const language = languages.find(
                    (lang) => lang.id.toString() === value
                  );
                  if (language) selectLanguage(language);
                }}
              >
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem
                      key={language.id}
                      value={language.id.toString()}
                    >
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>{language.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={executeCode}
                      disabled={!state.selectedLanguage || state.isExecuting}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Execute code (Ctrl+Enter)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={submitCode}
                      disabled={!state.selectedLanguage || state.isExecuting}
                      variant="outline"
                      size="sm"
                    >
                      <Loader2 className="h-4 w-4 mr-2" />
                      Submit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Submit and wait for results</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={clearResult} variant="ghost" size="sm">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear results</TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Utility Buttons */}
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCopyCode} variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy code</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleDownloadCode}
                      variant="ghost"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download code</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload file</TooltipContent>
                </Tooltip>

                <input
                  id="file-upload"
                  type="file"
                  accept=".txt,.js,.py,.java,.cpp,.c"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      variant="ghost"
                      size="sm"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle fullscreen</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Section */}
          <div className="flex-1 flex flex-col">
            {/* Editor Settings Bar */}
            <div className="border-b bg-gray-50/50 px-6 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Theme:</Label>
                  <Select value={editorTheme} onValueChange={setEditorTheme}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Size:</Label>
                  <Select
                    value={fontSize.toString()}
                    onValueChange={(v) => setFontSize(Number(v))}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {state.selectedLanguage && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{state.selectedLanguage.name}</span>
                  <span>•</span>
                  <span>Lines: {state.sourceCode.split('\n').length}</span>
                </div>
              )}
            </div>

            {/* Editor */}
            <div className="flex-1 bg-white">
              {state.selectedLanguage ? (
                <AceEditor
                  mode={state.selectedLanguage.ace_mode}
                  theme={editorTheme}
                  value={state.sourceCode}
                  onChange={updateSourceCode}
                  name="code-editor"
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                    wrap: false,
                    fontSize: fontSize,
                    showPrintMargin: false,
                    highlightActiveLine: true,
                    highlightSelectedWord: true,
                    behavioursEnabled: true,
                    wrapBehavioursEnabled: true,
                    autoScrollEditorIntoView: true,
                    copyWithEmptySelection: true,
                  }}
                  width="100%"
                  height="100%"
                  fontSize={fontSize}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  commands={[
                    {
                      name: 'executeCode',
                      bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                      exec: executeCode,
                    },
                  ]}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    {isLoadingLanguages ? (
                      <div className="flex items-center space-x-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-gray-600">
                          Loading languages...
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                          <Code className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Welcome to CodeStudio Pro
                          </h3>
                          <p className="text-gray-600">
                            Select a programming language to start coding
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="w-96 border-l bg-gray-50/50 flex flex-col">
            <div className="border-b bg-white px-4 py-3">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span>Execution Results</span>
              </h3>
            </div>

            <Tabs
              value={activeResultTab}
              onValueChange={setActiveResultTab}
              className="flex-1 flex flex-col h-full"
            >
              <TabsList className="grid grid-cols-3 m-4 mb-2">
                <TabsTrigger value="output" className="text-xs">
                  <Terminal className="w-3 h-3 mr-1" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  <Info className="w-3 h-3 mr-1" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="tests" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Tests
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 px-4 pb-4 h-full">
                <TabsContent value="output" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {/* Error Display */}
                      {state.error && (
                        <Card className="border-red-200 bg-red-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-red-800 text-sm flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4" />
                              <span>Error</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <pre className="text-red-700 text-sm whitespace-pre-wrap font-mono">
                              {state.error}
                            </pre>
                          </CardContent>
                        </Card>
                      )}

                      {/* Execution Results */}
                      {state.executionResult ? (
                        <div className="space-y-4">
                          {/* Status Card */}
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Status
                                </span>
                                <Badge className={getStatusColor()}>
                                  {state.executionResult.status.description}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Output */}
                          {state.executionResult.stdout && (
                            <div className="h-full">
                              <div className="pb-3 flex-1">
                                <div className="text-sm text-green-700 flex items-center space-x-2">
                                  <Terminal className="h-4 w-4" />
                                  <span>Output</span>
                                </div>
                              </div>
                              <div className="pt-0 flex-1">
                                <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm">
                                  <pre className="whitespace-pre-wrap break-words ">
                                    {state.executionResult.stdout}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Error Output */}
                          {state.executionResult.stderr && (
                            <div className="h-full">
                              <div className="pb-3">
                                <CardTitle className="text-sm text-red-600 flex items-center space-x-2">
                                  <XCircle className="h-4 w-4" />
                                  <span>Error Output</span>
                                </CardTitle>
                              </div>
                              <div className="pt-0 flex-1 h-full">
                                <div className="bg-red-900  text-red-300 p-3 rounded-md font-mono text-sm overflow-auto">
                                  <pre className="whitespace-pre-wrap">
                                    {state.executionResult.stderr}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Compile Output */}
                          {state.executionResult.compile_output && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-orange-600 flex items-center space-x-2">
                                  <Settings className="h-4 w-4" />
                                  <span>Compile Output</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="bg-orange-100 text-orange-800 p-3 rounded-md font-mono text-sm">
                                  <pre className="whitespace-pre-wrap">
                                    {state.executionResult.compile_output}
                                  </pre>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <Card className="h-64">
                          <CardContent className="h-full flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm font-medium">
                                No execution results
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Run your code to see output here
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="info" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Execution Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {state.executionResult ? (
                          <>
                            {state.executionResult.execution_time && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    Execution Time
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600 font-mono">
                                  {state.executionResult.execution_time}ms
                                </span>
                              </div>
                            )}

                            {state.executionResult.memory && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <MemoryStick className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    Memory Usage
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600 font-mono">
                                  {state.executionResult.memory} KB
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              No execution info available
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="tests" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Test Cases</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">
                                Test Case 1
                              </span>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="text-xs text-green-700 space-y-1">
                              <div>
                                <strong>Input:</strong> (none)
                              </div>
                              <div>
                                <strong>Expected:</strong> Hello, World!
                              </div>
                              <div>
                                <strong>Status:</strong> ✅ Passed
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
