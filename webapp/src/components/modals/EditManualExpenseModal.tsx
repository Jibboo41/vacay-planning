import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import type { Expense } from '../../core/models';
import { Button, Field, IconButton, Input, Select, Sheet } from '../ui';
import { deleteWithUndo } from '../../store/deleteWithUndo';

const EXPENSE_CATEGORIES: Expense['category'][] = ['Car Rental', 'Flights', 'Gas', 'Dining', 'Lodging', 'Souvenirs', 'Other'];

export default function EditManualExpenseModal() {
  const { editingExpense, updateExpense, setEditingExpense } = useTripStore();

  if (!editingExpense) return null;

  return (
    <ExpenseEditor
      key={editingExpense.id}
      expense={editingExpense}
      onClose={() => setEditingExpense(null)}
      onSave={async (id, updates) => {
        await updateExpense(id, updates);
        setEditingExpense(null);
      }}
      onDelete={id => {
        deleteWithUndo('expenses', id, `"${editingExpense.title}"`);
        setEditingExpense(null);
      }}
    />
  );
}

interface ExpenseEditorProps {
  expense: Expense;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Expense>) => Promise<void>;
  onDelete: (id: string) => void;
}

function ExpenseEditor({ expense, onClose, onSave, onDelete }: ExpenseEditorProps) {
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [paidAmount, setPaidAmount] = useState(expense.paidAmount?.toString() || '0');
  const [category, setCategory] = useState<Expense['category']>(expense.category);
  const [date, setDate] = useState(expense.date || '');

  const handleSave = async () => {
    const est = parseFloat(amount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    
    await onSave(expense.id, {
      title,
      amount: est,
      paidAmount: paid,
      category,
      date: date || undefined,
      paid: paid >= est && est > 0
    });
  };

  const handleDelete = () => {
    onDelete(expense.id);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit Expense"
      footer={(
        <>
          <Button onClick={handleSave} className="btn-glass-blue" block size="lg">
            <Save size={18} />
            Save Changes
          </Button>
          <IconButton aria-label="Delete expense" onClick={handleDelete} variant="danger" size="lg">
            <Trash2 size={20} />
          </IconButton>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <Field label="Title">
          {id => (
            <Input
              id={id}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What was this for?"
            />
          )}
        </Field>

        <div className="flex gap-3">
          <Field label="Estimated Cost ($)" className="flex-1">
            {id => (
              <Input
                id={id}
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
              />
            )}
          </Field>
          <Field label="Amount Paid ($)" className="flex-1">
            {id => (
              <Input
                id={id}
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            )}
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="Category" className="flex-1">
            {id => (
              <Select
                id={id}
                value={category}
                onChange={e => setCategory(e.target.value as Expense['category'])}
              >
                {EXPENSE_CATEGORIES.map(value => <option key={value} value={value}>{value}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Date (Optional)" className="flex-1">
            {id => (
              <div className="w-full overflow-hidden rounded-control">
                <Input
                  id={id}
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="m-0 block w-full box-border"
                />
              </div>
            )}
          </Field>
        </div>
      </div>
    </Sheet>
  );
}
