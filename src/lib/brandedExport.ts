import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportCell = string | number;

const BRAND = {
  burgundy: '861823',
  burgundyDark: '5F1019',
  gold: 'DEB657',
  cream: 'FFFAF0',
  white: 'FFFFFF',
  text: '302B2B',
};

const logoUrl = '/assets/rafaelo-resort-logo.png';

async function getLogoDataUrl(): Promise<string> {
  const response = await fetch(logoUrl);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reportTitle(filename: string) {
  return filename.replace(/_/g, ' ').replace(/^Rafaelo\s+(Resort\s+)?/i, '').trim();
}

function withRowNumbers(headersInput: string[], rowsInput: ExportCell[][]) {
  if (headersInput[0] === 'Nr.') return { headers: headersInput, rows: rowsInput };
  return {
    headers: ['Nr.', ...headersInput],
    rows: rowsInput.map((row, index) => [index + 1, ...row]),
  };
}

function buildTotalsRow(headers: string[], rows: ExportCell[][]): ExportCell[] | null {
  if (rows.length === 0) return null;

  const totals: ExportCell[] = headers.map((_, colIndex) => {
    if (colIndex === 0 && headers[0] === 'Nr.') return '';
    const allNumeric = rows.every((row) => typeof row[colIndex] === 'number');
    if (!allNumeric) return '';
    const sum = rows.reduce((acc, row) => acc + (row[colIndex] as number), 0);
    return Math.round(sum * 100) / 100;
  });

  const hasAnySum = totals.some((value) => typeof value === 'number');
  if (!hasAnySum) return null;

  const labelIndex = totals.findIndex((value) => value === '');
  if (labelIndex !== -1) totals[labelIndex] = 'TOTALI';

  return totals;
}

export async function exportBrandedExcel(
  filename: string,
  headersRaw: string[],
  rowsRaw: ExportCell[][]
) {
  const { headers, rows } = withRowNumbers(headersRaw, rowsRaw);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Rafaelo Resort HR - ARSELA SHTJEFNI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Raporti', {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: {
      orientation: headers.length > 6 ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  const logoDataUrl = await getLogoDataUrl();
  const logoId = workbook.addImage({ base64: logoDataUrl, extension: 'png' });
  sheet.addImage(logoId, { tl: { col: 0.15, row: 0.1 }, ext: { width: 58, height: 82 } });

  const lastColumn = Math.max(headers.length, 2);
  sheet.mergeCells(1, 2, 1, lastColumn);
  sheet.getCell(1, 2).value = 'RAFAELO RESORT';
  sheet.getCell(1, 2).font = { bold: true, size: 20, color: { argb: BRAND.burgundy } };
  sheet.getCell(1, 2).alignment = { vertical: 'middle' };

  sheet.mergeCells(2, 2, 2, lastColumn);
  sheet.getCell(2, 2).value = reportTitle(filename);
  sheet.getCell(2, 2).font = { bold: true, size: 13, color: { argb: BRAND.text } };

  sheet.mergeCells(3, 2, 3, lastColumn);
  sheet.getCell(3, 2).value = `Gjeneruar më: ${new Intl.DateTimeFormat('sq-AL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())} | Administratore: ARSELA SHTJEFNI`;
  sheet.getCell(3, 2).font = { italic: true, size: 9, color: { argb: '6B6262' } };
  sheet.getRow(1).height = 28;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 20;
  sheet.getRow(4).height = 8;

  const headerRow = sheet.getRow(5);
  headerRow.values = headers;
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.burgundy } };
    cell.font = { bold: true, color: { argb: BRAND.white }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: BRAND.gold } } };
  });

  rows.forEach((row, index) => {
    const excelRow = sheet.addRow(row);
    excelRow.height = 23;
    excelRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? BRAND.cream : BRAND.white },
      };
      cell.font = { size: 9, color: { argb: BRAND.text } };
      cell.alignment = colNumber === 1
        ? { vertical: 'middle', horizontal: 'center', wrapText: true }
        : { vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'hair', color: { argb: 'D8CBC3' } } };
      if (colNumber !== 1 && typeof cell.value === 'number') cell.numFmt = '#,##0.00';
    });
  });

  const totals = buildTotalsRow(headers, rows);
  if (totals) {
    const totalsRow = sheet.addRow(totals);
    totalsRow.height = 25;
    totalsRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.gold } };
      cell.font = { bold: true, size: 9.5, color: { argb: BRAND.burgundyDark } };
      cell.alignment = colNumber === 1
        ? { vertical: 'middle', horizontal: 'center', wrapText: true }
        : { vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'medium', color: { argb: BRAND.burgundy } } };
      if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
    });
  }

  const widthSourceRows = totals ? [...rows, totals] : rows;
  headers.forEach((header, index) => {
    const values = widthSourceRows.map((row) => String(row[index] ?? ''));
    const longest = Math.max(header.length, ...values.map((value) => value.length));
    sheet.getColumn(index + 1).width = index === 0 ? 6 : Math.min(34, Math.max(12, longest + 2));
  });
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + rows.length, column: headers.length } };
  sheet.headerFooter.oddFooter = '&LRAFAELO RESORT - HR&CKonfidenciale&RPage &P / &N';

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${filename}.xlsx`
  );
}

export async function exportBrandedPdf(
  filename: string,
  headersRaw: string[],
  rowsRaw: ExportCell[][]
) {
  const { headers, rows } = withRowNumbers(headersRaw, rowsRaw);
  const landscape = headers.length > 6;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await getLogoDataUrl();

  doc.setFillColor(134, 24, 35);
  doc.rect(0, 0, pageWidth, 31, 'F');
  doc.addImage(logoDataUrl, 'PNG', 10, 3, 14, 21);
  doc.setTextColor(222, 182, 87);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('RAFAELO RESORT', 29, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(reportTitle(filename), 29, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Gjeneruar: ${new Date().toLocaleString('sq-AL')} | ARSELA SHTJEFNI`, pageWidth - 10, 25, { align: 'right' });

  const totals = buildTotalsRow(headers, rows);

  autoTable(doc, {
    startY: 37,
    head: [headers],
    body: rows.map((row) => row.map((value) => String(value ?? ''))),
    foot: totals ? [totals.map((value) => String(value ?? ''))] : undefined,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: headers.length > 6 ? 6.5 : 8, cellPadding: 2, textColor: [48, 43, 43], lineColor: [220, 208, 196], lineWidth: 0.15 },
    headStyles: { fillColor: [134, 24, 35], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', lineColor: [222, 182, 87], lineWidth: 0.35 },
    footStyles: { fillColor: [222, 182, 87], textColor: [95, 16, 25], fontStyle: 'bold', lineColor: [134, 24, 35], lineWidth: 0.35 },
    columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
    alternateRowStyles: { fillColor: [255, 250, 240] },
    margin: { top: 37, right: 10, bottom: 14, left: 10 },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(222, 182, 87);
      doc.line(10, pageHeight - 10, pageWidth - 10, pageHeight - 10);
      doc.setFontSize(7);
      doc.setTextColor(110, 96, 88);
      doc.text('Rafaelo Resort - Sistem i Burimeve Njerëzore - Dokument konfidencial', 10, pageHeight - 6);
      doc.text(`Faqja ${doc.getNumberOfPages()}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
    },
  });

  doc.save(`${filename}.pdf`);
}
