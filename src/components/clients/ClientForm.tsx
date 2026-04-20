'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { IUser } from '@/types';
import apiClient from '@/lib/apiClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: IUser) => void;
}

export default function ClientForm({ isOpen, onClose, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password || form.password.length < 6) errs.password = 'Min 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/clients', form);
      if (res.data.success) {
        toast.success('Client account created');
        onSuccess(res.data.data as IUser);
        setForm({ name: '', email: '', password: '', company: '' });
        onClose();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Client Account" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="John Doe"
          error={errors.name}
        />
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="client@company.com"
          error={errors.email}
        />
        <Input
          label="Company"
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          placeholder="Acme Corp"
        />
        <Input
          label="Password *"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Min 6 characters"
          error={errors.password}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
