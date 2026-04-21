import { UploadCloud } from 'lucide-react';
import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { Button } from '../../design-system/Button';

interface Props {
  uploading: boolean;
  onFile: (file: File) => void;
}

const ALLOWED_EXT = ['.csv', '.json', '.xml'];

export function UploadDropzone({ uploading, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => name.endsWith(ext))) {
      setError('Only .csv, .json, or .xml files are supported.');
      return;
    }
    setError(null);
    onFile(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => pick(e.target.files?.[0]);
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-[12px] border-2 border-dashed p-8 text-center transition ${
        dragOver ? 'border-brand-600 bg-brand-50' : 'border-brand-200 bg-surface'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.xml,application/json,text/csv,text/xml,application/xml"
        onChange={onChange}
        className="hidden"
      />
      <UploadCloud className="mx-auto mb-3 h-10 w-10 text-brand-600" />
      <p className="font-display text-base font-semibold text-ink">Upload transaction file</p>
      <p className="mt-1 text-sm text-ink-muted">
        Drop a .csv, .json, or .xml file here, or click the button to choose one.
      </p>
      <div className="mt-4">
        <Button variant="primary" loading={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Processing…' : 'Select file'}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
