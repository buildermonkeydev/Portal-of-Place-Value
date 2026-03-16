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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
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
  Trash2,
  Plus,
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
import Image from 'next/image';

const THEMES = [
  { id: 'monokai', name: 'Monokai Dark', type: 'dark' },
  { id: 'dracula', name: 'Dracula', type: 'dark' },
  { id: 'tomorrow', name: 'Tomorrow', type: 'light' },
  { id: 'github', name: 'GitHub', type: 'light' },
  { id: 'twilight', name: 'Twilight', type: 'dark' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

export const CodeEditor: React.FC = () => {
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

  // Input dialog state
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [inputsList, setInputsList] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [shouldExecuteAfterStdinUpdate, setShouldExecuteAfterStdinUpdate] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  // Execute code after stdin has been updated
  useEffect(() => {
    if (shouldExecuteAfterStdinUpdate) {
      setShouldExecuteAfterStdinUpdate(false);
      executeCode();
      // Clear inputs after execution
      setInputsList([]);
      setCurrentInput('');
    }
  }, [state.stdin, shouldExecuteAfterStdinUpdate, executeCode]);

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

  // Input dialog handlers
  const handleRunClick = () => {
    setShowInputDialog(true);
    setActiveResultTab('output'); // Switch to output tab when running
  };

  const handleAddInput = () => {
    if (currentInput.trim()) {
      setInputsList([...inputsList, currentInput]);
      setCurrentInput('');
    }
  };

  const handleRemoveInput = (index: number) => {
    setInputsList(inputsList.filter((_, i) => i !== index));
  };

  const handleClearInputs = () => {
    setInputsList([]);
    setCurrentInput('');
  };

  const handleRunWithInputs = () => {
    const stdin = inputsList.join('\n');
    updateStdin(stdin);
    setShowInputDialog(false);
    // Set flag to execute after stdin state updates
    setShouldExecuteAfterStdinUpdate(true);
  };

  const handleRunWithoutInput = () => {
    updateStdin('');
    setShowInputDialog(false);
    executeCode();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInput();
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
                <Image
                  src={'/logo.png'}
                  width={100}
                  height={100}
                  alt="compiler"
                  className="w-full max-w-[200px] h-auto"
                />
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <Badge variant="outline" className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
                {state.executionResult?.execution_time && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {state.executionResult.execution_time}ms
                  </Badge>
                )}
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
                      onClick={handleRunClick}
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
              <TabsList className="grid grid-cols-2 m-4 mb-2">
                <TabsTrigger value="output" className="text-xs">
                  <Terminal className="w-3 h-3 mr-1" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  <Info className="w-3 h-3 mr-1" />
                  Info
                  {state.executionResult?.execution_time && (
                    <div className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
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
                              {state.executionResult.execution_time && (
                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Execution Time
                                    </span>
                                  </div>
                                  <span className="text-sm text-blue-600 font-mono font-semibold">
                                    {state.executionResult.execution_time}ms
                                  </span>
                                </div>
                              )}
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
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Interactive Input Dialog */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Program Input</span>
            </DialogTitle>
            <DialogDescription>
              Add inputs one by one (simulates interactive prompts like{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                input()
              </code>
              ,{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                scanf()
              </code>
              ,{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                cin
              </code>
              )
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Input List */}
            {inputsList.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Added Inputs:</Label>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {inputsList.map((input, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded group"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <code className="text-sm font-mono truncate">
                            {input || '(empty line)'}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInput(index)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Input Field */}
            <div className="space-y-2">
              <Label htmlFor="input-field">Enter Input Value:</Label>
              <div className="flex space-x-2">
                <Input
                  id="input-field"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type input and press Enter or click Add"
                  className="font-mono"
                />
                <Button
                  onClick={handleAddInput}
                  disabled={!currentInput.trim()}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Press Enter to add input quickly
              </p>
            </div>

            {/* Clear Button */}
            {inputsList.length > 0 && (
              <Button
                onClick={handleClearInputs}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All Inputs
              </Button>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRunWithoutInput}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Skip / No Input Needed
            </Button>
            <Button
              onClick={handleRunWithInputs}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              disabled={state.isExecuting}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Code
              {inputsList.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-700 text-white"
                >
                  {inputsList.length}
                </Badge>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
