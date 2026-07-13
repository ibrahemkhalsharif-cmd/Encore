export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}
