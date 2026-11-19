import { LinkButton } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">That page does not exist (or has moved).</p>
      <LinkButton to="/" className="mt-6">
        Back to home
      </LinkButton>
    </div>
  );
}
