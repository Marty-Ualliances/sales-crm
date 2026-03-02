'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Loader2, Download, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImportCSV, useImportPreview } from '@/features/leads/hooks/useLeads';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from 'sonner';

// Valid model fields allowed for mapping
const VALID_CRM_FIELDS = [
  { id: 'date', label: 'Added Date' },
  { id: 'source', label: 'Source' },
  { id: 'name', label: 'Name' },
  { id: 'title', label: 'Job Title' },
  { id: 'companyName', label: 'Company Name' },
  { id: 'email', label: 'Email' },
  { id: 'workDirectPhone', label: 'Work Direct Phone' },
  { id: 'homePhone', label: 'Home Phone' },
  { id: 'mobilePhone', label: 'Mobile Phone' },
  { id: 'corporatePhone', label: 'Corporate Phone' },
  { id: 'otherPhone', label: 'Other Phone' },
  { id: 'companyPhone', label: 'Company Phone' },
  { id: 'employeeCount', label: 'Employee Count' },
  { id: 'personLinkedinUrl', label: 'Personal LinkedIn' },
  { id: 'website', label: 'Website' },
  { id: 'companyLinkedinUrl', label: 'Company LinkedIn' },
  { id: 'address', label: 'Address' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State' },
  { id: 'status', label: 'Lead Status' },
  { id: 'assignedAgent', label: 'Assigned Agent' },
  { id: 'notes', label: 'Notes' },
  { id: 'nextFollowUp', label: 'Next Follow-up' },
  { id: 'priority', label: 'Priority (A/B/C)' },
  { id: 'segment', label: 'Segment / Industry' },
  { id: 'sourceChannel', label: 'Source Channel' },
  { id: 'revenue', label: 'Revenue / Deal Value' },
];

const ACCEPTED_EXTENSIONS = '.csv,.tsv,.txt,.xlsx,.xls';

export default function CSVUploadPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Mapping state
  const [mappingData, setMappingData] = useState<any>(null);
  const [customMappings, setCustomMappings] = useState<Record<string, string | null>>({});

  const [result, setResult] = useState<{ imported: number; errors: number; skipped: number; errorDetails: { row: number; error: string }[] } | null>(null);

  const previewMutation = useImportPreview();
  const importMutation = useImportCSV();

  const handleFile = async (f: File) => {
    setFile(f);
    try {
      const res = await previewMutation.mutateAsync(f);
      setMappingData(res);

      // Initialize custom mappings from auto-detected ones
      const initialMap: Record<string, string | null> = {};
      res.mappings.forEach((m: any) => {
        initialMap[m.csvHeader] = m.crmField;
      });
      setCustomMappings(initialMap);

      setStep('mapping');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file');
      setFile(null);
    }
  };

  const handleMappingConfirm = () => {
    setStep('preview');
  };

  const handleImport = async () => {
    if (!file) return;
    setStep('importing');
    try {
      const res = await importMutation.mutateAsync({
        file,
        customMappings
      });
      setResult(res);
      setStep('done');
    } catch (err: any) {
      setResult({ imported: 0, errors: 1, skipped: 0, errorDetails: [{ row: 0, error: err.message }] });
      setStep('done');
    }
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

  const downloadTemplate = () => {
    const csv = VALID_CRM_FIELDS.map(f => f.label).join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateMapping = (csvHeader: string, crmField: string | null) => {
    setCustomMappings(prev => ({
      ...prev,
      [csvHeader]: crmField === 'unmapped' ? null : crmField
    }));
  };

  const getConfidenceBadge = (csvHeader: string) => {
    // Find the original mapping to see confidence
    const original = mappingData?.mappings.find((m: any) => m.csvHeader === csvHeader);
    const current = customMappings[csvHeader];

    if (!current) return <Badge variant="outline" className="text-[10px] font-normal opacity-50">Unmapped</Badge>;

    // If user changed it, it's "manual"
    if (original && original.crmField !== current) {
      return <Badge variant="secondary" className="text-[10px] font-normal bg-blue-500/10 text-blue-500 border-blue-500/20">Manual</Badge>;
    }

    if (original?.confidence === 'exact') {
      return <Badge variant="secondary" className="text-[10px] font-normal bg-success/10 text-success border-success/20">Exact Match</Badge>;
    }
    if (original?.confidence === 'partial') {
      return <Badge variant="secondary" className="text-[10px] font-normal bg-amber-500/10 text-amber-500 border-amber-500/20">Partial Match</Badge>;
    }
    if (original?.confidence === 'fuzzy') {
      return <Badge variant="secondary" className="text-[10px] font-normal bg-orange-500/10 text-orange-500 border-orange-500/20">Fuzzy Match</Badge>;
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Import leads with robust column mapping and synonym detection</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['Upload', 'Map Columns', 'Preview', 'Importing', 'Done'].map((s, i) => {
          const stepIndex = ['upload', 'mapping', 'preview', 'importing', 'done'].indexOf(step);
          return (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i <= stepIndex ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              {i < 4 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
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
            className={`rounded-xl border-2 border-dashed p-16 text-center transition-colors ${dragOver ? 'border-primary bg-accent' : 'border-border bg-card shadow-sm'}`}
          >
            {previewMutation.isPending ? (
              <div className="py-2">
                <Loader2 className="h-10 w-10 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-lg font-medium text-foreground">Analyzing spreadsheet...</p>
                <p className="text-sm text-muted-foreground">Identifying columns and data types</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground mb-2">Drop your spreadsheet here</p>
                <p className="text-sm text-muted-foreground mb-6">Supports CSV, TSV, Excel (.xlsx, .xls)</p>
                <input type="file" accept={ACCEPTED_EXTENSIONS} className="hidden" id="csv-input" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }} />
                <Button size="lg" onClick={() => document.getElementById('csv-input')?.click()} className="gradient-primary border-0 px-8">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold text-foreground">Robust Mapping</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our AI-powered mapper recognizes 100+ synonyms. It handles "Agency Name" as "Company Name", "Direct Dial" as "Phone", and automatically merges "First Name" + "Last Name".
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Safe Handling</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unrecognized columns are never lost— we automatically append them to the "Notes" field of each lead so you can keep all your data.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 'mapping' && mappingData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Confirm Column Mapping</h3>
                <p className="text-xs text-muted-foreground">We've auto-matched these columns. You can manually adjust them if needed.</p>
              </div>
              <Badge variant="outline" className="bg-card">{mappingData.headers.length} columns detected</Badge>
            </div>

            <div className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-medium">Spreadshet Column</th>
                    <th className="px-5 py-3 text-left font-medium">Maps to CRM Field</th>
                    <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Sample Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mappingData.headers.map((h: string) => {
                    const sampleVal = mappingData.sampleRows?.[0]?.[h] || '';
                    return (
                      <tr key={h} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-foreground">{h}</div>
                          {getConfidenceBadge(h)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Select
                            value={customMappings[h] || 'unmapped'}
                            onValueChange={(val) => updateMapping(h, val)}
                          >
                            <SelectTrigger className="w-full sm:w-[240px] h-9 text-xs">
                              <SelectValue placeholder="Map to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unmapped" className="text-xs italic text-muted-foreground">
                                Skip (save in Notes)
                              </SelectItem>
                              {VALID_CRM_FIELDS.map(f => (
                                <SelectItem key={f.id} value={f.id} className="text-xs">
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                            {sampleVal || <span className="opacity-30 italic">empty</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {mappingData.mergeRules.length > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-4">
              <div className="p-2 rounded-full bg-blue-500/10">
                <HelpCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-700">Auto-Merge Detected</h4>
                <p className="text-xs text-blue-600/80 mt-1">
                  We found separate <strong>{mappingData.mergeRules[0].sourceHeaders.join(' & ')}</strong> columns. They will be combined into a single <strong>Name</strong> field automatically.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); }}>Back</Button>
            <Button onClick={handleMappingConfirm} className="gradient-primary border-0 px-8 shadow-md">
              Review Leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && mappingData && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Data Preview</h3>
                <p className="text-xs text-muted-foreground">Showing the first few leads to import</p>
              </div>
              <Badge variant="outline" className="bg-card text-primary font-bold border-primary/20">
                {mappingData.totalRows} leads to process
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {mappingData.headers.filter((h: string) => customMappings[h]).slice(0, 7).map((h: string) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {VALID_CRM_FIELDS.find(f => f.id === customMappings[h])?.label || h}
                      </th>
                    ))}
                    <th className="text-left px-5 py-3 text-[10px] whitespace-nowrap opacity-40 italic font-normal">...more</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingData.sampleRows.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                      {mappingData.headers.filter((h: string) => customMappings[h]).slice(0, 7).map((h: string) => (
                        <td key={h} className="px-5 py-3 text-muted-foreground whitespace-nowrap max-w-[180px] truncate text-xs">
                          {row[h] || '—'}
                        </td>
                      ))}
                      <td className="px-5 py-3 opacity-20">•••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('mapping')}>Back to Mapping</Button>
            <Button onClick={handleImport} className="gradient-primary border-0 px-8 shadow-md">
              Finish and Import {mappingData.totalRows} Leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="rounded-xl border border-border bg-card p-20 text-center shadow-card border-t-4 border-t-primary">
          <div className="relative inline-block mb-6">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-primary/40" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Importing Leads...</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            We're processing {mappingData?.totalRows || ''} rows, matching records, and setting up workflows. This usually takes just a few seconds.
          </p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-6">
          <div className={`rounded-xl border-t-4 p-10 text-center transition-all shadow-md bg-card ${result.imported > 0 ? 'border-success/60' : 'border-destructive/60'}`}>
            <div className="mb-6 inline-flex p-4 rounded-full bg-muted/30">
              {result.imported > 0 ? (
                <CheckCircle className="h-12 w-12 text-success" />
              ) : (
                <AlertCircle className="h-12 w-12 text-destructive" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {result.imported > 0 ? 'Import Successful!' : 'Import Failed'}
            </h2>

            <div className="flex justify-center gap-8 mt-6 mb-8 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-success">{result.imported}</span>
                <span className="text-muted-foreground uppercase text-[10px] tracking-widest font-semibold">Imported</span>
              </div>
              {result.skipped > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-amber-500">{result.skipped}</span>
                  <span className="text-muted-foreground uppercase text-[10px] tracking-widest font-semibold">Duplicates</span>
                </div>
              )}
              {result.errors > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-destructive">{result.errors}</span>
                  <span className="text-muted-foreground uppercase text-[10px] tracking-widest font-semibold">Errors</span>
                </div>
              )}
            </div>

            <Button size="lg" onClick={() => { setStep('upload'); setFile(null); setMappingData(null); setResult(null); }} className="px-10">
              Import Another File
            </Button>
          </div>

          {result.errorDetails && result.errorDetails.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-destructive/5 border-b border-destructive/10 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-semibold text-destructive">Error Details</h3>
              </div>
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {result.errorDetails.map((e, i) => (
                  <div key={i} className="text-xs p-2.5 rounded bg-muted/30 border border-border/50 flex gap-3">
                    <span className="text-destructive font-bold shrink-0">Row {e.row}:</span>
                    <span className="text-muted-foreground leading-relaxed">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
