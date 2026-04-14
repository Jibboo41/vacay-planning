import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ItineraryItem, Expense } from '../core/models';

/**
 * Professional Trip Export with Styled Formatting for Excel/Google Sheets
 */
export async function downloadTripExcel(tripTitle: string, items: ItineraryItem[], expenses: Expense[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vacay Planner';
  workbook.lastModifiedBy = 'Vacay Planner';
  workbook.created = new Date();
  
  // Create Main Itinerary Sheet
  const sheet = workbook.addWorksheet('Trip Itinerary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
    properties: { tabColor: { argb: '0A84FF' } }
  });

  // --- STYLING DEFS ---
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
  const dayGroupFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E1F5FE' } };
  const whiteText: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFF' }, bold: true };
  const boldText: Partial<ExcelJS.Font> = { bold: true };
  const centerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
  const currencyNumFmt = '"$"#,##0.00';

  // --- HEADER: TRIP TITLE ---
  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = tripTitle.toUpperCase();
  titleCell.font = { size: 20, bold: true, color: { argb: '0A84FF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 40;

  // --- COLUMN DEFINITIONS ---
  const columns = [
    { header: 'DATE', key: 'date', width: 14 },
    { header: 'TIME', key: 'time', width: 10 },
    { header: 'CATEGORY', key: 'category', width: 12 },
    { header: 'ACTIVITY / ITEM', key: 'title', width: 35 },
    { header: 'DETAILS', key: 'details', width: 25 },
    { header: 'LOCATION', key: 'location', width: 35 },
    { header: 'NOTES', key: 'notes', width: 30 },
    { header: 'EST. COST', key: 'cost', width: 12, style: { numFmt: currencyNumFmt } },
    { header: 'PAID', key: 'paid', width: 12, style: { numFmt: currencyNumFmt } },
    { header: 'BALANCE', key: 'balance', width: 12, style: { numFmt: currencyNumFmt } },
  ];
  sheet.columns = columns;

  // Style Header Row (Row 2)
  const headerRow = sheet.getRow(2);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = whiteText;
    cell.alignment = centerAlign;
    cell.border = { bottom: { style: 'thick', color: { argb: '0A84FF' } } };
  });

  // --- DATA PROCESSING: Group Items by Date ---
  const sortedItems = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
  
  let currentDay = '';
  
  sortedItems.forEach((item) => {
    const itemDate = item.startDate.split('T')[0];
    const timeStr = item.startDate.includes('T') ? new Date(item.startDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '---';
    
    // Add Day Header if date changed
    if (itemDate !== currentDay) {
      currentDay = itemDate;
      const dayLabel = new Date(itemDate.replace(/-/g, '/')).toLocaleDateString(undefined, { 
        weekday: 'long', month: 'short', day: 'numeric' 
      }).toUpperCase();
      
      const dayRow = sheet.addRow([dayLabel]);
      sheet.mergeCells(`A${dayRow.number}:J${dayRow.number}`);
      dayRow.getCell(1).fill = dayGroupFill;
      dayRow.getCell(1).font = { bold: true, color: { argb: '01579B' } };
      dayRow.height = 22;
    }

    // Add Itinerary Item
    const details = [];
    if (item.hikeDetails) details.push(`${item.hikeDetails.distance} | ${item.hikeDetails.difficulty}`);
    if (item.confirmationNumber) details.push(`Conf: ${item.confirmationNumber}`);
    
    const row = sheet.addRow({
      date: itemDate,
      time: timeStr,
      category: item.type.toUpperCase(),
      title: item.title,
      details: details.join('\n'),
      location: item.location.name || item.location.address || '',
      notes: item.description || '',
      cost: item.cost || 0,
      paid: item.paidAmount || 0,
      balance: (item.cost || 0) - (item.paidAmount || 0)
    });

    row.height = item.description && item.description.length > 50 ? 40 : 25;
    row.getCell('title').font = boldText;
    row.alignment = { vertical: 'middle', wrapText: true };
    
    // Balance highlighting
    const balCell = row.getCell('balance');
    if (balCell.value && (balCell.value as number) > 0) {
      balCell.font = { color: { argb: 'FF3B30' }, bold: true };
    }
  });


  // --- EXPENSE SUMMARY SHEET ---
  const expSheet = workbook.addWorksheet('Financial Summary', {
    properties: { tabColor: { argb: 'FF9F0A' } }
  });

  expSheet.columns = [
    { header: 'CATEGORY', key: 'category', width: 20 },
    { header: 'TITLE', key: 'title', width: 40 },
    { header: 'DATE', key: 'date', width: 14 },
    { header: 'EST. COST', key: 'amount', width: 15, style: { numFmt: currencyNumFmt } },
    { header: 'ACTUAL PAID', key: 'paid', width: 15, style: { numFmt: currencyNumFmt } },
    { header: 'REMAINING', key: 'balance', width: 15, style: { numFmt: currencyNumFmt } },
    { header: 'STATUS', key: 'status', width: 12 },
  ];

  // Title for Summary
  expSheet.mergeCells('A1:G1');
  const expTitle = expSheet.getCell('A1');
  expTitle.value = 'EXPENSE & BUDGET BREAKDOWN';
  expTitle.font = { size: 16, bold: true, color: { argb: 'FF9F0A' } };
  expTitle.alignment = centerAlign;
  expSheet.getRow(1).height = 30;

  // Header Row styling
  expSheet.getRow(2).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '333333' } };
    cell.font = whiteText;
    cell.alignment = centerAlign;
  });

  expenses.forEach(exp => {
    const row = expSheet.addRow({
      category: exp.category.toUpperCase(),
      title: exp.title,
      date: exp.date || 'TBD',
      amount: exp.amount,
      paid: exp.paidAmount || 0,
      balance: exp.amount - (exp.paidAmount || 0),
      status: exp.paid ? 'PAID' : 'PENDING'
    });
    
    if (!exp.paid) {
      row.getCell('status').font = { color: { argb: 'FF9F0A' }, bold: true };
    } else {
      row.getCell('status').font = { color: { argb: '30D158' }, bold: true };
    }
  });

  // Footer Totals
  const totalRow = expSheet.addRow({
    category: 'GRAND TOTALS',
    amount: expenses.reduce((sum, e) => sum + e.amount, 0),
    paid: expenses.reduce((sum, e) => sum + (e.paidAmount || 0), 0),
    balance: expenses.reduce((sum, e) => sum + (e.amount - (e.paidAmount || 0)), 0),
  });
  totalRow.eachCell(cell => {
    cell.font = { bold: true, size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEEEEE' } };
  });

  // --- GENERATE BLOB ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${tripTitle.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, filename);
}
