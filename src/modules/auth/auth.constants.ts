import { TRole } from "../../middlewares/roles"
import { TGender } from "../user.module/userProfile/userProfile.constant"
//@ts-ignore
import { Types } from 'mongoose';

export interface IRegisterData {
    name:string,
    email:string,
    password:string,
    role: TRole.provider | TRole.user,
    phoneNumber: number,
    location: string, 
    lat: number, 
    lng : number,
    gender : TGender.male | TGender.female,
    dob : string,
    acceptTOC: boolean  
}

export interface ICreateUser{
    name:string,
    email:string,
    password:string,
    role: TRole.provider | TRole.user
    profileId: Types.ObjectId 
}