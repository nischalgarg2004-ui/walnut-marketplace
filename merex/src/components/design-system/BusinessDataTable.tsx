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
  loading,
  spreadsheetMode = false
}: {
  columns: Column<T>[];
  rows: T[];
  bulkBar?: ReactNode;
  empty?: ReactNode;
  loading?: boolean;
  spreadsheetMode?: boolean;
}) {
  const columnLetters = columns.map((_, index) => {
    const letterCode = 65 + (index % 26);
    return String.fromCharCode(letterCode);
  });

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3",
        spreadsheetMode && "rounded-xl border border-[#d0d7e2] bg-[#f8fafc] p-3 text-[#0f172a]"
      )}
    >
      {bulkBar ? (
        <div
          className={cn(
            "flex min-h-touch flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2",
            spreadsheetMode && "border-[#d0d7e2] bg-white"
          )}
        >
          {bulkBar}
        </div>
      ) : null}
      <div className="table-scroller min-w-0">
        <table
          className={cn(
            "w-full min-w-[640px] border-collapse text-left text-sm",
            spreadsheetMode && "table-fixed border border-[#d0d7e2] bg-white"
          )}
        >
          <thead>
            {spreadsheetMode ? (
              <tr className="border-b border-[#d0d7e2] bg-[#f1f5f9]">
                <th className="sticky left-0 top-0 z-[3] w-12 border-r border-[#d0d7e2] px-2 py-1 text-center text-[11px] font-semibold text-[#475569]">
                  #
                </th>
                {columnLetters.map((letter, index) => (
                  <th
                    key={`letter-${letter}-${index}`}
                    className={cn(
                      "top-0 z-[2] border-r border-[#d0d7e2] px-3 py-1 text-center text-[11px] font-semibold text-[#475569]",
                      index === 0 && "sticky left-12 z-[3] bg-[#f1f5f9]"
                    )}
                  >
                    {letter}
                  </th>
                ))}
              </tr>
            ) : null}
            <tr className="border-b border-border bg-muted/50">
              {spreadsheetMode ? (
                <th className="sticky left-0 top-[30px] z-[3] w-12 border-r border-[#d0d7e2] bg-[#f8fafc] px-2 py-2 text-center text-[11px] font-semibold text-[#64748b]">
                  Row
                </th>
              ) : null}
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={cn(
                    "sticky top-0 z-sticky-sub whitespace-nowrap px-4 py-3 font-semibold text-foreground",
                    spreadsheetMode &&
                      "border-r border-[#d0d7e2] bg-[#f8fafc] px-3 py-2 text-xs uppercase tracking-wide text-[#334155]",
                    spreadsheetMode && c.id === columns[0]?.id && "left-12 z-[3]",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("divide-y divide-border", spreadsheetMode && "divide-[#e2e8f0]")}>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (spreadsheetMode ? 1 : 0)} className="px-4 py-8">
                  <div className="skeleton skeleton-card" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (spreadsheetMode ? 1 : 0)}
                  className={cn("px-4 py-10 text-center text-muted-foreground", spreadsheetMode && "text-[#64748b]")}
                >
                  {empty ?? "No rows."}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={row.id} className={cn("hover:bg-muted/30", spreadsheetMode && "hover:bg-[#f8fafc]")}>
                  {spreadsheetMode ? (
                    <td className="sticky left-0 z-[2] border-r border-[#e2e8f0] bg-white px-2 py-2 text-center text-[11px] text-[#64748b]">
                      {rowIndex + 1}
                    </td>
                  ) : null}
                  {columns.map((c, columnIndex) => (
                    <td
                      key={c.id}
                      className={cn(
                        "min-w-0 px-4 py-3 align-middle",
                        spreadsheetMode &&
                          "border-r border-[#e2e8f0] px-3 py-2 text-[13px] text-[#0f172a] last:border-r-0",
                        spreadsheetMode && columnIndex === 0 && "sticky left-12 z-[2] bg-white",
                        c.className
                      )}
                    >
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
