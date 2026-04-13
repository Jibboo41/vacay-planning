import type { ItineraryItem, Expense } from '../core/models';

/**
 * Escapes a string for CSV format by doubling quotes and wrapping in quotes if needed.
 */
function escapeCSV(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates and downloads a CSV export of trip timeline items and expenses.
 */
export function downloadTripCSV(tripTitle: string, items: ItineraryItem[], expenses: Expense[]) {
  const headers = [
    'Section',
    'Category',
    'Date',
    'Start Time',
    'End Time',
    'Title',
    'Location',
    'Cost ($)',
    'Paid ($)',
    'Confirmation #',
    'Description/Notes'
  ];

  const rows: string[][] = [];

  // Add Itinerary Items
  items.forEach(item => {
    const date = item.startDate.split('T')[0];
    const startTime = item.startDate.includes('T') ? item.startDate.split('T')[1].substring(0, 5) : '';
    const endTime = item.endDate && item.endDate.includes('T') ? item.endDate.split('T')[1].substring(0, 5) : '';
    
    rows.push([
      'TIMELINE',
      item.type.toUpperCase(),
      date,
      startTime,
      endTime,
      item.title,
      item.location.name || item.location.address || '',
      item.cost?.toString() || '0',
      item.paidAmount?.toString() || '0',
      item.confirmationNumber || '',
      item.description || ''
    ]);
  });

  // Add a separator row
  rows.push([]);
  rows.push(['EXPENSES SUMMARY']);
  rows.push([
    'Section',
    'Category',
    'Date',
    '', // No start time
    '', // No end time
    'Title',
    'Payment Method',
    'Cost ($)',
    'Paid Amount ($)',
    'Status',
    'Notes'
  ]);

  // Add Expenses
  expenses.forEach(exp => {
    rows.push([
      'EXPENSE',
      exp.category.toUpperCase(),
      exp.date || '',
      '',
      '',
      exp.title,
      '', // No payment method in model
      exp.amount.toString(),
      exp.paidAmount?.toString() || '0',
      exp.paid ? 'PAID' : 'UNPAID',
      '' // No notes in expense model
    ]);
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const filename = `${tripTitle.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
