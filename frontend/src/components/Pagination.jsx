import { memo, useCallback, useMemo } from "react";

const buildPages = (currentPage, totalPages, maxPagesToShow) => {
    if (totalPages <= 1) return [];
    const pages = [];
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    start = Math.max(1, end - maxPagesToShow + 1);

    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
    }

    return pages;
};

const Pagination = memo(function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    maxPagesToShow = 5,
}) {
    const totalPages = itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;

    const pages = useMemo(
        () => buildPages(currentPage, totalPages, maxPagesToShow),
        [currentPage, totalPages, maxPagesToShow]
    );

    const handlePageClick = useCallback(
        (page) => {
            if (page < 1 || page > totalPages || page === currentPage) return;
            onPageChange(page);
        },
        [currentPage, totalPages, onPageChange]
    );

    if (totalItems === 0 || totalPages === 0) return null;

    return (
        <nav className="pagination-controls">
            <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>
                이전
            </button>
            {pages.map((page, index) =>
                typeof page === "number" ? (
                    <button
                        key={index}
                        className={page === currentPage ? "active" : ""}
                        onClick={() => handlePageClick(page)}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="page-info">
                        ...
                    </span>
                )
            )}
            <button
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                다음
            </button>
        </nav>
    );
});

export default Pagination;
