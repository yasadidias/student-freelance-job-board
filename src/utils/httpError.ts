// A small error class that carries an HTTP status code.
// Controllers throw it, and the global error handler turns it into a JSON response.
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}