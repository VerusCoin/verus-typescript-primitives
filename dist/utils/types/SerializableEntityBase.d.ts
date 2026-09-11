/**
 * Makes buffer deserialization single-use, including failed attempts.
 * Parser methods must be prototype methods; assigning a parser on the instance
 * after construction replaces its guard. Internal parser delegation is allowed.
 */
export declare abstract class SerializableEntityBase {
    #private;
    /** Set in a subclass constructor only if its parsers safely support reuse. */
    protected allowRepeatedFromBuffer: boolean;
    constructor();
}
