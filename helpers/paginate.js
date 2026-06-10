// Pagination calculation helper
export function calculatePagination(pagination, totalRows) {
    const limit = parseInt(pagination.limit) || 10;
    const currentPage = parseInt(pagination.page) || 1;
    const totalPages = Math.ceil(totalRows / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    const startIndex = totalRows > 0 ? (currentPage - 1) * limit + 1 : 0;
    const endIndex = Math.min(currentPage * limit, totalRows);
    
    return {
      currentPage,
      totalPages,
      totalRows,
      limit,
      hasNextPage,
      hasPrevPage,
      startIndex,
      endIndex,
      showing: totalRows > 0 ? `${startIndex}-${endIndex} of ${totalRows} items` : '0 items'
    };
  }
  