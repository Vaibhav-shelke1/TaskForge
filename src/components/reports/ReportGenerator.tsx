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
      const pw = doc.internal.pageSize.getWidth();   // 210
      const ph = doc.internal.pageSize.getHeight();  // 297

      // ── colour palette (solid only — jsPDF has no transparency) ──────────
      const C = {
        ink:      [15,  23,  42]  as [number,number,number],  // slate-900
        muted:    [100, 116, 139] as [number,number,number],  // slate-500
        border:   [226, 232, 240] as [number,number,number],  // slate-200
        surface:  [248, 250, 252] as [number,number,number],  // slate-50
        white:    [255, 255, 255] as [number,number,number],
        violet:   [109,  40, 217] as [number,number,number],  // violet-700
        indigo:   [ 79,  70, 229] as [number,number,number],  // indigo-600
        emerald:  [ 5,  150, 105] as [number,number,number],  // emerald-600
        amber:    [217, 119,   6] as [number,number,number],  // amber-600
        red:      [220,  38,  38] as [number,number,number],  // red-600
        redSurf:  [254, 242, 242] as [number,number,number],  // red-50
        violSurf: [245, 243, 255] as [number,number,number],  // violet-50
      };

      const bold   = () => doc.setFont('helvetica', 'bold');
      const normal = () => doc.setFont('helvetica', 'normal');
      const color  = (c: [number,number,number]) => doc.setTextColor(...c);
      const fill   = (c: [number,number,number]) => doc.setFillColor(...c);
      const stroke = (c: [number,number,number]) => doc.setDrawColor(...c);

      // ── HEADER ────────────────────────────────────────────────────────────
      //  Dark navy band, full width
      fill(C.ink);
      doc.rect(0, 0, pw, 42, 'F');

      //  Violet left accent stripe
      fill(C.violet);
      doc.rect(0, 0, 5, 42, 'F');

      //  "WORKLOGS" large title
      color(C.white);
      bold();
      doc.setFontSize(26);
      doc.text('WORKLOGS', 14, 22);

      //  Subtitle
      normal();
      doc.setFontSize(9);
      color([180, 185, 200] as unknown as [number,number,number]);
      doc.text('Time & Work Report  ·  TrackForge', 14, 31);

      //  Period pill (right)
      const period = `${formatDate(report.dateRange.from)}  –  ${formatDate(report.dateRange.to)}`;
      fill(C.violet);
      doc.roundedRect(pw - 75, 13, 62, 16, 3, 3, 'F');
      color(C.white);
      bold();
      doc.setFontSize(7.5);
      doc.text('REPORT PERIOD', pw - 44, 20, { align: 'center' });
      normal();
      doc.setFontSize(7.5);
      doc.text(period, pw - 44, 26, { align: 'center' });

      let y = 52;

      // ── PARTIES ROW ───────────────────────────────────────────────────────
      const halfW = (pw - 28 - 4) / 2;
      const boxH  = 28;

      // Developer box
      fill(C.surface);
      stroke(C.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, halfW, boxH, 2, 2, 'FD');
      fill(C.violet);
      doc.roundedRect(14, y, 3, boxH, 1, 1, 'F');
      color(C.muted); bold(); doc.setFontSize(7);
      doc.text('FROM / DEVELOPER', 21, y + 8);
      color(C.ink); bold(); doc.setFontSize(9.5);
      doc.text(report.developer?.name ?? '', 21, y + 16);
      color(C.muted); normal(); doc.setFontSize(8);
      doc.text(report.developer?.email ?? '', 21, y + 22);

      // Client box
      const cx2 = 14 + halfW + 4;
      fill(C.surface);
      stroke(C.border);
      doc.roundedRect(cx2, y, halfW, boxH, 2, 2, 'FD');
      fill(C.indigo);
      doc.roundedRect(cx2, y, 3, boxH, 1, 1, 'F');
      color(C.muted); bold(); doc.setFontSize(7);
      doc.text('TO / CLIENT', cx2 + 7, y + 8);
      color(C.ink); bold(); doc.setFontSize(9.5);
      doc.text(report.client?.name ?? 'All Clients', cx2 + 7, y + 16);
      color(C.muted); normal(); doc.setFontSize(8);
      doc.text(
        report.client?.company
          ? `${report.client.company}  ·  ${report.client.email ?? ''}`
          : report.client?.email ?? '',
        cx2 + 7, y + 22
      );

      y += boxH + 8;

      // ── SUMMARY STRIP ─────────────────────────────────────────────────────
      fill(C.ink);
      doc.rect(14, y, pw - 28, 26, 'F');

      const sumItems = [
        { label: 'TOTAL HOURS',  value: formatHours(report.summary.totalHours),    col: C.violet },
        { label: 'TASKS WORKED', value: String(report.summary.totalTasks),          col: C.white },
        { label: 'BILLABLE',     value: formatHours(report.summary.billableHours),  col: C.emerald },
        { label: 'NON-BILLABLE', value: formatHours(report.summary.nonBillableHours), col: C.muted },
      ];
      const colW = (pw - 28) / 4;
      sumItems.forEach((item, i) => {
        const sx = 14 + i * colW;
        if (i > 0) {
          // vertical divider
          fill([35, 45, 65] as unknown as [number,number,number]);
          doc.rect(sx, y + 4, 0.3, 18, 'F');
        }
        bold(); doc.setFontSize(12);
        color(item.col);
        doc.text(item.value, sx + colW / 2, y + 14, { align: 'center' });
        normal(); doc.setFontSize(6.5);
        color(C.muted);
        doc.text(item.label, sx + colW / 2, y + 21, { align: 'center' });
      });

      y += 34;

      // ── TASK SECTIONS ─────────────────────────────────────────────────────
      for (const entry of report.tasks) {
        const task = entry.task;
        const pct   = getBudgetPercentage(entry.totalHours, task.budgetHours);
        const isOver = entry.totalHours > task.budgetHours;
        const accentCol: [number,number,number] = isOver ? C.red : C.violet;
        const surfCol:   [number,number,number] = isOver ? C.redSurf : C.violSurf;

        if (y > ph - 65) { doc.addPage(); y = 18; }

        // Task header row
        fill(surfCol);
        stroke(C.border);
        doc.setLineWidth(0.3);
        doc.rect(14, y, pw - 28, 18, 'FD');
        fill(accentCol);
        doc.rect(14, y, 4, 18, 'F');

        // Task title
        const titleStr = doc.splitTextToSize(task.title, pw - 28 - 55)[0] as string;
        bold(); doc.setFontSize(9.5);
        color(C.ink);
        doc.text(titleStr, 22, y + 7);

        // Budget meta
        normal(); doc.setFontSize(7.5);
        color(C.muted);
        doc.text(
          `Budget ${formatHours(task.budgetHours)}  ·  Logged ${formatHours(entry.totalHours)}  ·  ${pct}%${isOver ? '  ⚠ over budget' : ''}`,
          22, y + 14
        );

        // Hours pill (right)
        fill(accentCol);
        doc.roundedRect(pw - 46, y + 3, 32, 12, 2, 2, 'F');
        bold(); doc.setFontSize(9); color(C.white);
        doc.text(formatHours(entry.totalHours), pw - 30, y + 11, { align: 'center' });

        y += 20;

        // Progress bar
        fill(C.border);
        doc.rect(14, y, pw - 28, 2.5, 'F');
        fill(accentCol);
        doc.rect(14, y, (pw - 28) * Math.min(pct / 100, 1), 2.5, 'F');
        y += 6;

        // Logs table
        const tableRows = entry.logs.map((l) => [
          formatDate(l.date),
          formatHours(l.hours),
          typeof l.developerId === 'object' ? (l.developerId as { name: string }).name : '',
          (l.note as string) || '—',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Date', 'Hours', 'Developer', 'Work Description']],
          body: tableRows,
          theme: 'grid',
          headStyles: {
            fillColor: C.ink,
            textColor: C.white,
            fontSize: 8,
            fontStyle: 'bold',
            cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
          },
          bodyStyles: {
            fontSize: 8,
            textColor: C.ink,
            cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          },
          alternateRowStyles: { fillColor: C.surface },
          columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
            2: { cellWidth: 38 },
            3: { cellWidth: 'auto' },
          },
          margin: { left: 14, right: 14 },
          tableLineColor: C.border,
          tableLineWidth: 0.25,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      if (report.tasks.length === 0) {
        color(C.muted); normal(); doc.setFontSize(10);
        doc.text('No time logs found for the selected period.', pw / 2, y + 20, { align: 'center' });
      }

      // ── FOOTER on every page ──────────────────────────────────────────────
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // thin top rule
        fill(C.border);
        doc.rect(0, ph - 14, pw, 0.4, 'F');
        // footer text
        normal(); doc.setFontSize(7.5); color(C.muted);
        doc.text('Generated by TrackForge', 14, ph - 6);
        doc.text(`Page ${i} of ${totalPages}`, pw - 14, ph - 6, { align: 'right' });
        doc.text(
          `Worklogs  ·  ${formatDate(report.dateRange.from)} – ${formatDate(report.dateRange.to)}`,
          pw / 2, ph - 6, { align: 'center' }
        );
      }

      const slug = report.client?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'all';
      doc.save(`worklogs-${slug}-${filters.from}-${filters.to}.pdf`);
      toast.success('PDF downloaded!');
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
