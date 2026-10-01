import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DEFAULT_TODO_CATEGORY } from '../core/todoCategories';
import TodoCategoryPicker from './TodoCategoryPicker';

afterEach(cleanup);

function Harness() {
  const [category, setCategory] = useState(DEFAULT_TODO_CATEGORY);
  const [saved, setSaved] = useState('');
  return (
    <>
      <output aria-label="Selected category">{category}</output>
      <output aria-label="Saved category">{saved}</output>
      <TodoCategoryPicker
        value={category}
        onChange={setCategory}
        options={[DEFAULT_TODO_CATEGORY, 'Bookings']}
      />
      <button type="button" onClick={() => setSaved(category)}>Save Task</button>
    </>
  );
}

describe('TodoCategoryPicker', () => {
  it('publishes a typed category before the parent form saves', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New category name' }), { target: { value: '  Hiking   prep ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Task' }));

    expect(screen.getByLabelText('Selected category').textContent).toBe('Hiking prep');
    expect(screen.getByLabelText('Saved category').textContent).toBe('Hiking prep');
  });

  it('focuses the selected category after committing a custom category', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New category name' }), { target: { value: 'Gear' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add category' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Gear' })));
  });

  it('restores the prior selection and focuses New after cancellation', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New category name' }), { target: { value: 'Gear' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel new category' }));

    expect(screen.getByLabelText('Selected category').textContent).toBe(DEFAULT_TODO_CATEGORY);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New' })));
  });
});
