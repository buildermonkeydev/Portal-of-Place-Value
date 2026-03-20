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
  Info,
  Trash2,
  Plus,
  Sword,
  Shield,
  Zap,
  Skull,
  Scroll,
  Crosshair,
  Flame,
  Swords,
  Crown,
  Target,
  Brain,
  Cpu,
  Gauge,
  Sparkles,
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
import { cn } from '@/lib/utils';

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
    executeCode,
    clearResult,
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
      return <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />;
    }
    if (state.executionResult) {
      if (state.executionResult.status.id === 3) {
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      } else if (state.executionResult.status.id >= 4) {
        return <XCircle className="h-4 w-4 text-red-400" />;
      }
    }
    return <Terminal className="h-4 w-4 text-zinc-400" />;
  };

  const getStatusColor = () => {
    if (state.isExecuting) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (state.executionResult) {
      if (state.executionResult.status.id === 3)
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      if (state.executionResult.status.id >= 4)
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const getStatusText = () => {
    if (state.isExecuting) return 'Executing spell...';
    if (state.executionResult) {
      return state.executionResult.status.description;
    }
    return 'Ready for battle';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.sourceCode);
  };

  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([state.sourceCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `spell.${
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
    setActiveResultTab('output');
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
        className={cn(
          "bg-[#0C0C10] text-white",
          isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-screen'
        )}
      >
        {/* Header - War Room */}
        <header className="border-b border-white/10 bg-[#0C0C10]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Swords className="h-6 w-6 text-indigo-400" />
                <span className="text-xl font-bold text-white tracking-tight">
                  Code Forge
                </span>
              </div>

              <Separator orientation="vertical" className="h-8 bg-white/10" />

              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <Badge variant="outline" className={cn("border", getStatusColor())}>
                  {getStatusText()}
                </Badge>
                {state.executionResult?.execution_time && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {state.executionResult.execution_time}ms
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Language Selector - Spell Selection */}
              <Select
                value={state.selectedLanguage?.id.toString() || ''}
                onValueChange={(value) => {
                  const language = languages.find(
                    (lang) => lang.id.toString() === value
                  );
                  if (language) selectLanguage(language);
                }}
              >
                <SelectTrigger className="w-40 h-9 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose spell" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                  {languages.map((language) => (
                    <SelectItem
                      key={language.id}
                      value={language.id.toString()}
                      className="hover:bg-white/5 focus:bg-white/5"
                    >
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-indigo-400" />
                        <span>{language.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6 bg-white/10" />

              {/* Action Buttons - Battle Commands */}
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleRunClick}
                      disabled={!state.selectedLanguage || state.isExecuting}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Cast Spell
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Execute code (Ctrl+Enter)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={clearResult} variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Clear results</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 bg-white/10" />

              {/* Utility Buttons - Arsenal */}
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCopyCode} variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Copy spell</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleDownloadCode}
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Download spell</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }
                      className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Upload spellbook</p>
                  </TooltipContent>
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
                      className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
                    <p>Toggle fullscreen</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Battle Arena */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Section - Spell Forge */}
          <div className="flex-1 flex flex-col">
            {/* Editor Settings Bar - Enchantments */}
            <div className="border-b border-white/10 bg-white/5 px-6 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium text-zinc-400">Theme:</Label>
                  <Select value={editorTheme} onValueChange={setEditorTheme}>
                    <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                      {THEMES.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id} className="hover:bg-white/5">
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium text-zinc-400">Size:</Label>
                  <Select
                    value={fontSize.toString()}
                    onValueChange={(v) => setFontSize(Number(v))}
                  >
                    <SelectTrigger className="w-20 h-8 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                      {FONT_SIZES.map((size) => (
                        <SelectItem key={size} value={size.toString()} className="hover:bg-white/5">
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {state.selectedLanguage && (
                <div className="flex items-center space-x-2 text-sm text-zinc-400">
                  <Scroll className="w-4 h-4 text-indigo-400" />
                  <span>{state.selectedLanguage.name}</span>
                  <span>•</span>
                  <span>Lines: {state.sourceCode.split('\n').length}</span>
                </div>
              )}
            </div>

            {/* Editor - Spell Writing Chamber */}
            <div className="flex-1 bg-[#0C0C10]">
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
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    {isLoadingLanguages ? (
                      <div className="flex items-center space-x-3">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                        <span className="text-zinc-400">
                          Loading spells...
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
                          <Sword className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Welcome to the Code Forge
                          </h3>
                          <p className="text-zinc-400">
                            Select a spell to begin your incantation
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Battle Results */}
          <div className="w-96 border-l border-white/10 bg-white/5 flex flex-col">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3">
              <h3 className="font-semibold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Battle Results</span>
              </h3>
            </div>

            <Tabs
              value={activeResultTab}
              onValueChange={setActiveResultTab}
              className="flex-1 flex flex-col h-full"
            >
              <TabsList className="grid grid-cols-2 m-4 mb-2 bg-white/5">
                <TabsTrigger value="output" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
                  <Terminal className="w-3 h-3 mr-1" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
                  <Info className="w-3 h-3 mr-1" />
                  Intel
                  {state.executionResult?.execution_time && (
                    <div className="ml-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 px-4 pb-4 h-full">
                <TabsContent value="output" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {/* Error Display - Failed Spells */}
                      {state.error && (
                        <Card className="border-red-500/20 bg-red-500/5">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-red-400 text-sm flex items-center space-x-2">
                              <Skull className="h-4 w-4" />
                              <span>Spell Backfired</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono">
                              {state.error}
                            </pre>
                          </CardContent>
                        </Card>
                      )}

                      {/* Execution Results - Battle Outcomes */}
                      {state.executionResult ? (
                        <div className="space-y-4">
                          {/* Status Card */}
                          <Card className="bg-white/5 border-white/10">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-300">
                                  Battle Status
                                </span>
                                <Badge className={cn("border", getStatusColor())}>
                                  {state.executionResult.status.description}
                                </Badge>
                              </div>
                              {state.executionResult.execution_time && (
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-indigo-400" />
                                    <span className="text-sm font-medium text-zinc-300">
                                      Cast Time
                                    </span>
                                  </div>
                                  <span className="text-sm text-indigo-400 font-mono font-semibold">
                                    {state.executionResult.execution_time}ms
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Output - Successful Spells */}
                          {state.executionResult.stdout && (
                            <div className="h-full">
                              <div className="pb-3 flex-1">
                                <div className="text-sm text-green-400 flex items-center space-x-2">
                                  <Zap className="h-4 w-4" />
                                  <span>Spell Effect</span>
                                </div>
                              </div>
                              <div className="pt-0 flex-1">
                                <div className="bg-[#1A1A2A] text-green-400 p-3 rounded-md font-mono text-sm border border-green-500/20">
                                  <pre className="whitespace-pre-wrap break-words ">
                                    {state.executionResult.stdout}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Error Output - Failed Spells */}
                          {state.executionResult.stderr && (
                            <div className="h-full">
                              <div className="pb-3">
                                <CardTitle className="text-sm text-red-400 flex items-center space-x-2">
                                  <XCircle className="h-4 w-4" />
                                  <span>Corrupted Spell</span>
                                </CardTitle>
                              </div>
                              <div className="pt-0 flex-1 h-full">
                                <div className="bg-red-900/20 text-red-300 p-3 rounded-md font-mono text-sm overflow-auto border border-red-500/20">
                                  <pre className="whitespace-pre-wrap">
                                    {state.executionResult.stderr}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Compile Output */}
                          {state.executionResult.compile_output && (
                            <Card className="bg-white/5 border-white/10">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-orange-400 flex items-center space-x-2">
                                  <Settings className="h-4 w-4" />
                                  <span>Enchantment Log</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="bg-orange-500/10 text-orange-300 p-3 rounded-md font-mono text-sm border border-orange-500/20">
                                  <pre className="whitespace-pre-wrap">
                                    {state.executionResult.compile_output}
                                  </pre>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <Card className="bg-white/5 border-white/10 h-64">
                          <CardContent className="h-full flex items-center justify-center">
                            <div className="text-center text-zinc-500">
                              <Target className="w-12 h-12 mx-auto mb-3 opacity-50 text-indigo-400/30" />
                              <p className="text-sm font-medium text-zinc-400">
                                No battle results
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                Cast a spell to see the outcome
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
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-sm text-zinc-300">
                          Spell Intel
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {state.executionResult ? (
                          <>
                            {state.executionResult.execution_time && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-indigo-400" />
                                  <span className="text-sm font-medium text-zinc-300">
                                    Cast Time
                                  </span>
                                </div>
                                <span className="text-sm text-indigo-400 font-mono">
                                  {state.executionResult.execution_time}ms
                                </span>
                              </div>
                            )}

                            {state.executionResult.memory && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <MemoryStick className="h-4 w-4 text-indigo-400" />
                                  <span className="text-sm font-medium text-zinc-300">
                                    Mana Used
                                  </span>
                                </div>
                                <span className="text-sm text-indigo-400 font-mono">
                                  {state.executionResult.memory} KB
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center text-zinc-500 py-8">
                            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-400/30" />
                            <p className="text-sm text-zinc-400">
                              No intel available
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

      {/* Interactive Input Dialog - Spell Components */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[#1A1A2A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Scroll className="h-5 w-5 text-indigo-400" />
              <span>Spell Components</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add inputs one by one (like offering ingredients for your spell)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Input List - Components List */}
            {inputsList.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-300">Added Components:</Label>
                <ScrollArea className="h-32 border border-white/10 rounded-md p-2 bg-white/5">
                  <div className="space-y-1">
                    {inputsList.map((input, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white/5 p-2 rounded group hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <Badge variant="outline" className="text-xs border-indigo-500/20 text-indigo-400">
                            {index + 1}
                          </Badge>
                          <code className="text-sm font-mono truncate text-zinc-300">
                            {input || '(empty line)'}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInput(index)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Input Field - New Component */}
            <div className="space-y-2">
              <Label htmlFor="input-field" className="text-zinc-300">Enter Component:</Label>
              <div className="flex space-x-2">
                <Input
                  id="input-field"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type input and press Enter"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 font-mono"
                />
                <Button
                  onClick={handleAddInput}
                  disabled={!currentInput.trim()}
                  size="sm"
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-zinc-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Press Enter to add quickly
              </p>
            </div>

            {/* Clear Button */}
            {inputsList.length > 0 && (
              <Button
                onClick={handleClearInputs}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All Components
              </Button>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRunWithoutInput}
              variant="outline"
              className="w-full sm:w-auto border-white/10 hover:bg-white/5 text-zinc-300"
            >
              Skip / No Components
            </Button>
            <Button
              onClick={handleRunWithInputs}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
              disabled={state.isExecuting}
            >
              <Play className="h-4 w-4 mr-2" />
              Cast Spell
              {inputsList.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white/20 text-white"
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