'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Category = { id: number; name: string; icon: string; color: string };
type Expense = {
  id: number; amount: number; note: string | null; date: string;
  category_id: number;
  categories: { name: string; icon: string; color: string } | null;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', category_id: '', date: '', note: '' });

  const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('expenses')
      .select('id, amount, note, date, category_id, categories(name, icon, color)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setExpenses((data as unknown as Expense[]) ?? []);
    const { data: cats } = await supabase.from('categories').select('id, name, icon, color').order('name');
    setCategories(cats ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = [...expenses];
    if (filterCategory) list = list.filter(e => String(e.category_id) === filterCategory);
    if (filterMonth) {
      const [y, m] = filterMonth.split('-');
      list = list.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === Number(y) && d.getMonth() + 1 === Number(m);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => (e.note ?? '').toLowerCase().includes(q) || (e.categories?.name ?? '').toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = sortField === 'date' ? new Date(a.date).getTime() : Number(a.amount);
      const bv = sortField === 'date' ? new Date(b.date).getTime() : Number(b.amount);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [expenses, filterCategory, filterMonth, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Expense deleted'); fetchExpenses(); }
  };

  const startEdit = (e: Expense) => {
    setEditId(e.id);
    setEditForm({ amount: String(e.amount), category_id: String(e.category_id), date: e.date, note: e.note ?? '' });
  };

  const saveEdit = async () => {
    if (!editId) return;
    const { error } = await supabase.from('expenses').update({
      amount: Number(editForm.amount),
      category_id: Number(editForm.category_id),
      date: editForm.date,
      note: editForm.note || null,
    }).eq('id', editId);
    if (error) toast.error(error.message);
    else { toast.success('Expense updated'); setEditId(null); fetchExpenses(); }
  };

  // CSV Export
  const exportCSV = () => {
    const now = new Date();
    const rows = [['Date', 'Category', 'Amount (₹)', 'Note'],
      ...filtered.map(e => [
        new Date(e.date).toLocaleDateString('en-IN'),
        e.categories?.name ?? 'Other',
        Number(e.amount).toFixed(2),
        e.note ?? '',
      ])
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${now.getMonth() + 1}-${now.getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  // PDF Export
  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const now = new Date();
    doc.setFontSize(18);
    doc.setTextColor(34, 197, 94);
    doc.text('SpendSmart — Expense Report', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${now.toLocaleDateString('en-IN')}`, 14, 26);
    doc.text(`Total: ₹${filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}  |  Count: ${filtered.length}`, 14, 32);
    doc.setDrawColor(42, 47, 69);
    doc.line(14, 36, 196, 36);
    let y = 44;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    ['Date', 'Category', 'Amount (₹)', 'Note'].forEach((h, i) => {
      doc.text(h, [14, 55, 100, 135][i], y);
    });
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;
    doc.setTextColor(0);
    filtered.slice(0, 200).forEach(e => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(new Date(e.date).toLocaleDateString('en-IN'), 14, y);
      doc.text(e.categories?.name ?? 'Other', 55, y);
      doc.text(`₹${Number(e.amount).toFixed(2)}`, 100, y);
      doc.text((e.note ?? '').slice(0, 45), 135, y);
      y += 7;
    });
    doc.save(`expenses-${now.getMonth() + 1}-${now.getFullYear()}.pdf`);
    toast.success('PDF downloaded!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Available months from expenses
  const availableMonths = Array.from(new Set(expenses.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Expenses</h2>
          <p className="text-text-secondary text-sm mt-1">{expenses.length} total transactions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <span>⬇️</span> CSV
          </button>
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-sm">
            <span>📄</span> PDF
          </button>
          <a href="/dashboard/add" className="btn-primary flex items-center gap-2 text-sm">
            <span>+</span> Add Expense
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 text-sm"
              placeholder="Search notes or categories..."
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="select text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select
            value={filterMonth}
            onChange={e => { setFilterMonth(e.target.value); setPage(1); }}
            className="select text-sm"
          >
            <option value="">All Months</option>
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              return <option key={m} value={m}>{MONTH_NAMES[Number(mo) - 1]} {y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-6 py-4">
                  <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-text-muted text-xs font-semibold uppercase tracking-wider hover:text-text-primary">
                    Date {sortField === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-text-muted text-xs font-semibold uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-4">
                  <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 text-text-muted text-xs font-semibold uppercase tracking-wider hover:text-text-primary">
                    Amount {sortField === 'amount' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-text-muted text-xs font-semibold uppercase tracking-wider">Note</th>
                <th className="text-right px-6 py-4 text-text-muted text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-text-muted">
                    <p className="text-4xl mb-3">🔍</p>
                    <p>No expenses found matching your filters</p>
                  </td>
                </tr>
              ) : paginated.map(e => (
                <tr key={e.id} className="table-row-hover">
                  {editId === e.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input type="date" value={editForm.date} onChange={ev => setEditForm({ ...editForm, date: ev.target.value })}
                          className="input text-sm py-1.5" />
                      </td>
                      <td className="px-6 py-3">
                        <select value={editForm.category_id} onChange={ev => setEditForm({ ...editForm, category_id: ev.target.value })}
                          className="select text-sm py-1.5">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">₹</span>
                          <input type="number" step="0.01" value={editForm.amount}
                            onChange={ev => setEditForm({ ...editForm, amount: ev.target.value })}
                            className="input pl-7 text-sm py-1.5" />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <input type="text" value={editForm.note} onChange={ev => setEditForm({ ...editForm, note: ev.target.value })}
                          className="input text-sm py-1.5" placeholder="Note..." />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={saveEdit} className="text-accent text-sm font-medium hover:text-accent-light px-3 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">Save</button>
                          <button onClick={() => setEditId(null)} className="text-text-muted text-sm hover:text-text-primary px-3 py-1 rounded-lg hover:bg-surface transition-colors">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge" style={{
                          background: `${e.categories?.color ?? '#6b7280'}20`, color: e.categories?.color ?? '#6b7280',
                        }}>
                          {e.categories?.icon ?? '📦'} {e.categories?.name ?? 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{fmt(Number(e.amount))}</td>
                      <td className="px-6 py-4 text-text-secondary text-sm max-w-[200px] truncate">{e.note ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => startEdit(e)} className="text-info text-sm font-medium hover:text-blue-400 px-3 py-1 rounded-lg bg-info/10 hover:bg-info/20 transition-colors">Edit</button>
                          <button onClick={() => handleDelete(e.id)} className="btn-danger text-xs px-3 py-1">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-text-secondary">
            Total of <span className="font-semibold text-text-primary">{filtered.length}</span> results:&nbsp;
            <span className="text-accent font-bold">{fmt(filteredTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >← Prev</button>
            <span className="text-text-muted text-sm px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
