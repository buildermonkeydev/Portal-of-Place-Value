export interface CodeSubmission {
    source_code: string;
    language_id: number;
    stdin?: string;
    expected_output?: string;
    cpu_time_limit?: number;
    memory_limit?: number;
    enable_network?: boolean;
}

export interface CodeExecutionResult {
    token: string;
    status: {
        id: number;
        description: string;
    };
    stdout?: string;
    stderr?: string;
    compile_output?: string;
    message?: string;
    time?: string;
    memory?: number;
    execution_time?: number;
}

export interface Language {
    id: number;
    name: string;
    extension: string;
    ace_mode: string;
    sample_code: string;
}

export interface CodeExecutionRequest {
    source_code: string;
    language_id: number;
    stdin?: string;
    expected_output?: string;
}

export interface CodeExecutionResponse {
    success: boolean;
    data?: CodeExecutionResult;
    error?: string;
    token?: string;
}

export interface CodeEditorState {
    sourceCode: string;
    selectedLanguage: Language | null;
    stdin: string;
    expectedOutput: string;
    isExecuting: boolean;
    executionResult: CodeExecutionResult | null;
    error: string | null;
}
