'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Bills: '#ef4444',
  Shopping: '#8b5cf6',
  Health: '#10b981',
  Entertainment: '#f59e0b',
  Other: '#6b7280',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type SummaryCard = { totalSpent: number; budgetRemaining: number; txCount: number };
type MonthData = { month: string; amount: number };
type CategoryData = { name: string; value: number; color: string };
type RecentExpense = {
  id: number; amount: number; note: string | null; date: string;
  categories: { name: string; icon: string; color: string } | null;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [summary, setSummary] = useState<SummaryCard>({ totalSpent: 0, budgetRemaining: 0, txCount: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Current month expenses
      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount, categories(name, icon, color)')
        .eq('user_id', user.id)
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);

      const totalSpent = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

      // Budget
      const { data: budgets } = await supabase
        .from('budgets')
        .select('monthly_limit')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear);
      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.monthly_limit), 0) ?? 0;

      setSummary({
        totalSpent,
        budgetRemaining: Math.max(0, totalBudget - totalSpent),
        txCount: monthExpenses?.length ?? 0,
      });

      // Category breakdown
      const catMap: Record<string, { value: number; color: string }> = {};
      monthExpenses?.forEach((e: { amount: number; categories: { name: string; icon?: string; color?: string } | null }) => {
        const catName = e.categories?.name ?? 'Other';
        const catColor = e.categories?.color ?? CATEGORY_COLORS['Other'];
        if (!catMap[catName]) catMap[catName] = { value: 0, color: catColor };
        catMap[catName].value += Number(e.amount);
      });
      setCategoryData(
        Object.entries(catMap).map(([name, { value, color }]) => ({ name, value, color }))
      );

      // Last 6 months bar chart
      const last6: MonthData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0);
        const { data } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate.toISOString().split('T')[0]);
        const total = data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
        last6.push({ month: MONTH_NAMES[m - 1], amount: total });
      }
      setMonthlyData(last6);

      // Recent 5 expenses
      const { data: recent } = await supabase
        .from('expenses')
        .select('id, amount, note, date, categories(name, icon, color)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);
      setRecentExpenses((recent as RecentExpense[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
        <p className="text-text-secondary text-sm mt-1">
          {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })} overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="summary-card">
          <div>
            <p className="text-text-secondary text-sm font-medium">Total Spent</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{fmt(summary.totalSpent)}</p>
            <p className="text-text-muted text-xs mt-1">This month</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-2xl">💸</div>
        </div>
        <div className="summary-card glow-green">
          <div>
            <p className="text-text-secondary text-sm font-medium">Budget Remaining</p>
            <p className="text-3xl font-bold text-accent mt-1">{fmt(summary.budgetRemaining)}</p>
            <p className="text-text-muted text-xs mt-1">Set budgets in Budget Manager</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">🎯</div>
        </div>
        <div className="summary-card">
          <div>
            <p className="text-text-secondary text-sm font-medium">Transactions</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{summary.txCount}</p>
            <p className="text-text-muted text-xs mt-1">This month</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center text-2xl">🧾</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Bar Chart */}
        <div className="card lg:col-span-3">
          <h3 className="font-semibold text-text-primary mb-4">Monthly Spending (Last 6 Months)</h3>
          {monthlyData.every(d => d.amount === 0) ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip
                  contentStyle={{ background: '#1e2132', border: '1px solid #2a2f45', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Spent']}
                />
                <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-text-primary mb-4">By Category</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2132', border: '1px solid #2a2f45', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text-primary">Recent Transactions</h3>
          <a href="/dashboard/expenses" className="text-accent text-sm hover:text-accent-light transition-colors">
            View all →
          </a>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <p className="text-4xl mb-3">🧾</p>
            <p>No expenses yet. <a href="/dashboard/add" className="text-accent hover:underline">Add your first one!</a></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="text-text-muted text-xs font-semibold uppercase tracking-wider pb-3">Date</th>
                  <th className="text-text-muted text-xs font-semibold uppercase tracking-wider pb-3">Category</th>
                  <th className="text-text-muted text-xs font-semibold uppercase tracking-wider pb-3 text-right">Amount</th>
                  <th className="text-text-muted text-xs font-semibold uppercase tracking-wider pb-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentExpenses.map((e) => (
                  <tr key={e.id} className="table-row-hover">
                    <td className="py-3 text-text-secondary text-sm">
                      {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3">
                      <span className="badge" style={{
                        background: `${e.categories?.color ?? '#6b7280'}20`,
                        color: e.categories?.color ?? '#6b7280',
                      }}>
                        {e.categories?.icon ?? '📦'} {e.categories?.name ?? 'Other'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-text-primary">
                      {fmt(Number(e.amount))}
                    </td>
                    <td className="py-3 text-text-secondary text-sm truncate max-w-[160px]">
                      {e.note ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
