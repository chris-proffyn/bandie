type AdminPaginationProps = {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (nextOffset: number) => void;
};

export function AdminPagination({ total, limit, offset, onPageChange }: AdminPaginationProps) {
  if (total <= limit) {
    return null;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + limit, total);

  return (
    <div className="admin-pagination">
      <p className="admin-pagination-summary">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="admin-pagination-actions">
        <button
          type="button"
          className="admin-compact-button"
          disabled={offset <= 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
        >
          Previous
        </button>
        <span className="admin-pagination-page">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="admin-compact-button"
          disabled={offset + limit >= total}
          onClick={() => onPageChange(offset + limit)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
