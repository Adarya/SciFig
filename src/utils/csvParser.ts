import Papa from 'papaparse';

export interface ParsedData {
  data: any[];
  columns: string[];
  filename: string;
  rows: number;
  preview: any[];
}

export const parseCSVFile = (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }

        const data = results.data as any[];
        const columns = Object.keys(data[0] || {});
        
        resolve({
          data,
          columns,
          filename: file.name,
          rows: data.length,
          preview: data.slice(0, 5) // First 5 rows for preview
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};