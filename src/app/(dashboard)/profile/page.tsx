'use client';

import { useState, useEffect } from 'react';
import {
  User, Mail, Building2, Github, Linkedin, Globe, CreditCard,
  Phone, FileText, Save, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { IUser } from '@/types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    company: '',
    bio: '',
    linkedin: '',
    github: '',
    website: '',
    paypalEmail: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        company: user.company ?? '',
        bio: user.bio ?? '',
        linkedin: user.linkedin ?? '',
        github: user.github ?? '',
        website: user.website ?? '',
        paypalEmail: user.paypalEmail ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.patch('/auth/profile', form);
      if (res.data.success) {
        setUser(res.data.data as IUser);
        setSaved(true);
        toast.success('Profile updated');
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          {user?.role === 'developer'
            ? 'Your contact info is visible to clients in their portal'
            : 'Manage your account details'}
        </p>
      </div>

      {/* Avatar preview */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
        >
          {getInitials(form.name || user?.name || '?')}
        </div>
        <div>
          <p className="text-white font-semibold">{form.name || user?.name}</p>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          <span
            className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: user?.role === 'developer' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.1)',
              color: user?.role === 'developer' ? '#a78bfa' : '#6ee7b7',
              border: `1px solid ${user?.role === 'developer' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.2)'}`,
            }}
          >
            {user?.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic Info */}
        <Section title="Basic Info">
          <Input label="Full Name *" value={form.name} onChange={f('name')} icon={<User className="w-4 h-4" />} placeholder="Your name" />
          <Input label="Company / Studio" value={form.company} onChange={f('company')} icon={<Building2 className="w-4 h-4" />} placeholder="Your company or freelance name" />
          <Textarea
            label="Bio"
            value={form.bio}
            onChange={f('bio')}
            placeholder="Short intro about you or your services..."
            rows={3}
          />
        </Section>

        {/* Contact & Social — developer only */}
        {user?.role === 'developer' && (
          <>
            <Section title="Social & Portfolio" subtitle="Clients will see these links">
              <Input
                label="LinkedIn"
                value={form.linkedin}
                onChange={f('linkedin')}
                icon={<Linkedin className="w-4 h-4" />}
                placeholder="https://linkedin.com/in/yourname"
              />
              <Input
                label="GitHub"
                value={form.github}
                onChange={f('github')}
                icon={<Github className="w-4 h-4" />}
                placeholder="https://github.com/yourname"
              />
              <Input
                label="Website / Portfolio"
                value={form.website}
                onChange={f('website')}
                icon={<Globe className="w-4 h-4" />}
                placeholder="https://yoursite.com"
              />
            </Section>

            <Section title="Payment & Contact" subtitle="Clients use these to send payments or reach you">
              <Input
                label="PayPal Email"
                type="email"
                value={form.paypalEmail}
                onChange={f('paypalEmail')}
                icon={<CreditCard className="w-4 h-4" />}
                placeholder="paypal@yourmail.com"
              />
              <Input
                label="Phone / WhatsApp"
                value={form.phone}
                onChange={f('phone')}
                icon={<Phone className="w-4 h-4" />}
                placeholder="+1 234 567 8900"
              />
              <div
                className="flex gap-2 p-3 rounded-xl text-xs text-slate-400"
                style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}
              >
                <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="text-violet-300 font-medium">Tip:</span> Clients see your PayPal email and contact
                  so they can pay invoices and reach you directly.
                </span>
              </div>
            </Section>
          </>
        )}

        <Button type="submit" loading={loading} className="w-full" icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}>
          {saved ? 'Saved!' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="mb-1">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
