import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Plus, Wallet, ShoppingBag, Utensils, Plane, Car, Menu, Bed, Activity, ChevronRight, Fuel, ChevronDown, ChevronUp } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { Expense } from '../core/models';
import { getItemTypeMeta } from '../core/itemTypes';
import { cn } from '../lib/cn';
import { Button, Card, IconButton, Input, Select } from './ui';

const EXPENSE_CATEGORIES: Expense['category'][] = [
  'Car Rental', 'Flights', 'Gas', 'Dining', 'Lodging', 'Souvenirs', 'Other'
];

const CATEGORY_ICONS: Record<Expense['category'], ReactNode> = {
  'Car Rental': <Car size={18} />,
  'Flights': <Plane size={18} />,
  'Gas': <Fuel size={18} />,
  'Dining': <Utensils size={18} />,
  'Lodging': <Bed size={18} />,
  'Souvenirs': <ShoppingBag size={18} />,
  'Other': <Activity size={18} />,
};

const CATEGORY_CLASSES: Record<Expense['category'], { text: string; bg: string; border: string }> = {
  'Car Rental': { text: 'text-sys-teal', bg: 'bg-sys-teal/10', border: 'border-sys-teal/20' },
  'Flights': { text: 'text-sys-blue', bg: 'bg-sys-blue/10', border: 'border-sys-blue/20' },
  'Gas': { text: 'text-sys-yellow', bg: 'bg-sys-yellow/10', border: 'border-sys-yellow/20' },
  'Dining': { text: 'text-sys-purple', bg: 'bg-sys-purple/10', border: 'border-sys-purple/20' },
  'Lodging': { text: 'text-sys-orange', bg: 'bg-sys-orange/10', border: 'border-sys-orange/20' },
  'Souvenirs': { text: 'text-sys-pink', bg: 'bg-sys-pink/10', border: 'border-sys-pink/20' },
  'Other': { text: 'text-label-secondary', bg: 'bg-white/5', border: 'border-white/10' },
};

export default function CostTrackerScreen() {
  const { expenses, items, addExpense, setEditingItem, setEditingExpense, setSidebarOpen } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<Expense['category']>('Other');

  const itineraryExpenses = useMemo(() => {
    return items.filter(i => (i.cost || 0) > 0).map(i => {
      const category = getItemTypeMeta(i).expenseCategory ?? 'Other';

      return {
        id: `itinerary-${i.id}`,
        title: i.title,
        amount: i.cost || 0,
        paidAmount: i.paidAmount || 0,
        category,
        date: i.startDate.split('T')[0],
        paid: (i.paidAmount || 0) >= (i.cost || 0),
        linkedItemId: i.id
      };
    });
  }, [items]);

  const allExpenses = useMemo(() => {
    // Migration for old expenses if any still use old categories
    const migratedManual = expenses.map(e => {
      if (EXPENSE_CATEGORIES.includes(e.category)) return e;
      const legacyCategory = e.category as string;
      let newCat: Expense['category'] = 'Other';
      if (legacyCategory === 'food') newCat = 'Dining';
      if (legacyCategory === 'transport') newCat = 'Car Rental';
      return { ...e, category: newCat };
    });

    return [...migratedManual, ...itineraryExpenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses, itineraryExpenses]);

  const categoryBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => {
      const catExps = allExpenses.filter(e => e.category === cat);
      const total = catExps.reduce((sum, e) => sum + e.amount, 0);
      const paid = catExps.reduce((sum, e) => sum + e.paidAmount, 0);
      return { category: cat, total, paid, remaining: total - paid };
    }).filter(c => c.total > 0);
  }, [allExpenses]);

  const totalCost = allExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
  const totalPaid = allExpenses.reduce((sum: number, e: Expense) => sum + (e.paidAmount || 0), 0);
  const remainingCost = totalCost - totalPaid;

  const handleAdd = () => {
    if (!newTitle.trim() || !newAmount.trim()) return;
    addExpense({
      title: newTitle.trim(),
      amount: parseFloat(newAmount),
      category: newCategory,
      date: newDate || undefined
    });
    setNewTitle('');
    setNewAmount('');
    setNewDate('');
    setShowAdd(false);
  };

  return (
    <div className="safe-area-inset min-h-screen bg-transparent">
      <header className="screen-header">
        <IconButton aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </IconButton>
        <div className="flex flex-1 flex-col">
          <h1 className="mb-1 text-footnote font-extrabold uppercase tracking-[0.1em] text-label-secondary">
            Trip Financials
          </h1>

          <div className="flex items-baseline gap-2">
            <span className="text-[38px] font-black tracking-[-1.5px] text-label">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="mt-2 flex gap-5">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-sys-green" />
              <span className="text-[14px] font-bold text-label-secondary">
                ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-sys-blue" />
              <span className="text-[14px] font-bold text-label-secondary">
                ${remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 pt-6 pb-[120px]">
        {categoryBreakdown.length > 0 && (
          <Card padding="none" className="mb-6 overflow-hidden rounded-panel">
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="flex w-full items-center justify-between border-0 bg-white/3 px-5 py-4 text-left transition-colors hover:bg-white/6 motion-reduce:transition-none"
            >
              <div className="flex items-center gap-2.5">
                <Wallet size={18} className="text-sys-blue" />
                <span className="text-[14px] font-extrabold tracking-[0.05em] text-label">CATEGORY BREAKDOWN</span>
              </div>
              {showSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showSummary && (
              <div className="flex flex-col px-5 pb-4">
                <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] border-b border-white/8 py-3 text-caption font-extrabold uppercase text-label-tertiary">
                  <span>Category</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Paid</span>
                  <span className="text-right">Left</span>
                </div>
                {categoryBreakdown.map(cat => (
                  <div key={cat.category} className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-b border-white/4 py-3.5 text-[14px] last:border-b-0">
                    <div className="flex min-w-0 items-center gap-2 font-bold">
                      <span className={CATEGORY_CLASSES[cat.category].text}>{CATEGORY_ICONS[cat.category]}</span>
                      <span className="truncate whitespace-nowrap">{cat.category}</span>
                    </div>
                    <span className="text-right font-semibold">${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-right font-semibold text-sys-green">${cat.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className={cn('text-right font-extrabold', cat.remaining > 0 ? 'text-sys-blue' : 'text-label-tertiary')}>
                      ${cat.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {!showAdd ? (
          <Button onClick={() => setShowAdd(true)} block className="mb-8 min-h-14 rounded-2xl p-4 text-[16px]">
            <Plus size={20} /> Add Manual Expense
          </Button>
        ) : (
          <Card className="mb-8 rounded-panel border border-sys-blue p-6">
            <h3 className="mb-5 text-[18px] font-bold text-label">New Expense</h3>
            <Input
              type="text"
              aria-label="Expense title"
              placeholder="What was it for?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="mb-4"
            />
            <div className="mb-4 flex gap-3">
              <div className="flex flex-1 items-center rounded-control border border-white/10 bg-white/5 px-3">
                <span className="mr-1 text-[16px] text-label-tertiary">$</span>
                <input
                  type="number"
                  aria-label="Expense amount"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 text-label outline-none scheme-dark placeholder:text-label-tertiary"
                />
              </div>
              <Select
                aria-label="Expense category"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as Expense['category'])}
                className="flex-1"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div className="mb-6 w-full overflow-hidden rounded-control">
              <Input
                type="date"
                aria-label="Expense date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAdd} className="min-h-14 flex-1 rounded-[14px] p-4 text-body">
                Save
              </Button>
              <Button variant="secondary" onClick={() => setShowAdd(false)} className="min-h-14 flex-1 rounded-[14px] p-4 text-body">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {allExpenses.map((exp: Expense) => {
            const categoryClass = CATEGORY_CLASSES[exp.category];
            return (
              <button
                type="button"
                key={exp.id}
                onClick={() => {
                  if (exp.linkedItemId) {
                    const item = items.find(i => i.id === exp.linkedItemId);
                    if (item) setEditingItem(item);
                  } else {
                    setEditingExpense(exp);
                  }
                }}
                className="glass-card flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-white/8 p-4 text-left transition-all duration-200 ease-ios hover:bg-white/6 motion-reduce:transition-none"
              >
                <div className={cn('flex size-[42px] shrink-0 items-center justify-center rounded-control border', categoryClass.bg, categoryClass.border, categoryClass.text)}>
                  {CATEGORY_ICONS[exp.category]}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-[16px] font-bold text-label">
                    {exp.title}
                  </h4>
                  <p className="mt-0.5 text-caption font-medium text-label-tertiary">
                    {exp.date || 'No date'} · {exp.category}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-headline font-extrabold text-label">
                      ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>

                    {exp.paidAmount > 0 && (
                      <span className={cn('text-caption font-extrabold uppercase', exp.paidAmount > exp.amount ? 'text-sys-red' : 'text-sys-green')}>
                        Paid ${exp.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}

                    {!exp.paid && exp.amount > exp.paidAmount && (
                      <span className="text-caption font-extrabold uppercase text-sys-blue">
                        Due ${(exp.amount - exp.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  <div className="text-label-tertiary">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
