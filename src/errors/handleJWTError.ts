import { IErrorMessage } from "../types/errors.types";

export default function handleJWTError(error: any) {
  const message =
    error.name === "TokenExpiredError"
      ? "Your session has expired. Please log in again."
      : "Invalid authentication token.";

  const errorMessages: IErrorMessage[] = [
    { path: "token", message }
  ];

  return { code: 401, message, errorMessages };
}