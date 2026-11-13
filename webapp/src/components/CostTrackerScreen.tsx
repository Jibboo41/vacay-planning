import { useState, useMemo, type CSSProperties } from 'react';
import { Plus, Wallet, ShoppingBag, Utensils, Plane, TrainFront, Car, Menu, Bed, Activity, ChevronRight, Fuel, ChevronDown, ChevronUp } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { Expense } from '../core/models';
import { EXPENSE_CATEGORIES, itineraryExpenseCategory, normalizeExpenseCategory } from '../core/expenseCategories';

const CATEGORY_ICONS: Record<Expense['category'], any> = {
  'Car Rental': <Car size={18} />,
  'Flights': <Plane size={18} />,
  'Transit': <TrainFront size={18} />,
  'Gas': <Fuel size={18} />,
  'Dining': <Utensils size={18} />,
  'Lodging': <Bed size={18} />,
  'Souvenirs': <ShoppingBag size={18} />,
  'Other': <Activity size={18} />,
};

const CATEGORY_COLORS: Record<Expense['category'], string> = {
  'Car Rental': 'var(--sys-cyan)',
  'Flights': 'var(--sys-blue)',
  'Transit': 'var(--sys-indigo)',
  'Gas': 'var(--sys-yellow)',
  'Dining': 'var(--sys-purple)',
  'Lodging': 'var(--sys-orange)',
  'Souvenirs': 'var(--sys-pink)',
  'Other': 'var(--sys-label-secondary)',
};

export default function CostTrackerScreen() {
  const { expenses, items, addExpense, setEditingItem, setEditingExpense, setSidebarOpen } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<Expense['category']>('Other');

  // Map itinerary items to the new unified categories
  const itineraryExpenses = useMemo(() => {
    return items.filter(i => (i.cost || 0) > 0).map(i => {
      const category = itineraryExpenseCategory(i.type);

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
      return { ...e, category: normalizeExpenseCategory(e.category) };
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

  const paidShare = totalCost > 0 ? Math.min(100, Math.max(0, (totalPaid / totalCost) * 100)) : 0;
  const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="screen safe-area-inset">
      <header className="screen-header screen-header--stacked cost-header">
        <div className="screen-header__row">
          <button
            className="header-icon-btn legacy-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="screen-header__titles">
            <h1 className="page-title">Trip Financials</h1>
          </div>
        </div>

        <div className="cost-summary">
          <span className="cost-summary__total">{money(totalCost)}</span>
          <div className="cost-summary__legend">
            <span><i className="cost-summary__dot cost-summary__dot--paid" />{money(totalPaid)} paid</span>
            <span><i className="cost-summary__dot cost-summary__dot--left" />{money(remainingCost)} left</span>
          </div>
        </div>
        <div className="progress cost-summary__bar" role="img" aria-label={`${Math.round(paidShare)}% of the trip cost is paid`}>
          <div className={`progress__bar${paidShare >= 100 ? ' progress__bar--complete' : ''}`} style={{ width: `${paidShare}%` }} />
        </div>
      </header>

      <div className="screen-body">

        {/* Category Summary Table */}
        {categoryBreakdown.length > 0 && (
          <div className="card cost-breakdown">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="cost-breakdown__toggle"
              aria-expanded={showSummary}
            >
              <span className="cost-breakdown__label">
                <Wallet size={16} />
                Category Breakdown
              </span>
              {showSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showSummary && (
              <div className="cost-table">
                <div className="cost-table__row cost-table__row--head">
                  <span>Category</span>
                  <span>Total</span>
                  <span>Paid</span>
                  <span>Left</span>
                </div>
                {categoryBreakdown.map(cat => (
                  <div key={cat.category} className="cost-table__row">
                    <div className="cost-table__category">
                      <span style={{ color: CATEGORY_COLORS[cat.category] }}>{CATEGORY_ICONS[cat.category]}</span>
                      <span>{cat.category}</span>
                    </div>
                    <span>{money(cat.total)}</span>
                    <span className="cost-table__paid">{money(cat.paid)}</span>
                    <span className={cat.remaining > 0 ? 'cost-table__left' : 'cost-table__settled'}>
                      {money(cat.remaining)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Button / Form */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="btn btn--tonal btn--lg btn--block screen-action"
          >
            <Plus size={20} /> Add Manual Expense
          </button>
        ) : (
          <div className="form-card">
            <h3 className="form-card__title">New Expense</h3>
            <input
              type="text" placeholder="What was it for?" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="edit-field-input"
            />
            <div className="form-row">
              <div className="input-affix">
                <span>$</span>
                <input
                  type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                />
              </div>
              <select
                value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
                className="edit-field-input"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
              <input
                type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="edit-field-input"
              />
            </div>
            <div className="form-actions">
              <button
                onClick={handleAdd}
                className="btn btn--primary"
              >
                Save
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className="list-stack">
          {allExpenses.map((exp: Expense) => {
            return (
              <div
                key={exp.id}
                onClick={() => {
                  if (exp.linkedItemId) {
                    const item = items.find(i => i.id === exp.linkedItemId);
                    if (item) setEditingItem(item);
                  } else {
                    setEditingExpense(exp);
                  }
                }}
                className="card card--interactive expense-row"
                style={{ '--item-color': CATEGORY_COLORS[exp.category] } as CSSProperties}
              >
                <div className="expense-row__icon">
                  {CATEGORY_ICONS[exp.category]}
                </div>

                <div className="expense-row__main">
                  <h4 className="expense-row__title">
                    {exp.title}
                  </h4>
                  <p className="expense-row__meta">
                    {exp.date || 'No date'} · {exp.category}
                  </p>
                </div>

                <div className="expense-row__amounts">
                  <p className="expense-row__amount">
                    {money(exp.amount)}
                  </p>

                  {exp.paidAmount > 0 && (
                    <span className={`expense-row__status ${exp.paidAmount > exp.amount ? 'expense-row__status--over' : 'expense-row__status--paid'}`}>
                      Paid {money(exp.paidAmount)}
                    </span>
                  )}

                  {!exp.paid && exp.amount > exp.paidAmount && (
                    <span className="expense-row__status expense-row__status--due">
                      Due {money(exp.amount - exp.paidAmount)}
                    </span>
                  )}
                </div>

                <ChevronRight size={18} className="expense-row__chevron" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
