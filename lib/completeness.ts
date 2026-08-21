/**
 * Client-safe and server-safe Submission Completeness Calculator
 * Calculates explicit 0 - 100% completion based on required publishing elements.
 */
export function calculateSubmissionCompleteness(submission: {
  title?: string;
  description?: string;
  category?: string;
  language?: string;
  desiredPrice?: number;
  manuscriptFile?: { storagePath?: string };
  coverFile?: { storagePath?: string };
  rightsConfirmed?: boolean;
  termsAccepted?: boolean;
}): {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
  checklist: { item: string; done: boolean }[];
} {
  const checklist = [
    {
      item: "Book Title",
      done: Boolean(submission.title && submission.title.trim().length >= 2),
    },
    {
      item: "Description",
      done: Boolean(submission.description && submission.description.trim().length >= 10),
    },
    {
      item: "Category & Language",
      done: Boolean(submission.category?.trim() && submission.language?.trim()),
    },
    {
      item: "Manuscript File",
      done: Boolean(submission.manuscriptFile?.storagePath),
    },
    {
      item: "Book Cover",
      done: Boolean(submission.coverFile?.storagePath),
    },
    {
      item: "Pricing (INR)",
      done: Boolean(Number(submission.desiredPrice || 0) >= 1),
    },
    {
      item: "Rights Declaration",
      done: Boolean(submission.rightsConfirmed),
    },
    {
      item: "Publishing Terms",
      done: Boolean(submission.termsAccepted),
    },
  ];

  const total = checklist.length;
  const completedCount = checklist.filter((c) => c.done).length;
  const percentage = Math.round((completedCount / total) * 100);
  const isComplete = completedCount === total;
  const missingFields = checklist.filter((c) => !c.done).map((c) => c.item);

  return { percentage, isComplete, missingFields, checklist };
}
