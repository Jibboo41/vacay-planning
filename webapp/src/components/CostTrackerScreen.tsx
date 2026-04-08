import { useState, useMemo } from 'react';
import { Plus, Trash2, PieChart, Wallet, CreditCard, ShoppingBag, Utensils, Plane, Car, Menu, Mountain, Bed, Activity, FileText, CheckCircle, Circle } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { Expense, ItineraryItem } from '../core/models';

export default function CostTrackerScreen() {
  const { expenses, items, addExpense, updateExpense, deleteExpense, setSidebarOpen } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<Expense['category']>('manual');

  // Calculate itinerary costs (items with a .cost field)
  const itineraryExpenses = useMemo(() => {
    return items.filter(i => (i.cost || 0) > 0).map(i => ({
      id: `itinerary-${i.id}`,
      title: i.title,
      amount: i.cost || 0,
      category: 'itinerary' as const,
      date: i.startDate.split('T')[0],
      paid: false, // Itinerary items don't have a separate paid flag yet, assuming unpaid or handled by manual
      linkedItemId: i.id
    }));
  }, [items]);

  const allExpenses = useMemo(() => {
    return [...expenses, ...itineraryExpenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses, itineraryExpenses]);

  const totalCost = allExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
  const totalPaid = allExpenses.filter(e => e.paid).reduce((sum: number, e: Expense) => sum + e.amount, 0);
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
    itinerary: <Plane size={18} />, // Fallback
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
    <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="screen-header glass-effect" style={{ marginBottom: '0' }}>
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', color: '#FFF', margin: 0 }}>
            Cost Tracker
          </h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--sys-label-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Planned</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '24px', margin: 'auto 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--sys-blue)', fontWeight: 700, textTransform: 'uppercase' }}>Remaining</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sys-blue)' }}>
                ${remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', paddingBottom: '120px' }}>
        {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--sys-bg-elevated-1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ color: 'var(--sys-blue)', marginBottom: '12px' }}><PieChart size={24} /></div>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: '0 0 4px 0' }}>Itinerary</p>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
            ${itineraryExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0).toLocaleString()}
          </h3>
        </div>
        <div style={{ background: 'var(--sys-bg-elevated-1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ color: 'var(--sys-green)', marginBottom: '12px' }}><CreditCard size={24} /></div>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: '0 0 4px 0' }}>Manual/Extra</p>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
            ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Add Button / Form */}
      {!showAdd ? (
        <button 
          onClick={() => setShowAdd(true)}
          style={{ 
            width: '100%', padding: '16px', borderRadius: '16px', 
            background: 'var(--sys-blue)', color: '#fff', border: 'none',
            fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', 
            justifyContent: 'center', gap: '8px', marginBottom: '32px',
            boxShadow: '0 8px 24px rgba(10, 132, 255, 0.3)'
          }}
        >
          <Plus size={20} /> Add Expense
        </button>
      ) : (
        <div style={{ 
          background: 'var(--sys-bg-elevated-2)', padding: '24px', borderRadius: '24px', 
          marginBottom: '32px', border: '1px solid var(--sys-blue)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0' }}>New Expense</h3>
          <input 
            type="text" placeholder="What was it for?" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--sys-label-tertiary)' }}>$</span>
              <input 
                type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
            </div>
            <select 
              value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
              style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
            >
              <option value="manual">Wallet</option>
              <option value="food">Food</option>
              <option value="transport">Transit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <input 
            type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>Cancel</button>
            <button onClick={handleAdd} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--sys-blue)', border: 'none', color: '#fff', fontWeight: 700 }}>Save</button>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {allExpenses.map((exp: Expense) => {
          const linkedItem = exp.linkedItemId ? items.find((i: ItineraryItem) => i.id === exp.linkedItemId) : null;
          const icon = linkedItem ? getItineraryIcon(linkedItem.type) : CATEGORY_ICONS[exp.category];
          
          return (
            <div 
              key={exp.id}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '16px', 
                background: 'var(--sys-bg-elevated-1)', padding: '16px', 
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                opacity: exp.paid ? 0.6 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '12px', 
                background: `${CATEGORY_COLORS[exp.category]}20`, 
                color: CATEGORY_COLORS[exp.category],
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{exp.title}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--sys-label-tertiary)' }}>
                  {exp.date || 'TBD'} {exp.category === 'itinerary' && '· Itinerary'}
                </p>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: exp.paid ? 'var(--sys-green)' : (exp.category === 'itinerary' ? 'var(--sys-blue)' : '#fff') }}>
                    ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    {exp.category !== 'itinerary' && (
                      <button 
                        onClick={() => updateExpense(exp.id, { paid: !exp.paid })}
                        style={{ background: 'transparent', border: 'none', color: exp.paid ? 'var(--sys-green)' : 'var(--sys-label-tertiary)', padding: '4px' }}
                      >
                        {exp.paid ? <CheckCircle size={16} /> : <Circle size={16} />}
                      </button>
                    )}
                    {exp.category !== 'itinerary' && (
                      <button 
                        onClick={() => deleteExpense(exp.id)}
                        style={{ background: 'transparent', border: 'none', color: '#FF453A', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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
