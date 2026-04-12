import { useState, useMemo } from 'react';
import { Plus, PieChart, Wallet, CreditCard, ShoppingBag, Utensils, Plane, Car, Menu, Mountain, Bed, Activity, FileText, ChevronRight } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { Expense } from '../core/models';
import PullToRefresh from './PullToRefresh';

export default function CostTrackerScreen() {
  const { expenses, items, addExpense, setEditingItem, setEditingExpense, setSidebarOpen, refreshAppData } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<Expense['category']>('manual');

  const itineraryExpenses = useMemo(() => {
    return items.filter(i => (i.cost || 0) > 0).map(i => ({
      id: `itinerary-${i.id}`,
      title: i.title,
      amount: i.cost || 0,
      paidAmount: i.paidAmount || 0, 
      category: 'itinerary' as const,
      date: i.startDate.split('T')[0],
      paid: (i.paidAmount || 0) >= (i.cost || 0),
      linkedItemId: i.id
    }));
  }, [items]);

  const allExpenses = useMemo(() => {
    return [...expenses, ...itineraryExpenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses, itineraryExpenses]);

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

  const getItineraryIcon = (type: string) => {
    switch (type) {
      case 'hike':
      case 'hiking': return <Mountain size={18} />;
      case 'hotel': return <Bed size={18} />;
      case 'flight': return <Plane size={18} />;
      case 'rental-car': return <Car size={18} />;
      case 'food': return <Utensils size={18} />;
      case 'activity': return <Activity size={18} />;
      case 'note': return <FileText size={18} />;
      case 'transit': return <Car size={18} />;
      default: return <Plane size={18} />;
    }
  };

  const CATEGORY_ICONS: Record<string, any> = {
    itinerary: <Plane size={18} />, 
    manual: <Wallet size={18} />,
    food: <Utensils size={18} />,
    transport: <Car size={18} />,
    other: <ShoppingBag size={18} />,
  };

  const CATEGORY_COLORS: Record<string, string> = {
    itinerary: 'var(--sys-blue)',
    manual: 'var(--sys-green)',
    food: 'var(--sys-orange)',
    transport: 'var(--sys-purple)',
    other: 'var(--sys-label-tertiary)',
  };

  return (
    <PullToRefresh onRefresh={refreshAppData}>
      <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
        <header className="screen-header" style={{ paddingTop: 'calc(6px + env(safe-area-inset-top))' }}>
          <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Trip Financials
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-1.5px', color: '#FFF' }}>
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--sys-label-secondary)', marginBottom: '6px' }}>total</span>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--sys-label-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Paid</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sys-green)' }}>
                  ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--sys-blue)', fontWeight: 700, textTransform: 'uppercase' }}>Remaining</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sys-blue)' }}>
                  ${remainingCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: '0 20px 120px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px', marginTop: '24px' }}>
            <div style={{ background: 'var(--sys-bg-elevated)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--sys-blue)', marginBottom: '12px' }}><PieChart size={24} /></div>
              <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: '0 0 4px 0' }}>Itinerary</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                ${itineraryExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0).toLocaleString()}
              </h3>
            </div>
            <div style={{ background: 'var(--sys-bg-elevated)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--sys-green)', marginBottom: '12px' }}><CreditCard size={24} /></div>
              <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: '0 0 4px 0' }}>Manual</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </h3>
            </div>
          </div>

          {!showAdd ? (
            <button 
              onClick={() => setShowAdd(true)}
              style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#FFF', fontWeight: 700, fontSize: '15px', marginBottom: '32px' }}
            >
              <Plus size={18} /> Add Manual Expense
            </button>
          ) : (
            <div style={{ background: 'var(--sys-bg-elevated)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(10, 132, 255, 0.2)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800 }}>New Expense</h3>
                <button onClick={() => setShowAdd(false)} style={{ color: 'var(--sys-label-tertiary)', background: 'none', border: 'none' }}>Cancel</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {['manual', 'food', 'transport', 'other'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(cat as any)}
                      style={{ 
                        flexShrink: 0, padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                        background: newCategory === cat ? CATEGORY_COLORS[cat] : 'rgba(255,255,255,0.05)',
                        color: newCategory === cat ? '#FFF' : 'var(--sys-label-secondary)',
                        border: 'none'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Expense title" 
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '14px', color: '#FFF' }} 
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input 
                    type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                    placeholder="Amount $" 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '14px', color: '#FFF' }} 
                  />
                  <input 
                    type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '14px', color: '#FFF' }} 
                  />
                </div>
                <button 
                  onClick={handleAdd}
                  disabled={!newTitle || !newAmount}
                  style={{ background: 'var(--sys-blue)', color: '#FFF', padding: '18px', borderRadius: '18px', fontWeight: 800, border: 'none', opacity: (!newTitle || !newAmount) ? 0.5 : 1 }}
                >
                  SAVE EXPENSE
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--sys-label-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Transactions
            </h2>
            {allExpenses.map((expense) => (
              <div 
                key={expense.id}
                onClick={() => {
                  if (expense.category === 'itinerary' && expense.linkedItemId) {
                    const item = items.find(i => i.id === expense.linkedItemId);
                    if (item) setEditingItem(item);
                  } else {
                    setEditingExpense(expense);
                  }
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div style={{ 
                  width: '42px', height: '42px', borderRadius: '14px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: CATEGORY_COLORS[expense.category] + '15',
                  color: CATEGORY_COLORS[expense.category]
                }}>
                  {expense.category === 'itinerary' && expense.linkedItemId 
                    ? getItineraryIcon(items.find(i => i.id === expense.linkedItemId)?.type || 'activity')
                    : CATEGORY_ICONS[expense.category]
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {expense.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sys-label-tertiary)' }}>
                      {expense.date ? new Date(expense.date.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
                    </span>
                    {expense.paid && (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--sys-green)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(48, 209, 88, 0.1)' }}>PAID</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
                    ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </div>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.2 }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </PullToRefresh>
  );
}
