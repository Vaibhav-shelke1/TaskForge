'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ITask, ITimeLog, IComment } from '@/types';
import apiClient from '@/lib/apiClient';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskForm from '@/components/tasks/TaskForm';
import TimeLogForm from '@/components/time/TimeLogForm';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [task, setTask] = useState<ITask | null>(null);
  const [timeLogs, setTimeLogs] = useState<ITimeLog[]>([]);
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTask = async () => {
    try {
      const res = await apiClient.get(`/tasks/${id}`);
      if (res.data.success) {
        setTask(res.data.data.task);
        setTimeLogs(res.data.data.timeLogs);
        setComments(res.data.data.comments);
      }
    } catch {
      toast.error('Task not found');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      router.push('/tasks');
    } catch {
      toast.error('Failed to delete task');
      setDeleting(false);
    }
  };

  if (loading || !task) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <TaskDetail
        task={task}
        timeLogs={timeLogs}
        comments={comments}
        onEdit={() => setShowEditForm(true)}
        onDelete={() => setShowDeleteModal(true)}
        onLogTime={() => setShowLogForm(true)}
        onCommentAdded={(c) => setComments((prev) => [c, ...prev])}
        onPaymentUpdate={(status) => setTask((prev) => prev ? { ...prev, paymentStatus: status } : prev)}
      />

      <TaskForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={(updated) => { setTask(updated); setShowEditForm(false); }}
        editTask={task}
      />

      <TimeLogForm
        isOpen={showLogForm}
        onClose={() => setShowLogForm(false)}
        onSuccess={fetchTask}
        defaultTaskId={task._id}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        size="sm"
      >
        <p className="text-slate-400 text-sm mb-5">
          Are you sure you want to delete <strong className="text-white">"{task.title}"</strong>?
          This will also remove all associated time logs and comments. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete} className="flex-1">
            Delete Task
          </Button>
        </div>
      </Modal>
    </div>
  );
}
