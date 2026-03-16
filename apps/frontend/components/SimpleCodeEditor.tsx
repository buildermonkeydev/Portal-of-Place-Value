'use client';

import React from 'react';
import AceEditor from 'react-ace';

// Import Ace editor themes and modes for supported languages only
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';

import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-kuroir';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/theme-xcode';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import 'ace-builds/src-noconflict/theme-solarized_light';
import 'ace-builds/src-noconflict/theme-terminal';

interface SimpleCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
  aceMode?: string;
}

export const SimpleCodeEditor: React.FC<SimpleCodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = '300px',
  placeholder = 'Enter your code here...',
  aceMode: propAceMode,
}) => {
  const getAceMode = (lang: string): string => {
    // Handle full language names like "C (GCC 7.4.0)", "JavaScript (Node.js 12.14.0)", etc.
    const langLower = lang.toLowerCase();

    if (langLower.includes('javascript') || langLower.includes('node')) {
      return 'javascript';
    } else if (langLower.includes('python')) {
      return 'python';
    } else if (langLower.includes('java')) {
      return 'java';
    } else if (langLower.includes('c++') || langLower.includes('cpp')) {
      return 'c_cpp';
    } else if (langLower.includes('c (') || langLower.startsWith('c ')) {
      return 'c_cpp';
    }

    // Fallback to simple mapping for basic language names
    const modeMap: Record<string, string> = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'c_cpp',
      c: 'c_cpp',
    };
    return modeMap[langLower] || 'text';
  };

  const aceMode = propAceMode || getAceMode(language);
  // console.log('SimpleCodeEditor props:', {
  //   value,
  //   language,
  //   readOnly,
  //   aceMode,
  // });

  return (
    <div className="border rounded-md overflow-hidden" style={{ height }}>
      <AceEditor
        mode={aceMode}
        theme={'monokai'}
        value={value}
        onChange={onChange}
        name="code-editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          wrap: false,
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
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        commands={[
          {
            name: 'executeCode',
            bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
            exec: () => {},
          },
        ]}
      />
    </div>
  );
};
