import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCreateAssessment } from '@/lib/hooks/useAssessments';
import { useQuestions } from '@/lib/hooks/useQuestions';
import { useUsers } from '@/lib/hooks/useUsers';
import { useColleges } from '@/lib/hooks/useColleges';
import { assessmentSchema, AssessmentFormData, QuestionFormData } from '../types';
import { AssessmentType } from '@/lib/types/assessment';

export function useAssessmentCreation() {
    const router = useRouter();
    const { data: questionsData } = useQuestions({ limit: 100 });
    const { data: usersData } = useUsers({ limit: 100 });
    const { data: collegesData } = useColleges({ limit: 100 });
    const createAssessmentMutation = useCreateAssessment();

    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [sections, setSections] = useState<string[]>([]);
    const [newSection, setNewSection] = useState('');
    const [isAddingSection, setIsAddingSection] = useState(false);

    const [newQuestion, setNewQuestion] = useState<QuestionFormData>({
        text: '',
        section: '',
        type: 'single_choice',
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
        ],
        marks: 1,
        explanation: '',
    });

    const [editingQuestion, setEditingQuestion] = useState<QuestionFormData>({
        text: '',
        section: '',
        type: 'single_choice',
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
        ],
        marks: 1,
        explanation: '',
    });

    const form = useForm<AssessmentFormData>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: {
            title: '',
            description: '',
            type: AssessmentType.MCQ,
            duration: 60,
            colleges: [],
            assignedUsers: [],
            assignAllUsers: false,
            invitedUsers: [],
            googleForm: '',
            passPercentage: 60,
            questionsToCreate: [],
            existingQuestions: [],
            codingQuestions: [],
            showResultsToUsers: false,
        },
    });

    const questionArray = useFieldArray({
        control: form.control,
        name: 'questionsToCreate',
    });

    const questions = questionsData?.data || [];
    const users = usersData?.data || [];
    const colleges = collegesData?.data || [];

    const watchedQuestionsToCreate = form.watch('questionsToCreate') || [];
    const watchedExistingQuestions = form.watch('existingQuestions') || [];
    const watchedAssignAllUsers = form.watch('assignAllUsers');

    const calculateTotalMarks = () => {
        const newQuestionsMarks = watchedQuestionsToCreate.reduce(
            (sum, q) => sum + (q.marks || 0),
            0
        );
        const existingQuestionsMarks = watchedExistingQuestions.reduce(
            (sum, questionId) => {
                const question = questions.find((q) => q._id === questionId);
                return sum + (question?.marks || 0);
            },
            0
        );
        const codingQuestionsMarks = (form.watch('codingQuestions') || []).reduce(
            (sum, cq) => sum + (cq.score || 0),
            0
        );
        return newQuestionsMarks + existingQuestionsMarks + codingQuestionsMarks;
    };

    const getTotalMarksError = () => {
        const totalMarks = calculateTotalMarks();
        if (totalMarks > 100) {
            return `Total marks (${totalMarks}) cannot exceed 100`;
        }
        return null;
    };

    const totalMarksError = getTotalMarksError();
    const remainingMarks = 100 - calculateTotalMarks();

    // Get validation errors for create assessment button
    const getCreateButtonErrors = () => {
        const errors: string[] = [];

        if (!form.watch('title')?.trim()) {
            errors.push('Assessment title is required');
        }

        if (!form.watch('duration') || form.watch('duration') < 1) {
            errors.push('Duration must be at least 1 minute');
        }

        // Validate date constraints
        const startDate = form.watch('startDate');
        const endDate = form.watch('endDate');
        const duration = form.watch('duration') || 0;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const timeGap = end.getTime() - start.getTime();
            const durationMs = duration * 60 * 1000;
            const minGapMs = 30 * 60 * 1000;

            if (timeGap < durationMs) {
                errors.push(`End date must be at least ${duration} minute${duration !== 1 ? 's' : ''} after start date`);
            }

            if (timeGap < minGapMs) {
                errors.push('Start and end dates must have at least 30 minutes gap');
            }
        }

        if (totalMarksError) {
            errors.push(totalMarksError);
        }

        if (
            watchedQuestionsToCreate.length === 0 &&
            watchedExistingQuestions.length === 0 &&
            (form.watch('codingQuestions') || []).length === 0
        ) {
            errors.push('At least one question (MCQ or coding) is required');
        }

        // At least one of assignedUsers, invitedUsers, or colleges must be present (unless assign all users)
        const assignedUsersCount = form.watch('assignedUsers')?.length || 0;
        const invitedUsersCount = form.watch('invitedUsers')?.length || 0;
        const collegesCount = form.watch('colleges')?.length || 0;
        if (
            !watchedAssignAllUsers &&
            assignedUsersCount === 0 &&
            invitedUsersCount === 0 &&
            collegesCount === 0
        ) {
            errors.push('At least one user, invited user, or college must be assigned');
        }

        return errors;
    };

    const createButtonErrors = getCreateButtonErrors();

    const handleCreateAssessment = async (data: AssessmentFormData) => {
        try {
            // Validate date constraints before submission
            if (data.startDate && data.endDate) {
                const start = new Date(data.startDate);
                const end = new Date(data.endDate);
                const timeGap = end.getTime() - start.getTime();
                const durationMs = data.duration * 60 * 1000;
                const minGapMs = 30 * 60 * 1000;

                if (timeGap < durationMs) {
                    toast.error(`End date must be at least ${data.duration} minute${data.duration !== 1 ? 's' : ''} after start date`);
                    return;
                }

                if (timeGap < minGapMs) {
                    toast.error('Start and end dates must have at least 30 minutes gap');
                    return;
                }
            }

            // Calculate total marks from questions
            const newQuestionsMarks = (data.questionsToCreate || []).reduce(
                (sum, q) => sum + q.marks,
                0
            );
            const existingQuestionsMarks = (data.existingQuestions || []).reduce(
                (sum, questionId) => {
                    const question = questions.find((q) => q._id === questionId);
                    return sum + (question?.marks || 0);
                },
                0
            );
            const codingQuestionsMarks = (data.codingQuestions || []).reduce(
                (sum, cq) => sum + cq.score,
                0
            );
            const totalMarks = newQuestionsMarks + existingQuestionsMarks + codingQuestionsMarks;

            // Validate total marks
            if (totalMarks > 100) {
                toast.error(
                    `Total marks (${totalMarks}) cannot exceed 100. Please reduce question marks or remove some questions.`
                );
                return;
            }

            // Prepare the data for the API according to backend DTO structure
            const assessmentData = {
                title: data.title,
                description: data.description || undefined,
                type: data.type as AssessmentType,
                duration: data.duration,
                colleges: data.colleges || [],
                startDate: data.startDate || undefined,
                endDate: data.endDate || undefined,
                assignedUsers: (data.assignAllUsers
                    ? 'all'
                    : data.assignedUsers || []) as string[] | 'all',
                invitedUsers: data.invitedUsers || [],
                googleForm: data.googleForm || undefined,
                passPercentage: data.passPercentage ?? 60,
                questions: data.existingQuestions || [],
                questionsToCreate: data.questionsToCreate || [],
                codingQuestions: data.codingQuestions || [],
                totalMarks: totalMarks > 0 ? totalMarks : undefined,
            };

            // Validate that we have at least some questions
            if (
                assessmentData.questions.length === 0 &&
                assessmentData.questionsToCreate.length === 0 &&
                assessmentData.codingQuestions.length === 0
            ) {
                toast.error('Please add at least one question (MCQ or coding) to the assessment');
                return;
            }

            // Validate that we have assigned users
            if (
                !data.assignAllUsers &&
                (!data.assignedUsers || data.assignedUsers.length === 0) &&
                (!data.invitedUsers || data.invitedUsers.length === 0) &&
                (!data.colleges || data.colleges.length === 0)
            ) {
                toast.error('Please assign at least one user, invited user, or college to the assessment');
                return;
            }

            await createAssessmentMutation.mutateAsync(assessmentData);
            toast.success('Assessment created successfully!');
            // router.push('/admin/assessments');
        } catch (error: any) {
            console.error('Failed to create assessment:', error);

            // Handle specific error cases
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.message) {
                toast.error(error.message);
            } else {
                toast.error('Failed to create assessment. Please try again.');
            }
        }
    };

    const addNewQuestion = () => {
        if (
            newQuestion.text.trim() &&
            newQuestion.section &&
            newQuestion.options.every((opt) => opt.text.trim()) &&
            newQuestion.options.some((opt) => opt.isCorrect)
        ) {
            // Check if adding this question would exceed 100 total marks
            const currentTotal = calculateTotalMarks();
            if (currentTotal + newQuestion.marks > 100) {
                toast.error(
                    `Cannot add question: Total marks would exceed 100 (${currentTotal + newQuestion.marks
                    })`
                );
                return;
            }

            questionArray.append(newQuestion);
            setNewQuestion({
                text: '',
                section: '',
                type: 'single_choice',
                options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                ],
                marks: 1,
                explanation: '',
            });
            setIsAddingQuestion(false);

            // Trigger validation after adding question
            form.trigger('questionsToCreate');
        }
    };

    const startEditingQuestion = (index: number) => {
        const question = watchedQuestionsToCreate[index];
        setEditingQuestion(question);
        setEditingQuestionIndex(index);
    };

    const saveEditedQuestion = () => {
        if (
            editingQuestion.text.trim() &&
            editingQuestion.section &&
            editingQuestion.options.every((opt) => opt.text.trim()) &&
            editingQuestion.options.some((opt) => opt.isCorrect) &&
            editingQuestionIndex !== null
        ) {
            // Check if editing this question would exceed 100 total marks
            const currentTotal = calculateTotalMarks();
            const oldMarks = watchedQuestionsToCreate[editingQuestionIndex]?.marks || 0;
            const newTotal = currentTotal - oldMarks + editingQuestion.marks;

            if (newTotal > 100) {
                toast.error(
                    `Cannot save question: Total marks would exceed 100 (${newTotal})`
                );
                return;
            }

            questionArray.update(editingQuestionIndex, editingQuestion);
            setEditingQuestionIndex(null);
            setEditingQuestion({
                text: '',
                section: '',
                type: 'single_choice',
                options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                ],
                marks: 1,
                explanation: '',
            });
            form.trigger('questionsToCreate');
        }
    };

    const cancelEditingQuestion = () => {
        setEditingQuestionIndex(null);
        setEditingQuestion({
            text: '',
            section: '',
            type: 'single_choice',
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
            ],
            marks: 1,
            explanation: '',
        });
    };

    const removeQuestion = (index: number) => {
        questionArray.remove(index);
    };

    const addExistingQuestion = (questionId: string) => {
        const currentQuestions = form.watch('existingQuestions') || [];
        if (!currentQuestions.includes(questionId)) {
            form.setValue('existingQuestions', [...currentQuestions, questionId]);
        }
    };

    const addUser = (userId: string) => {
        const currentUsers = form.watch('assignedUsers') || [];
        if (!currentUsers.includes(userId)) {
            form.setValue('assignedUsers', [...currentUsers, userId]);
        }
    };

    const handleAssignAllUsers = (checked: boolean) => {
        form.setValue('assignAllUsers', checked);
        if (checked) {
            form.setValue('assignedUsers', []);
        }
    };

    // Section management functions
    const addSection = () => {
        if (newSection.trim() && !sections.includes(newSection.trim())) {
            setSections([...sections, newSection.trim()]);
            setNewSection('');
            setIsAddingSection(false);
        }
    };

    const removeSection = (sectionToRemove: string) => {
        // Check if any questions are using this section
        const questionsUsingSection = watchedQuestionsToCreate.filter(
            (q) => q.section === sectionToRemove
        );

        if (questionsUsingSection.length > 0) {
            toast.error(
                `Cannot remove section "${sectionToRemove}" - ${questionsUsingSection.length} questions are using it. Please reassign or remove those questions first.`
            );
            return;
        }

        setSections(sections.filter((s) => s !== sectionToRemove));
    };

    const getAvailableSections = () => {
        const usedSections = new Set(
            watchedQuestionsToCreate.map((q) => q.section).filter(Boolean)
        );
        return sections.filter((s) => !usedSections.has(s));
    };

    return {
        form,
        questionArray,
        questions,
        users,
        colleges,
        isAddingQuestion,
        setIsAddingQuestion,
        editingQuestionIndex,
        setEditingQuestionIndex,
        sections,
        setSections,
        newSection,
        setNewSection,
        isAddingSection,
        setIsAddingSection,
        newQuestion,
        setNewQuestion,
        editingQuestion,
        setEditingQuestion,
        watchedQuestionsToCreate,
        watchedExistingQuestions,
        watchedAssignAllUsers,
        calculateTotalMarks,
        getTotalMarksError,
        totalMarksError,
        remainingMarks,
        createButtonErrors,
        createAssessmentMutation,
        handleCreateAssessment,
        addNewQuestion,
        startEditingQuestion,
        saveEditedQuestion,
        cancelEditingQuestion,
        removeQuestion,
        addExistingQuestion,
        addUser,
        handleAssignAllUsers,
        addSection,
        removeSection,
        getAvailableSections,
    };
}
