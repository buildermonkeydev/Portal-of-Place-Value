/**
 * Utility functions for processing text content
 */

/**
 * Processes question text and converts \n escape sequences to actual line breaks
 * @param text - The text containing \n escape sequences
 * @returns React elements with proper line breaks
 */
export const processQuestionText = (text: string) => {
    if (!text) return '';

    // Split by \n and create array of lines
    const lines = text.split('\\n');

    return lines.map((line, index) => (
        <span key= { index } >
        { line }
      { index<lines.length - 1 && <br /> }
        </span>
    ));
};

/**
 * Alternative approach using CSS whitespace-pre-wrap for simpler cases
 * @param text - The text containing \n escape sequences
 * @returns The text as-is (CSS will handle the formatting)
 */
export const getProcessedText = (text: string) => {
    if (!text) return '';
    return text;
};
