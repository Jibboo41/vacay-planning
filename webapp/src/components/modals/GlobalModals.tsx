import { useTripStore } from '../../store/useTripStore';
import EditItineraryModal from './EditItineraryModal';
import EditManualExpenseModal from './EditManualExpenseModal';

export default function GlobalModals() {
  const { editingItem, setEditingItem, updateItem, editingExpense } = useTripStore();

  return (
    <>
      {editingItem && (
        <EditItineraryModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)}
          onSave={(id, updates) => {
            updateItem(id, updates);
            setEditingItem(null);
          }}
        />
      )}
      {editingExpense && (
        <EditManualExpenseModal />
      )}
    </>
  );
}
