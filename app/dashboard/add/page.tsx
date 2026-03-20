'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Category = { id: number; name: string; icon: string; color: string };

export default function AddExpensePage() {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name, icon, color').order('name');
      setCategories(data ?? []);
      if (data && data.length > 0) setForm(f => ({ ...f, category_id: String(data[0].id) }));
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category_id || !form.date) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); setLoading(false); return; }

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: Number(form.amount),
      category_id: Number(form.category_id),
      date: form.date,
      note: form.note || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Expense added successfully! 🎉');
      setForm({
        amount: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
    }
    setLoading(false);
  };

  const selectedCat = categories.find(c => String(c.id) === form.category_id);

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Add Expense</h2>
        <p className="text-text-secondary text-sm mt-1">Record a new transaction</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="label">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="input pl-9"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category *</label>
            <div className="relative">
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="select appearance-none cursor-pointer"
                required
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">▾</span>
            </div>
            {selectedCat && (
              <div className="mt-2">
                <span className="badge text-xs" style={{
                  background: `${selectedCat.color}20`, color: selectedCat.color,
                }}>
                  {selectedCat.icon} {selectedCat.name}
                </span>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="label">Note <span className="text-text-muted font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="input"
              placeholder="e.g. Lunch with team, Electricity bill..."
              maxLength={200}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : '+ Add Expense'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/expenses')}
              className="btn-secondary"
            >
              View All
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl">
        <p className="text-accent text-sm font-medium mb-1">💡 Quick Tips</p>
        <ul className="text-text-muted text-xs space-y-1 list-disc list-inside">
          <li>Add a note to remember what this expense was for</li>
          <li>Set budget limits in the Budget Manager to track overspending</li>
          <li>Export your expenses as CSV anytime from the Expenses page</li>
        </ul>
      </div>
    </div>
  );
}
