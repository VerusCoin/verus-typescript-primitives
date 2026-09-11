/**
 * Makes buffer deserialization single-use, including failed attempts.
 * Parser methods must be prototype methods; assigning a parser on the instance
 * after construction replaces its guard. Internal parser delegation is allowed.
 */
export abstract class SerializableEntityBase {
  /** Set in a subclass constructor only if its parsers safely support reuse. */
  protected allowRepeatedFromBuffer = false;

  #parseAttempted = false;
  #parsing = false;

  constructor() {
    Object.defineProperty(this, "allowRepeatedFromBuffer", { enumerable: false });

    for (const name of ["fromBuffer", "fromDataBuffer", "fromBufferOptionalType"]) {
      const parse = (this as any)[name];
      if (typeof parse !== "function") continue;

      // Capture the most-derived implementation. super calls continue to use
      // prototype methods, so they remain part of the same parsing attempt.
      Object.defineProperty(this, name, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function (this: SerializableEntityBase, ...args: any[]) {
          if (this.#parsing) return parse.apply(this, args);
          if (this.#parseAttempted && !this.allowRepeatedFromBuffer) {
            throw new Error("Deserialization already attempted on this instance");
          }

          this.#parseAttempted = true;
          this.#parsing = true;
          try {
            return parse.apply(this, args);
          } finally {
            this.#parsing = false;
          }
        }
      });
    }
  }
}
