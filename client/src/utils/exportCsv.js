/**
 * Export an array of objects to a CSV file download
 * @param {object[]} rows
 * @param {string} filename
 */
export function exportToCsv(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines   = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        // Escape double quotes and wrap if contains comma/newline
        const escaped = v.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
          ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
