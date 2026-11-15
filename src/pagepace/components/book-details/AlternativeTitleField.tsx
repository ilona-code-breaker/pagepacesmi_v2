interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function AlternativeTitleField({ value, onChange }: Props) {
  return <label className="block space-y-1.5 text-sm text-muted-foreground">
    <span>Original / English title (optional)</span>
    <input aria-label="Original / English title" value={value} onChange={(event) => onChange(event.target.value)} placeholder="e.g. Dune" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" />
  </label>;
}