'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Category = { id: number; name: string; icon: string; color: string };
type Budget = { category_id: number; monthly_limit: number; spent: number };

export default function BudgetPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Record<number, number>>({});
  const [spent, setSpent] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cats } = await supabase.from('categories').select('id, name, icon, color').order('name');
      setCategories(cats ?? []);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('category_id, monthly_limit')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      const budgetMap: Record<number, number> = {};
      budgetData?.forEach(b => { budgetMap[b.category_id] = Number(b.monthly_limit); });
      setBudgets(budgetMap);

      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const { data: expenses } = await supabase
        .from('expenses')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .gte('date', startDate);

      const spentMap: Record<number, number> = {};
      expenses?.forEach(e => {
        spentMap[e.category_id] = (spentMap[e.category_id] ?? 0) + Number(e.amount);
      });
      setSpent(spentMap);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const upserts = Object.entries(budgets)
      .filter(([, limit]) => limit > 0)
      .map(([cat_id, limit]) => ({
        user_id: user.id,
        category_id: Number(cat_id),
        monthly_limit: limit,
        month: currentMonth,
        year: currentYear,
      }));

    if (upserts.length === 0) {
      toast.error('Please set at least one budget limit.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('budgets').upsert(upserts, {
      onConflict: 'user_id,category_id,month,year',
    });

    if (error) toast.error(error.message);
    else toast.success('Budget limits saved! 🎯');
    setSaving(false);
  };

  const getBarColor = (pct: number) => {
    if (pct >= 100) return '#ef4444';
    if (pct >= 80) return '#f59e0b';
    return '#22c55e';
  };

  const getStatusTag = (pct: number) => {
    if (pct >= 100) return { label: 'Over Budget', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (pct >= 80) return { label: 'Near Limit', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'On Track', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Budget Manager</h2>
        <p className="text-text-secondary text-sm mt-1">Set monthly spending limits for {monthLabel}</p>
      </div>

      {/* Progress overview */}
      <div className="space-y-4">
        {categories.map(cat => {
          const limit = budgets[cat.id] ?? 0;
          const spentAmt = spent[cat.id] ?? 0;
          const pct = limit > 0 ? (spentAmt / limit) * 100 : 0;
          const barColor = getBarColor(pct);
          const tag = limit > 0 ? getStatusTag(pct) : null;

          return (
            <div key={cat.id} className={`card py-5 ${pct >= 100 && limit > 0 ? 'pulse-danger border-danger/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{cat.name}</p>
                    {limit > 0 ? (
                      <p className="text-xs text-text-muted">
                        ₹{spentAmt.toLocaleString('en-IN', { minimumFractionDigits: 0 })} of ₹{limit.toLocaleString('en-IN', { minimumFractionDigits: 0 })} spent
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted">No limit set</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tag && (
                    <span className="badge text-xs" style={{ color: tag.color, background: tag.bg }}>
                      {tag.label}
                    </span>
                  )}
                  {limit > 0 && (
                    <span className="text-sm font-bold" style={{ color: barColor }}>
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {limit > 0 && (
                <div className="h-2 bg-border rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: barColor,
                    }}
                  />
                </div>
              )}

              {/* Budget input */}
              <div className="flex items-center gap-3">
                <label className="text-text-secondary text-sm whitespace-nowrap">Monthly limit:</label>
                <div className="relative flex-1 max-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={budgets[cat.id] ?? ''}
                    onChange={e => setBudgets({ ...budgets, [cat.id]: Number(e.target.value) })}
                    className="input pl-7 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : '💾 Save Budget Limits'}
      </button>
    </div>
  );
}
