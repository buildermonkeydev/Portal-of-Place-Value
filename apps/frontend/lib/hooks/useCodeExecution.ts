import { useState, useCallback } from 'react';
import { codeExecutionApi } from '../api/codeExecution';
import {
    Language,
    CodeExecutionRequest,
    CodeExecutionResult,
    CodeEditorState
} from '../types/codeExecution';

export const useCodeExecution = () => {
    const [state, setState] = useState<CodeEditorState>({
        sourceCode: '',
        selectedLanguage: null,
        stdin: '',
        expectedOutput: '',
        isExecuting: false,
        executionResult: null,
        error: null
    });

    const [languages, setLanguages] = useState<Language[]>([]);
    const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

    /**
     * Load supported languages (global or test-specific)
     * @param testId Optional test ID to load only languages supported by that test
     */
    const loadLanguages = useCallback(async (testId?: string) => {
        try {
            setIsLoadingLanguages(true);
            setState(prev => ({ ...prev, error: null })); // Clear any previous error

            let languagesData: Language[];
            if (testId) {
                // Load test-specific languages
                languagesData = await codeExecutionApi.getLanguagesForTest(testId);
            } else {
                // Load all languages (global)
                languagesData = await codeExecutionApi.getLanguages();
            }

            setLanguages(languagesData);

            // Set default language to Python if none selected and languages are loaded
            if (!state.selectedLanguage && languagesData.length > 0) {
                const pythonLang = languagesData.find(lang => lang.id === 10); // Python ID
                const defaultLang = pythonLang || languagesData[0];
                setState(prev => ({
                    ...prev,
                    selectedLanguage: defaultLang,
                    // Don't automatically set sample code - let the caller decide
                }));
            }
        } catch (error) {
            setState(prev => ({ ...prev, error: 'Failed to load languages' }));
        } finally {
            setIsLoadingLanguages(false);
        }
    }, [state.selectedLanguage]);

    /**
     * Select a programming language
     */
    const selectLanguage = useCallback((language: Language) => {
        setState(prev => ({
            ...prev,
            selectedLanguage: language,
            // Don't automatically overwrite source code - let the caller decide
            error: null,
            executionResult: null
        }));
    }, []);

    /**
     * Update source code
     */
    const updateSourceCode = useCallback((code: string) => {
        setState(prev => ({ ...prev, sourceCode: code, error: null }));
    }, []);

    /**
     * Update stdin
     */
    const updateStdin = useCallback((input: string) => {
        setState(prev => ({ ...prev, stdin: input }));
    }, []);

    /**
     * Update expected output
     */
    const updateExpectedOutput = useCallback((output: string) => {
        setState(prev => ({ ...prev, expectedOutput: output }));
    }, []);

    /**
     * Execute code
     */
    const executeCode = useCallback(async () => {
        if (!state.selectedLanguage) {
            setState(prev => ({ ...prev, error: 'Please select a programming language' }));
            return;
        }

        if (!state.sourceCode.trim()) {
            setState(prev => ({ ...prev, error: 'Please enter some code to execute' }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isExecuting: true, error: null, executionResult: null }));

            const submission: CodeExecutionRequest = {
                source_code: state.sourceCode,
                language_id: state.selectedLanguage.id,
                stdin: state.stdin || undefined,
                expected_output: state.expectedOutput || undefined
            };

            const result = await codeExecutionApi.executeCode(submission);

            setState(prev => ({
                ...prev,
                executionResult: result,
                isExecuting: false
            }));
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.response?.data?.message || 'Failed to execute code',
                isExecuting: false
            }));
        }
    }, [state.selectedLanguage, state.sourceCode, state.stdin, state.expectedOutput]);

    /**
     * Submit code for async execution
     */
    const submitCode = useCallback(async () => {
        if (!state.selectedLanguage) {
            setState(prev => ({ ...prev, error: 'Please select a programming language' }));
            return;
        }

        if (!state.sourceCode.trim()) {
            setState(prev => ({ ...prev, error: 'Please enter some code to execute' }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isExecuting: true, error: null, executionResult: null }));

            const submission: CodeExecutionRequest = {
                source_code: state.sourceCode,
                language_id: state.selectedLanguage.id,
                stdin: state.stdin || undefined,
                expected_output: state.expectedOutput || undefined
            };

            const { token } = await codeExecutionApi.submitCode(submission);

            // Poll for result
            let attempts = 0;
            const maxAttempts = 30;

            while (attempts < maxAttempts) {
                try {
                    const result = await codeExecutionApi.getExecutionResult(token);

                    if (result.status.id >= 3) { // Status 3+ means processing is complete
                        setState(prev => ({
                            ...prev,
                            executionResult: result,
                            isExecuting: false
                        }));
                        return;
                    }

                    // Wait 1 second before next attempt
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                } catch (error) {
                    attempts++;
                }
            }

            setState(prev => ({
                ...prev,
                error: 'Execution timeout - code took too long to execute',
                isExecuting: false
            }));
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.response?.data?.message || 'Failed to submit code',
                isExecuting: false
            }));
        }
    }, [state.selectedLanguage, state.sourceCode, state.stdin, state.expectedOutput]);

    /**
     * Clear execution result and error
     */
    const clearResult = useCallback(() => {
        setState(prev => ({
            ...prev,
            executionResult: null,
            error: null
        }));
    }, []);

    /**
     * Reset to initial state
     */
    const reset = useCallback(() => {
        setState({
            sourceCode: '',
            selectedLanguage: null,
            stdin: '',
            expectedOutput: '',
            isExecuting: false,
            executionResult: null,
            error: null
        });
    }, []);

    return {
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
        reset
    };
};
