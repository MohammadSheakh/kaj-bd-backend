import { IErrorMessage } from "../types/errors.types";

export default function handleSyntaxError(error: SyntaxError) {
  const message = "Invalid JSON in request body.";
  const errorMessages: IErrorMessage[] = [
    { path: "body", message }
  ];

  return { code: 400, message, errorMessages };
}