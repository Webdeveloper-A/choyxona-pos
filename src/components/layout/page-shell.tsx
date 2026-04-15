type PageShellProps = {
  children: React.ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  return (
    <main className="flex-1 bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}