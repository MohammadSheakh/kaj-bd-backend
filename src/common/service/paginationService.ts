//@ts-ignore
import { Schema } from 'mongoose';

export interface PaginateOptions {
  page?: number;
  limit?: number;
  sortBy?: string | object;
  populate?: any[];
  select?: string;
}

export interface PaginateResult<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AggregationPaginateOptions {
  page?: number;
  limit?: number;
  countField?: string; // Field name for total count in aggregation
}

export interface AggregationPaginateResult<T> { // 🟢🟢🟢 sheakh
  // results: T[];
  // pagination: {
  //   currentPage: number;
  //   totalPages: number;
  //   totalResults: number;
  //   hasNextPage: boolean;
  //   hasPrevPage: boolean;
  //   limit: number;
  // };

  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  // hasNextPage: boolean;
  // hasPrevPage: boolean;

}

class PaginationService {

  // Pagination for aggregation pipelines // 🟢🟢🟢 sheakh
  static async aggregationPaginate<T>(
    model: any,
    pipeline: any[] = [],
    // options: AggregationPaginateOptions = {}
    options:any
  ): Promise<AggregationPaginateResult<T>> {
    const limit = Math.min(options.limit ?? 10, 100);
    const page = Math.max(options.page ?? 1, 1);
    const skip = (page - 1) * limit;

    // Add facet stage for pagination
    const paginationPipeline = [
      ...pipeline,
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const [result] = await model.aggregate(paginationPipeline).exec();
    
    const results = result.data || [];
    const totalResults = result.totalCount[0]?.count || 0;
    // const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      // pagination: {
        page,
        limit,
        totalPages :  Math.ceil(totalResults / limit),
        totalResults,
        // currentPage: page,
        // hasNextPage: page < totalPages,
        // hasPrevPage: page > 1
        
      // }
    };
  }


  /******** 🟢
  // Generic pagination plugin for Mongoose schemas
  static plugin = <T>(schema: Schema<T>) => {
    schema.statics.paginate = async function (
      filter: any = {},
      options: PaginateOptions = {}
    ): Promise<PaginateResult<T>> {
      return PaginationService.paginate(this, filter, options);
    };
  };
  *********** */

  /********
  // Helper method to validate pagination parameters
  static validatePaginationParams(page?: any, limit?: any) {
    const validatedPage = Math.max(parseInt(page) || 1, 1);
    const validatedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    
    return { page: validatedPage, limit: validatedLimit };
  }
    *********** */

  // Helper method to build sort object from string
  static buildSortObject(sortBy?: string) {
    if (!sortBy) return { createdAt: -1 };
    
    // Handle formats like: "name:asc", "createdAt:desc", "-createdAt", "name"
    if (sortBy.startsWith('-')) {
      const field = sortBy.substring(1);
      return { [field]: -1 };
    }
    
    if (sortBy.includes(':')) {
      const [field, direction] = sortBy.split(':');
      return { [field]: direction === 'desc' ? -1 : 1 };
    }
    
    return { [sortBy]: 1 };
  }

  /********
  // Search helper with pagination 🟢
  static async searchWithPagination<T>(
    model: any,
    searchQuery: any = {},
    searchFields: string[] = [],
    searchTerm?: string,
    options: PaginateOptions = {}
  ): Promise<PaginateResult<T>> {
    let filter = { ...searchQuery };
    
    // Add search functionality
    if (searchTerm && searchFields.length > 0) {
      filter.$or = searchFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }));
    }
    
    return this.paginate(model, filter, options);
  }
  *********** */

  /******************
  // Core pagination method for regular queries 🟢
  static async paginate<T>(
    model: any,
    filter: any = {},
    options: PaginateOptions = {}
  ): Promise<PaginateResult<T>> {
    const limit = Math.min(options.limit ?? 10, 100); // Max limit of 100
    const page = Math.max(options.page ?? 1, 1); // Min page of 1
    const skip = (page - 1) * limit;
    const sort = options.sortBy ?? { createdAt: -1 };

    // Build query
    let query = model.find(filter);
    
    // Apply select if provided
    if (options.select) {
      query = query.select(options.select);
    }
    
    // Apply sort
    query = query.sort(sort);
    
    // Apply pagination
    query = query.skip(skip).limit(limit);
    
    // Apply populate if provided
    if (options.populate?.length > 0) {
      options.populate.forEach(populateOption => {
        if (typeof populateOption === 'string') {
          query = query.populate(populateOption);
        } else {
          query = query.populate(populateOption);
        }
      });
    }

    // Execute queries in parallel
    const [totalResults, results] = await Promise.all([
      model.countDocuments(filter).exec(),
      query.exec()
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      page,
      limit,
      totalPages,
      totalResults,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
 ***********************/


}

export default PaginationService;