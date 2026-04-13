import { useState, useMemo } from 'react';
import { Plus, Wallet, ShoppingBag, Utensils, Plane, Car, Menu, Bed, Activity, ChevronRight, Fuel, ChevronDown, ChevronUp } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { Expense } from '../core/models';

const EXPENSE_CATEGORIES: Expense['category'][] = [
  'Car Rental', 'Flights', 'Gas', 'Dining', 'Lodging', 'Souvenirs', 'Other'
];

const CATEGORY_ICONS: Record<Expense['category'], any> = {
  'Car Rental': <Car size={18} />,
  'Flights': <Plane size={18} />,
  'Gas': <Fuel size={18} />,
  'Dining': <Utensils size={18} />,
  'Lodging': <Bed size={18} />,
  'Souvenirs': <ShoppingBag size={18} />,
  'Other': <Activity size={18} />,
};

const CATEGORY_COLORS: Record<Expense['category'], string> = {
  'Car Rental': '#AF52DE',
  'Flights': '#0A84FF',
  'Gas': '#FFD60A',
  'Dining': '#FF7000',
  'Lodging': '#FF9F0A',
  'Souvenirs': '#FF2D55',
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
      let category: Expense['category'] = 'Other';
      if (i.type === 'flight') category = 'Flights';
      else if (i.type === 'hotel') category = 'Lodging';
      else if (i.type === 'rental-car') category = 'Car Rental';
      else if (i.type === 'food') category = 'Dining';

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
      // Map old to new
      let newCat: Expense['category'] = 'Other';
      if (e.category === 'food' as any) newCat = 'Dining';
      if (e.category === 'transport' as any) newCat = 'Car Rental';
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
    <div className="safe-area-inset" style={{ minHeight: '100vh', background: 'transparent' }}>
      <header className="screen-header">
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h1 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Trip Financials
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-1.5px', color: '#FFF' }}>
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sys-green)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sys-label-secondary)' }}>
                ${totalPaid.toLocaleString()} paid
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sys-blue)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sys-label-secondary)' }}>
                ${remainingCost.toLocaleString()} left
              </span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: '24px', paddingBottom: '120px' }}>
        
        {/* Category Summary Table */}
        {categoryBreakdown.length > 0 && (
          <div className="glass-card" style={{ borderRadius: '24px', marginBottom: '24px', overflow: 'hidden' }}>
            <button 
              onClick={() => setShowSummary(!showSummary)}
              style={{ 
                width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', 
                justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: 'none' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wallet size={18} color="var(--sys-blue)" />
                <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>CATEGORY BREAKDOWN</span>
              </div>
              {showSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {showSummary && (
              <div style={{ padding: '0 20px 16px 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', 
                  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '11px', fontWeight: 800, color: 'var(--sys-label-tertiary)', textTransform: 'uppercase'
                }}>
                  <span>Category</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                  <span style={{ textAlign: 'right' }}>Paid</span>
                  <span style={{ textAlign: 'right' }}>Left</span>
                </div>
                {categoryBreakdown.map(cat => (
                  <div key={cat.category} style={{ 
                    display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', 
                    padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '14px', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <span style={{ color: CATEGORY_COLORS[cat.category] }}>{CATEGORY_ICONS[cat.category]}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.category}</span>
                    </div>
                    <span style={{ textAlign: 'right', fontWeight: 600 }}>${cat.total.toLocaleString()}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--sys-green)' }}>${cat.paid.toLocaleString()}</span>
                    <span style={{ textAlign: 'right', fontWeight: 800, color: cat.remaining > 0 ? 'var(--sys-blue)' : 'var(--sys-label-tertiary)' }}>
                      ${cat.remaining.toLocaleString()}
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
            className="btn-glass-blue"
            style={{ 
              width: '100%', padding: '16px', borderRadius: '16px', 
              fontSize: '16px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '8px', marginBottom: '32px',
            }}
          >
            <Plus size={20} /> Add Manual Expense
          </button>
        ) : (
          <div className="glass-card" style={{ 
            padding: '24px', borderRadius: '24px', 
            marginBottom: '32px', border: '1px solid var(--sys-blue)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0' }}>New Expense</h3>
            <input 
              type="text" placeholder="What was it for?" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="edit-field-input"
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', flex: 1,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px', padding: '0 12px'
              }}>
                <span style={{ color: 'var(--sys-label-tertiary)', fontSize: '16px', marginRight: '4px' }}>$</span>
                <input 
                  type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                  style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                />
              </div>
              <select 
                value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
                className="edit-field-input"
                style={{ flex: 1 }}
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%', marginBottom: '24px' }}>
              <input 
                type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="edit-field-input"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleAdd} 
                className="btn-glass-blue" 
                style={{ flex: 1, padding: '16px', borderRadius: '14px', fontSize: '15px' }}
              >
                Save
              </button>
              <button 
                onClick={() => setShowAdd(false)} 
                style={{ 
                  flex: 1, padding: '16px', borderRadius: '14px', 
                  background: 'rgba(255,255,255,0.08)', color: '#fff', 
                  border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '15px' 
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Expense List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                className="glass-card"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', 
                  padding: '16px', borderRadius: '16px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ 
                  width: '42px', height: '42px', borderRadius: '12px', 
                  background: `${CATEGORY_COLORS[exp.category]}15`, 
                  color: CATEGORY_COLORS[exp.category],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${CATEGORY_COLORS[exp.category]}30`
                }}>
                  {CATEGORY_ICONS[exp.category]}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exp.title}
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--sys-label-tertiary)', fontWeight: 500 }}>
                    {exp.date || 'No date'} · {exp.category}
                  </p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                      ${exp.amount.toLocaleString()}
                    </p>
                    
                    {exp.paidAmount > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: exp.paidAmount > exp.amount ? 'var(--sys-red)' : 'var(--sys-green)', textTransform: 'uppercase' }}>
                        Paid ${exp.paidAmount.toLocaleString()}
                      </span>
                    )}

                    {!exp.paid && exp.amount > exp.paidAmount && (
                      <span style={{ fontSize: '10px', color: 'var(--sys-blue)', fontWeight: 800, textTransform: 'uppercase' }}>
                        Due ${(exp.amount - exp.paidAmount).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ color: 'var(--sys-label-quaternary)' }}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
