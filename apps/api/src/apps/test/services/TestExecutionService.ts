import { logger } from "../../../utils/logger";
import { CodeExecutionRequest } from "../interface/CodeExecution";
import { ITestCase, ITestDocument, ITestSubmissionDocument } from "../interface/Test";
import { TestRepository } from "../repository/TestRepository";
import { CodeExecutionService } from "./CodeExecutionService";



export interface TestExecutionResult {
    testCaseId: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput: string;
    executionTime?: number;
    memoryUsed?: number;
    errorMessage?: string;
}

export interface TestSubmissionResult {
    totalTestCases: number;
    passedTestCases: number;
    score: number;
    executionTime: number;
    testResults: TestExecutionResult[];
}

export class TestExecutionService {
    private codeExecutionService: CodeExecutionService;
    private testRepository: TestRepository;

    constructor() {
        this.codeExecutionService = new CodeExecutionService();
        this.testRepository = new TestRepository();
    }

    /**
     * Execute user code against all test cases for a test
     */
    async executeTestSubmission(
        testId: string,
        sourceCode: string,
        languageId: number,
        userId: string
    ): Promise<TestSubmissionResult> {
        try {
            // Get test with all test cases
            const test = await this.testRepository.findByIdRaw(testId);
            if (!test) {
                throw new Error('Test not found');
            }

            if (!test.isActive || test.status !== 'published') {
                throw new Error('Test is not available for submission');
            }

            // Check if language is allowed
            if (!test.allowedLanguages.includes(languageId)) {
                throw new Error('Language not allowed for this test');
            }

            console.log("TEST", test);

            const testResults: TestExecutionResult[] = [];
            let totalExecutionTime = 0;
            let passedTestCases = 0;

            // Execute code against each test case
            for (const testCase of test.testCases) {
                try {
                    console.log("Executing test case", sourceCode, testCase, languageId);
                    const result = await this.executeTestCase(
                        sourceCode,
                        languageId,
                        testCase,
                        test
                    );

                    console.log("result....", result);
                    testResults.push(result);
                    totalExecutionTime += result.executionTime || 0;

                    if (result.passed) {
                        passedTestCases++;
                    }
                } catch (error) {
                    logger.error(`Error executing test case ${testCase._id}:`, error);
                    testResults.push({
                        testCaseId: testCase._id || '',
                        passed: false,
                        expectedOutput: testCase.expectedOutput,
                        errorMessage: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const score = test.testCases.length > 0 ? (passedTestCases / test.testCases.length) * 100 : 0;

            console.log("testResults", testResults);
            // Create and save submission
            const submissionData: Partial<ITestSubmissionDocument> = {
                testId: (test._id as any).toString(),
                userId,
                sourceCode,
                languageId,
                testResults: testResults.map(result => {
                    const mappedResult: any = {
                        testCaseId: result.testCaseId,
                        passed: result.passed,
                        expectedOutput: result.expectedOutput
                    };

                    if (result.actualOutput !== undefined) {
                        mappedResult.actualOutput = result.actualOutput;
                    }
                    if (result.executionTime !== undefined) {
                        mappedResult.executionTime = result.executionTime;
                    }
                    if (result.memoryUsed !== undefined) {
                        mappedResult.memoryUsed = result.memoryUsed;
                    }
                    if (result.errorMessage !== undefined) {
                        mappedResult.errorMessage = result.errorMessage;
                    }

                    return mappedResult;
                }),
                totalTestCases: test.testCases.length,
                passedTestCases,
                score: Math.round(score * 100) / 100, // Round to 2 decimal places
                executionTime: totalExecutionTime
            };

            console.log("submissionData", submissionData);

            await this.testRepository.createSubmission(submissionData);

            return {
                totalTestCases: test.testCases.length,
                passedTestCases,
                score: Math.round(score * 100) / 100,
                executionTime: totalExecutionTime,
                testResults
            };

        } catch (error) {
            logger.error('Error executing test submission:', error);
            throw error;
        }
    }

    async executeTestSubmissionWithSubmissionData(
        testId: string,
        sourceCode: string,
        languageId: number,
        userId: string
    ): Promise<{
        totalTestCases: number;
        passedTestCases: number;
        score: number;
        executionTime: number;
        testResults: TestExecutionResult[];
        submission: ITestSubmissionDocument;
    }> {
        try {
            // Get test with all test cases
            const test = await this.testRepository.findByIdRaw(testId);
            if (!test) {
                throw new Error('Test not found');
            }

            if (!test.isActive || test.status !== 'published') {
                throw new Error('Test is not available for submission');
            }

            // Check if language is allowed
            if (!test.allowedLanguages.includes(languageId)) {
                throw new Error('Language not allowed for this test');
            }

            console.log("TEST", test);

            const testResults: TestExecutionResult[] = [];
            let totalExecutionTime = 0;
            let passedTestCases = 0;

            // Execute code against each test case
            for (const testCase of test.testCases) {
                try {
                    console.log("Executing test case", sourceCode, testCase, languageId);
                    const result = await this.executeTestCase(
                        sourceCode,
                        languageId,
                        testCase,
                        test
                    );

                    console.log("result....", result);
                    testResults.push(result);
                    totalExecutionTime += result.executionTime || 0;

                    if (result.passed) {
                        passedTestCases++;
                    }
                } catch (error) {
                    logger.error(`Error executing test case ${testCase._id}:`, error);
                    testResults.push({
                        testCaseId: testCase._id || '',
                        passed: false,
                        expectedOutput: testCase.expectedOutput,
                        errorMessage: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const score = test.testCases.length > 0 ? (passedTestCases / test.testCases.length) * 100 : 0;

            console.log("testResults", testResults);
            // Create and save submission
            const submissionData: Partial<ITestSubmissionDocument> = {
                testId: (test._id as any).toString(),
                userId,
                sourceCode,
                languageId,
                testResults: testResults.map(result => {
                    const mappedResult: any = {
                        testCaseId: result.testCaseId,
                        passed: result.passed,
                        expectedOutput: result.expectedOutput
                    };

                    if (result.actualOutput !== undefined) {
                        mappedResult.actualOutput = result.actualOutput;
                    }
                    if (result.executionTime !== undefined) {
                        mappedResult.executionTime = result.executionTime;
                    }
                    if (result.memoryUsed !== undefined) {
                        mappedResult.memoryUsed = result.memoryUsed;
                    }
                    if (result.errorMessage !== undefined) {
                        mappedResult.errorMessage = result.errorMessage;
                    }

                    return mappedResult;
                }),
                totalTestCases: test.testCases.length,
                passedTestCases,
                score: Math.round(score * 100) / 100, // Round to 2 decimal places
                executionTime: totalExecutionTime
            };

            console.log("submissionData", submissionData);

            const submission = await this.testRepository.createSubmission(submissionData);

            return {
                totalTestCases: test.testCases.length,
                passedTestCases,
                score: Math.round(score * 100) / 100,
                executionTime: totalExecutionTime,
                testResults,
                submission
            };

        } catch (error) {
            logger.error('Error executing test submission:', error);
            throw error;
        }
    }


    /**
     * Create LeetCode-style wrapper for code execution
     */
    private createLeetCodeWrapper(sourceCode: string, languageId: number, testCase: ITestCase, test: ITestDocument): string {
        // Parse inputs based on language and format
        console.log("testCase", testCase);
        console.log("sourceCode", sourceCode);

        const parsedInputs = this.parseTestCaseInputs(testCase.inputs, languageId);
        console.log("parsedInputs", parsedInputs);

        switch (languageId) {
            case 63: // JavaScript (Node.js)
                return this.createJavaScriptWrapper(sourceCode, parsedInputs, testCase, test);
            case 62: // Java
                return this.createJavaWrapper(sourceCode, parsedInputs, testCase, test);
            case 52: // C++
                return this.createCppWrapper(sourceCode, parsedInputs, testCase, test);
            case 48: // C
                return this.createCWrapper(sourceCode, parsedInputs, testCase, test);
            case 71: // Python
                return this.createPythonWrapper(sourceCode, parsedInputs, testCase, test);
            default:
                return sourceCode;
        }
    }

    /**
     * Parse test case inputs based on language and format, filtering by applicable languages
     */
    private parseTestCaseInputs(inputs: any[], languageId: number): any[] {
        console.log(`Parsing inputs for language ${languageId}:`, inputs);

        // Filter inputs that apply to this language (empty applicableLanguages means all languages)
        const applicableInputs = inputs.filter(input => {
            const isApplicable = !input.applicableLanguages ||
                input.applicableLanguages.length === 0 ||
                input.applicableLanguages.includes(languageId);
            console.log(`Input order ${input.order} (${input.value}) - applicable: ${isApplicable}, languages: ${input.applicableLanguages || 'all'}`);
            return isApplicable;
        });

        // Sort by order to ensure correct parameter sequence
        const sortedInputs = applicableInputs.sort((a, b) => a.order - b.order);
        console.log(`Sorted inputs by order:`, sortedInputs.map(input => ({ order: input.order, value: input.value })));

        // Parse each input based on its format
        const parsedInputs = sortedInputs.map(input => this.parseSingleInput(input.value, input.inputFormat));
        console.log(`Parsed inputs:`, parsedInputs);

        return parsedInputs;
    }

    /**
     * Parse a single input based on its format
     */
    private parseSingleInput(input: string, inputFormat?: string): any {
        console.log("InputFormat", inputFormat, input);

        if (inputFormat === 'array') {
            console.log("array-input");
            return input.trim().split(",").map((value) => {
                const trimmedValue = value.trim();

                // Check if it's a valid integer (including 0)
                if (!isNaN(parseInt(trimmedValue)) && isFinite(parseInt(trimmedValue)) && Number.isInteger(parseFloat(trimmedValue))) {
                    console.log("int-input", trimmedValue);
                    return parseInt(trimmedValue);
                }
                // Check if it's a valid float (including 0.0)
                else if (!isNaN(parseFloat(trimmedValue)) && isFinite(parseFloat(trimmedValue))) {
                    console.log("float-input", trimmedValue);
                    return parseFloat(trimmedValue);
                }
                // Check if it's a boolean
                else if (trimmedValue.toLowerCase() === 'true' || trimmedValue.toLowerCase() === 'false') {
                    console.log("boolean-input", trimmedValue);
                    return trimmedValue.toLowerCase() === 'true';
                }
                // Otherwise treat as string
                else {
                    console.log("string-input", trimmedValue);
                    return trimmedValue;
                }
            });
        }
        else if (inputFormat === 'string') {
            return input.trim();
        }
        else if (inputFormat === 'number') {
            console.log("number-input");
            const trimmedInput = input.trim();
            // Check if it's a valid integer first
            if (!isNaN(parseInt(trimmedInput)) && isFinite(parseInt(trimmedInput)) && Number.isInteger(parseFloat(trimmedInput))) {
                console.log("parsed as int:", parseInt(trimmedInput));
                return parseInt(trimmedInput);
            }
            // Otherwise try float
            else if (!isNaN(parseFloat(trimmedInput)) && isFinite(parseFloat(trimmedInput))) {
                console.log("parsed as float:", parseFloat(trimmedInput));
                return parseFloat(trimmedInput);
            }
            // If neither works, return the original string
            else {
                console.log("parsed as string:", trimmedInput);
                return trimmedInput;
            }
        }
        else if (inputFormat === 'object') {
            return JSON.parse(input.trim());
        }
        else if (inputFormat === 'mixed') {
            return input.trim();
        }
        else {
            return input.trim();
        }
    }



    private createJavaScriptWrapper(sourceCode: string, parsedInputs: any[], testCase: ITestCase, test: ITestDocument): string {
        // Use executeCodeName from test instead of parsing
        const functionName = test.executeCodeName || 'solution';

        console.log(`Creating JavaScript wrapper with ${parsedInputs.length} parameters in order:`, parsedInputs);

        // Create input variables for each parameter
        let inputDeclarations = '';
        let functionCall = '';
        const parameterNames: string[] = [];

        if (parsedInputs.length === 1) {
            // Single parameter
            const input = parsedInputs[0];
            const paramName = 'input';
            parameterNames.push(paramName);

            if (Array.isArray(input)) {
                inputDeclarations = `const ${paramName} = ${JSON.stringify(input)};`;
            } else if (typeof input === 'string') {
                inputDeclarations = `const ${paramName} = "${input}";`;
            } else {
                inputDeclarations = `const ${paramName} = ${input};`;
            }
            functionCall = `const result = ${functionName}(${paramName});`;
        } else {
            // Multiple parameters
            parsedInputs.forEach((input, index) => {
                const paramName = `input${index + 1}`;
                parameterNames.push(paramName);

                if (Array.isArray(input)) {
                    inputDeclarations += `const ${paramName} = ${JSON.stringify(input)};\n`;
                } else if (typeof input === 'string') {
                    inputDeclarations += `const ${paramName} = "${input}";\n`;
                } else {
                    inputDeclarations += `const ${paramName} = ${input};\n`;
                }
            });

            functionCall = `const result = ${functionName}(${parameterNames.join(', ')});`;
        }

        // Add type validation to catch type mismatches
        const typeValidation = parsedInputs
            .map((input, index) => {
                const paramName = parameterNames[index];
                if (Array.isArray(input)) {
                    return `if (!Array.isArray(${paramName})) { throw new Error("Parameter ${index + 1} should be an array but got: " + typeof ${paramName}); }`;
                } else if (typeof input === 'string') {
                    return `if (typeof ${paramName} !== 'string') { throw new Error("Parameter ${index + 1} should be a string but got: " + typeof ${paramName}); }`;
                } else if (typeof input === 'number') {
                    return `if (typeof ${paramName} !== 'number') { throw new Error("Parameter ${index + 1} should be a number but got: " + typeof ${paramName}); }`;
                }
                return '';
            })
            .filter(Boolean)
            .join('\n');

        return `${sourceCode}\n${inputDeclarations}\n${typeValidation}\n${functionCall}\nconsole.log(result);`; 
    }







    private createJavaWrapper(sourceCode: string, parsedInputs: any[], testCase: ITestCase, test: ITestDocument): string {
        // Always use Solution as class name, executeCodeName as method name
        const className = 'Solution';
        const methodName = test.executeCodeName || 'solution';

        console.log(`Creating Java wrapper with ${parsedInputs.length} parameters in order:`, parsedInputs);
        console.log(`Using class: ${className}, method: ${methodName}`);

        let inputCode = '';
        let functionCall = '';
        const paramNames: string[] = [];

        // Helper to format Java array initialization
        const formatJavaArray = (arr: any[]): string => {
            if (arr.length === 0) return 'new int[] {}';
            // Check if it's a 2D array
            if (Array.isArray(arr[0])) {
                const rows = arr.map((row: any[]) => `{${row.join(', ')}}`).join(', ');
                return `new int[][] {${rows}}`;
            }
            return `new int[] {${arr.join(', ')}}`;
        };

        if (parsedInputs.length === 1) {
            // Single parameter
            const input = parsedInputs[0];
            if (Array.isArray(input)) {
                inputCode = `int[] input = ${formatJavaArray(input)};`;
                paramNames.push('input');
            } else if (typeof input === 'string') {
                inputCode = `String input = "${input}";`;
                paramNames.push('input');
            } else if (typeof input === 'number') {
                inputCode = `int input = ${input};`;
                paramNames.push('input');
            } else {
                inputCode = `String input = "${input}";`;
                paramNames.push('input');
            }
            functionCall = `Object result = solution.${methodName}(${paramNames.join(', ')});`;
        } else {
            // Multiple parameters
            parsedInputs.forEach((input, index) => {
                const paramName = `input${index + 1}`;
                paramNames.push(paramName);

                if (Array.isArray(input)) {
                    inputCode += `int[] ${paramName} = ${formatJavaArray(input)};\n        `;
                } else if (typeof input === 'string') {
                    inputCode += `String ${paramName} = "${input}";\n        `;
                } else if (typeof input === 'number') {
                    inputCode += `int ${paramName} = ${input};\n        `;
                } else {
                    inputCode += `String ${paramName} = "${input}";\n        `;
                }
            });

            functionCall = `Object result = solution.${methodName}(${paramNames.join(', ')});`;
        }

        return `import java.util.*;

${sourceCode}

public class Main {
    public static void main(String[] args) {
        ${className} solution = new ${className}();
        ${inputCode}
        ${functionCall}
        printResult(result);
    }

    private static void printResult(Object result) {
        if (result == null) {
            System.out.println("null");
            return;
        }

        if (result.getClass().isArray()) {
            if (result instanceof int[]) {
                printIntArray((int[]) result);
            } else if (result instanceof long[]) {
                printLongArray((long[]) result);
            } else if (result instanceof double[]) {
                printDoubleArray((double[]) result);
            } else if (result instanceof char[]) {
                printCharArray((char[]) result);
            } else if (result instanceof boolean[]) {
                printBooleanArray((boolean[]) result);
            } else {
                printObjectArray((Object[]) result);
            }
        } else {
            System.out.println(result);
        }
    }

    private static void printIntArray(int[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }

    private static void printLongArray(long[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }

    private static void printDoubleArray(double[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }

    private static void printCharArray(char[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }

    private static void printBooleanArray(boolean[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }

    private static void printObjectArray(Object[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }
}
`;
    }

    private createPythonWrapper(sourceCode: string, parsedInputs: any[], testCase: ITestCase, test: ITestDocument): string {
        const functionName = test.executeCodeName || 'solution';

        console.log(`Creating Python wrapper with ${parsedInputs.length} parameters in order:`, parsedInputs);

        // Check if the source code is incomplete (ends with colon without body)
        // Add a pass statement if the function/class definition is incomplete
        let processedSourceCode = sourceCode.trim();
        if (processedSourceCode.endsWith(':')) {
            // Check if it's a function or method definition
            const lines = processedSourceCode.split('\n');
            const lastLine = lines[lines.length - 1].trim();
            if (lastLine.includes('def ') || lastLine.includes('class ')) {
                // Add a pass statement to make it valid Python
                processedSourceCode += '\n    pass';
            }
        }

        const inputLines: string[] = [];
        const paramNames: string[] = [];

        if (parsedInputs.length === 1) {
            const input = parsedInputs[0];
            const paramName = 'input';
            paramNames.push(paramName);

            if (Array.isArray(input)) {
                inputLines.push(`${paramName} = ${JSON.stringify(input)}`);
            } else if (typeof input === 'string') {
                inputLines.push(`${paramName} = "${input}"`);
            } else {
                inputLines.push(`${paramName} = ${input}`);
            }
        } else {
            parsedInputs.forEach((input, index) => {
                const paramName = `input${index + 1}`;
                paramNames.push(paramName);

                if (Array.isArray(input)) {
                    inputLines.push(`${paramName} = ${JSON.stringify(input)}`);
                } else if (typeof input === 'string') {
                    inputLines.push(`${paramName} = "${input}"`);
                } else {
                    inputLines.push(`${paramName} = ${input}`);
                }
            });
        }

        const validationLines: string[] = [];
        parsedInputs.forEach((input, index) => {
            const paramName = paramNames[index] || 'input';
            if (Array.isArray(input)) {
                validationLines.push(`if not isinstance(${paramName}, list):`, `    raise TypeError(f"Parameter ${index + 1} should be a list but got: {type(${paramName}).__name__}")`);
            } else if (typeof input === 'string') {
                validationLines.push(`if not isinstance(${paramName}, str):`, `    raise TypeError(f"Parameter ${index + 1} should be a string but got: {type(${paramName}).__name__}")`);
            } else if (typeof input === 'number') {
                validationLines.push(`if not isinstance(${paramName}, (int, float)):`, `    raise TypeError(f"Parameter ${index + 1} should be a number but got: {type(${paramName}).__name__}")`);
            }
        });

        const indentedLines: string[] = [];
        inputLines.forEach((line) => indentedLines.push(`    ${line}`));
        validationLines.forEach((line) => indentedLines.push(`    ${line}`));
        indentedLines.push('    solver = Solution()');
        indentedLines.push(`    result = solver.${functionName}(${paramNames.join(', ')})`);
        indentedLines.push('    print(result)');

        return `${processedSourceCode}

if __name__ == "__main__":
${indentedLines.join('\n')}`;
    }

   private createCppWrapper(sourceCode: string, parsedInputs: any[], testCase: ITestCase, test: any): string {
    const functionName = test.executeCodeName || 'solution';

    const escapeString = (value: string) =>
        value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const declarations: string[] = [];
    const paramNames: string[] = [];

    parsedInputs.forEach((input, index) => {
        const paramName = `input${index}`;
        paramNames.push(paramName);

        if (Array.isArray(input)) {
            if (input.length > 0 && Array.isArray(input[0])) {
                const rows = input
                    .map((row: any[]) => `{${row.join(', ')}}`)
                    .join(', ');
                declarations.push(`    vector<vector<int>> ${paramName} = {${rows}};`);
            } else {
                const arrayStr = input.join(', ');
                declarations.push(`    vector<int> ${paramName} = {${arrayStr}};`);
            }
        } else if (typeof input === 'string') {
            declarations.push(`    string ${paramName} = "${escapeString(input)}";`);
        } else if (typeof input === 'boolean') {
            declarations.push(`    bool ${paramName} = ${input ? 'true' : 'false'};`);
        } else {
            declarations.push(`    auto ${paramName} = ${input};`);
        }
    });

    const declarationBlock = declarations.length > 0 ? declarations.join('\n') + '\n' : '';
    const paramList = paramNames.join(', ');

    // Make sure the user's code has the Solution class with the function
    // If the user's code doesn't have the class definition, we need to wrap it
    let userCode = sourceCode;
    if (!sourceCode.includes('class Solution')) {
        userCode = `class Solution {
public:
${sourceCode.split('\n').map(line => '    ' + line).join('\n')}
};`;
    }

    return `#include <bits/stdc++.h>
using namespace std;

${userCode}

template <typename T>
void printValue(const T& value) {
    cout << value;
}

inline void printValue(const string& value) {
    cout << value;
}

inline void printValue(const char* value) {
    cout << value;
}

inline void printValue(bool value) {
    cout << (value ? "true" : "false");
}

template <typename T>
void printValue(const vector<T>& vec) {
    cout << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        if (i > 0) cout << ",";
        printValue(vec[i]);
    }
    cout << "]";
}

template <typename T>
void printResult(const T& value) {
    printValue(value);
    cout << endl;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cout << boolalpha;

    Solution solution;
${declarationBlock}    auto result = solution.${functionName}(${paramList});
    printResult(result);
    return 0;
}`;
}

    private createCWrapper(sourceCode: string, parsedInputs: any[], testCase: ITestCase, test: any): string {
        // Use executeCodeName from test instead of parsing
        const functionName = test.executeCodeName || 'solution';

        let inputCode = '';
        let resultType = 'char*';
        let functionCall = '';

        if (parsedInputs.length === 1) {
            // Single parameter
            const input = parsedInputs[0];
            if (typeof input === 'string') {
                inputCode = `char* input = "${input}";`;
                resultType = 'char*';
            } else if (typeof input === 'number') {
                inputCode = `int input = ${input};`;
                resultType = 'int';
            } else if (Array.isArray(input)) {
                if (input.length === 0) {
                    inputCode = `int input[] = {};`;
                    resultType = 'int*';
                } else {
                    // Check if it's a 2D array
                    if (Array.isArray(input[0])) {
                        // 2D array - convert to C array initialization
                        const arrayStr = input.map((row: any[]) =>
                            `{${row.join(', ')}}`
                        ).join(', ');
                        inputCode = `int input[][${input[0].length}] = {${arrayStr}};`;
                        resultType = 'int**';
                    } else {
                        // 1D array
                        const arrayStr = input.join(', ');
                        inputCode = `int input[] = {${arrayStr}};`;
                        resultType = 'int*';
                    }
                }
            } else {
                inputCode = `char* input = "${input}";`;
                resultType = 'char*';
            }

            // Check if expected output is array format (contains commas)
            const isArrayOutput = testCase.expectedOutput.includes(',');

            // Generate function call based on input format
            if (isArrayOutput && resultType === 'int*') {
                functionCall = `${functionName}(input, &returnSize);`;
            } else {
                functionCall = `${functionName}(input);`;
            }
        } else {
            // Multiple parameters
            const paramTypes: string[] = [];
            const paramNames: string[] = [];
            const arraySizes: string[] = [];

            parsedInputs.forEach((input, index) => {
                const paramName = `input${index + 1}`;
                let paramType = 'char*';

                if (typeof input === 'string') {
                    inputCode += `char* ${paramName} = "${input}";\n    `;
                    paramType = 'char*';
                    arraySizes.push(''); // No size needed for strings
                } else if (typeof input === 'number') {
                    inputCode += `int ${paramName} = ${input};\n    `;
                    paramType = 'int';
                    arraySizes.push(''); // No size needed for numbers
                } else if (Array.isArray(input)) {
                    if (input.length === 0) {
                        inputCode += `int ${paramName}[] = {};\n    `;
                        inputCode += `int ${paramName}Size = 0;\n    `;
                        paramType = 'int*';
                        arraySizes.push(`${paramName}Size`);
                    } else if (Array.isArray(input[0])) {
                        const arrayStr = input.map((row: any[]) =>
                            `{${row.join(', ')}}`
                        ).join(', ');
                        inputCode += `int ${paramName}[][${input[0].length}] = {${arrayStr}};\n    `;
                        inputCode += `int ${paramName}Size = ${input.length};\n    `;
                        paramType = 'int**';
                        arraySizes.push(`${paramName}Size`);
                    } else {
                        const arrayStr = input.join(', ');
                        inputCode += `int ${paramName}[] = {${arrayStr}};\n    `;
                        inputCode += `int ${paramName}Size = ${input.length};\n    `;
                        paramType = 'int*';
                        arraySizes.push(`${paramName}Size`);
                    }
                } else {
                    inputCode += `char* ${paramName} = "${input}";\n    `;
                    paramType = 'char*';
                    arraySizes.push(''); // No size needed for strings
                }

                paramTypes.push(paramType);
                paramNames.push(paramName);
            });

            // Determine result type based on first parameter or default to char*
            resultType = paramTypes[0] || 'char*';

            // Check if expected output is array format (contains commas)
            const isArrayOutput = testCase.expectedOutput.includes(',');

            // Build function call parameters: for each array param, add its size
            const functionParams: string[] = [];
            paramNames.forEach((paramName, index) => {
                functionParams.push(paramName);
                // If this is an array parameter, add its size
                if (arraySizes[index]) {
                    functionParams.push(arraySizes[index]);
                }
            });

            // Add returnSize parameter for array outputs
            if (isArrayOutput && (resultType === 'int*' || resultType === 'int**')) {
                functionParams.push('&returnSize');
            }

            functionCall = `${functionName}(${functionParams.join(', ')});`;
        }

        // Check if expected output is array format (contains commas)
        const isArrayOutput = testCase.expectedOutput.includes(',');

        // Generate appropriate print statement based on result type
        let printStatement = '';
        if (resultType === 'int*') {
            if (isArrayOutput) {
                // For array results, add returnSize parameter
                printStatement = `
    int returnSize;
    int* result = ${functionCall.replace(';', '')};
    printf("[");
    if (result != NULL) {
        // Print elements using actual return size
        for (int i = 0; i < returnSize; i++) {
            if (i > 0) printf(",");
            printf("%d", result[i]);
        }
    }
    printf("]\\n");`;
            } else {
                // For single value results
                printStatement = `
    int* result = ${functionCall.replace(';', '')};
    printf("%d\\n", result[0]);`;
            }
        } else if (resultType === 'int**') {
            // For 2D array results
            printStatement = `
    int** result = ${functionCall.replace(';', '')};
    printf("[");
    for (int i = 0; i < sizeof(input)/sizeof(input[0]); i++) {
        printf("[");
        for (int j = 0; j < sizeof(input[0])/sizeof(input[0][0]); j++) {
            printf("%d", result[i][j]);
            if (j < sizeof(input[0])/sizeof(input[0][0]) - 1) printf(",");
        }
        printf("]");
        if (i < sizeof(input)/sizeof(input[0]) - 1) printf(",");
    }
    printf("]\\n");`;
        } else if (resultType === 'int') {
            printStatement = `
    int result = ${functionCall.replace(';', '')};
    printf("%d\\n", result);`;
        } else {
            printStatement = `
    char* result = ${functionCall.replace(';', '')};
    printf("%s\\n", result);`;
        }

        return `${sourceCode}

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    ${inputCode}
    ${printStatement}
    return 0;
}`;
    }




    /**
     * Execute code against a single test case
     */
    private async executeTestCase(
        sourceCode: string,
        languageId: number,
        testCase: ITestCase,
        test: ITestDocument
    ): Promise<TestExecutionResult> {
        try {
            const wrappedCode = this.createLeetCodeWrapper(sourceCode, languageId, testCase, test);

            console.log("wrappedCode", wrappedCode);

            const submission: CodeExecutionRequest = {
                source_code: wrappedCode,
                language_id: languageId,
                stdin: '', // No stdin needed with wrapper
                expected_output: testCase.expectedOutput.trim() === "''" || testCase.expectedOutput === "" ? "" : testCase.expectedOutput
            };

            console.log("sourceCode", sourceCode);
            console.log("submission", submission);

            const executionResult = await this.codeExecutionService.executeCode(submission);

            console.log("executionResult", executionResult);

            if (!executionResult.success || !executionResult.data) {
                return {
                    testCaseId: testCase._id || '',
                    passed: false,
                    expectedOutput: testCase.expectedOutput,
                    errorMessage: executionResult.error || 'Execution failed'
                };
            }

            const result = executionResult.data;
            console.log("result", result);
            console.log("stderr:", result.stderr);
            console.log("stdout:", result.stdout);
            console.log("compile_output:", result.compile_output);
            console.log("status id:", result.status.id);

            const actualOutput = result.stdout || '';

            const expectedOutput = testCase.expectedOutput.trim();



            // Check if execution was successful
            // Status 3 = Accepted, Status 4 = Wrong Answer (but we do our own comparison)
            // Status 5+ = Runtime/Compile errors
            const isExecutionSuccessful = result.status.id === 3 || result.status.id === 4;
            const isOutputCorrect = this.compareOutputs(actualOutput.trim(), expectedOutput, testCase.outputFormat);

            // Get execution metrics
            const executionTime = result.execution_time || 0; // Already in milliseconds from CodeExecutionService
            const memoryUsed = result.memory ? parseInt(result.memory.toString()) : 0; // Memory in KB

            console.log("isExecutionSuccessful", isExecutionSuccessful);
            console.log("isOutputCorrect", isOutputCorrect);

            const passed = isExecutionSuccessful && isOutputCorrect;

            console.log("passed", passed);

            const testResult: TestExecutionResult = {
                testCaseId: testCase._id || '',
                passed,
                actualOutput,
                expectedOutput,
                executionTime,
                memoryUsed
            };

            console.log("testResult", testResult);

            // Set error message for execution errors (status 5+) or compilation errors (status 6)
            if (result.status.id >= 5) {
                if (result.status.id === 6) {
                    // Compilation error - use compile_output
                    testResult.errorMessage = result.compile_output || 'Compilation error';
                } else {
                    // Runtime error - use stderr
                    testResult.errorMessage = result.stderr || result.message || 'Execution error';
                }
            } else if (result.stderr && result.stderr.trim()) {
                // Check if there's a stderr message (could be type validation error)
                testResult.errorMessage = result.stderr.trim();
            }

            return testResult;

        } catch (error) {
            logger.error('Error executing test case:', error);
            return {
                testCaseId: testCase._id || '',
                passed: false,
                expectedOutput: testCase.expectedOutput,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Enhanced output comparison that handles common formatting inconsistencies
     */
    /**
 * Compare actual output with expected output, handling multiple valid answers and format validation
 */
    private compareOutputs(actual: string, expected: string, outputFormat?: string): boolean {

        console.log('actual', actual);
        console.log('expected', expected);

        if (actual == "\n" && expected === "''" || actual === "" && expected === "''") {
            return true;
        }
        // Handle multiple valid answers separated by ||
        if (expected.includes('||')) {
            const validAnswers = expected.split('||').map(answer => answer.trim());
            return validAnswers.some(validAnswer =>
                this.compareOutputs(actual, validAnswer, outputFormat)
            );
        }

        // Normalize whitespace and line endings
        const normalize = (str: string) => {
            return str
                .replace(/\r\n/g, '\n')  // Normalize line endings
                .replace(/\r/g, '\n')    // Handle old Mac line endings
                .trim();                 // Remove leading/trailing whitespace
        };

        const normalizedActual = normalize(actual);
        const normalizedExpected = normalize(expected);

        // Validate output format first
        if (!this.validateOutputFormat(normalizedActual, outputFormat)) {
            return false;
        }

        // Format-specific comparison based on outputFormat
        switch (outputFormat) {
            case 'array':
                return this.compareArrayOutputs(normalizedActual, normalizedExpected);
            case 'string':
                return this.compareStringOutputs(normalizedActual, normalizedExpected);
            case 'number':
                return this.compareNumberOutputs(normalizedActual, normalizedExpected);
            case 'boolean':
                return this.compareBooleanOutputs(normalizedActual, normalizedExpected);
            case 'object':
                return this.compareObjectOutputs(normalizedActual, normalizedExpected);
            default:
                return this.compareGenericOutputs(normalizedActual, normalizedExpected);
        }
    }

    /**
    * Validate if the actual output matches the expected format
    */
    private validateOutputFormat(output: string, outputFormat?: string): boolean {
        if (!outputFormat) return true; // No format specified, accept any

        const trimmed = output.trim();

        switch (outputFormat) {
            case 'array':
                return this.isValidArrayFormat(trimmed);
            case 'string':
                return this.isValidStringFormat(trimmed);
            case 'number':
                return this.isValidNumberFormat(trimmed);
            case 'boolean':
                return this.isValidBooleanFormat(trimmed);
            case 'object':
                return this.isValidObjectFormat(trimmed);
            default:
                return true; // Unknown format, accept any
        }
    }

    /**
    * Validate array format
    */
    private isValidArrayFormat(output: string): boolean {
        // Check for JSON array format [1,2,3]
        if (output.startsWith('[') && output.endsWith(']')) {
            try {
                const parsed = JSON.parse(output);
                return Array.isArray(parsed);
            } catch {
                return false;
            }
        }

        // Check for comma-separated values without brackets: 1,2,3
        if (output.includes(',')) {
            const elements = output.split(',').map(el => el.trim());
            // All elements should be valid (not empty after trim)
            return elements.every(el => el.length > 0);
        }

        // Single element array
        return output.length > 0;
    }

    /**
    * Validate string format
    */
    private isValidStringFormat(output: string): boolean {
        // Accept quoted strings "hello" or unquoted strings hello
        return true; // Most outputs can be treated as strings
    }

    /**
    * Validate number format
    */
    private isValidNumberFormat(output: string): boolean {
        const trimmed = output.trim();
        return /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed) && !isNaN(parseFloat(trimmed));
    }

    /**
    * Validate boolean format
    */
    private isValidBooleanFormat(output: string): boolean {
        const trimmed = output.toLowerCase().trim();
        return ['true', 'false', '1', '0'].includes(trimmed);
    }

    /**
    * Validate object format
    */
    private isValidObjectFormat(output: string): boolean {
        if (output.startsWith('{') && output.endsWith('}')) {
            try {
                const parsed = JSON.parse(output);
                return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * Compare array outputs
     */
    private compareArrayOutputs(actual: string, expected: string): boolean {
        try {
            let actualArray, expectedArray;

            // Try parsing as JSON arrays first
            if (actual.startsWith('[') && actual.endsWith(']')) {
                actualArray = JSON.parse(actual);
            } else {
                // Parse as comma-separated values
                actualArray = actual.split(',').map(item => {
                    const trimmed = item.trim();
                    // Try to parse as number, otherwise keep as string
                    const num = parseFloat(trimmed);
                    return isNaN(num) ? trimmed.replace(/^"|"$/g, '') : num;
                });
            }

            if (expected.startsWith('[') && expected.endsWith(']')) {
                expectedArray = JSON.parse(expected);
            } else {
                // For comma-separated values, we need to determine if it should be 1D or 2D
                // Check if the actual output is 2D array, then expected should also be 2D
                const isActual2D = Array.isArray(actualArray) && actualArray.length > 0 && Array.isArray(actualArray[0]);

                if (isActual2D) {
                    // If actual is 2D, wrap the expected in another array
                    expectedArray = [expected.split(',').map(item => {
                        const trimmed = item.trim();
                        const num = parseFloat(trimmed);
                        return isNaN(num) ? trimmed.replace(/^"|"$/g, '') : num;
                    })];
                } else {
                    // If actual is 1D, parse as 1D array
                    expectedArray = expected.split(',').map(item => {
                        const trimmed = item.trim();
                        const num = parseFloat(trimmed);
                        return isNaN(num) ? trimmed.replace(/^"|"$/g, '') : num;
                    });
                }
            }

            console.log("actualArray", actualArray);
            console.log("expectedArray", expectedArray);

            // Deep comparison for arrays
            return this.deepCompareArrays(actualArray, expectedArray);
        } catch (error) {
            console.log("Array comparison error:", error);
            // Fallback to string comparison
            return this.normalizeCommaSpacing(actual) === this.normalizeCommaSpacing(expected);
        }
    }

    /**
     * Deep comparison for arrays (handles nested arrays)
     */
    private deepCompareArrays(arr1: any, arr2: any): boolean {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            return arr1 === arr2;
        }

        if (arr1.length !== arr2.length) {
            return false;
        }

        for (let i = 0; i < arr1.length; i++) {
            if (Array.isArray(arr1[i]) && Array.isArray(arr2[i])) {
                if (!this.deepCompareArrays(arr1[i], arr2[i])) {
                    return false;
                }
            } else if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }

    /**
    * Compare string outputs
    */
    private compareStringOutputs(actual: string, expected: string): boolean {
        // Remove surrounding quotes if present
        const cleanActual = actual.replace(/^"|"$/g, '');
        const cleanExpected = expected.replace(/^"|"$/g, '');

        // Exact match
        if (cleanActual === cleanExpected) return true;

        // Case-insensitive match for strings
        return cleanActual.toLowerCase() === cleanExpected.toLowerCase();
    }

    /**
    * Compare number outputs
    */
    private compareNumberOutputs(actual: string, expected: string): boolean {
        const actualNum = parseFloat(actual.trim());
        const expectedNum = parseFloat(expected.trim());

        if (isNaN(actualNum) || isNaN(expectedNum)) {
            return false;
        }

        // Handle floating point precision
        return Math.abs(actualNum - expectedNum) < 1e-9;
    }

    /**
    * Compare boolean outputs
    */
    private compareBooleanOutputs(actual: string, expected: string): boolean {
        const normalizeBool = (str: string): boolean => {
            const trimmed = str.toLowerCase().trim();
            return trimmed === 'true' || trimmed === '1';
        };

        return normalizeBool(actual) === normalizeBool(expected);
    }

    /**
    * Compare object outputs
    */
    private compareObjectOutputs(actual: string, expected: string): boolean {
        try {
            const actualObj = JSON.parse(actual);
            const expectedObj = JSON.parse(expected);
            return JSON.stringify(actualObj) === JSON.stringify(expectedObj);
        } catch {
            return false;
        }
    }

    /**
    * Compare generic outputs (fallback)
    */
    private compareGenericOutputs(actual: string, expected: string): boolean {
        // Exact match first
        if (actual === expected) return true;

        // Normalize comma spacing
        const spacingNormalizedActual = this.normalizeCommaSpacing(actual);
        const spacingNormalizedExpected = this.normalizeCommaSpacing(expected);

        if (spacingNormalizedActual === spacingNormalizedExpected) return true;

        // Try JSON comparison
        try {
            const actualParsed = JSON.parse(actual);
            const expectedParsed = JSON.parse(expected);
            return JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);
        } catch {
            // Continue with other comparisons
        }

        // Numeric comparison
        if (this.isNumericOutput(actual) && this.isNumericOutput(expected)) {
            const actualNum = parseFloat(actual);
            const expectedNum = parseFloat(expected);

            if (!isNaN(actualNum) && !isNaN(expectedNum)) {
                return Math.abs(actualNum - expectedNum) < 1e-9;
            }
        }

        // Line-by-line comparison
        const actualLines = actual.split('\n');
        const expectedLines = expected.split('\n');

        if (actualLines.length === expectedLines.length) {
            for (let i = 0; i < actualLines.length; i++) {
                const actualLine = this.normalizeCommaSpacing(actualLines[i]?.trim() || '');
                const expectedLine = this.normalizeCommaSpacing(expectedLines[i]?.trim() || '');

                if (actualLine !== expectedLine) {
                    return false;
                }
            }
            return true;
        }

        // Case-insensitive comparison
        return actual.toLowerCase() === expected.toLowerCase();
    }

    /**
    * Helper method to normalize comma spacing
    */
    private normalizeCommaSpacing(str: string): string {
        return str.replace(/\s*,\s*/g, ',');
    }

    /**
    * Check if output is numeric
    */
    private isNumericOutput(output: string): boolean {
        const trimmed = output.trim();
        return /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed);
    }

    /**
    * Check if output looks like an array (comma-separated values)
    */
    private isArrayLikeOutput(output: string): boolean {
        return output.includes(',') && !output.includes('{') && !output.includes('[');
    }
    /**
     * Check if output is numeric
     */

    /**
     * Get user's submission history for a test
     */
    async getUserSubmissionHistory(testId: string, userId: string): Promise<ITestSubmissionDocument[]> {
        return await this.testRepository.findUserSubmissionsForTest(testId.toString(), userId);
    }

    /**
     * Get test submission statistics
     */
    async getTestSubmissionStats(testId: string): Promise<{
        totalSubmissions: number;
        uniqueUsers: number;
        averageScore: number;
        passRate: number;
    }> {
        return await this.testRepository.getTestSubmissionStats(testId.toString());
    }

    validateTestCase(testCase: Partial<ITestCase>): { isValid: boolean; error?: string; normalizedTestCase?: Partial<ITestCase> } {
        if (!testCase.inputs || testCase.inputs.length === 0) {
            return { isValid: false, error: 'Test case inputs are required' };
        }

        // Validate each input
        for (let i = 0; i < testCase.inputs.length; i++) {
            const input = testCase.inputs[i];
            if (!input) {
                return { isValid: false, error: `Input ${i + 1} is required` };
            }
            if (!input.value || input.value.trim() === '') {
                return { isValid: false, error: `Input ${i + 1} value is required` };
            }
            if (!input.order || input.order < 1) {
                return { isValid: false, error: `Input ${i + 1} order must be at least 1` };
            }
        }

        if (!testCase.expectedOutput || testCase.expectedOutput.trim() === '') {
            return { isValid: false, error: 'Test case expected output is required' };
        }

        // Normalize the expected output for consistency
        const normalizedOutput = testCase.expectedOutput
            .replace(/\s*,\s*/g, ',')  // Remove spaces around commas
            .trim();

        const normalizedTestCase = {
            ...testCase,
            expectedOutput: normalizedOutput
        };

        return {
            isValid: true,
            normalizedTestCase
        };
    }

}