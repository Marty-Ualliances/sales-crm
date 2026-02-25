'use client';
import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImportCSV } from '@/hooks/useApi';
import * as XLSX from 'xlsx';

interface CSVRow {
  [key: string]: string;
}

const LEAD_FIELDS = [
  'Date', 'Source', 'Name', 'Title', 'Company Name', 'Email',
  'Work Direct Phone', 'Home Phone', 'Mobile Phone', 'Corporate Phone',
  'Other Phone', 'Company Phone', 'Employees',
  'Person LinkedIn URL', 'Website', 'Company LinkedIn URL',
  'City', 'State', 'Assigned', 'Status', 'Notes',
];

const ACCEPTED_EXTENSIONS = '.csv,.tsv,.txt,.xlsx,.xls';

export default function CSVUploadPage() {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: number; skipped: number; errorDetails: { row: number; error: string }[] } | null>(null);

  const importMutation = useImportCSV();

  const parseFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

        if (jsonData.length < 2) {
          setHeaders([]);
          setRows([]);
          return;
        }

        const h = jsonData[0].map((cell: any) => String(cell || '').trim()).filter(Boolean);
        setHeaders(h);

        const parsedRows = jsonData.slice(1)
          .filter(row => row.some((cell: any) => String(cell || '').trim() !== ''))
          .map(row => {
            const obj: CSVRow = {};
            h.forEach((header, i) => {
              obj[header] = String(row[i] || '').trim();
            });
            return obj;
          });

        setRows(parsedRows);
        setStep('preview');
      } catch (err) {
        console.error('File parse error:', err);
        setHeaders([]);
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleFile = (f: File) => {
    setFile(f);
    parseFile(f);
  };

  const isAcceptedFile = (f: File) => {
    const ext = f.name.toLowerCase();
    return ext.endsWith('.csv') || ext.endsWith('.tsv') || ext.endsWith('.txt') || ext.endsWith('.xlsx') || ext.endsWith('.xls');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && isAcceptedFile(f)) handleFile(f);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setStep('importing');
    try {
      const res = await importMutation.mutateAsync(file);
      setResult(res);
      setStep('done');
    } catch (err: any) {
      setResult({ imported: 0, errors: 1, skipped: 0, errorDetails: [{ row: 0, error: err.message }] });
      setStep('done');
    }
  };

  const downloadTemplate = () => {
    const csv = LEAD_FIELDS.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Import leads from CSV, TSV, or Excel files</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {['Upload', 'Preview', 'Importing', 'Done'].map((s, i) => {
          const stepIndex = ['upload', 'preview', 'importing', 'done'].indexOf(step);
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i <= stepIndex ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${dragOver ? 'border-primary bg-accent' : 'border-border bg-card'}`}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground mb-2">Drop your file here</p>
            <p className="text-sm text-muted-foreground mb-4">Supports CSV, TSV, Excel (.xlsx, .xls)</p>
            <input type="file" accept={ACCEPTED_EXTENSIONS} className="hidden" id="csv-input" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Button onClick={() => document.getElementById('csv-input')?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Select File
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-2">Expected Columns (auto-matched)</h3>
            <div className="flex flex-wrap gap-1.5">
              {LEAD_FIELDS.map(f => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Column headers are auto-matched. Only "Name" is recommended — all other fields are optional. Unrecognized columns are saved in notes.</p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Preview ({rows.length} leads)</span>
              <Badge variant="secondary">{headers.length} columns detected</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {headers.slice(0, 8).map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                    {headers.length > 8 && <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">...</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {headers.slice(0, 8).map(h => (
                        <td key={h} className="px-4 py-2 text-muted-foreground whitespace-nowrap max-w-[150px] truncate">{row[h] || '—'}</td>
                      ))}
                      {headers.length > 8 && <td className="px-4 py-2 text-muted-foreground">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">...and {rows.length - 5} more rows</div>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); setRows([]); setHeaders([]); }}>Back</Button>
            <Button onClick={handleImport} className="gradient-primary border-0">
              Import {rows.length} Leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <h2 className="text-xl font-bold text-foreground mb-2">Importing Leads...</h2>
          <p className="text-muted-foreground">Processing {rows.length} rows. Please wait.</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-8 text-center ${result.imported > 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
            {result.imported > 0 ? (
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            ) : (
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            )}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {result.imported > 0 ? 'Import Complete!' : 'Import Failed'}
            </h2>
            <p className="text-muted-foreground mb-1">{result.imported} leads imported successfully.</p>
            {result.errors > 0 && (
              <p className="text-sm text-destructive">{result.errors} rows had errors.</p>
            )}
          </div>

          {result.errorDetails && result.errorDetails.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-card p-4 shadow-card">
              <h3 className="text-sm font-semibold text-destructive mb-2">Error Details</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errorDetails.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="text-destructive font-medium">Row {e.row}:</span> {e.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Button onClick={() => { setStep('upload'); setFile(null); setRows([]); setHeaders([]); setResult(null); }}>
            Upload Another File
          </Button>
        </div>
      )}
    </div>
  );
}
