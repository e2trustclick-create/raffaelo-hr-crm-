'use client';

import { Employee, PayrollRecord } from '@/lib/types';
import { formatMonthName, formatCurrency } from '@/lib/dateUtils';
import { Printer } from 'lucide-react';

export function PaySlipModal({ payroll, employee, onClose }: { payroll: PayrollRecord; employee: Employee; onClose: () => void }) {
  const handlePrint = () => {
    const payslip = document.getElementById('printable-payslip');
    if (!payslip) return;

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('title', 'Printimi i fletëpagesës');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDocument = printFrame.contentDocument;
    if (!frameDocument) {
      printFrame.remove();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((element) => element.outerHTML)
      .join('\n');

    frameDocument.open();
    frameDocument.write(`<!doctype html>
      <html lang="sq">
        <head>
          <meta charset="utf-8" />
          <title>Fletëpagesa - ${employee.firstName} ${employee.lastName}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            html, body {
              width: auto !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #fff !important;
            }
            body * { visibility: visible !important; }
            #printable-payslip {
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>${payslip.outerHTML}</body>
      </html>`);
    frameDocument.close();

    printFrame.onload = async () => {
      const images = Array.from(frameDocument.images);
      await Promise.all(images.map((image) => image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          })));

      const frameWindow = printFrame.contentWindow;
      if (!frameWindow) return;
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => printFrame.remove(), 60_000);
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 my-6 text-slate-900">
        <div id="printable-payslip" className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b-2 border-amber-500">
            <div className="flex items-center gap-3">
              <img src="/assets/rafaelo-resort-logo.png" alt="Rafaelo Resort" className="w-14 h-20 object-contain" />
              <div>
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight">RAFAELO RESORT</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Shëngjin, Lezhë, Shqipëri</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-rose-700 uppercase block tracking-wider">Fletëpagesë Mujore</span>
              <span className="text-sm font-extrabold">{formatMonthName(payroll.month)}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Punonjësi:</span>
              <strong className="text-slate-900 text-sm">{employee.firstName} {employee.lastName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pozicioni & Departamenti:</span>
              <span className="font-semibold text-slate-800">{employee.position} ({employee.department})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telefoni:</span>
              <span className="font-mono text-slate-700">{employee.phone}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 p-2.5 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
              <span>Përshkrimi i Zërit</span>
              <span>Vlera</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-600">Paga Mujore Bazë</span>
                <span className="font-bold text-slate-900">{formatCurrency(payroll.monthlySalary)}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-600">Ditë Totale në Muaj</span>
                <span className="font-semibold">{payroll.workingDaysStandard} ditë</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-600">Ditë të Punuara Realisht</span>
                <span className="font-bold text-emerald-700">{payroll.daysWorked} ditë</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-600">Paga Ditore e Llogaritur</span>
                <span className="font-mono">~{formatCurrency(payroll.dailyRate)}/ditë</span>
              </div>
              <div className="p-2.5 flex justify-between bg-amber-50/50 text-amber-900">
                <span>Leje pa Pagesë (Zbriten nga paga)</span>
                <span className="font-bold">{payroll.unpaidLeaveDays} ditë</span>
              </div>
              <div className="p-2.5 flex justify-between bg-rose-50 text-rose-900">
                <span className="font-bold">Zbritja Totale (Paga ditore × Ditë leje)</span>
                <span className="font-bold">-{formatCurrency(payroll.deductions)}</span>
              </div>
            </div>
            <div className="bg-rose-50 p-3.5 border-t-2 border-rose-600 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-extrabold text-rose-900 block">PAGA PËRFUNDIMTARE NETO</span>
                <span className="text-[10px] text-rose-700">Për likuidim në llogari bankare</span>
              </div>
              <span className="text-lg font-black text-rose-900">{formatCurrency(payroll.finalSalary)}</span>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-4 text-[11px] text-slate-500 border-t border-slate-200">
            <div>
              <p className="font-bold text-slate-700">Miratuar nga HR:</p>
              <div className="h-10 mt-1 border-b border-slate-300 border-dashed flex items-end"><span className="italic text-[10px] text-slate-400">Vula & Nënshkrimi HR</span></div>
            </div>
            <div>
              <p className="font-bold text-slate-700">Nënshkrimi i Punonjësit:</p>
              <div className="h-10 mt-1 border-b border-slate-300 border-dashed flex items-end"><span className="italic text-[10px] text-slate-400">Data: _______________</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Printer className="w-3.5 h-3.5" />
            <span>Printo / Ruaj PDF</span>
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer">Mbyll</button>
        </div>
      </div>
    </div>
  );
}
