'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';
import { AssessmentResult } from '@/lib/types';

interface ConsolidatedReportResult {
  _id: string;
  assessmentTitle: string;
  assessmentDate: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
}

interface ConsolidatedReportProps {
  results: ConsolidatedReportResult[];
  studentInfo: {
    name: string;
    registrationNo: string | number;
    email: string;
    mobileNumber?: string;
    branch: string;
    year?: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  logoUrl?: string;
  onExportPDF?: () => void;
  isExporting?: boolean;
}

export function ConsolidatedReport({
  results,
  studentInfo,
  dateRange,
  logoUrl = '/logo.png',
  onExportPDF,
  isExporting = false,
}: ConsolidatedReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { text: string; className: string } } = {
      completed: { text: 'Pass', className: 'text-green-700' },
      in_progress: { text: 'In Progress', className: 'text-yellow-700' },
      abandoned: { text: 'Fail', className: 'text-red-700' },
      failed: { text: 'Fail', className: 'text-red-700' },
      paused: { text: 'Paused', className: 'text-orange-700' },
    };
    return statusMap[status] || { text: status, className: 'text-gray-700' };
  };

  const studentNameUpper = studentInfo.name?.toUpperCase();
  const registrationUpper = String(
    studentInfo.registrationNo || ''
  ).toUpperCase();

  return (
    <div className="space-y-4">
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
      {/* Export Button */}
      {onExportPDF && (
        <div className="flex justify-end print:hidden">
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

      {/* Report Content */}
      <div
        ref={reportRef}
        className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none print:border-none"
        id="consolidated-report"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Behave Like Compiler Logo"
              width={120}
              height={60}
              className="object-contain"
              priority
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Pink oval banner with Consolidated Report */}
          <div
            className="px-8 py-2 rounded-full border border-black"
            style={{ backgroundColor: '#ffe4e1' }}
          >
            <h1 className="text-lg font-semibold text-black jetbrains-mono">
              Consolidated Report
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
                  {studentNameUpper}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Registration Number
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {registrationUpper}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Email ID
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {studentInfo.email}
                </td>
              </tr>
              {studentInfo.mobileNumber && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    Mobile Number
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {studentInfo.mobileNumber}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Branch
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {studentInfo.branch}
                </td>
              </tr>
              {studentInfo.year && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    Year
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {studentInfo.year}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Date Range Info */}
        <div className="mb-4 text-sm text-gray-600">
          <p>
            Report Period: {formatDate(dateRange.startDate)} to{' '}
            {formatDate(dateRange.endDate)}
          </p>
        </div>

        {/* Assessments Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold w-16">
                  Sl. No.
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Name of Test
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-28">
                  Date
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-28">
                  Score
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-28">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                  >
                    No assessments found for the selected date range.
                  </td>
                </tr>
              ) : (
                results.map((result, index) => {
                  const statusInfo = getStatusDisplay(result.status);
                  return (
                    <tr key={result._id}>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {result.assessmentTitle}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {formatDate(result.assessmentDate)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {result.score}/{result.totalMarks} (
                        {result.percentage.toFixed(1)}%)
                      </td>
                      <td
                        className={`border border-gray-300 px-4 py-3 text-center font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {results.length}
                </div>
                <div className="text-sm text-gray-600">Total Assessments</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(
                    results.reduce((sum, r) => sum + r.percentage, 0) /
                    results.length
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {results.filter((r) => r.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Pass</div>
              </div>
            </div>
          </div>
        )}
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

export default ConsolidatedReport;

// Helper function to transform AssessmentResult[] to ConsolidatedReportResult[]
export function transformToConsolidatedResults(
  results: AssessmentResult[]
): ConsolidatedReportResult[] {
  return results.map((result) => ({
    _id: result._id,
    assessmentTitle:
      result.assessmentId &&
      typeof result.assessmentId === 'object' &&
      result.assessmentId !== null
        ? result.assessmentId.title || 'Unknown Assessment'
        : 'Unknown Assessment',
    assessmentDate: result.endTime || result.createdAt,
    score: result.totalMarksObtained,
    totalMarks: result.totalMarksPossible,
    percentage: result.percentage,
    status: result.status,
  }));
}
