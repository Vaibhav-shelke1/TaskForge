'use client';

import { useEffect, useState } from 'react';
import {
  Mail, Github, Linkedin, Globe, CreditCard, Phone, Copy, CheckCircle2,
} from 'lucide-react';
import { IUser } from '@/types';
import apiClient from '@/lib/apiClient';
import { getInitials } from '@/lib/utils';

export default function DeveloperCard() {
  const [dev, setDev] = useState<IUser | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/developer/profile').then((res) => {
      if (res.data.success) setDev(res.data.data);
    }).catch(() => {});
  }, []);

  if (!dev) return null;

  const copy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasLinks = dev.linkedin || dev.github || dev.website;
  const hasContact = dev.paypalEmail || dev.phone || dev.email;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 2px 12px rgba(124,58,237,0.35)' }}
        >
          {getInitials(dev.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{dev.name}</p>
          {dev.company && <p className="text-xs text-slate-500 truncate">{dev.company}</p>}
        </div>
        <span
          className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
        >
          Developer
        </span>
      </div>

      {/* Bio */}
      {dev.bio && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-white/[0.05] pt-3">
          {dev.bio}
        </p>
      )}

      {/* Social Links */}
      {hasLinks && (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.05] pt-3">
          {dev.linkedin && (
            <a
              href={dev.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07]"
            >
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {dev.github && (
            <a
              href={dev.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07]"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
          )}
          {dev.website && (
            <a
              href={dev.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07]"
            >
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
        </div>
      )}

      {/* Contact / Payment Info */}
      {hasContact && (
        <div className="space-y-2 border-t border-white/[0.05] pt-3">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Contact & Payment</p>

          {dev.email && (
            <CopyRow
              icon={<Mail className="w-3.5 h-3.5 text-slate-500" />}
              label="Email"
              value={dev.email}
              copied={copiedField === 'email'}
              onCopy={() => copy(dev.email, 'email')}
            />
          )}
          {dev.paypalEmail && (
            <CopyRow
              icon={<CreditCard className="w-3.5 h-3.5 text-emerald-500" />}
              label="PayPal"
              value={dev.paypalEmail}
              copied={copiedField === 'paypal'}
              onCopy={() => copy(dev.paypalEmail!, 'paypal')}
              highlight
            />
          )}
          {dev.phone && (
            <CopyRow
              icon={<Phone className="w-3.5 h-3.5 text-slate-500" />}
              label="Phone"
              value={dev.phone}
              copied={copiedField === 'phone'}
              onCopy={() => copy(dev.phone!, 'phone')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CopyRow({
  icon, label, value, copied, onCopy, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all group ${
        highlight
          ? 'bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10'
          : 'bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
      onClick={onCopy}
      title={`Copy ${label}`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-600 leading-none mb-0.5">{label}</p>
        <p className={`text-xs truncate font-mono ${highlight ? 'text-emerald-300' : 'text-slate-300'}`}>
          {value}
        </p>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          : <Copy className="w-3.5 h-3.5 text-slate-500" />}
      </div>
    </div>
  );
}
