'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Settings, Code } from 'lucide-react';
import Image from 'next/image';
import { AssessmentResultWithCollegeInfo, SectionScore } from '@/lib/types';

interface IndividualAssessmentReportProps {
  result: AssessmentResultWithCollegeInfo;
  logoUrl?: string;
  onExportPDF?: () => void;
  isExporting?: boolean;
}

export function IndividualAssessmentReport({
  result,
  logoUrl = '/logo.png',
  onExportPDF,
  isExporting = false,
}: IndividualAssessmentReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // Get section-wise scores
  const getSectionScores = (): SectionScore[] => {
    if (result.sectionScores && result.sectionScores.length > 0) {
      return result.sectionScores;
    }

    // Fallback: Calculate section scores from responses
    const sectionMap = new Map<string, SectionScore>();

    result.responses.forEach((response) => {
      const sectionName =
        response.question?.section || response.section || 'General';
      const questionMarks = response.question?.marks || 0;
      const obtainedMarks = response.marksObtained || 0;

      if (sectionMap.has(sectionName)) {
        const existing = sectionMap.get(sectionName)!;
        existing.marksObtained += obtainedMarks;
        existing.totalMarks += questionMarks;
        existing.questionsCount += 1;
        existing.percentage =
          existing.totalMarks > 0
            ? (existing.marksObtained / existing.totalMarks) * 100
            : 0;
      } else {
        sectionMap.set(sectionName, {
          sectionName,
          marksObtained: obtainedMarks,
          totalMarks: questionMarks,
          percentage:
            questionMarks > 0 ? (obtainedMarks / questionMarks) * 100 : 0,
          questionsCount: 1,
        });
      }
    });

    return Array.from(sectionMap.values()).sort((a, b) =>
      a.sectionName.localeCompare(b.sectionName)
    );
  };

  const sectionScores = getSectionScores();

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {onExportPDF && (
        <div className="flex justify-end gap-2 print:hidden">
          <Button
            onClick={onExportPDF}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Report'}
          </Button>
          <Button
            onClick={onExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      )}

      {/* JetBrains Mono font import */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
            .jetbrains-mono {
              font-family: 'JetBrains Mono', monospace !important;
            }
            @media print {
              .jetbrains-mono {
                font-family: 'JetBrains Mono', monospace !important;
              }
            }
          `,
        }}
      />
      {/* Report Content */}
      <div
        ref={reportRef}
        className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none print:border-none"
        id="individual-assessment-report"
      >

        {/* Header - Logo and Title */}
        <div className="flex items-center justify-between mb-8">
          {/* Left side - Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Behave Like Compiler Logo"
              width={120}
              height={60}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* Center/Right - Assessment Report title in pink oval */}
          <div
            className="px-8 py-2 rounded-full border border-black"
            style={{ backgroundColor: '#ffe4e1' }}
          >
            <h1 className="text-lg font-semibold text-black jetbrains-mono">
              Assessment Report
            </h1>
          </div>
        </div>

        {/* Student Details Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="bg-gray-50 border border-gray-300 px-4 py-3 text-left font-semibold"
                >
                  Student Details
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium w-1/3">
                  Name
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {result.user.firstName} {result.user.lastName}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Registration Number
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {result.user.registrationNo}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Email ID
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {result.user.email}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Branch
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {result.user.branchName}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Year
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {result.user.collegeYear || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Assessment Name
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {result.assessment.title}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Score Section */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th
                  colSpan={3}
                  className="bg-gray-50 border border-gray-300 px-4 py-3 text-center font-semibold"
                >
                  Score
                </th>
              </tr>
              <tr>
                {sectionScores.map((section) => (
                  <th
                    key={section.sectionName}
                    className="border border-gray-300 px-4 py-2 text-center font-medium"
                  >
                    {section.sectionName}({section.totalMarks})
                  </th>
                ))}
                <th className="border border-gray-300 px-4 py-2 text-center font-medium">
                  Total({result.totalMarksPossible})
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {sectionScores.map((section) => (
                  <td
                    key={section.sectionName}
                    className="border border-gray-300 px-4 py-2 text-center"
                  >
                    {section.marksObtained}
                  </td>
                ))}
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {result.totalMarksObtained}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Questions and Answers Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Questions and Answers</h2>
          <div className="space-y-6">
            {result.responses.map((response, index) => {
              const question = response.question;
              if (!question) return null;

              return (
                <div
                  key={response._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">
                      Q{index + 1}. {question.text}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        response.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {response.marksObtained}/{question.marks} marks
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-600 mb-1">Your Answer:</p>
                      <p
                        className={`font-medium ${
                          response.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {response.selectedOptions.length > 0
                          ? response.selectedOptions.join(', ')
                          : 'Not answered'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Correct Answer:</p>
                      <p className="font-medium text-green-700">
                        {question.correctAnswer.join(', ')}
                      </p>
                    </div>
                  </div>

                  {question.explanation && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-blue-600">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Logo and Link */}
        <div className="mt-12 pt-6 border-t border-gray-200 print:mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <a 
              href="https://blcompiler.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Image
                src="/logo.png"
                alt="Behave Like Compiler Logo"
                width={100}
                height={50}
                className="object-contain cursor-pointer"
              />
            </a>
            </div>
            <div className="text-right">
              <a
                href="https://blcompiler.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm jetbrains-mono"
              >
                www.blcompiler.com
              </a>
              <p className="text-xs text-gray-500 mt-1">
                Behave Like Compiler - Assessment Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndividualAssessmentReport;
