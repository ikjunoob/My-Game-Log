import { useCallback, useState } from "react";

const DEFAULT_PAGE = 1;
const DEFAULT_TOTAL_ITEMS = 0;

export default function usePagination(options = {}) {
    const { initialPage = DEFAULT_PAGE, initialTotal = DEFAULT_TOTAL_ITEMS } = options;
    const [state, setState] = useState(() => ({
        page: initialPage,
        totalItems: initialTotal,
    }));

    const setPagination = useCallback((next = {}) => {
        setState((prev) => {
            const page = typeof next.page === "number" ? next.page : prev.page;
            const totalItems = typeof next.totalItems === "number" ? next.totalItems : prev.totalItems;
            if (page === prev.page && totalItems === prev.totalItems) return prev;
            return { page, totalItems };
        });
    }, []);

    const setPage = useCallback((page) => setPagination({ page }), [setPagination]);
    const setTotalItems = useCallback(
        (totalItems) => setPagination({ totalItems }),
        [setPagination]
    );
    const resetPage = useCallback(() => setPagination({ page: DEFAULT_PAGE }), [setPagination]);

    return {
        page: state.page,
        totalItems: state.totalItems,
        setPage,
        setTotalItems,
        setPagination,
        resetPage,
    };
}
