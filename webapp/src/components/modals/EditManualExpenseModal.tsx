import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import type { Expense } from '../../core/models';

export default function EditManualExpenseModal() {
  const { editingExpense, updateExpense, deleteExpense, setEditingExpense } = useTripStore();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('manual');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setPaidAmount(editingExpense.paidAmount?.toString() || '0');
      setCategory(editingExpense.category);
      setDate(editingExpense.date || '');
    }
  }, [editingExpense]);

  if (!editingExpense) return null;

  const handleSave = async () => {
    const est = parseFloat(amount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    
    await updateExpense(editingExpense.id, {
      title,
      amount: est,
      paidAmount: paid,
      category,
      date: date || undefined,
      paid: paid >= est && est > 0
    });
    setEditingExpense(null);
  };

  const handleDelete = async () => {
    if (confirm('Delete this expense?')) {
      await deleteExpense(editingExpense.id);
      setEditingExpense(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setEditingExpense(null)}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Edit Expense</h2>
          <button onClick={() => setEditingExpense(null)}><X size={22} color="var(--sys-label-secondary)" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="edit-field-group">
            <label className="edit-field-label">Title</label>
            <input 
              className="edit-field-input"
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What was this for?"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="edit-field-group" style={{ flex: 1 }}>
              <label className="edit-field-label">Estimated Cost ($)</label>
              <input 
                className="edit-field-input"
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="edit-field-group" style={{ flex: 1 }}>
              <label className="edit-field-label">Amount Paid ($)</label>
              <input 
                className="edit-field-input"
                type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="edit-field-group" style={{ flex: 1 }}>
              <label className="edit-field-label">Category</label>
              <select 
                className="edit-field-input"
                value={category} onChange={e => setCategory(e.target.value as any)}
              >
                <option value="manual">Wallet / General</option>
                <option value="food">Food & Dining</option>
                <option value="transport">Transit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="edit-field-group" style={{ flex: 1 }}>
              <label className="edit-field-label">Date (Optional)</label>
              <input 
                className="edit-field-input"
                type="date" value={date} onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleDelete}
            style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 69, 58, 0.1)', border: 'none', color: '#FF453A' }}
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={handleSave}
            style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'var(--sys-blue)', border: 'none', color: '#FFF', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
