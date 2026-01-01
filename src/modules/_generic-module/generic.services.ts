//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { PaginateOptions } from '../../types/paginate';

export class GenericService<ModelType, InterfaceType> {
  model: ModelType | any; // FIXME : fix type ..

  constructor(model: ModelType) {
    this.model = model;
  }

  async create(data:/*InterfaceType*/ Partial<InterfaceType>) : Promise<InterfaceType> {
    // console.log('req.body from generic create 🧪🧪', data);
    return await this.model.create(data);
  }

  async createAndPopulateSpecificFields(data:InterfaceType, populateOptions?: (string | any)[]) : Promise<InterfaceType> {
    // Create the document
    const createdObject = await this.model.create(data);
    
    // If populate options are provided, fetch and populate
    if (populateOptions && populateOptions.length > 0) {
        return await this.getById(createdObject._id.toString(), populateOptions);
    }
    
    return createdObject;
  }

  async getAll() {
    return await this.model.find({isDeleted : false}).select('-__v');
  }


  async getAllV2(filter?: any, populateOptions?: (string | any)[], select?: string) {
    let query = this.model.find(filter).select(select);
    
    if (populateOptions && populateOptions.length > 0) {
        
        // Check if it's the old format (array of strings)
        if (typeof populateOptions[0] === 'string') {
            // query = query.select(populateOptions[0]);
            populateOptions.forEach(field => {
                query = query.populate(field as string);
            });
        } else {
            populateOptions.forEach(option => {
                query = query.populate(option);
            });
        }
    }
    
    const object = await query.select('-__v');
    if (!object) {
        return null;
    }
    return object;
  }
  
  async getAllWithPagination(
    filters: any, // Partial<INotification> // FixMe : fix type
    options: PaginateOptions,
    populateOptions?: any,
    select ? : string | string[]
  ) {

    // console.log('Service received filters:', JSON.stringify(filters, null, 2));

    const result = await this.model.paginate(filters, options, populateOptions, select);
    
    return result;
  }

  async getById(id: string , populateOptions?: (string | any)[], select?: string) : Promise<InterfaceType | null>  {
    

    let query = this.model.findById(id).select(select);
    
    if (populateOptions && populateOptions.length > 0) {
      
      console.log("populateOptions : ", populateOptions);

      // Check if it's the old format (array of strings)
      if (typeof populateOptions[0] === 'string') {
        console.log("if block hit ")
        // query = query.select(populateOptions[0]);
        populateOptions.forEach(field => {
            console.log('field : ', field);  

            query = query.populate(field as string);
        });
      } else {

        console.log("else block hit ")
        populateOptions.forEach(option => {
            console.log('option : ', option);
            query = query.populate(option);
        });
      }
    }
    
    const object = await query.select('-__v');
    if (!object) {
        return null;
    }
    return object;
  }

  async updateById(id: string, data: InterfaceType) {
    const object = await this.model.findById(id).select('-__v');
    if (!object) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No Object Found');
      //   return null;
    }

    return await this.model.findByIdAndUpdate(id, data, { new: true }).select('-__v');
  }

  async deleteById(id: string) {
    return await this.model.findByIdAndDelete(id).select('-__v');
  }

  // TODO :  eta kothao call kora hoy nai ba eta niye kaj kora hoy nai .. 
  async aggregate(pipeline: any[]) {
    return await this.model.aggregate(pipeline);
  }

  async softDeleteById(id: string) {

    const object = await this.model.findById(id).select('-__v');

    if (!object) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No Object Found');
      //   return null;
    }

    if (object.isDeleted === true) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Item already deleted');
    }

    return await this.model.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
  }
}
