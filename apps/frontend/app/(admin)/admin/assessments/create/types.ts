import { z } from 'zod';

export const questionSchema = z.object({
    text: z.string().min(10, 'Question text must be at least 10 characters'),
    section: z.string().min(1, 'Section is required'),
    type: z.enum(['single_choice', 'multiple_choice']),
    options: z
        .array(
            z.object({
                text: z.string().min(1, 'Option text is required'),
                isCorrect: z.boolean(),
            })
        )
        .min(2, 'At least 2 options are required')
        .refine(
            (options) => options.some((opt) => opt.isCorrect),
            'At least one option must be correct'
        ),
    marks: z
        .number()
        .min(1, 'Marks must be at least 1')
        .max(100, 'Marks cannot exceed 100'),
    explanation: z.string().optional(),
});

export const assessmentSchema = z
    .object({
        title: z.string().min(5, 'Title must be at least 5 characters'),
        description: z.string().optional(),
        type: z.enum(['mcq', 'coding', 'mixed']),
        duration: z
            .number()
            .min(1, 'Duration must be at least 1 minute')
            .max(480, 'Duration cannot exceed 8 hours'),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        colleges: z.array(z.object({
            _id: z.string(),
            branches: z.array(z.object({
                _id: z.string(),
                name: z.string(),
            })).optional(),
            year: z.array(z.number().min(1).max(5)).optional(),
        })).optional(),
        assignedUsers: z.array(z.string()).optional(),
        assignAllUsers: z.boolean().optional(),
        invitedUsers: z.array(z.string().email('Invalid email address')).optional(),
        googleForm: z.string().min(1, 'Google Form URL is required').url('Must be a valid URL'),
        passPercentage: z.number().min(0).max(100).default(60).optional(),
        questionsToCreate: z.array(questionSchema).optional(),
        existingQuestions: z.array(z.string()).optional(),
        codingQuestions: z.array(z.object({
            _id: z.string(),
            section: z.string(),
            score: z.number().min(0),
        })).optional(),
        showResultsToUsers: z.boolean().default(true),
    })
    .refine(
        (data) => {
            return (
                data.assignAllUsers ||
                (data.assignedUsers && data.assignedUsers.length > 0) ||
                (data.invitedUsers && data.invitedUsers.length > 0) ||
                (data.colleges && data.colleges.length > 0)
            );
        },
        {
            message: 'At least one user, invited user, or college must be assigned',
            path: ['assignedUsers', 'invitedUsers', 'colleges'],
        }
    )
    .refine(
        (data) => {
            const newQuestionsMarks = (data.questionsToCreate || []).reduce(
                (sum, q) => sum + q.marks,
                0
            );
            const existingQuestionsMarks = (data.existingQuestions || []).reduce(
                (sum, questionId) => {
                    // We'll calculate this in the component since we need access to questions data
                    return sum;
                },
                0
            );
            return newQuestionsMarks <= 100;
        },
        {
            message: 'Total marks for new questions cannot exceed 100',
            path: ['questionsToCreate'],
        }
    )
    .refine(
        (data) => {
            // If both start and end dates are provided, validate the time gap
            if (data.startDate && data.endDate) {
                const startDate = new Date(data.startDate);
                console.log("startDate", data.startDate, startDate)

                const endDate = new Date(data.endDate);
                console.log("endDate", data.endDate, endDate)
                const durationMs = data.duration * 60 * 1000; // Convert minutes to milliseconds
                const timeGap = endDate.getTime() - startDate.getTime();

                // End date should be at least duration minutes after start date
                if (timeGap < durationMs) {
                    return false;
                }

                // Ensure minimum 30 minutes gap between start and end dates
                const minGapMs = 30 * 60 * 1000; // 30 minutes in milliseconds
                if (timeGap < minGapMs) {
                    return false;
                }
            }
            return true;
        },
        {
            message: 'End date must be at least duration minutes after start date and have a minimum 30-minute gap',
            path: ['endDate'],
        }
    );

type RawAssessmentFormData = z.infer<typeof assessmentSchema>;

export type AssessmentFormData = Omit<RawAssessmentFormData, 'showResultsToUsers'> & {
    showResultsToUsers?: boolean;
};
export type QuestionFormData = z.infer<typeof questionSchema>;

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface College {
    _id: string;
    name: string;
    branches: Array<{
        _id: string;
        name: string;
    }>;
}
