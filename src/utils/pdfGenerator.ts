import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import { NoteItem, PurchaseOrder } from '../types';
import { getNotePdfData } from './storage';

/**
 * Converts a File or Blob into a Base64 data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts page count and info from an uploaded PDF file
 */
export async function getPdfFileInfo(file: File): Promise<{ totalPages: number; fileSizeMb: number }> {
  const fileSizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();
    return {
      totalPages: Math.max(1, totalPages),
      fileSizeMb: Math.max(0.1, fileSizeMb),
    };
  } catch (e) {
    console.warn('Could not read page count directly from PDF, estimating:', e);
    return {
      totalPages: Math.max(5, Math.round(fileSizeMb * 4)),
      fileSizeMb: Math.max(0.1, fileSizeMb),
    };
  }
}

/**
 * Converts a clean ArrayBuffer or DataURL to an unwatermarked clean PDF Blob
 */
async function getCleanPdfBlob(
  pdfBufferOrDataUrl: ArrayBuffer | string
): Promise<Blob> {
  let arrayBuffer: ArrayBuffer;
  if (typeof pdfBufferOrDataUrl === 'string') {
    // Base64 Data URL to ArrayBuffer
    const base64Clean = pdfBufferOrDataUrl.replace(/^data:application\/pdf;base64,/, '');
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    arrayBuffer = bytes.buffer;
  } else {
    arrayBuffer = pdfBufferOrDataUrl;
  }

  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Generates a clean, rich, 100% valid multi-page PDF document for text/structured notes without any watermark
 */
function generateStructuredNotePdf(
  note: NoteItem,
  order?: Partial<PurchaseOrder>
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const orderNumber = order?.orderNumber || `NB-${Date.now().toString().slice(-6)}`;

  const drawPageFrame = (pageIdx: number, totalEstPages: number) => {
    // Header Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('NoteBridge Verified Academic Notes', 14, 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Reference #${orderNumber}`, pageWidth - 14, 10.5, { align: 'right' });

    // Footer Bar
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NoteBridge Official Academic Notes • Clean Copy', 14, pageHeight - 7);
    doc.text(`Page ${pageIdx} of ${totalEstPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  };

  // --- PAGE 1: COVER & SYLLABUS BREAKDOWN ---
  drawPageFrame(1, Math.max(3, (note.samplePages?.length || 2) + 1));

  // Subject Title Header Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 25, pageWidth - 28, 48, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 25, pageWidth - 28, 48, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(`${(note.university || 'University').toUpperCase()} • ${note.degree || 'Degree'} • SEMESTER ${note.semester}`, 20, 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  const splitTitle = doc.splitTextToSize(note.title, pageWidth - 45);
  doc.text(splitTitle, 20, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Subject: ${note.subject} | Units: ${note.unitsCovered || 'All Modules'}`, 20, 56);
  doc.text(`Author: ${note.sellerName} (${note.sellerCollege || 'Verified Senior'}) • Price: Rs.${note.price}`, 20, 64);

  let curY = 82;

  // AI / Executive Synopsis Box
  if (note.aiSynopsis || note.description) {
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.roundedRect(14, curY, pageWidth - 28, 38, 2, 2, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(14, curY, pageWidth - 28, 38, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text('Key Syllabus Summary & Exam Highlights', 20, curY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const summaryText = note.aiSynopsis || note.description;
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 42);
    doc.text(splitSummary.slice(0, 4), 20, curY + 16);

    curY += 46;
  }

  // Text Content or Unit 1 Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Module 1: Core Definitions & High-Weightage University Concepts', 14, curY);
  curY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const bodyContent = note.textContent || 
    `This official study guide covers comprehensive derivations, circuit/flow schematics, and model step-by-step solved university questions for ${note.subject}.\n\n` +
    `Key Formulae & Axioms:\n` +
    `• Standard form equation and convergence criteria\n` +
    `• Step-by-step proofs for recurring 8-mark end-semester questions\n` +
    `• Essential time-saving calculation shortcuts and verified notes by ${note.sellerName}.`;

  const splitBody = doc.splitTextToSize(bodyContent, pageWidth - 28);
  doc.text(splitBody.slice(0, 16), 14, curY);

  // --- SUBSEQUENT PAGES: DETAILED NOTES & SOLVED SAMPLES ---
  const samplePages = note.samplePages || [];
  let pageNumber = 2;
  const totalPagesCount = Math.max(pageNumber, samplePages.length + 1);

  samplePages.forEach((sp) => {
    doc.addPage();
    drawPageFrame(pageNumber, totalPagesCount);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(sp.title || `Unit ${pageNumber}: Solved Numerical & Model Questions`, 14, 28);

    let pageY = 36;
    sp.sections.forEach((sec) => {
      if (sec.heading) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 58, 138); // blue-900
        doc.text(sec.heading, 14, pageY);
        pageY += 6;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const sBody = doc.splitTextToSize(sec.body, pageWidth - 28);
      doc.text(sBody, 14, pageY);
      pageY += (sBody.length * 4.8) + 4;

      if (sec.formula) {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(14, pageY, pageWidth - 28, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(146, 64, 14); // amber-800
        doc.text(`Key Equation: ${sec.formula}`, 18, pageY + 8);
        pageY += 18;
      }

      if (sec.pyqAlert) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28); // red-700
        doc.text(`★ ${sec.pyqAlert}`, 14, pageY);
        pageY += 6;
      }

      if (sec.diagramDescription) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, pageY, pageWidth - 28, 18, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, pageY, pageWidth - 28, 18, 2, 2, 'S');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`[Diagram Schematic]: ${sec.diagramDescription}`, 18, pageY + 10);
        pageY += 22;
      }

      pageY += 4;
    });

    pageNumber++;
  });

  const pdfOutput = doc.output('blob');
  return pdfOutput;
}

export async function getNoteRenderablePdfUrl(note: NoteItem): Promise<string> {
  let sourceData = note.pdfData || (note.pdfUrl && note.pdfUrl.startsWith('data:application/pdf') ? note.pdfUrl : undefined);
  if (!sourceData && note.id) {
    sourceData = (await getNotePdfData(note.id)) || undefined;
  }
  
  if (!sourceData) {
    const generatedBlob = generateStructuredNotePdf(note);
    return URL.createObjectURL(generatedBlob);
  }

  if (sourceData.startsWith('blob:') || sourceData.startsWith('http://') || sourceData.startsWith('https://')) {
    return sourceData;
  }

  try {
    const base64Clean = sourceData.replace(/^data:application\/pdf;base64,/, '');
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to create Blob URL for PDF:', err);
    return sourceData;
  }
}

/**
 * Main function: Downloads a valid, fully rendered & watermarked PDF
 */
/**
 * Main function: Downloads a valid, fully rendered clean PDF without watermarks for purchased notes
 */
export async function downloadWatermarkedPdf(
  order: Partial<PurchaseOrder> | undefined,
  note: NoteItem
): Promise<void> {
  try {
    let pdfBlob: Blob;

    // Check if the note has a real uploaded PDF stored (directly, in cache, or in IndexedDB)
    let sourceData = note.pdfData || (note.pdfUrl && note.pdfUrl.startsWith('data:application/pdf') ? note.pdfUrl : undefined);
    if (!sourceData && note.id) {
      sourceData = (await getNotePdfData(note.id)) || undefined;
    }

    if (sourceData) {
      pdfBlob = await getCleanPdfBlob(sourceData);
    } else {
      // Generate a structured, complete, valid multi-page clean PDF document
      pdfBlob = generateStructuredNotePdf(note, order);
    }

    const cleanFilename = `${(note.subject || note.title || 'Notes').replace(/[^a-zA-Z0-9]/g, '_')}_NoteBridge.pdf`;
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (error) {
    console.error('Error generating PDF download:', error);
    // Fallback: Generate structured clean PDF
    const fallbackBlob = generateStructuredNotePdf(note, order);
    const url = URL.createObjectURL(fallbackBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(note.subject || note.title || 'Notes').replace(/[^a-zA-Z0-9]/g, '_')}_NoteBridge.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

export const downloadNotePdf = downloadWatermarkedPdf;
