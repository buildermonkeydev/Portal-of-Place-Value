// Language mappings for Judge0
// Maps Judge0 language IDs to their metadata
export const LANGUAGE_MAP: Record<number, {
    id: number;
    name: string;
    extension: string;
    ace_mode: string;
    sample_code: string;
}> = {
    48: {
        id: 48,
        name: "C (GCC 7.4.0)",
        extension: ".c",
        ace_mode: "c_cpp",
        sample_code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
    },
    52: {
        id: 52,
        name: "C++ (GCC 7.4.0)",
        extension: ".cpp",
        ace_mode: "c_cpp",
        sample_code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
    },
    54: {
        id: 54,
        name: "C++ (GCC 8.3.0)",
        extension: ".cpp",
        ace_mode: "c_cpp",
        sample_code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
    },
    62: {
        id: 62,
        name: "Java (OpenJDK 13.0.1)",
        extension: ".java",
        ace_mode: "java",
        sample_code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
    },
    63: {
        id: 63,
        name: "JavaScript (Node.js 12.14.0)",
        extension: ".js",
        ace_mode: "javascript",
        sample_code: 'console.log("Hello, World!");'
    },
    71: {
        id: 71,
        name: "Python (3.8.1)",
        extension: ".py",
        ace_mode: "python",
        sample_code: 'print("Hello, World!")'
    },
    74: {
        id: 74,
        name: "TypeScript (3.7.4)",
        extension: ".ts",
        ace_mode: "typescript",
        sample_code: 'console.log("Hello, World!");'
    },
    75: {
        id: 75,
        name: "C (Clang 7.0.1)",
        extension: ".c",
        ace_mode: "c_cpp",
        sample_code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
    },
    76: {
        id: 76,
        name: "C++ (Clang 7.0.1)",
        extension: ".cpp",
        ace_mode: "c_cpp",
        sample_code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
    },
    82: {
        id: 82,
        name: "SQL (SQLite 3.27.2)",
        extension: ".sql",
        ace_mode: "sql",
        sample_code: 'SELECT "Hello, World!";'
    },
    83: {
        id: 83,
        name: "Swift (5.2.3)",
        extension: ".swift",
        ace_mode: "swift",
        sample_code: 'print("Hello, World!")'
    }
};

export const getAllLanguages = () => {
    return Object.values(LANGUAGE_MAP);
};

export const getLanguageById = (id: number) => {
    return LANGUAGE_MAP[id] || null;
};

export const getLanguagesByIds = (ids: number[]) => {
    return ids.map(id => LANGUAGE_MAP[id]).filter(Boolean);
};
