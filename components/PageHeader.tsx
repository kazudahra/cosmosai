export default function PageHeader({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {hint && <p className="mt-1 max-w-xl text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
