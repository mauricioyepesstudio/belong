export class IdentityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityValidationError";
  }
}

export class IdentityEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityEngineError";
  }
}
