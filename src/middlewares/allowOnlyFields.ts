// middlewares/allowFields.ts
//@ts-ignore
import { Request, Response, NextFunction } from 'express';

/**
 * Allows only whitelisted fields to pass through req.body.
 * Optionally auto-assign fixed values (like { status: "inProgress" }).
 */
export const allowOnlyFields = (
  allowedFields: string[],
  fixedValues: Record<string, any> = {}
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const filteredBody: Record<string, any> = {};

    // Pick only allowed fields
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        filteredBody[key] = req.body[key];
      }
    }

    // Apply any fixed values (forced updates)
    Object.assign(filteredBody, fixedValues);

    // Replace body with filtered one
    req.body = filteredBody;

    next();
  };
};