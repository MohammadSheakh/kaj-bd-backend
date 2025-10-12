import PaginationService from "./paginationService";

// utils/paginationHelpers.js
export class PaginationHelpers {
  // Extract pagination params from request query
  static extractPaginationFromQuery(query: any) {
    return PaginationService.validatePaginationParams(query.page, query.limit);
  }

  // Extract sort params from request query
  static extractSortFromQuery(query: any) {
    return PaginationService.buildSortObject(query.sortBy || query.sort);
  }

  // Build populate array from query string
  static buildPopulateFromQuery(populate?: string) {
    if (!populate) return [];
    return populate.split(',').map(field => field.trim());
  }

  // Build response metadata
  static buildPaginationMeta(paginateResult: any) {
    return {
      currentPage: paginateResult.page,
      totalPages: paginateResult.totalPages,
      totalResults: paginateResult.totalResults,
      hasNextPage: paginateResult.hasNextPage,
      hasPrevPage: paginateResult.hasPrevPage,
      limit: paginateResult.limit
    };
  }
}

// Example usage in your schema plugin
export const paginatePlugin = PaginationService.plugin;