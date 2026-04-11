import { useState, useMemo } from 'react';
import { Plus, PieChart, Wallet, CreditCard, ShoppingBag, Utensils, Plane, Car, Menu, Mountain, Bed, Activity, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { Expense, ItineraryItem } from '../core/models';

export default function CostTrackerScreen() {
  const { expenses, items, addExpense, setEditingItem, setEditingExpense, setSidebarOpen } = useTripStore();
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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Trip Financials
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-1.5px', color: '#FFF' }}>
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--sys-label-secondary)', marginBottom: '6px' }}>
              total
            </span>
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
      </div>

      <div style={{ padding: '24px', paddingBottom: '120px' }}>
        {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--sys-bg-elevated)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ color: 'var(--sys-blue)', marginBottom: '12px' }}><PieChart size={24} /></div>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: '0 0 4px 0' }}>Itinerary</p>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
            ${itineraryExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0).toLocaleString()}
          </h3>
        </div>
        <div style={{ background: 'var(--sys-bg-elevated)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
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
          className="btn-glass-blue"
          style={{ 
            width: '100%', padding: '16px', borderRadius: '16px', 
            fontSize: '16px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', gap: '8px', marginBottom: '32px',
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
            style={{ 
              width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', 
              marginBottom: '20px', boxSizing: 'border-box', colorScheme: 'dark'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>Cancel</button>
            <button onClick={handleAdd} className="btn-glass-blue" style={{ flex: 1, padding: '12px', borderRadius: '12px' }}>Save</button>
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
              onClick={() => {
                if (exp.linkedItemId) {
                  const item = items.find(i => i.id === exp.linkedItemId);
                  if (item) setEditingItem(item);
                } else {
                  setEditingExpense(exp);
                }
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '16px', 
                background: 'var(--sys-bg-elevated)', padding: '16px', 
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
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

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <p style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                    ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  
                  {exp.paidAmount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                       {exp.paidAmount > exp.amount && <AlertCircle size={10} color="#FF453A" />}
                       <span style={{ fontSize: '11px', fontWeight: 700, color: exp.paidAmount > exp.amount ? '#FF453A' : 'var(--sys-green)' }}>
                         PAID ${exp.paidAmount.toLocaleString()}
                       </span>
                    </div>
                  )}

                  {!exp.paid && exp.amount > exp.paidAmount && (
                    <span style={{ fontSize: '10px', color: 'var(--sys-label-tertiary)', fontWeight: 600 }}>
                      DUE ${ (exp.amount - exp.paidAmount).toLocaleString() }
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
