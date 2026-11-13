import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import type { Expense } from '../../core/models';
import { EXPENSE_CATEGORIES, normalizeExpenseCategory } from '../../core/expenseCategories';

export default function EditManualExpenseModal() {
  const { editingExpense, updateExpense, deleteExpense, setEditingExpense } = useTripStore();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Other');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setPaidAmount(editingExpense.paidAmount?.toString() || '0');
      setCategory(normalizeExpenseCategory(editingExpense.category));
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
        <div className="modal-pull-indicator" />
        <div className="modal-header">
          <h2 className="modal-title">Edit Expense</h2>
          <button onClick={() => setEditingExpense(null)} className="icon-btn icon-btn--round" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="modal-form">
          <div className="edit-field-group">
            <label className="edit-field-label">Title</label>
            <input 
              className="edit-field-input"
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What was this for?"
            />
          </div>

          <div className="form-row">
            <div className="edit-field-group">
              <label className="edit-field-label">Estimated Cost ($)</label>
              <input 
                className="edit-field-input"
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="edit-field-group">
              <label className="edit-field-label">Amount Paid ($)</label>
              <input 
                className="edit-field-input"
                type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="edit-field-group">
              <label className="edit-field-label">Category</label>
              <select 
                className="edit-field-input"
                value={category} onChange={e => setCategory(e.target.value as any)}
              >
                {EXPENSE_CATEGORIES.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className="edit-field-group">
              <label className="edit-field-label">Date (Optional)</label>
              <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
                <input 
                  className="edit-field-input"
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', display: 'block', margin: 0 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer modal-footer--safe">
          <button
            onClick={handleSave}
            className="btn btn--primary btn--lg"
          >
            <Save size={18} />
            Save Changes
          </button>
          <button
            onClick={handleDelete}
            className="icon-btn icon-btn--danger modal-footer__icon"
            aria-label="Delete expense"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
