type RoleDefinitionHintProps = {
  title: string;
  description: string;
};

export function RoleDefinitionHint({ title, description }: RoleDefinitionHintProps) {
  return (
    <details className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <summary className="cursor-pointer list-none font-medium text-foreground">{title}</summary>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </details>
  );
}
