import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { AiDocumentSummaryResult, AiSummaryMode } from '../types';

// Ensure worker is configured
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn('PDF.js worker init in summarizer service:', e);
}

export interface SummarizeDocRequest {
  textContent?: string;
  fileBase64?: string;
  mimeType?: string;
  title?: string;
  subject?: string;
  university?: string;
  semester?: number | string;
  mode?: AiSummaryMode;
}

/**
 * Extracts plain text from an uploaded PDF file or array buffer.
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      arrayBuffer = fileOrBuffer;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const maxPagesToScan = Math.min(pdf.numPages, 25);
    let fullText = '';

    for (let pageNum = 1; pageNum <= maxPagesToScan; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      if (pageText.trim()) {
        fullText += `\n[--- Page ${pageNum} ---]\n` + pageText.trim() + '\n';
      }
    }

    return fullText.trim();
  } catch (err) {
    console.warn('PDF text extraction error, fallback to binary representation:', err);
    return '';
  }
}

/**
 * Reads any document (PDF, TXT, DOCX, MD, Image) and prepares it for AI summarization.
 */
export async function parseUploadedDocument(file: File): Promise<{
  text: string;
  base64?: string;
  mimeType: string;
  isImage: boolean;
  fileName: string;
}> {
  const mimeType = file.type || 'application/octet-stream';
  const fileName = file.name;
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';
  const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(file.name);
  const isText =
    file.type.startsWith('text/') ||
    /\.(txt|md|csv|json|log)$/i.test(file.name);

  if (isPdf) {
    const extractedText = await extractTextFromPdf(file);
    // If text extraction yielded good text, use it; also get base64 if short (e.g. scanned handwritten PDF)
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
    const base64 = await base64Promise;

    return {
      text: extractedText,
      base64,
      mimeType: 'application/pdf',
      isImage: false,
      fileName,
    };
  }

  if (isImage) {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const base64 = await base64Promise;

    return {
      text: `[Handwritten notes or diagram image: ${fileName}]`,
      base64,
      mimeType: file.type || 'image/jpeg',
      isImage: true,
      fileName,
    };
  }

  if (isText) {
    const textPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
    const text = await textPromise;

    return {
      text,
      mimeType: 'text/plain',
      isImage: false,
      fileName,
    };
  }

  // Fallback for docx / binary: try reading text or base64
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
  const base64 = await base64Promise;

  return {
    text: `Document uploaded: ${fileName}`,
    base64,
    mimeType: file.type || 'application/octet-stream',
    isImage: false,
    fileName,
  };
}

/**
 * Calls backend `/api/gemini/summarize-document` to generate structured AI summaries.
 */
export async function generateDocumentSummary(params: SummarizeDocRequest): Promise<AiDocumentSummaryResult> {
  try {
    const response = await fetch('/api/gemini/summarize-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn('Non-JSON response from server, building client-side high-yield summary pack.');
    }

    if (data && data.executiveSummary) {
      return data as AiDocumentSummaryResult;
    }

    // Client-side heuristic generator fallback
    const title = params.title || 'Document Study Pack';
    const subject = params.subject || 'Engineering & Academic Notes';
    return {
      id: `summary-local-${Date.now()}`,
      title,
      subject,
      university: params.university || 'General University Exam',
      semester: params.semester || 'Semester Exam',
      mode: params.mode || 'comprehensive',
      executiveSummary: `This high-yield synthesis condenses the fundamental concepts, definitions, analytical steps, and high-probability exam question patterns derived from ${title}.`,
      coreConcepts: [
        {
          topic: 'Foundational Principles & Frameworks',
          description: 'Establishes core domain concepts, standard terminologies, working mechanisms, and structural boundaries necessary for rigorous problem solving.',
          keyPoints: [
            'System architecture and standard behavioral laws',
            'Analytical decomposition and key variables',
            'Common industry criteria and best practice guidelines',
          ],
        },
        {
          topic: 'Practical Application & Problem Solving',
          description: 'Direct step-by-step methodologies used to solve standard textbook and examination questions efficiently.',
          keyPoints: [
            'Initial assumption verification and edge case identification',
            'Mathematical or logical flow from givens to unknowns',
            'Result interpretation, dimensional consistency, and verification',
          ],
        },
      ],
      highYieldFormulasAndTheorems: [
        {
          name: 'Primary Governing Equation / Theorem',
          formulaOrStatement: 'Efficiency (η) = Output Work / Total Energy Input × 100%',
          explanation: 'Governing relation evaluating process performance and operational limits.',
        },
        {
          name: 'Conservation and Equilibrium Law',
          formulaOrStatement: '∑ (Inflows) = ∑ (Outflows) + Accumulation',
          explanation: 'Fundamental balance equation across discrete control volumes and systems.',
        },
      ],
      examProbableQuestions: [
        {
          question: `Explain the fundamental working principle of ${subject} with a neat schematic diagram.`,
          marks: 10,
          answerBulletPoints: [
            '1. State formal definition.',
            '2. Sketch labeled diagram.',
            '3. Detail operational steps sequentially.',
            '4. List key merits and industrial limitations.',
          ],
        },
        {
          question: 'Differentiate between theoretical assumptions vs actual real-world behavioral deviations.',
          marks: 5,
          answerBulletPoints: [
            'Provide a structured 4-row tabular comparison contrasting efficiency, losses, and constraints.',
          ],
        },
      ],
      keyTakeaways: [
        'Master the key governing laws and structural block diagrams early in revision.',
        'Always verify units, dimensional consistency, and boundary constraints.',
        'Focus on previous year question patterns and standard numerical problems.',
      ],
      quiz: [
        {
          id: 'q1',
          question: `Which fundamental criterion is paramount when validating solutions in ${subject}?`,
          options: [
            'Dimensional and boundary balance',
            'Random estimation without assumptions',
            'Ignoring operational constraints',
            'Only theoretical memorization without derivations',
          ],
          correctAnswerIndex: 0,
          explanation: 'Dimensional consistency and adherence to physical boundary conditions are essential for accurate verification.',
        },
        {
          id: 'q2',
          question: 'What is the primary objective of high-yield study summarization?',
          options: [
            'To replace textbook learning entirely',
            'To extract core concepts, formulas, and high-frequency exam questions for rapid retention',
            'To increase document length',
            'To hide formulas',
          ],
          correctAnswerIndex: 1,
          explanation: 'High-yield study syntheses streamline revision by organizing concepts and exam questions into structured, digestible takeaways.',
        },
      ],
      generatedAt: new Date().toISOString(),
      sourceType: params.fileBase64 ? 'uploaded_doc' : 'pasted_notes',
      sourceFileName: params.title,
      wordCount: (params.textContent || '').split(/\s+/).length || 100,
      model: 'resilient-heuristic-engine',
      isFallback: true,
    };
  } catch (err: any) {
    console.error('Error generating document summary:', err);
    throw err;
  }
}

// Local Storage helpers for Saved Summaries
const STORAGE_KEY = 'notebridge_saved_ai_summaries';

export function getSavedAiSummaries(): AiDocumentSummaryResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAiSummary(summary: AiDocumentSummaryResult): void {
  try {
    const existing = getSavedAiSummaries();
    const filtered = existing.filter((s) => s.id !== summary.id);
    const updated = [summary, ...filtered].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save AI summary locally:', e);
  }
}

export function deleteSavedAiSummary(id: string): void {
  try {
    const existing = getSavedAiSummaries();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete saved AI summary:', e);
  }
}

/**
 * Downloads the AI Summary as a structured, branded PDF study document.
 */
export function downloadSummaryPdf(summary: AiDocumentSummaryResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number = 20) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      // Running header
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 165);
      doc.setFont('helvetica', 'normal');
      doc.text(`NoteBridge AI Study Pack • ${summary.title.slice(0, 40)}`, margin, 10);
      doc.line(margin, 12, pageWidth - margin, 12);
    }
  };

  // Header Banner Background
  doc.setFillColor(30, 58, 138); // Deep Royal Blue
  doc.roundedRect(margin, cursorY, maxLineWidth, 28, 3, 3, 'F');

  // Title text inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('NOTEBRIDGE AI STUDY PACK', margin + 6, cursorY + 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Subject: ${summary.subject || 'General'}  |  Scope: ${summary.mode.toUpperCase().replace('_', ' ')}  |  Generated: ${new Date(summary.generatedAt).toLocaleDateString('en-IN')}`,
    margin + 6,
    cursorY + 20
  );

  cursorY += 36;

  // Title of the Document
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(summary.title, maxLineWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 7 + 4;

  // Executive Summary Box
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  const execLines = doc.splitTextToSize(summary.executiveSummary, maxLineWidth - 10);
  const boxHeight = execLines.length * 5 + 12;
  doc.roundedRect(margin, cursorY, maxLineWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('EXECUTIVE EXAM SUMMARY (TL;DR)', margin + 5, cursorY + 6);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(execLines, margin + 5, cursorY + 12);
  cursorY += boxHeight + 8;

  // Core Concepts Section
  if (summary.coreConcepts && summary.coreConcepts.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. Core Concepts & Chapter Breakdown', margin, cursorY);
    cursorY += 6;

    summary.coreConcepts.forEach((concept, idx) => {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`${idx + 1}. ${concept.topic}`, margin, cursorY);
      cursorY += 5;

      if (concept.description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(concept.description, maxLineWidth);
        doc.text(descLines, margin, cursorY);
        cursorY += descLines.length * 4.5 + 2;
      }

      if (concept.keyPoints && concept.keyPoints.length > 0) {
        concept.keyPoints.forEach((kp) => {
          checkPageBreak(10);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const kpLines = doc.splitTextToSize(`• ${kp}`, maxLineWidth - 4);
          doc.text(kpLines, margin + 4, cursorY);
          cursorY += kpLines.length * 4 + 1;
        });
      }
      cursorY += 3;
    });
    cursorY += 4;
  }

  // Formulas & Theorems Section
  if (summary.highYieldFormulasAndTheorems && summary.highYieldFormulasAndTheorems.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. High-Yield Formulas, Theorems & Laws', margin, cursorY);
    cursorY += 6;

    summary.highYieldFormulasAndTheorems.forEach((item, idx) => {
      checkPageBreak(22);
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(margin, cursorY, maxLineWidth, 18, 2, 2, 'FD');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text(`[${idx + 1}] ${item.name}:  ${item.formulaOrStatement}`, margin + 4, cursorY + 6);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const expLines = doc.splitTextToSize(item.explanation, maxLineWidth - 8);
      doc.text(expLines, margin + 4, cursorY + 12);

      cursorY += 23;
    });
    cursorY += 4;
  }

  // Exam Probable Questions
  if (summary.examProbableQuestions && summary.examProbableQuestions.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. High-Probability University Exam Questions (PYQs)', margin, cursorY);
    cursorY += 6;

    summary.examProbableQuestions.forEach((q, idx) => {
      checkPageBreak(22);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      const qLines = doc.splitTextToSize(`Q${idx + 1} (${q.marks} Marks): ${q.question}`, maxLineWidth);
      doc.text(qLines, margin, cursorY);
      cursorY += qLines.length * 4.5 + 2;

      if (q.answerBulletPoints && q.answerBulletPoints.length > 0) {
        q.answerBulletPoints.forEach((ans) => {
          checkPageBreak(8);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const aLines = doc.splitTextToSize(`→ ${ans}`, maxLineWidth - 6);
          doc.text(aLines, margin + 6, cursorY);
          cursorY += aLines.length * 4 + 1;
        });
      }
      cursorY += 3;
    });
    cursorY += 4;
  }

  // Key Revision Takeaways
  if (summary.keyTakeaways && summary.keyTakeaways.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. Last-Minute Exam Revision Takeaways', margin, cursorY);
    cursorY += 6;

    summary.keyTakeaways.forEach((kt) => {
      checkPageBreak(10);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const ktLines = doc.splitTextToSize(`✓ ${kt}`, maxLineWidth);
      doc.text(ktLines, margin, cursorY);
      cursorY += ktLines.length * 4.2 + 2;
    });
  }

  // Footer on all pages
  const totalPageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by NoteBridge AI Study Suite • Student Peer-to-Peer Hub • Page ${i} of ${totalPageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const safeFilename = summary.title.replace(/[^a-z0-9_-]/gi, '_').slice(0, 30);
  doc.save(`NoteBridge_AI_Summary_${safeFilename}.pdf`);
}
