import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Column<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
};

export function BusinessDataTable<T extends { id: string }>({
  columns,
  rows,
  bulkBar,
  empty,
  loading
}: {
  columns: Column<T>[];
  rows: T[];
  bulkBar?: ReactNode;
  empty?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {bulkBar ? (
        <div className="flex min-h-touch flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          {bulkBar}
        </div>
      ) : null}
      <div className="table-scroller min-w-0">
        <table className="min-w-[640px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={cn("sticky top-0 z-sticky-sub whitespace-nowrap px-4 py-3 font-semibold text-foreground", c.className)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <div className="skeleton skeleton-card" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {empty ?? "No rows."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  {columns.map((c) => (
                    <td key={c.id} className={cn("min-w-0 px-4 py-3 align-middle", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
