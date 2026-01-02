import type { Process, ProcessDetail, Stage } from '@/types';

export function exportToCSV(processes: ProcessDetail[]): string {
  const headers = ['Company', 'Position', 'Status', 'Stage Name', 'Stage Date', 'Notes', 'Created At', 'Updated At'];
  const rows = processes.flatMap(process => {
    if (process.stages && process.stages.length > 0) {
      return process.stages.map(stage => [
        process.company_name,
        process.position || '',
        process.status,
        stage.stage_name,
        stage.stage_date,
        stage.notes || '',
        process.created_at,
        process.updated_at,
      ]);
    } else {
      return [[
        process.company_name,
        process.position || '',
        process.status,
        '',
        '',
        '',
        process.created_at,
        process.updated_at,
      ]];
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function exportToJSON(processes: ProcessDetail[]): string {
  return JSON.stringify(processes, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProcessesToCSV(processes: ProcessDetail[]) {
  const csv = exportToCSV(processes);
  const filename = `processes_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

export function exportProcessesToJSON(processes: ProcessDetail[]) {
  const json = exportToJSON(processes);
  const filename = `processes_${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

