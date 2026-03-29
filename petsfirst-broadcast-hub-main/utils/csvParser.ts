import * as XLSX from 'xlsx';
import { Contact, CSVData } from '../types';

const NUMBER_HEADER_NORMALIZED = 'phone';

/** Name column: Name, NAME, name, etc. */
function isNameHeader(header: string): boolean {
  return header.trim().toLowerCase() === 'name';
}

/** Phone/Number column: Number, Phone, number, phone, Mobile, etc. */
function isNumberHeader(header: string): boolean {
  const h = header.trim().toLowerCase();
  return ['phone', 'number', 'mobile', 'contact', 'phone number', 'mobile number'].includes(h);
}

/**
 * Validates that the sheet has a Name column and a Phone/Number column (anywhere).
 * Order does not matter. Throws with a clear message if name or phone column is missing.
 */
function validateSheetHasRequiredColumns(rawHeaders: string[], fileType: 'CSV' | 'Excel'): void {
  if (rawHeaders.length < 2) {
    const found = rawHeaders.length === 0 ? 'no columns' : `only ${rawHeaders.length} column(s): "${(rawHeaders[0] ?? '').trim() || '(empty)'}"`;
    throw new Error(
      `${fileType} must have at least two columns. Required: a Name column and a Phone/Number column (e.g. "Name", "Phone"). Found: ${found}.`
    );
  }
  const hasName = rawHeaders.some(h => isNameHeader(h));
  const hasPhone = rawHeaders.some(h => isNumberHeader(h));
  if (!hasName && !hasPhone) {
    throw new Error(
      `This sheet is missing required columns. It must include a column for Name and a column for Phone/Number (e.g. Name, Phone, Number, Mobile). Found: ${rawHeaders.join(', ') || 'no headers'}.`
    );
  }
  if (!hasName) {
    throw new Error(
      'This sheet must include a Name column (e.g. Name, NAME, name). Please add a column with that header and upload again.'
    );
  }
  if (!hasPhone) {
    throw new Error(
      'This sheet must include a Phone/Number column (e.g. Phone, Number, Mobile). Please add a column with that header and upload again.'
    );
  }
}

export const parseCSV = (content: string): CSVData => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error("CSV must contain headers and at least one data row.");

  const rawHeaders = lines[0].split(',').map(h => h.trim());
  validateSheetHasRequiredColumns(rawHeaders, 'CSV');
  const headers = rawHeaders.map(h => h.trim());

  const rows: Contact[] = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const contact: any = {};
    headers.forEach((header, index) => {
      contact[header] = values[index] || '';
    });
    return contact as Contact;
  });

  return { headers, rows };
};

export const parseExcel = (buffer: ArrayBuffer): CSVData => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excel file is empty or has no sheets.");
  }
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
    header: 1,
    defval: ''
  }) as any[][];
  
  if (jsonData.length < 2) {
    throw new Error("Excel sheet must contain headers and at least one data row.");
  }

  // First row is headers
  const rawHeaders = (jsonData[0] as string[]).map(h => String(h ?? '').trim());
  validateSheetHasRequiredColumns(rawHeaders, 'Excel');
  const headers = rawHeaders.map(h => h.trim());

  // Parse data rows
  const rows: Contact[] = jsonData.slice(1)
    .filter(row => row.some((cell: any) => cell !== '' && cell != null)) // Skip empty rows
    .map(row => {
      const contact: any = {};
      headers.forEach((header, index) => {
        let value = row[index] ?? '';
        // Convert phone numbers to string and handle formatting
        if (header === NUMBER_HEADER_NORMALIZED) {
          value = String(value).replace(/\.0$/, ''); // Remove .0 from number formatting
        }
        contact[header] = String(value).trim();
      });
      return contact as Contact;
    });

  return { headers, rows };
};

export const parseFile = async (file: File): Promise<CSVData> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    // Parse as CSV
    const content = await file.text();
    return parseCSV(content);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    // Parse as Excel
    const buffer = await file.arrayBuffer();
    return parseExcel(buffer);
  } else {
    throw new Error("Unsupported file format. Please upload a CSV or Excel file (.xlsx, .xls).");
  }
};
