import { useState, useEffect } from "react";

/**
 * Simple pagination hook.
 * @param {Array} items - full list to paginate
 * @param {number} pageSize - items per page (default 10)
 */
export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when list changes (e.g. after search/filter)
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return { paged, page, setPage, totalPages };
}

/**
 * Pagination UI component.
 */
export function Paginator({ page, totalPages, setPage, total, pageSize }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="paginator">
      <span className="paginator-info">{start}–{end} מתוך {total}</span>
      <div className="paginator-btns">
        <button className="pag-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
        <button className="pag-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? <span key={`dots-${i}`} className="pag-dots">…</span> :
            <button key={p} className={`pag-btn ${p === page ? "pag-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          )}
        <button className="pag-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
        <button className="pag-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
      </div>
    </div>
  );
}
