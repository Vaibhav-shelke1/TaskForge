'use client';

import Link from 'next/link';
import { Building2, Mail } from 'lucide-react';
import { IUser } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';

interface ClientCardProps {
  client: IUser;
  taskCount?: number;
  totalHours?: number;
}

export default function ClientCard({ client, taskCount = 0, totalHours = 0 }: ClientCardProps) {
  return (
    <Link
      href={`/clients/${client._id}`}
      className="block bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/[0.14] hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-indigo-300">{getInitials(client.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-0.5 truncate">{client.name}</h3>
          {client.company && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <Building2 className="w-3 h-3" />
              <span>{client.company}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Mail className="w-3 h-3" />
            <span className="truncate">{client.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/[0.05]">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{taskCount}</p>
          <p className="text-[11px] text-slate-500">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{totalHours.toFixed(1)}h</p>
          <p className="text-[11px] text-slate-500">Hours Logged</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 mt-3">
        Member since {formatDate(client.createdAt)}
      </p>
    </Link>
  );
}
