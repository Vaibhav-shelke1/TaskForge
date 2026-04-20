'use client';

import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { IUser, ITask } from '@/types';
import apiClient from '@/lib/apiClient';
import ClientCard from '@/components/clients/ClientCard';
import ClientForm from '@/components/clients/ClientForm';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface ClientWithStats {
  client: IUser;
  taskCount: number;
  totalHours: number;
}

export default function ClientsPage() {
  const [clientsData, setClientsData] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchClients = async () => {
    try {
      const [clientsRes, tasksRes] = await Promise.all([
        apiClient.get('/clients'),
        apiClient.get('/tasks?limit=500'),
      ]);

      const clients: IUser[] = clientsRes.data.data ?? [];
      const tasks: ITask[] = tasksRes.data.data ?? [];

      const data = clients.map((client) => {
        const clientTasks = tasks.filter((t) => {
          const cId = typeof t.clientId === 'object' ? t.clientId._id : t.clientId;
          return cId === client._id;
        });
        const totalHours = clientTasks.reduce((s, t) => s + t.totalLoggedHours, 0);
        return { client, taskCount: clientTasks.length, totalHours };
      });

      setClientsData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">{clientsData.length} client{clientsData.length !== 1 ? 's' : ''}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Client
        </Button>
      </div>

      {clientsData.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No clients yet</p>
          <p className="text-slate-600 text-sm mt-1">Add your first client to get started</p>
          <Button className="mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            Add Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientsData.map(({ client, taskCount, totalHours }) => (
            <ClientCard
              key={client._id}
              client={client}
              taskCount={taskCount}
              totalHours={totalHours}
            />
          ))}
        </div>
      )}

      <ClientForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={(newClient) => setClientsData((prev) => [{ client: newClient, taskCount: 0, totalHours: 0 }, ...prev])}
      />
    </div>
  );
}
