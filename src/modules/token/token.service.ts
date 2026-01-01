//@ts-ignore
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { config } from '../../config';
//@ts-ignore
import { addMinutes, addDays } from 'date-fns';
import ApiError from '../../errors/ApiError';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import {  TokenType } from './token.interface';
import { Token } from './token.model';
//@ts-ignore
import EventEmitter from 'events';
import { IUser as IUserMain } from '../user.module/user/user.interface';
const eventEmitterForTokenDeleteAndCreate = new EventEmitter(); // functional way


eventEmitterForTokenDeleteAndCreate.on('eventEmitForTokenDeleteAndCreate', async (valueFromRequest: any) => {
  try {
      await Promise.all([
        Token.deleteMany({ user: valueFromRequest.user }), // Clean up old tokens
        Token.create(valueFromRequest)
      ]);
    }catch (error) {
      console.error('Error occurred while handling token creation and deletion:', error);
    }
  
});

export default eventEmitterForTokenDeleteAndCreate;

const getExpirationTime = (expiration: string) => {
  const timeValue = parseInt(expiration);
  if (expiration.includes('d')) {
    return addDays(new Date(), timeValue);
  } else if (expiration.includes('m')) {
    return addMinutes(new Date(), timeValue);
  }
  return new Date();
};

const createToken = (payload: object, secret: Secret, expireTime: string) => {
  return jwt.sign(payload, secret, { expiresIn: expireTime });
};

const verifyToken = async (
  token: string,
  secret: Secret,
  tokenType: TokenType
) => {

  const decoded = jwt.verify(token, secret) as JwtPayload;

  const storedToken = await Token.findOne({
    token,
    user: decoded.userId,
    type: tokenType
  });

  // ------------------------ as per toky vai  TODO : MUST : NEED_TO_TEST
  if (!storedToken) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Token is invalid or already used'
    );
  }

  if (storedToken.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Token has expired');
  }
  if (storedToken.type !== tokenType) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid token type');
  }
  storedToken.verified = true;
  await storedToken.save();
  return decoded;
};

const createVerifyEmailToken = async (user: IUserMain) => {

  const payload = { userId: user._id, email: user.email, role: user.role };
  await Token.deleteMany({ user: user._id });
  const verifyEmailToken = createToken(
    payload,
    config.token.TokenSecret,
    config.token.verifyEmailTokenExpiration
  );
  const expiresAt = getExpirationTime(config.token.verifyEmailTokenExpiration);

  await Token.create({
    token: verifyEmailToken,
    user: user._id,
    type: TokenType.VERIFY,
    expiresAt,
  });
  return verifyEmailToken;

  /*
  const payload = { userId: user._id, email: user.email, role: user.role };
 const verifyEmailToken = createToken(
    payload,
    config.token.TokenSecret,
    config.token.verifyEmailTokenExpiration
  );
  */
  /**************
  await Token.deleteMany({ user: user._id });
  
  const expiresAt = getExpirationTime(config.token.verifyEmailTokenExpiration);

  await Token.create({
    token: verifyEmailToken,
    user: user._id,
    type: TokenType.VERIFY,
    expiresAt,
  });
  ****************/

  /**************
   * 
   * ****************/
  
  /*
  const [, tokenDoc] = await Promise.all([
    Token.deleteMany({ user: user._id }), // Clean up old tokens
    Token.create({
      token: verifyEmailToken,
      user: user._id,
      type: TokenType.VERIFY,
      expiresAt: getExpirationTime(config.token.verifyEmailTokenExpiration),
    })
  ]);

  
  */

  /*-----------

  // TODO : Need to add type
  let tokenRelatedValues : any = {
      token: verifyEmailToken,
      user: user._id,
      type: TokenType.VERIFY,
      expiresAt: getExpirationTime(config.token.verifyEmailTokenExpiration),
    }

    eventEmitterForTokenDeleteAndCreate.emit('eventEmitForTokenDeleteAndCreate', tokenRelatedValues);

  -------------*/
  
  
  //return verifyEmailToken;
};



const createResetPasswordToken = async (user: IUserMain) => {
  const payload = { userId: user._id, email: user.email, role: user.role };
  await Token.deleteMany({ user: user._id });
  const resetPasswordToken = createToken(
    payload,
    config.token.TokenSecret,
    config.token.resetPasswordTokenExpiration
  );
  const expiresAt = getExpirationTime(
    config.token.resetPasswordTokenExpiration
  );

  await Token.create({
    token: resetPasswordToken,
    user: user._id,
    type: TokenType.RESET_PASSWORD,
    expiresAt,
  });
  return resetPasswordToken;
};

const accessAndRefreshToken = async (user: IUserMain) => {
  let userFullname;
  if(user.fname && user.lname){
    userFullname = user.fname + ' ' + user.lname;
  }else{
    userFullname = user.name;
  }

  const payload:IUserMain = { 
    userId: user?._id,
    userName: userFullname ,
    email: user.email,
    role: user.role,
    stripe_customer_id: user.stripe_customer_id ? user.stripe_customer_id : null
  };

  // await Token.deleteMany({ user: user._id });  // ---------------------

  const accessToken = createToken(
    payload,
    config.jwt.accessSecret,
    config.jwt.accessExpiration
  );

  const refreshToken = createToken(
    payload,
    config.jwt.refreshSecret,
    config.jwt.refreshExpiration
  );

  await Token.create({
    token: accessToken,
    user: user._id,
    type: TokenType.ACCESS,
    expiresAt: getExpirationTime(config.jwt.accessExpiration),
  });

  await Token.create({
    token: refreshToken,
    user: user._id,
    type: TokenType.REFRESH,
    expiresAt: getExpirationTime(config.jwt.refreshExpiration),
  });

  return { accessToken, refreshToken };
};

export const TokenService = {
  createToken,
  verifyToken,
  createVerifyEmailToken,
  createResetPasswordToken,
  accessAndRefreshToken,
};
