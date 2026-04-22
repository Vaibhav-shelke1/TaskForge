'use client';

import { useState } from 'react';
import { FileDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { IUser, IReport } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatHours, toISODateString, getBudgetPercentage } from '@/lib/utils';
import { subDays } from 'date-fns';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';

interface ReportGeneratorProps {
  clients: IUser[];
}

export default function ReportGenerator({ clients }: ReportGeneratorProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<IReport | null>(null);

  const [filters, setFilters] = useState({
    clientId: '',
    preset: '7',
    from: toISODateString(subDays(new Date(), 7)),
    to: toISODateString(new Date()),
  });

  const applyPreset = (days: string) => {
    if (days === 'custom') {
      setFilters((f) => ({ ...f, preset: 'custom' }));
      return;
    }
    const d = parseInt(days);
    setFilters((f) => ({
      ...f,
      preset: days,
      from: toISODateString(subDays(new Date(), d)),
      to: toISODateString(new Date()),
    }));
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        ...(filters.clientId && { clientId: filters.clientId }),
      });
      const res = await apiClient.get(`/reports?${params}`);
      if (res.data.success) setReport(res.data.data as IReport);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      // ── HEADER BAND ──────────────────────────────────────────────────────
      // Violet → indigo gradient simulation (two rects blended)
      doc.setFillColor(109, 40, 217);   // violet-700
      doc.rect(0, 0, pw, 52, 'F');
      doc.setFillColor(79, 70, 229);    // indigo-600 overlay right side
      doc.rect(pw * 0.5, 0, pw * 0.5, 52, 'F');

      // Decorative circle (top-right)
      doc.setFillColor(255, 255, 255, 0.05);
      doc.circle(pw - 10, -10, 40, 'F');

      // Logo mark — small square with "TF"
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 12, 16, 16, 3, 3, 'F');
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TF', 22, 23, { align: 'center' });

      // "Worklogs" title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Worklogs', 35, 24);

      // Subtitle
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 255);
      doc.text('TrackForge  •  Time & Work Report', 35, 32);

      // Period badge (right side)
      doc.setFillColor(255, 255, 255, 0.15);
      doc.roundedRect(pw - 80, 14, 66, 18, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('PERIOD', pw - 47, 21, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${formatDate(report.dateRange.from)} – ${formatDate(report.dateRange.to)}`,
        pw - 47, 28, { align: 'center' }
      );

      let y = 62;

      // ── CLIENT / DEVELOPER META ──────────────────────────────────────────
      const metaBoxH = report.client ? 26 : 16;
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(14, y, pw - 28, metaBoxH, 3, 3, 'F');
      doc.setFillColor(109, 40, 217);
      doc.roundedRect(14, y, 3, metaBoxH, 1, 1, 'F');

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 130);
      doc.setFont('helvetica', 'bold');
      doc.text('DEVELOPER', 22, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 50);
      doc.text(`${report.developer?.name ?? ''}  <${report.developer?.email ?? ''}>`, 22, y + 13);

      if (report.client) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 130);
        doc.text('CLIENT', pw / 2, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 50);
        doc.text(
          `${report.client.name}${report.client.company ? `  •  ${report.client.company}` : ''}`,
          pw / 2, y + 13
        );
        doc.setTextColor(120);
        doc.text(report.client.email ?? '', pw / 2, y + 19);
      }

      y += metaBoxH + 10;

      // ── SUMMARY CARDS ────────────────────────────────────────────────────
      const cards = [
        { label: 'Total Hours', value: formatHours(report.summary.totalHours), color: [109, 40, 217] as [number,number,number] },
        { label: 'Tasks Worked', value: String(report.summary.totalTasks), color: [79, 70, 229] as [number,number,number] },
        { label: 'Billable', value: formatHours(report.summary.billableHours), color: [16, 185, 129] as [number,number,number] },
        { label: 'Non-Billable', value: formatHours(report.summary.nonBillableHours), color: [100, 116, 139] as [number,number,number] },
      ];
      const cardW = (pw - 28 - 9) / 4;
      cards.forEach((card, i) => {
        const cx = 14 + i * (cardW + 3);
        doc.setFillColor(248, 248, 252);
        doc.roundedRect(cx, y, cardW, 22, 2, 2, 'F');
        doc.setFillColor(...card.color);
        doc.roundedRect(cx, y + 18, cardW, 4, 1, 1, 'F');
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...card.color);
        doc.text(card.value, cx + cardW / 2, y + 12, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(card.label, cx + cardW / 2, y + 17.5, { align: 'center' });
      });
      y += 32;

      // ── TASK SECTIONS ────────────────────────────────────────────────────
      for (const entry of report.tasks) {
        const task = entry.task;
        const pct = getBudgetPercentage(entry.totalHours, task.budgetHours);
        const isOver = entry.totalHours > task.budgetHours;

        // Page break if needed
        if (y > ph - 60) { doc.addPage(); y = 20; }

        // Task header strip
        doc.setFillColor(isOver ? 254 : 245, isOver ? 242 : 243, isOver ? 242 : 255);
        doc.roundedRect(14, y, pw - 28, 20, 2, 2, 'F');
        // Left accent bar
        doc.setFillColor(isOver ? 239 : 109, isOver ? 68 : 40, isOver ? 68 : 217);
        doc.roundedRect(14, y, 3, 20, 1, 1, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isOver ? 185 : 30, isOver ? 28 : 28, isOver ? 28 : 50);
        const titleMaxWidth = pw - 28 - 50;
        const titleText = doc.splitTextToSize(task.title, titleMaxWidth)[0];
        doc.text(titleText, 21, y + 8);

        // Hours badge (right)
        doc.setFillColor(isOver ? 239 : 109, isOver ? 68 : 40, isOver ? 68 : 217);
        doc.roundedRect(pw - 50, y + 3, 36, 14, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(formatHours(entry.totalHours), pw - 32, y + 12, { align: 'center' });

        // Budget info
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        const budgetText = `Budget: ${formatHours(task.budgetHours)}  |  Logged: ${formatHours(entry.totalHours)}  |  ${pct}%${isOver ? '  ⚠ Over budget' : ''}`;
        doc.text(budgetText, 21, y + 16);

        y += 24;

        // Progress bar
        doc.setFillColor(230, 230, 240);
        doc.roundedRect(14, y, pw - 28, 3, 1, 1, 'F');
        const barColor: [number, number, number] = isOver ? [239, 68, 68] : pct >= 80 ? [245, 158, 11] : [109, 40, 217];
        doc.setFillColor(...barColor);
        doc.roundedRect(14, y, (pw - 28) * Math.min(pct / 100, 1), 3, 1, 1, 'F');
        y += 7;

        // Logs table
        const tableData = entry.logs.map((l) => [
          formatDate(l.date),
          formatHours(l.hours),
          typeof l.developerId === 'object' ? (l.developerId as { name: string }).name : '',
          (l.note as string) || '—',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Date', 'Hours', 'Developer', 'Work Description']],
          body: tableData,
          theme: 'plain',
          headStyles: {
            fillColor: [109, 40, 217],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 70],
            cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          },
          alternateRowStyles: { fillColor: [248, 248, 252] },
          columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 38 },
            3: { cellWidth: 'auto' },
          },
          margin: { left: 14, right: 14 },
          tableLineColor: [220, 220, 235],
          tableLineWidth: 0.1,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      if (report.tasks.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('No time logs found for the selected period.', pw / 2, y + 20, { align: 'center' });
      }

      // ── FOOTER ───────────────────────────────────────────────────────────
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Footer bar
        doc.setFillColor(245, 245, 250);
        doc.rect(0, ph - 14, pw, 14, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by TrackForge', 14, ph - 5.5);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pw - 14, ph - 5.5, { align: 'right' }
        );
        doc.setFontSize(7);
        doc.setTextColor(180);
        doc.text(
          `Worklogs  •  ${formatDate(report.dateRange.from)} – ${formatDate(report.dateRange.to)}`,
          pw / 2, ph - 5.5, { align: 'center' }
        );
      }

      const clientSlug = report.client?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'all';
      doc.save(`worklogs-${clientSlug}-${filters.from}-${filters.to}.pdf`);
      toast.success('Worklogs PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          Report Filters
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {['7', '10', '20', 'custom'].map((d) => (
            <button
              key={d}
              onClick={() => applyPreset(d)}
              className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 border ${
                filters.preset === d
                  ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/20'
              }`}
            >
              {d === 'custom' ? 'Custom' : `Last ${d} days`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {user?.role === 'developer' && (
            <Select
              label="Client"
              value={filters.clientId}
              onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value }))}
              placeholder="All Clients"
              options={clients.map((c) => ({ value: c._id, label: c.name }))}
            />
          )}
          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, preset: 'custom' }))}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, preset: 'custom' }))}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={fetchReport} loading={loading} className="flex-1">
            Generate Report
          </Button>
          {report && (
            <Button
              onClick={downloadPDF}
              loading={generating}
              variant="ghost"
              icon={<FileDown className="w-4 h-4" />}
            >
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Report Preview */}
      {report && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Hours', value: formatHours(report.summary.totalHours), color: 'text-violet-400' },
              { label: 'Tasks Worked', value: report.summary.totalTasks, color: 'text-white' },
              { label: 'Billable', value: formatHours(report.summary.billableHours), color: 'text-emerald-400' },
              { label: 'Non-Billable', value: formatHours(report.summary.nonBillableHours), color: 'text-slate-400' },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Task Details */}
          {report.tasks.map((entry) => {
            const task = entry.task;
            const isOver = entry.totalHours > task.budgetHours;
            const pct = getBudgetPercentage(entry.totalHours, task.budgetHours);

            return (
              <div
                key={task._id}
                className={`bg-white/[0.04] border rounded-2xl overflow-hidden ${
                  isOver ? 'border-red-500/30' : 'border-white/[0.08]'
                }`}
              >
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Budget: {formatHours(task.budgetHours)} | Logged: {formatHours(entry.totalHours)} | {pct}%
                        {isOver && (
                          <span className="ml-2 text-red-400 font-medium">
                            ⚠ Over by {formatHours(entry.totalHours - task.budgetHours)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-violet-400'}`}>
                      {formatHours(entry.totalHours)}
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-violet-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        {['Date', 'Hours', 'Work Description'].map((h) => (
                          <th key={h} className="px-5 py-2.5 text-left text-xs text-slate-500 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entry.logs.map((log) => (
                        <tr key={log._id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {formatDate(log.date)}
                          </td>
                          <td className="px-5 py-3 text-xs text-white font-medium whitespace-nowrap">
                            {formatHours(log.hours)}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-400">
                            {log.note || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {report.tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No time logs found for the selected period.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
