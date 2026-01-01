import ApiError from '../../errors/ApiError';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
//@ts-ignore
import { Request, Response} from 'express';
import { GenericService } from './generic.services';
import omit from '../../shared/omit';

export class GenericController<ModelType, InterfaceType> {
  service: GenericService<ModelType, InterfaceType>  
  modelName: string;

  constructor(service: any /* GenericService<T> */, modelName: string) {
    this.service = service;
    this.modelName = modelName; // Assign model name
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:InterfaceType = req.body;
    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  // Get all items  //[🚧][🧑‍💻✅][🧪] // 🆗
  getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getAll();

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName}s`,
      success: true,
    });
  });

  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    

    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name ' 
      // },
      // 'personId'
      // {
      //   path: 'conversationId',
      //   select: 'lastMessage updatedAt',
      //   populate: {
      //     path: 'lastMessage',
      //   }
      // }
    ];

    const select = '-isDeleted -createdAt -updatedAt -__v'; 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  getAllWithPaginationV2 = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // Get by ID // [🚧][🧑‍💻✅][🧪] // 🆗
  getById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const result = await this.service.getById(id);
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });

  getAllV2 = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const result = await this.service.getAllV2(filters, populateOptions, select);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName}s`,
      success: true,
    });
  });

  getByIdV2 = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt'; // -__v

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const result = await this.service.getById(id, populateOptions, select);
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });

  
  // Update by ID
  updateById = catchAsync(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `id is required for update ${this.modelName}`
      );
    }
    
    const id = req.params.id;

    const updatedObject = await this.service.updateById(id, req.body);
    if (!updatedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }
    //   return res.status(StatusCodes.OK).json(updatedObject);
    sendResponse(res, {
      code: StatusCodes.OK,
      data: updatedObject,
      message: `${this.modelName} updated successfully`,
    });
  });

  // Delete by ID
  deleteById = catchAsync(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `id is required for delete ${this.modelName}`
      );
    }

    const id = req.params.id;
    const deletedObject = await this.service.deleteById(id);
    if (!deletedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }
    //   return res.status(StatusCodes.NO_CONTENT).json({});
    sendResponse(res, {
      code: StatusCodes.OK,
      data: deletedObject,
      message: `${this.modelName} deleted successfully`,
    });
  });

  //Soft Delete by ID
  softDeleteById = catchAsync(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `id is required for delete ${this.modelName}`
      );
    }

    const id = req.params.id;
    const deletedObject = await this.service.softDeleteById(id);
    if (!deletedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }
    //   return res.status(StatusCodes.NO_CONTENT).json({});
    sendResponse(res, {
      code: StatusCodes.OK,
      data: deletedObject,
      message: `${this.modelName} soft deleted successfully`,
    });
  });
}
