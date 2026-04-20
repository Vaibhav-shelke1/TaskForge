'use client';

import { useState } from 'react';
import { FileDown, Calendar, Loader2 } from 'lucide-react';
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
      if (res.data.success) {
        setReport(res.data.data as IReport);
      }
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

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('TrackForge', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Time & Task Report', 14, 30);
      doc.text(`Period: ${formatDate(report.dateRange.from)} – ${formatDate(report.dateRange.to)}`, 14, 38);
      y = 60;

      // Client & Developer Info
      doc.setTextColor(30, 30, 60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Details', 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const infoLines = [
        ['Client:', report.client?.name ?? 'All Clients', 'Developer:', report.developer?.name ?? ''],
        ['Company:', report.client?.company ?? '—', 'Email:', report.developer?.email ?? ''],
      ];

      infoLines.forEach((row) => {
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(row[1], 40, y);
        doc.setFont('helvetica', 'bold');
        doc.text(row[2], 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text(row[3], 135, y);
        y += 6;
      });

      y += 6;

      // Summary Box
      doc.setFillColor(245, 247, 255);
      doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, 'F');
      const summaryData = [
        { label: 'Total Hours', value: formatHours(report.summary.totalHours) },
        { label: 'Total Tasks', value: String(report.summary.totalTasks) },
        { label: 'Billable', value: formatHours(report.summary.billableHours) },
        { label: 'Non-Billable', value: formatHours(report.summary.nonBillableHours) },
      ];
      summaryData.forEach((item, i) => {
        const x = 14 + i * 45;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(item.label, x + 4, y + 9);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(item.value, x + 4, y + 21);
        doc.setFont('helvetica', 'normal');
      });
      y += 38;

      // Tasks
      for (const entry of report.tasks) {
        const task = entry.task;
        const budgetPct = getBudgetPercentage(entry.totalHours, task.budgetHours);
        const isOver = entry.totalHours > task.budgetHours;

        // Task Header
        doc.setFillColor(isOver ? 255 : 240, isOver ? 230 : 244, isOver ? 230 : 255);
        doc.rect(14, y, pageWidth - 28, 16, 'F');
        doc.setTextColor(isOver ? 180 : 30, isOver ? 30 : 30, isOver ? 30 : 30);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(task.title, 18, y + 6);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        doc.text(
          `Budget: ${formatHours(task.budgetHours)} | Logged: ${formatHours(entry.totalHours)} | ${budgetPct}% ${isOver ? '⚠ OVER BUDGET' : ''}`,
          18, y + 12
        );
        y += 20;

        // Time logs table
        const tableData = entry.logs.map((l) => [
          formatDate(l.date),
          formatHours(l.hours),
          typeof l.developerId === 'object' ? (l.developerId as { name: string }).name : '',
          (l.note as string) || '—',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Date', 'Hours', 'Developer', 'Description']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [99, 102, 241],
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
          },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 20 }, 2: { cellWidth: 35 } },
          margin: { left: 14, right: 14 },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 10;
        if (y > 250) { doc.addPage(); y = 20; }
      }

      // Footer
      const pages = doc.internal.pages.length - 1;
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated by TrackForge • Page ${i} of ${pages}`,
          pageWidth / 2, doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      const fileName = `trackforge-report-${filters.from}-${filters.to}.pdf`;
      doc.save(fileName);
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
          <Calendar className="w-4 h-4 text-indigo-400" />
          Report Filters
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {['7', '10', '20', 'custom'].map((d) => (
            <button
              key={d}
              onClick={() => applyPreset(d)}
              className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 border ${
                filters.preset === d
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
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
              { label: 'Total Hours', value: formatHours(report.summary.totalHours), color: 'text-indigo-400' },
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
                    <span className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-indigo-400'}`}>
                      {formatHours(entry.totalHours)}
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        {['Date', 'Hours', 'Description'].map((h) => (
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
