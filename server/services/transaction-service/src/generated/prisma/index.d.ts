
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Booking
 * 
 */
export type Booking = $Result.DefaultSelection<Prisma.$BookingPayload>
/**
 * Model Interaction
 * 
 */
export type Interaction = $Result.DefaultSelection<Prisma.$InteractionPayload>
/**
 * Model PaymentTransaction
 * 
 */
export type PaymentTransaction = $Result.DefaultSelection<Prisma.$PaymentTransactionPayload>
/**
 * Model Settlement
 * 
 */
export type Settlement = $Result.DefaultSelection<Prisma.$SettlementPayload>
/**
 * Model HostLinkedAccount
 * 
 */
export type HostLinkedAccount = $Result.DefaultSelection<Prisma.$HostLinkedAccountPayload>
/**
 * Model Ledger
 * 
 */
export type Ledger = $Result.DefaultSelection<Prisma.$LedgerPayload>
/**
 * Model HostAdjustment
 * 
 */
export type HostAdjustment = $Result.DefaultSelection<Prisma.$HostAdjustmentPayload>
/**
 * Model OrganizerTrustScore
 * 
 */
export type OrganizerTrustScore = $Result.DefaultSelection<Prisma.$OrganizerTrustScorePayload>
/**
 * Model EventUserResponse
 * 
 */
export type EventUserResponse = $Result.DefaultSelection<Prisma.$EventUserResponsePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const SettlementStatus: {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  HELD: 'HELD',
  REFUND_INITIATED: 'REFUND_INITIATED'
};

export type SettlementStatus = (typeof SettlementStatus)[keyof typeof SettlementStatus]


export const PaymentStatus: {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUND_PROCESSING: 'REFUND_PROCESSING',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  REFUND_FAILED: 'REFUND_FAILED'
};

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]


export const BookingStatus: {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  VERIFIED: 'VERIFIED'
};

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]


export const RefundStatus: {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  NOT_APPLICABLE: 'NOT_APPLICABLE'
};

export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus]


export const InteractionType: {
  LIKE: 'LIKE',
  SHARE: 'SHARE',
  VIEW: 'VIEW',
  SAVE: 'SAVE',
  FEEDBACK: 'FEEDBACK'
};

export type InteractionType = (typeof InteractionType)[keyof typeof InteractionType]

}

export type SettlementStatus = $Enums.SettlementStatus

export const SettlementStatus: typeof $Enums.SettlementStatus

export type PaymentStatus = $Enums.PaymentStatus

export const PaymentStatus: typeof $Enums.PaymentStatus

export type BookingStatus = $Enums.BookingStatus

export const BookingStatus: typeof $Enums.BookingStatus

export type RefundStatus = $Enums.RefundStatus

export const RefundStatus: typeof $Enums.RefundStatus

export type InteractionType = $Enums.InteractionType

export const InteractionType: typeof $Enums.InteractionType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Bookings
 * const bookings = await prisma.booking.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Bookings
   * const bookings = await prisma.booking.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.booking`: Exposes CRUD operations for the **Booking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bookings
    * const bookings = await prisma.booking.findMany()
    * ```
    */
  get booking(): Prisma.BookingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.interaction`: Exposes CRUD operations for the **Interaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Interactions
    * const interactions = await prisma.interaction.findMany()
    * ```
    */
  get interaction(): Prisma.InteractionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.paymentTransaction`: Exposes CRUD operations for the **PaymentTransaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PaymentTransactions
    * const paymentTransactions = await prisma.paymentTransaction.findMany()
    * ```
    */
  get paymentTransaction(): Prisma.PaymentTransactionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.settlement`: Exposes CRUD operations for the **Settlement** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Settlements
    * const settlements = await prisma.settlement.findMany()
    * ```
    */
  get settlement(): Prisma.SettlementDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.hostLinkedAccount`: Exposes CRUD operations for the **HostLinkedAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HostLinkedAccounts
    * const hostLinkedAccounts = await prisma.hostLinkedAccount.findMany()
    * ```
    */
  get hostLinkedAccount(): Prisma.HostLinkedAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.ledger`: Exposes CRUD operations for the **Ledger** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Ledgers
    * const ledgers = await prisma.ledger.findMany()
    * ```
    */
  get ledger(): Prisma.LedgerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.hostAdjustment`: Exposes CRUD operations for the **HostAdjustment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HostAdjustments
    * const hostAdjustments = await prisma.hostAdjustment.findMany()
    * ```
    */
  get hostAdjustment(): Prisma.HostAdjustmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.organizerTrustScore`: Exposes CRUD operations for the **OrganizerTrustScore** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OrganizerTrustScores
    * const organizerTrustScores = await prisma.organizerTrustScore.findMany()
    * ```
    */
  get organizerTrustScore(): Prisma.OrganizerTrustScoreDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventUserResponse`: Exposes CRUD operations for the **EventUserResponse** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventUserResponses
    * const eventUserResponses = await prisma.eventUserResponse.findMany()
    * ```
    */
  get eventUserResponse(): Prisma.EventUserResponseDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Booking: 'Booking',
    Interaction: 'Interaction',
    PaymentTransaction: 'PaymentTransaction',
    Settlement: 'Settlement',
    HostLinkedAccount: 'HostLinkedAccount',
    Ledger: 'Ledger',
    HostAdjustment: 'HostAdjustment',
    OrganizerTrustScore: 'OrganizerTrustScore',
    EventUserResponse: 'EventUserResponse'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "booking" | "interaction" | "paymentTransaction" | "settlement" | "hostLinkedAccount" | "ledger" | "hostAdjustment" | "organizerTrustScore" | "eventUserResponse"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Booking: {
        payload: Prisma.$BookingPayload<ExtArgs>
        fields: Prisma.BookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findFirst: {
            args: Prisma.BookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findMany: {
            args: Prisma.BookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          create: {
            args: Prisma.BookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          createMany: {
            args: Prisma.BookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          delete: {
            args: Prisma.BookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          update: {
            args: Prisma.BookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          deleteMany: {
            args: Prisma.BookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BookingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          upsert: {
            args: Prisma.BookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          aggregate: {
            args: Prisma.BookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBooking>
          }
          groupBy: {
            args: Prisma.BookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<BookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.BookingCountArgs<ExtArgs>
            result: $Utils.Optional<BookingCountAggregateOutputType> | number
          }
        }
      }
      Interaction: {
        payload: Prisma.$InteractionPayload<ExtArgs>
        fields: Prisma.InteractionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InteractionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InteractionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          findFirst: {
            args: Prisma.InteractionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InteractionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          findMany: {
            args: Prisma.InteractionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>[]
          }
          create: {
            args: Prisma.InteractionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          createMany: {
            args: Prisma.InteractionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InteractionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>[]
          }
          delete: {
            args: Prisma.InteractionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          update: {
            args: Prisma.InteractionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          deleteMany: {
            args: Prisma.InteractionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InteractionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InteractionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>[]
          }
          upsert: {
            args: Prisma.InteractionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          aggregate: {
            args: Prisma.InteractionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInteraction>
          }
          groupBy: {
            args: Prisma.InteractionGroupByArgs<ExtArgs>
            result: $Utils.Optional<InteractionGroupByOutputType>[]
          }
          count: {
            args: Prisma.InteractionCountArgs<ExtArgs>
            result: $Utils.Optional<InteractionCountAggregateOutputType> | number
          }
        }
      }
      PaymentTransaction: {
        payload: Prisma.$PaymentTransactionPayload<ExtArgs>
        fields: Prisma.PaymentTransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentTransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentTransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>
          }
          findFirst: {
            args: Prisma.PaymentTransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentTransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>
          }
          findMany: {
            args: Prisma.PaymentTransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>[]
          }
          create: {
            args: Prisma.PaymentTransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>
          }
          createMany: {
            args: Prisma.PaymentTransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentTransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>[]
          }
          delete: {
            args: Prisma.PaymentTransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>
          }
          update: {
            args: Prisma.PaymentTransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>
          }
          deleteMany: {
            args: Prisma.PaymentTransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentTransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PaymentTransactionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>[]
          }
          upsert: {
            args: Prisma.PaymentTransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentTransactionPayload>
          }
          aggregate: {
            args: Prisma.PaymentTransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePaymentTransaction>
          }
          groupBy: {
            args: Prisma.PaymentTransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentTransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentTransactionCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentTransactionCountAggregateOutputType> | number
          }
        }
      }
      Settlement: {
        payload: Prisma.$SettlementPayload<ExtArgs>
        fields: Prisma.SettlementFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SettlementFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SettlementFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>
          }
          findFirst: {
            args: Prisma.SettlementFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SettlementFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>
          }
          findMany: {
            args: Prisma.SettlementFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>[]
          }
          create: {
            args: Prisma.SettlementCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>
          }
          createMany: {
            args: Prisma.SettlementCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SettlementCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>[]
          }
          delete: {
            args: Prisma.SettlementDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>
          }
          update: {
            args: Prisma.SettlementUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>
          }
          deleteMany: {
            args: Prisma.SettlementDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SettlementUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SettlementUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>[]
          }
          upsert: {
            args: Prisma.SettlementUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettlementPayload>
          }
          aggregate: {
            args: Prisma.SettlementAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSettlement>
          }
          groupBy: {
            args: Prisma.SettlementGroupByArgs<ExtArgs>
            result: $Utils.Optional<SettlementGroupByOutputType>[]
          }
          count: {
            args: Prisma.SettlementCountArgs<ExtArgs>
            result: $Utils.Optional<SettlementCountAggregateOutputType> | number
          }
        }
      }
      HostLinkedAccount: {
        payload: Prisma.$HostLinkedAccountPayload<ExtArgs>
        fields: Prisma.HostLinkedAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HostLinkedAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HostLinkedAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>
          }
          findFirst: {
            args: Prisma.HostLinkedAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HostLinkedAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>
          }
          findMany: {
            args: Prisma.HostLinkedAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>[]
          }
          create: {
            args: Prisma.HostLinkedAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>
          }
          createMany: {
            args: Prisma.HostLinkedAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HostLinkedAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>[]
          }
          delete: {
            args: Prisma.HostLinkedAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>
          }
          update: {
            args: Prisma.HostLinkedAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>
          }
          deleteMany: {
            args: Prisma.HostLinkedAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HostLinkedAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HostLinkedAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>[]
          }
          upsert: {
            args: Prisma.HostLinkedAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostLinkedAccountPayload>
          }
          aggregate: {
            args: Prisma.HostLinkedAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHostLinkedAccount>
          }
          groupBy: {
            args: Prisma.HostLinkedAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<HostLinkedAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.HostLinkedAccountCountArgs<ExtArgs>
            result: $Utils.Optional<HostLinkedAccountCountAggregateOutputType> | number
          }
        }
      }
      Ledger: {
        payload: Prisma.$LedgerPayload<ExtArgs>
        fields: Prisma.LedgerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LedgerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LedgerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>
          }
          findFirst: {
            args: Prisma.LedgerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LedgerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>
          }
          findMany: {
            args: Prisma.LedgerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>[]
          }
          create: {
            args: Prisma.LedgerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>
          }
          createMany: {
            args: Prisma.LedgerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LedgerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>[]
          }
          delete: {
            args: Prisma.LedgerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>
          }
          update: {
            args: Prisma.LedgerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>
          }
          deleteMany: {
            args: Prisma.LedgerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LedgerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LedgerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>[]
          }
          upsert: {
            args: Prisma.LedgerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerPayload>
          }
          aggregate: {
            args: Prisma.LedgerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLedger>
          }
          groupBy: {
            args: Prisma.LedgerGroupByArgs<ExtArgs>
            result: $Utils.Optional<LedgerGroupByOutputType>[]
          }
          count: {
            args: Prisma.LedgerCountArgs<ExtArgs>
            result: $Utils.Optional<LedgerCountAggregateOutputType> | number
          }
        }
      }
      HostAdjustment: {
        payload: Prisma.$HostAdjustmentPayload<ExtArgs>
        fields: Prisma.HostAdjustmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HostAdjustmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HostAdjustmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>
          }
          findFirst: {
            args: Prisma.HostAdjustmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HostAdjustmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>
          }
          findMany: {
            args: Prisma.HostAdjustmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>[]
          }
          create: {
            args: Prisma.HostAdjustmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>
          }
          createMany: {
            args: Prisma.HostAdjustmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HostAdjustmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>[]
          }
          delete: {
            args: Prisma.HostAdjustmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>
          }
          update: {
            args: Prisma.HostAdjustmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>
          }
          deleteMany: {
            args: Prisma.HostAdjustmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HostAdjustmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HostAdjustmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>[]
          }
          upsert: {
            args: Prisma.HostAdjustmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HostAdjustmentPayload>
          }
          aggregate: {
            args: Prisma.HostAdjustmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHostAdjustment>
          }
          groupBy: {
            args: Prisma.HostAdjustmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<HostAdjustmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.HostAdjustmentCountArgs<ExtArgs>
            result: $Utils.Optional<HostAdjustmentCountAggregateOutputType> | number
          }
        }
      }
      OrganizerTrustScore: {
        payload: Prisma.$OrganizerTrustScorePayload<ExtArgs>
        fields: Prisma.OrganizerTrustScoreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrganizerTrustScoreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrganizerTrustScoreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>
          }
          findFirst: {
            args: Prisma.OrganizerTrustScoreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrganizerTrustScoreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>
          }
          findMany: {
            args: Prisma.OrganizerTrustScoreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>[]
          }
          create: {
            args: Prisma.OrganizerTrustScoreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>
          }
          createMany: {
            args: Prisma.OrganizerTrustScoreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrganizerTrustScoreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>[]
          }
          delete: {
            args: Prisma.OrganizerTrustScoreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>
          }
          update: {
            args: Prisma.OrganizerTrustScoreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>
          }
          deleteMany: {
            args: Prisma.OrganizerTrustScoreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrganizerTrustScoreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OrganizerTrustScoreUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>[]
          }
          upsert: {
            args: Prisma.OrganizerTrustScoreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizerTrustScorePayload>
          }
          aggregate: {
            args: Prisma.OrganizerTrustScoreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrganizerTrustScore>
          }
          groupBy: {
            args: Prisma.OrganizerTrustScoreGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrganizerTrustScoreGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrganizerTrustScoreCountArgs<ExtArgs>
            result: $Utils.Optional<OrganizerTrustScoreCountAggregateOutputType> | number
          }
        }
      }
      EventUserResponse: {
        payload: Prisma.$EventUserResponsePayload<ExtArgs>
        fields: Prisma.EventUserResponseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventUserResponseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventUserResponseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>
          }
          findFirst: {
            args: Prisma.EventUserResponseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventUserResponseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>
          }
          findMany: {
            args: Prisma.EventUserResponseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>[]
          }
          create: {
            args: Prisma.EventUserResponseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>
          }
          createMany: {
            args: Prisma.EventUserResponseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventUserResponseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>[]
          }
          delete: {
            args: Prisma.EventUserResponseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>
          }
          update: {
            args: Prisma.EventUserResponseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>
          }
          deleteMany: {
            args: Prisma.EventUserResponseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventUserResponseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventUserResponseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>[]
          }
          upsert: {
            args: Prisma.EventUserResponseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventUserResponsePayload>
          }
          aggregate: {
            args: Prisma.EventUserResponseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventUserResponse>
          }
          groupBy: {
            args: Prisma.EventUserResponseGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventUserResponseGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventUserResponseCountArgs<ExtArgs>
            result: $Utils.Optional<EventUserResponseCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    booking?: BookingOmit
    interaction?: InteractionOmit
    paymentTransaction?: PaymentTransactionOmit
    settlement?: SettlementOmit
    hostLinkedAccount?: HostLinkedAccountOmit
    ledger?: LedgerOmit
    hostAdjustment?: HostAdjustmentOmit
    organizerTrustScore?: OrganizerTrustScoreOmit
    eventUserResponse?: EventUserResponseOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type BookingCountOutputType
   */

  export type BookingCountOutputType = {
    paymentTransactions: number
  }

  export type BookingCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    paymentTransactions?: boolean | BookingCountOutputTypeCountPaymentTransactionsArgs
  }

  // Custom InputTypes
  /**
   * BookingCountOutputType without action
   */
  export type BookingCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BookingCountOutputType
     */
    select?: BookingCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BookingCountOutputType without action
   */
  export type BookingCountOutputTypeCountPaymentTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentTransactionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Booking
   */

  export type AggregateBooking = {
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  export type BookingAvgAggregateOutputType = {
    quantity: number | null
    pricePerTicket: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
    platformFee: Decimal | null
    totalAmount: Decimal | null
    refundAmount: Decimal | null
    cancellationCount: number | null
    refund_retry_count: number | null
    convenienceFee: Decimal | null
    organizerGst: Decimal | null
    platformGst: Decimal | null
    food_addon_amount: Decimal | null
    accommodation_addon_amount: Decimal | null
  }

  export type BookingSumAggregateOutputType = {
    quantity: number | null
    pricePerTicket: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
    platformFee: Decimal | null
    totalAmount: Decimal | null
    refundAmount: Decimal | null
    cancellationCount: number | null
    refund_retry_count: number | null
    convenienceFee: Decimal | null
    organizerGst: Decimal | null
    platformGst: Decimal | null
    food_addon_amount: Decimal | null
    accommodation_addon_amount: Decimal | null
  }

  export type BookingMinAggregateOutputType = {
    id: string | null
    bookingId: string | null
    userId: string | null
    ticketId: string | null
    groupId: string | null
    ticketType: string | null
    quantity: number | null
    pricePerTicket: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
    platformFee: Decimal | null
    totalAmount: Decimal | null
    currency: string | null
    paymentStatus: $Enums.PaymentStatus | null
    paymentMethod: string | null
    razorpayOrderId: string | null
    razorpayPaymentId: string | null
    razorpaySignature: string | null
    bookingStatus: $Enums.BookingStatus | null
    qrCode: string | null
    qrCodeUrl: string | null
    isVerified: boolean | null
    verifiedAt: Date | null
    verifiedBy: string | null
    cancellationReason: string | null
    cancelledAt: Date | null
    refundAmount: Decimal | null
    refundStatus: $Enums.RefundStatus | null
    refundProcessedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    cancellationCount: number | null
    refundId: string | null
    refundInitiatedAt: Date | null
    refund_retry_count: number | null
    convenienceFee: Decimal | null
    organizerGst: Decimal | null
    platformGst: Decimal | null
    settlementMode: string | null
    refundPolicyId: string | null
    financialState: string | null
    refundReason: string | null
    isAdminCancelled: boolean | null
    isRead: boolean | null
    food_addon_amount: Decimal | null
    accommodation_addon_amount: Decimal | null
  }

  export type BookingMaxAggregateOutputType = {
    id: string | null
    bookingId: string | null
    userId: string | null
    ticketId: string | null
    groupId: string | null
    ticketType: string | null
    quantity: number | null
    pricePerTicket: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
    platformFee: Decimal | null
    totalAmount: Decimal | null
    currency: string | null
    paymentStatus: $Enums.PaymentStatus | null
    paymentMethod: string | null
    razorpayOrderId: string | null
    razorpayPaymentId: string | null
    razorpaySignature: string | null
    bookingStatus: $Enums.BookingStatus | null
    qrCode: string | null
    qrCodeUrl: string | null
    isVerified: boolean | null
    verifiedAt: Date | null
    verifiedBy: string | null
    cancellationReason: string | null
    cancelledAt: Date | null
    refundAmount: Decimal | null
    refundStatus: $Enums.RefundStatus | null
    refundProcessedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    cancellationCount: number | null
    refundId: string | null
    refundInitiatedAt: Date | null
    refund_retry_count: number | null
    convenienceFee: Decimal | null
    organizerGst: Decimal | null
    platformGst: Decimal | null
    settlementMode: string | null
    refundPolicyId: string | null
    financialState: string | null
    refundReason: string | null
    isAdminCancelled: boolean | null
    isRead: boolean | null
    food_addon_amount: Decimal | null
    accommodation_addon_amount: Decimal | null
  }

  export type BookingCountAggregateOutputType = {
    id: number
    bookingId: number
    userId: number
    ticketId: number
    groupId: number
    ticketType: number
    quantity: number
    pricePerTicket: number
    subtotal: number
    tax: number
    platformFee: number
    totalAmount: number
    currency: number
    paymentStatus: number
    paymentMethod: number
    razorpayOrderId: number
    razorpayPaymentId: number
    razorpaySignature: number
    bookingStatus: number
    userDetails: number
    eventDetails: number
    qrCode: number
    qrCodeUrl: number
    isVerified: number
    verifiedAt: number
    verifiedBy: number
    cancellationReason: number
    cancelledAt: number
    refundAmount: number
    refundStatus: number
    refundProcessedAt: number
    createdAt: number
    updatedAt: number
    cancellationCount: number
    refundId: number
    refundInitiatedAt: number
    seatDetails: number
    refund_retry_count: number
    convenienceFee: number
    organizerGst: number
    platformGst: number
    settlementMode: number
    refundPolicyId: number
    financialState: number
    refundReason: number
    isAdminCancelled: number
    isRead: number
    food_addon_amount: number
    accommodation_addon_amount: number
    _all: number
  }


  export type BookingAvgAggregateInputType = {
    quantity?: true
    pricePerTicket?: true
    subtotal?: true
    tax?: true
    platformFee?: true
    totalAmount?: true
    refundAmount?: true
    cancellationCount?: true
    refund_retry_count?: true
    convenienceFee?: true
    organizerGst?: true
    platformGst?: true
    food_addon_amount?: true
    accommodation_addon_amount?: true
  }

  export type BookingSumAggregateInputType = {
    quantity?: true
    pricePerTicket?: true
    subtotal?: true
    tax?: true
    platformFee?: true
    totalAmount?: true
    refundAmount?: true
    cancellationCount?: true
    refund_retry_count?: true
    convenienceFee?: true
    organizerGst?: true
    platformGst?: true
    food_addon_amount?: true
    accommodation_addon_amount?: true
  }

  export type BookingMinAggregateInputType = {
    id?: true
    bookingId?: true
    userId?: true
    ticketId?: true
    groupId?: true
    ticketType?: true
    quantity?: true
    pricePerTicket?: true
    subtotal?: true
    tax?: true
    platformFee?: true
    totalAmount?: true
    currency?: true
    paymentStatus?: true
    paymentMethod?: true
    razorpayOrderId?: true
    razorpayPaymentId?: true
    razorpaySignature?: true
    bookingStatus?: true
    qrCode?: true
    qrCodeUrl?: true
    isVerified?: true
    verifiedAt?: true
    verifiedBy?: true
    cancellationReason?: true
    cancelledAt?: true
    refundAmount?: true
    refundStatus?: true
    refundProcessedAt?: true
    createdAt?: true
    updatedAt?: true
    cancellationCount?: true
    refundId?: true
    refundInitiatedAt?: true
    refund_retry_count?: true
    convenienceFee?: true
    organizerGst?: true
    platformGst?: true
    settlementMode?: true
    refundPolicyId?: true
    financialState?: true
    refundReason?: true
    isAdminCancelled?: true
    isRead?: true
    food_addon_amount?: true
    accommodation_addon_amount?: true
  }

  export type BookingMaxAggregateInputType = {
    id?: true
    bookingId?: true
    userId?: true
    ticketId?: true
    groupId?: true
    ticketType?: true
    quantity?: true
    pricePerTicket?: true
    subtotal?: true
    tax?: true
    platformFee?: true
    totalAmount?: true
    currency?: true
    paymentStatus?: true
    paymentMethod?: true
    razorpayOrderId?: true
    razorpayPaymentId?: true
    razorpaySignature?: true
    bookingStatus?: true
    qrCode?: true
    qrCodeUrl?: true
    isVerified?: true
    verifiedAt?: true
    verifiedBy?: true
    cancellationReason?: true
    cancelledAt?: true
    refundAmount?: true
    refundStatus?: true
    refundProcessedAt?: true
    createdAt?: true
    updatedAt?: true
    cancellationCount?: true
    refundId?: true
    refundInitiatedAt?: true
    refund_retry_count?: true
    convenienceFee?: true
    organizerGst?: true
    platformGst?: true
    settlementMode?: true
    refundPolicyId?: true
    financialState?: true
    refundReason?: true
    isAdminCancelled?: true
    isRead?: true
    food_addon_amount?: true
    accommodation_addon_amount?: true
  }

  export type BookingCountAggregateInputType = {
    id?: true
    bookingId?: true
    userId?: true
    ticketId?: true
    groupId?: true
    ticketType?: true
    quantity?: true
    pricePerTicket?: true
    subtotal?: true
    tax?: true
    platformFee?: true
    totalAmount?: true
    currency?: true
    paymentStatus?: true
    paymentMethod?: true
    razorpayOrderId?: true
    razorpayPaymentId?: true
    razorpaySignature?: true
    bookingStatus?: true
    userDetails?: true
    eventDetails?: true
    qrCode?: true
    qrCodeUrl?: true
    isVerified?: true
    verifiedAt?: true
    verifiedBy?: true
    cancellationReason?: true
    cancelledAt?: true
    refundAmount?: true
    refundStatus?: true
    refundProcessedAt?: true
    createdAt?: true
    updatedAt?: true
    cancellationCount?: true
    refundId?: true
    refundInitiatedAt?: true
    seatDetails?: true
    refund_retry_count?: true
    convenienceFee?: true
    organizerGst?: true
    platformGst?: true
    settlementMode?: true
    refundPolicyId?: true
    financialState?: true
    refundReason?: true
    isAdminCancelled?: true
    isRead?: true
    food_addon_amount?: true
    accommodation_addon_amount?: true
    _all?: true
  }

  export type BookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Booking to aggregate.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bookings
    **/
    _count?: true | BookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BookingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BookingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BookingMaxAggregateInputType
  }

  export type GetBookingAggregateType<T extends BookingAggregateArgs> = {
        [P in keyof T & keyof AggregateBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBooking[P]>
      : GetScalarType<T[P], AggregateBooking[P]>
  }




  export type BookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithAggregationInput | BookingOrderByWithAggregationInput[]
    by: BookingScalarFieldEnum[] | BookingScalarFieldEnum
    having?: BookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BookingCountAggregateInputType | true
    _avg?: BookingAvgAggregateInputType
    _sum?: BookingSumAggregateInputType
    _min?: BookingMinAggregateInputType
    _max?: BookingMaxAggregateInputType
  }

  export type BookingGroupByOutputType = {
    id: string
    bookingId: string
    userId: string
    ticketId: string
    groupId: string
    ticketType: string
    quantity: number
    pricePerTicket: Decimal
    subtotal: Decimal
    tax: Decimal
    platformFee: Decimal
    totalAmount: Decimal
    currency: string
    paymentStatus: $Enums.PaymentStatus
    paymentMethod: string | null
    razorpayOrderId: string | null
    razorpayPaymentId: string | null
    razorpaySignature: string | null
    bookingStatus: $Enums.BookingStatus
    userDetails: JsonValue
    eventDetails: JsonValue
    qrCode: string | null
    qrCodeUrl: string | null
    isVerified: boolean
    verifiedAt: Date | null
    verifiedBy: string | null
    cancellationReason: string | null
    cancelledAt: Date | null
    refundAmount: Decimal | null
    refundStatus: $Enums.RefundStatus | null
    refundProcessedAt: Date | null
    createdAt: Date
    updatedAt: Date
    cancellationCount: number
    refundId: string | null
    refundInitiatedAt: Date | null
    seatDetails: JsonValue | null
    refund_retry_count: number
    convenienceFee: Decimal
    organizerGst: Decimal
    platformGst: Decimal
    settlementMode: string
    refundPolicyId: string
    financialState: string
    refundReason: string | null
    isAdminCancelled: boolean
    isRead: boolean
    food_addon_amount: Decimal
    accommodation_addon_amount: Decimal
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  type GetBookingGroupByPayload<T extends BookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BookingGroupByOutputType[P]>
            : GetScalarType<T[P], BookingGroupByOutputType[P]>
        }
      >
    >


  export type BookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    userId?: boolean
    ticketId?: boolean
    groupId?: boolean
    ticketType?: boolean
    quantity?: boolean
    pricePerTicket?: boolean
    subtotal?: boolean
    tax?: boolean
    platformFee?: boolean
    totalAmount?: boolean
    currency?: boolean
    paymentStatus?: boolean
    paymentMethod?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    razorpaySignature?: boolean
    bookingStatus?: boolean
    userDetails?: boolean
    eventDetails?: boolean
    qrCode?: boolean
    qrCodeUrl?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    cancellationReason?: boolean
    cancelledAt?: boolean
    refundAmount?: boolean
    refundStatus?: boolean
    refundProcessedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    cancellationCount?: boolean
    refundId?: boolean
    refundInitiatedAt?: boolean
    seatDetails?: boolean
    refund_retry_count?: boolean
    convenienceFee?: boolean
    organizerGst?: boolean
    platformGst?: boolean
    settlementMode?: boolean
    refundPolicyId?: boolean
    financialState?: boolean
    refundReason?: boolean
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: boolean
    accommodation_addon_amount?: boolean
    paymentTransactions?: boolean | Booking$paymentTransactionsArgs<ExtArgs>
    _count?: boolean | BookingCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    userId?: boolean
    ticketId?: boolean
    groupId?: boolean
    ticketType?: boolean
    quantity?: boolean
    pricePerTicket?: boolean
    subtotal?: boolean
    tax?: boolean
    platformFee?: boolean
    totalAmount?: boolean
    currency?: boolean
    paymentStatus?: boolean
    paymentMethod?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    razorpaySignature?: boolean
    bookingStatus?: boolean
    userDetails?: boolean
    eventDetails?: boolean
    qrCode?: boolean
    qrCodeUrl?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    cancellationReason?: boolean
    cancelledAt?: boolean
    refundAmount?: boolean
    refundStatus?: boolean
    refundProcessedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    cancellationCount?: boolean
    refundId?: boolean
    refundInitiatedAt?: boolean
    seatDetails?: boolean
    refund_retry_count?: boolean
    convenienceFee?: boolean
    organizerGst?: boolean
    platformGst?: boolean
    settlementMode?: boolean
    refundPolicyId?: boolean
    financialState?: boolean
    refundReason?: boolean
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: boolean
    accommodation_addon_amount?: boolean
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    userId?: boolean
    ticketId?: boolean
    groupId?: boolean
    ticketType?: boolean
    quantity?: boolean
    pricePerTicket?: boolean
    subtotal?: boolean
    tax?: boolean
    platformFee?: boolean
    totalAmount?: boolean
    currency?: boolean
    paymentStatus?: boolean
    paymentMethod?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    razorpaySignature?: boolean
    bookingStatus?: boolean
    userDetails?: boolean
    eventDetails?: boolean
    qrCode?: boolean
    qrCodeUrl?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    cancellationReason?: boolean
    cancelledAt?: boolean
    refundAmount?: boolean
    refundStatus?: boolean
    refundProcessedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    cancellationCount?: boolean
    refundId?: boolean
    refundInitiatedAt?: boolean
    seatDetails?: boolean
    refund_retry_count?: boolean
    convenienceFee?: boolean
    organizerGst?: boolean
    platformGst?: boolean
    settlementMode?: boolean
    refundPolicyId?: boolean
    financialState?: boolean
    refundReason?: boolean
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: boolean
    accommodation_addon_amount?: boolean
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectScalar = {
    id?: boolean
    bookingId?: boolean
    userId?: boolean
    ticketId?: boolean
    groupId?: boolean
    ticketType?: boolean
    quantity?: boolean
    pricePerTicket?: boolean
    subtotal?: boolean
    tax?: boolean
    platformFee?: boolean
    totalAmount?: boolean
    currency?: boolean
    paymentStatus?: boolean
    paymentMethod?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    razorpaySignature?: boolean
    bookingStatus?: boolean
    userDetails?: boolean
    eventDetails?: boolean
    qrCode?: boolean
    qrCodeUrl?: boolean
    isVerified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    cancellationReason?: boolean
    cancelledAt?: boolean
    refundAmount?: boolean
    refundStatus?: boolean
    refundProcessedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    cancellationCount?: boolean
    refundId?: boolean
    refundInitiatedAt?: boolean
    seatDetails?: boolean
    refund_retry_count?: boolean
    convenienceFee?: boolean
    organizerGst?: boolean
    platformGst?: boolean
    settlementMode?: boolean
    refundPolicyId?: boolean
    financialState?: boolean
    refundReason?: boolean
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: boolean
    accommodation_addon_amount?: boolean
  }

  export type BookingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "bookingId" | "userId" | "ticketId" | "groupId" | "ticketType" | "quantity" | "pricePerTicket" | "subtotal" | "tax" | "platformFee" | "totalAmount" | "currency" | "paymentStatus" | "paymentMethod" | "razorpayOrderId" | "razorpayPaymentId" | "razorpaySignature" | "bookingStatus" | "userDetails" | "eventDetails" | "qrCode" | "qrCodeUrl" | "isVerified" | "verifiedAt" | "verifiedBy" | "cancellationReason" | "cancelledAt" | "refundAmount" | "refundStatus" | "refundProcessedAt" | "createdAt" | "updatedAt" | "cancellationCount" | "refundId" | "refundInitiatedAt" | "seatDetails" | "refund_retry_count" | "convenienceFee" | "organizerGst" | "platformGst" | "settlementMode" | "refundPolicyId" | "financialState" | "refundReason" | "isAdminCancelled" | "isRead" | "food_addon_amount" | "accommodation_addon_amount", ExtArgs["result"]["booking"]>
  export type BookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    paymentTransactions?: boolean | Booking$paymentTransactionsArgs<ExtArgs>
    _count?: boolean | BookingCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type BookingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $BookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Booking"
    objects: {
      paymentTransactions: Prisma.$PaymentTransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      bookingId: string
      userId: string
      ticketId: string
      groupId: string
      ticketType: string
      quantity: number
      pricePerTicket: Prisma.Decimal
      subtotal: Prisma.Decimal
      tax: Prisma.Decimal
      platformFee: Prisma.Decimal
      totalAmount: Prisma.Decimal
      currency: string
      paymentStatus: $Enums.PaymentStatus
      paymentMethod: string | null
      razorpayOrderId: string | null
      razorpayPaymentId: string | null
      razorpaySignature: string | null
      bookingStatus: $Enums.BookingStatus
      userDetails: Prisma.JsonValue
      eventDetails: Prisma.JsonValue
      qrCode: string | null
      qrCodeUrl: string | null
      isVerified: boolean
      verifiedAt: Date | null
      verifiedBy: string | null
      cancellationReason: string | null
      cancelledAt: Date | null
      refundAmount: Prisma.Decimal | null
      refundStatus: $Enums.RefundStatus | null
      refundProcessedAt: Date | null
      createdAt: Date
      updatedAt: Date
      cancellationCount: number
      refundId: string | null
      refundInitiatedAt: Date | null
      seatDetails: Prisma.JsonValue | null
      refund_retry_count: number
      convenienceFee: Prisma.Decimal
      organizerGst: Prisma.Decimal
      platformGst: Prisma.Decimal
      settlementMode: string
      refundPolicyId: string
      financialState: string
      refundReason: string | null
      isAdminCancelled: boolean
      isRead: boolean
      food_addon_amount: Prisma.Decimal
      accommodation_addon_amount: Prisma.Decimal
    }, ExtArgs["result"]["booking"]>
    composites: {}
  }

  type BookingGetPayload<S extends boolean | null | undefined | BookingDefaultArgs> = $Result.GetResult<Prisma.$BookingPayload, S>

  type BookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BookingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BookingCountAggregateInputType | true
    }

  export interface BookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Booking'], meta: { name: 'Booking' } }
    /**
     * Find zero or one Booking that matches the filter.
     * @param {BookingFindUniqueArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BookingFindUniqueArgs>(args: SelectSubset<T, BookingFindUniqueArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Booking that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BookingFindUniqueOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BookingFindUniqueOrThrowArgs>(args: SelectSubset<T, BookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Booking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BookingFindFirstArgs>(args?: SelectSubset<T, BookingFindFirstArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Booking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BookingFindFirstOrThrowArgs>(args?: SelectSubset<T, BookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Bookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bookings
     * const bookings = await prisma.booking.findMany()
     * 
     * // Get first 10 Bookings
     * const bookings = await prisma.booking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bookingWithIdOnly = await prisma.booking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BookingFindManyArgs>(args?: SelectSubset<T, BookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Booking.
     * @param {BookingCreateArgs} args - Arguments to create a Booking.
     * @example
     * // Create one Booking
     * const Booking = await prisma.booking.create({
     *   data: {
     *     // ... data to create a Booking
     *   }
     * })
     * 
     */
    create<T extends BookingCreateArgs>(args: SelectSubset<T, BookingCreateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Bookings.
     * @param {BookingCreateManyArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BookingCreateManyArgs>(args?: SelectSubset<T, BookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Bookings and returns the data saved in the database.
     * @param {BookingCreateManyAndReturnArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BookingCreateManyAndReturnArgs>(args?: SelectSubset<T, BookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Booking.
     * @param {BookingDeleteArgs} args - Arguments to delete one Booking.
     * @example
     * // Delete one Booking
     * const Booking = await prisma.booking.delete({
     *   where: {
     *     // ... filter to delete one Booking
     *   }
     * })
     * 
     */
    delete<T extends BookingDeleteArgs>(args: SelectSubset<T, BookingDeleteArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Booking.
     * @param {BookingUpdateArgs} args - Arguments to update one Booking.
     * @example
     * // Update one Booking
     * const booking = await prisma.booking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BookingUpdateArgs>(args: SelectSubset<T, BookingUpdateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Bookings.
     * @param {BookingDeleteManyArgs} args - Arguments to filter Bookings to delete.
     * @example
     * // Delete a few Bookings
     * const { count } = await prisma.booking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BookingDeleteManyArgs>(args?: SelectSubset<T, BookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BookingUpdateManyArgs>(args: SelectSubset<T, BookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings and returns the data updated in the database.
     * @param {BookingUpdateManyAndReturnArgs} args - Arguments to update many Bookings.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BookingUpdateManyAndReturnArgs>(args: SelectSubset<T, BookingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Booking.
     * @param {BookingUpsertArgs} args - Arguments to update or create a Booking.
     * @example
     * // Update or create a Booking
     * const booking = await prisma.booking.upsert({
     *   create: {
     *     // ... data to create a Booking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Booking we want to update
     *   }
     * })
     */
    upsert<T extends BookingUpsertArgs>(args: SelectSubset<T, BookingUpsertArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingCountArgs} args - Arguments to filter Bookings to count.
     * @example
     * // Count the number of Bookings
     * const count = await prisma.booking.count({
     *   where: {
     *     // ... the filter for the Bookings we want to count
     *   }
     * })
    **/
    count<T extends BookingCountArgs>(
      args?: Subset<T, BookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BookingAggregateArgs>(args: Subset<T, BookingAggregateArgs>): Prisma.PrismaPromise<GetBookingAggregateType<T>>

    /**
     * Group by Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BookingGroupByArgs['orderBy'] }
        : { orderBy?: BookingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Booking model
   */
  readonly fields: BookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Booking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    paymentTransactions<T extends Booking$paymentTransactionsArgs<ExtArgs> = {}>(args?: Subset<T, Booking$paymentTransactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Booking model
   */
  interface BookingFieldRefs {
    readonly id: FieldRef<"Booking", 'String'>
    readonly bookingId: FieldRef<"Booking", 'String'>
    readonly userId: FieldRef<"Booking", 'String'>
    readonly ticketId: FieldRef<"Booking", 'String'>
    readonly groupId: FieldRef<"Booking", 'String'>
    readonly ticketType: FieldRef<"Booking", 'String'>
    readonly quantity: FieldRef<"Booking", 'Int'>
    readonly pricePerTicket: FieldRef<"Booking", 'Decimal'>
    readonly subtotal: FieldRef<"Booking", 'Decimal'>
    readonly tax: FieldRef<"Booking", 'Decimal'>
    readonly platformFee: FieldRef<"Booking", 'Decimal'>
    readonly totalAmount: FieldRef<"Booking", 'Decimal'>
    readonly currency: FieldRef<"Booking", 'String'>
    readonly paymentStatus: FieldRef<"Booking", 'PaymentStatus'>
    readonly paymentMethod: FieldRef<"Booking", 'String'>
    readonly razorpayOrderId: FieldRef<"Booking", 'String'>
    readonly razorpayPaymentId: FieldRef<"Booking", 'String'>
    readonly razorpaySignature: FieldRef<"Booking", 'String'>
    readonly bookingStatus: FieldRef<"Booking", 'BookingStatus'>
    readonly userDetails: FieldRef<"Booking", 'Json'>
    readonly eventDetails: FieldRef<"Booking", 'Json'>
    readonly qrCode: FieldRef<"Booking", 'String'>
    readonly qrCodeUrl: FieldRef<"Booking", 'String'>
    readonly isVerified: FieldRef<"Booking", 'Boolean'>
    readonly verifiedAt: FieldRef<"Booking", 'DateTime'>
    readonly verifiedBy: FieldRef<"Booking", 'String'>
    readonly cancellationReason: FieldRef<"Booking", 'String'>
    readonly cancelledAt: FieldRef<"Booking", 'DateTime'>
    readonly refundAmount: FieldRef<"Booking", 'Decimal'>
    readonly refundStatus: FieldRef<"Booking", 'RefundStatus'>
    readonly refundProcessedAt: FieldRef<"Booking", 'DateTime'>
    readonly createdAt: FieldRef<"Booking", 'DateTime'>
    readonly updatedAt: FieldRef<"Booking", 'DateTime'>
    readonly cancellationCount: FieldRef<"Booking", 'Int'>
    readonly refundId: FieldRef<"Booking", 'String'>
    readonly refundInitiatedAt: FieldRef<"Booking", 'DateTime'>
    readonly seatDetails: FieldRef<"Booking", 'Json'>
    readonly refund_retry_count: FieldRef<"Booking", 'Int'>
    readonly convenienceFee: FieldRef<"Booking", 'Decimal'>
    readonly organizerGst: FieldRef<"Booking", 'Decimal'>
    readonly platformGst: FieldRef<"Booking", 'Decimal'>
    readonly settlementMode: FieldRef<"Booking", 'String'>
    readonly refundPolicyId: FieldRef<"Booking", 'String'>
    readonly financialState: FieldRef<"Booking", 'String'>
    readonly refundReason: FieldRef<"Booking", 'String'>
    readonly isAdminCancelled: FieldRef<"Booking", 'Boolean'>
    readonly isRead: FieldRef<"Booking", 'Boolean'>
    readonly food_addon_amount: FieldRef<"Booking", 'Decimal'>
    readonly accommodation_addon_amount: FieldRef<"Booking", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * Booking findUnique
   */
  export type BookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findUniqueOrThrow
   */
  export type BookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findFirst
   */
  export type BookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findFirstOrThrow
   */
  export type BookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findMany
   */
  export type BookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Bookings to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking create
   */
  export type BookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to create a Booking.
     */
    data: XOR<BookingCreateInput, BookingUncheckedCreateInput>
  }

  /**
   * Booking createMany
   */
  export type BookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Booking createManyAndReturn
   */
  export type BookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Booking update
   */
  export type BookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to update a Booking.
     */
    data: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
    /**
     * Choose, which Booking to update.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking updateMany
   */
  export type BookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
  }

  /**
   * Booking updateManyAndReturn
   */
  export type BookingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
  }

  /**
   * Booking upsert
   */
  export type BookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The filter to search for the Booking to update in case it exists.
     */
    where: BookingWhereUniqueInput
    /**
     * In case the Booking found by the `where` argument doesn't exist, create a new Booking with this data.
     */
    create: XOR<BookingCreateInput, BookingUncheckedCreateInput>
    /**
     * In case the Booking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
  }

  /**
   * Booking delete
   */
  export type BookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter which Booking to delete.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking deleteMany
   */
  export type BookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bookings to delete
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to delete.
     */
    limit?: number
  }

  /**
   * Booking.paymentTransactions
   */
  export type Booking$paymentTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    where?: PaymentTransactionWhereInput
    orderBy?: PaymentTransactionOrderByWithRelationInput | PaymentTransactionOrderByWithRelationInput[]
    cursor?: PaymentTransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PaymentTransactionScalarFieldEnum | PaymentTransactionScalarFieldEnum[]
  }

  /**
   * Booking without action
   */
  export type BookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
  }


  /**
   * Model Interaction
   */

  export type AggregateInteraction = {
    _count: InteractionCountAggregateOutputType | null
    _min: InteractionMinAggregateOutputType | null
    _max: InteractionMaxAggregateOutputType | null
  }

  export type InteractionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    ticketId: string | null
    interactionType: $Enums.InteractionType | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InteractionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    ticketId: string | null
    interactionType: $Enums.InteractionType | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InteractionCountAggregateOutputType = {
    id: number
    userId: number
    ticketId: number
    interactionType: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InteractionMinAggregateInputType = {
    id?: true
    userId?: true
    ticketId?: true
    interactionType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InteractionMaxAggregateInputType = {
    id?: true
    userId?: true
    ticketId?: true
    interactionType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InteractionCountAggregateInputType = {
    id?: true
    userId?: true
    ticketId?: true
    interactionType?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InteractionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Interaction to aggregate.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Interactions
    **/
    _count?: true | InteractionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InteractionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InteractionMaxAggregateInputType
  }

  export type GetInteractionAggregateType<T extends InteractionAggregateArgs> = {
        [P in keyof T & keyof AggregateInteraction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInteraction[P]>
      : GetScalarType<T[P], AggregateInteraction[P]>
  }




  export type InteractionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InteractionWhereInput
    orderBy?: InteractionOrderByWithAggregationInput | InteractionOrderByWithAggregationInput[]
    by: InteractionScalarFieldEnum[] | InteractionScalarFieldEnum
    having?: InteractionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InteractionCountAggregateInputType | true
    _min?: InteractionMinAggregateInputType
    _max?: InteractionMaxAggregateInputType
  }

  export type InteractionGroupByOutputType = {
    id: string
    userId: string
    ticketId: string
    interactionType: $Enums.InteractionType
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: InteractionCountAggregateOutputType | null
    _min: InteractionMinAggregateOutputType | null
    _max: InteractionMaxAggregateOutputType | null
  }

  type GetInteractionGroupByPayload<T extends InteractionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InteractionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InteractionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InteractionGroupByOutputType[P]>
            : GetScalarType<T[P], InteractionGroupByOutputType[P]>
        }
      >
    >


  export type InteractionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    ticketId?: boolean
    interactionType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["interaction"]>

  export type InteractionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    ticketId?: boolean
    interactionType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["interaction"]>

  export type InteractionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    ticketId?: boolean
    interactionType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["interaction"]>

  export type InteractionSelectScalar = {
    id?: boolean
    userId?: boolean
    ticketId?: boolean
    interactionType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InteractionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "ticketId" | "interactionType" | "metadata" | "createdAt" | "updatedAt", ExtArgs["result"]["interaction"]>

  export type $InteractionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Interaction"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      ticketId: string
      interactionType: $Enums.InteractionType
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["interaction"]>
    composites: {}
  }

  type InteractionGetPayload<S extends boolean | null | undefined | InteractionDefaultArgs> = $Result.GetResult<Prisma.$InteractionPayload, S>

  type InteractionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InteractionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InteractionCountAggregateInputType | true
    }

  export interface InteractionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Interaction'], meta: { name: 'Interaction' } }
    /**
     * Find zero or one Interaction that matches the filter.
     * @param {InteractionFindUniqueArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InteractionFindUniqueArgs>(args: SelectSubset<T, InteractionFindUniqueArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Interaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InteractionFindUniqueOrThrowArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InteractionFindUniqueOrThrowArgs>(args: SelectSubset<T, InteractionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Interaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionFindFirstArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InteractionFindFirstArgs>(args?: SelectSubset<T, InteractionFindFirstArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Interaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionFindFirstOrThrowArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InteractionFindFirstOrThrowArgs>(args?: SelectSubset<T, InteractionFindFirstOrThrowArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Interactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Interactions
     * const interactions = await prisma.interaction.findMany()
     * 
     * // Get first 10 Interactions
     * const interactions = await prisma.interaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const interactionWithIdOnly = await prisma.interaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InteractionFindManyArgs>(args?: SelectSubset<T, InteractionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Interaction.
     * @param {InteractionCreateArgs} args - Arguments to create a Interaction.
     * @example
     * // Create one Interaction
     * const Interaction = await prisma.interaction.create({
     *   data: {
     *     // ... data to create a Interaction
     *   }
     * })
     * 
     */
    create<T extends InteractionCreateArgs>(args: SelectSubset<T, InteractionCreateArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Interactions.
     * @param {InteractionCreateManyArgs} args - Arguments to create many Interactions.
     * @example
     * // Create many Interactions
     * const interaction = await prisma.interaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InteractionCreateManyArgs>(args?: SelectSubset<T, InteractionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Interactions and returns the data saved in the database.
     * @param {InteractionCreateManyAndReturnArgs} args - Arguments to create many Interactions.
     * @example
     * // Create many Interactions
     * const interaction = await prisma.interaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Interactions and only return the `id`
     * const interactionWithIdOnly = await prisma.interaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InteractionCreateManyAndReturnArgs>(args?: SelectSubset<T, InteractionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Interaction.
     * @param {InteractionDeleteArgs} args - Arguments to delete one Interaction.
     * @example
     * // Delete one Interaction
     * const Interaction = await prisma.interaction.delete({
     *   where: {
     *     // ... filter to delete one Interaction
     *   }
     * })
     * 
     */
    delete<T extends InteractionDeleteArgs>(args: SelectSubset<T, InteractionDeleteArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Interaction.
     * @param {InteractionUpdateArgs} args - Arguments to update one Interaction.
     * @example
     * // Update one Interaction
     * const interaction = await prisma.interaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InteractionUpdateArgs>(args: SelectSubset<T, InteractionUpdateArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Interactions.
     * @param {InteractionDeleteManyArgs} args - Arguments to filter Interactions to delete.
     * @example
     * // Delete a few Interactions
     * const { count } = await prisma.interaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InteractionDeleteManyArgs>(args?: SelectSubset<T, InteractionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Interactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Interactions
     * const interaction = await prisma.interaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InteractionUpdateManyArgs>(args: SelectSubset<T, InteractionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Interactions and returns the data updated in the database.
     * @param {InteractionUpdateManyAndReturnArgs} args - Arguments to update many Interactions.
     * @example
     * // Update many Interactions
     * const interaction = await prisma.interaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Interactions and only return the `id`
     * const interactionWithIdOnly = await prisma.interaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InteractionUpdateManyAndReturnArgs>(args: SelectSubset<T, InteractionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Interaction.
     * @param {InteractionUpsertArgs} args - Arguments to update or create a Interaction.
     * @example
     * // Update or create a Interaction
     * const interaction = await prisma.interaction.upsert({
     *   create: {
     *     // ... data to create a Interaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Interaction we want to update
     *   }
     * })
     */
    upsert<T extends InteractionUpsertArgs>(args: SelectSubset<T, InteractionUpsertArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Interactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionCountArgs} args - Arguments to filter Interactions to count.
     * @example
     * // Count the number of Interactions
     * const count = await prisma.interaction.count({
     *   where: {
     *     // ... the filter for the Interactions we want to count
     *   }
     * })
    **/
    count<T extends InteractionCountArgs>(
      args?: Subset<T, InteractionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InteractionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Interaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InteractionAggregateArgs>(args: Subset<T, InteractionAggregateArgs>): Prisma.PrismaPromise<GetInteractionAggregateType<T>>

    /**
     * Group by Interaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InteractionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InteractionGroupByArgs['orderBy'] }
        : { orderBy?: InteractionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InteractionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInteractionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Interaction model
   */
  readonly fields: InteractionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Interaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InteractionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Interaction model
   */
  interface InteractionFieldRefs {
    readonly id: FieldRef<"Interaction", 'String'>
    readonly userId: FieldRef<"Interaction", 'String'>
    readonly ticketId: FieldRef<"Interaction", 'String'>
    readonly interactionType: FieldRef<"Interaction", 'InteractionType'>
    readonly metadata: FieldRef<"Interaction", 'Json'>
    readonly createdAt: FieldRef<"Interaction", 'DateTime'>
    readonly updatedAt: FieldRef<"Interaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Interaction findUnique
   */
  export type InteractionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction findUniqueOrThrow
   */
  export type InteractionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction findFirst
   */
  export type InteractionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Interactions.
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Interactions.
     */
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Interaction findFirstOrThrow
   */
  export type InteractionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Interactions.
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Interactions.
     */
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Interaction findMany
   */
  export type InteractionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Filter, which Interactions to fetch.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Interactions.
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Interaction create
   */
  export type InteractionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The data needed to create a Interaction.
     */
    data: XOR<InteractionCreateInput, InteractionUncheckedCreateInput>
  }

  /**
   * Interaction createMany
   */
  export type InteractionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Interactions.
     */
    data: InteractionCreateManyInput | InteractionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Interaction createManyAndReturn
   */
  export type InteractionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The data used to create many Interactions.
     */
    data: InteractionCreateManyInput | InteractionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Interaction update
   */
  export type InteractionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The data needed to update a Interaction.
     */
    data: XOR<InteractionUpdateInput, InteractionUncheckedUpdateInput>
    /**
     * Choose, which Interaction to update.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction updateMany
   */
  export type InteractionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Interactions.
     */
    data: XOR<InteractionUpdateManyMutationInput, InteractionUncheckedUpdateManyInput>
    /**
     * Filter which Interactions to update
     */
    where?: InteractionWhereInput
    /**
     * Limit how many Interactions to update.
     */
    limit?: number
  }

  /**
   * Interaction updateManyAndReturn
   */
  export type InteractionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The data used to update Interactions.
     */
    data: XOR<InteractionUpdateManyMutationInput, InteractionUncheckedUpdateManyInput>
    /**
     * Filter which Interactions to update
     */
    where?: InteractionWhereInput
    /**
     * Limit how many Interactions to update.
     */
    limit?: number
  }

  /**
   * Interaction upsert
   */
  export type InteractionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The filter to search for the Interaction to update in case it exists.
     */
    where: InteractionWhereUniqueInput
    /**
     * In case the Interaction found by the `where` argument doesn't exist, create a new Interaction with this data.
     */
    create: XOR<InteractionCreateInput, InteractionUncheckedCreateInput>
    /**
     * In case the Interaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InteractionUpdateInput, InteractionUncheckedUpdateInput>
  }

  /**
   * Interaction delete
   */
  export type InteractionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Filter which Interaction to delete.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction deleteMany
   */
  export type InteractionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Interactions to delete
     */
    where?: InteractionWhereInput
    /**
     * Limit how many Interactions to delete.
     */
    limit?: number
  }

  /**
   * Interaction without action
   */
  export type InteractionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
  }


  /**
   * Model PaymentTransaction
   */

  export type AggregatePaymentTransaction = {
    _count: PaymentTransactionCountAggregateOutputType | null
    _avg: PaymentTransactionAvgAggregateOutputType | null
    _sum: PaymentTransactionSumAggregateOutputType | null
    _min: PaymentTransactionMinAggregateOutputType | null
    _max: PaymentTransactionMaxAggregateOutputType | null
  }

  export type PaymentTransactionAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type PaymentTransactionSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type PaymentTransactionMinAggregateOutputType = {
    id: string | null
    bookingId: string | null
    razorpayOrderId: string | null
    razorpayPaymentId: string | null
    amount: Decimal | null
    currency: string | null
    status: $Enums.PaymentStatus | null
    method: string | null
    bank: string | null
    wallet: string | null
    vpa: string | null
    email: string | null
    contact: string | null
    errorCode: string | null
    errorDescription: string | null
    createdAt: Date | null
    updatedAt: Date | null
    refundId: string | null
  }

  export type PaymentTransactionMaxAggregateOutputType = {
    id: string | null
    bookingId: string | null
    razorpayOrderId: string | null
    razorpayPaymentId: string | null
    amount: Decimal | null
    currency: string | null
    status: $Enums.PaymentStatus | null
    method: string | null
    bank: string | null
    wallet: string | null
    vpa: string | null
    email: string | null
    contact: string | null
    errorCode: string | null
    errorDescription: string | null
    createdAt: Date | null
    updatedAt: Date | null
    refundId: string | null
  }

  export type PaymentTransactionCountAggregateOutputType = {
    id: number
    bookingId: number
    razorpayOrderId: number
    razorpayPaymentId: number
    amount: number
    currency: number
    status: number
    method: number
    bank: number
    wallet: number
    vpa: number
    email: number
    contact: number
    webhookData: number
    errorCode: number
    errorDescription: number
    createdAt: number
    updatedAt: number
    refundId: number
    _all: number
  }


  export type PaymentTransactionAvgAggregateInputType = {
    amount?: true
  }

  export type PaymentTransactionSumAggregateInputType = {
    amount?: true
  }

  export type PaymentTransactionMinAggregateInputType = {
    id?: true
    bookingId?: true
    razorpayOrderId?: true
    razorpayPaymentId?: true
    amount?: true
    currency?: true
    status?: true
    method?: true
    bank?: true
    wallet?: true
    vpa?: true
    email?: true
    contact?: true
    errorCode?: true
    errorDescription?: true
    createdAt?: true
    updatedAt?: true
    refundId?: true
  }

  export type PaymentTransactionMaxAggregateInputType = {
    id?: true
    bookingId?: true
    razorpayOrderId?: true
    razorpayPaymentId?: true
    amount?: true
    currency?: true
    status?: true
    method?: true
    bank?: true
    wallet?: true
    vpa?: true
    email?: true
    contact?: true
    errorCode?: true
    errorDescription?: true
    createdAt?: true
    updatedAt?: true
    refundId?: true
  }

  export type PaymentTransactionCountAggregateInputType = {
    id?: true
    bookingId?: true
    razorpayOrderId?: true
    razorpayPaymentId?: true
    amount?: true
    currency?: true
    status?: true
    method?: true
    bank?: true
    wallet?: true
    vpa?: true
    email?: true
    contact?: true
    webhookData?: true
    errorCode?: true
    errorDescription?: true
    createdAt?: true
    updatedAt?: true
    refundId?: true
    _all?: true
  }

  export type PaymentTransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentTransaction to aggregate.
     */
    where?: PaymentTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentTransactions to fetch.
     */
    orderBy?: PaymentTransactionOrderByWithRelationInput | PaymentTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PaymentTransactions
    **/
    _count?: true | PaymentTransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentTransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentTransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentTransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentTransactionMaxAggregateInputType
  }

  export type GetPaymentTransactionAggregateType<T extends PaymentTransactionAggregateArgs> = {
        [P in keyof T & keyof AggregatePaymentTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePaymentTransaction[P]>
      : GetScalarType<T[P], AggregatePaymentTransaction[P]>
  }




  export type PaymentTransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentTransactionWhereInput
    orderBy?: PaymentTransactionOrderByWithAggregationInput | PaymentTransactionOrderByWithAggregationInput[]
    by: PaymentTransactionScalarFieldEnum[] | PaymentTransactionScalarFieldEnum
    having?: PaymentTransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentTransactionCountAggregateInputType | true
    _avg?: PaymentTransactionAvgAggregateInputType
    _sum?: PaymentTransactionSumAggregateInputType
    _min?: PaymentTransactionMinAggregateInputType
    _max?: PaymentTransactionMaxAggregateInputType
  }

  export type PaymentTransactionGroupByOutputType = {
    id: string
    bookingId: string
    razorpayOrderId: string
    razorpayPaymentId: string | null
    amount: Decimal
    currency: string
    status: $Enums.PaymentStatus
    method: string | null
    bank: string | null
    wallet: string | null
    vpa: string | null
    email: string | null
    contact: string | null
    webhookData: JsonValue | null
    errorCode: string | null
    errorDescription: string | null
    createdAt: Date
    updatedAt: Date
    refundId: string | null
    _count: PaymentTransactionCountAggregateOutputType | null
    _avg: PaymentTransactionAvgAggregateOutputType | null
    _sum: PaymentTransactionSumAggregateOutputType | null
    _min: PaymentTransactionMinAggregateOutputType | null
    _max: PaymentTransactionMaxAggregateOutputType | null
  }

  type GetPaymentTransactionGroupByPayload<T extends PaymentTransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentTransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentTransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentTransactionGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentTransactionGroupByOutputType[P]>
        }
      >
    >


  export type PaymentTransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    method?: boolean
    bank?: boolean
    wallet?: boolean
    vpa?: boolean
    email?: boolean
    contact?: boolean
    webhookData?: boolean
    errorCode?: boolean
    errorDescription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    refundId?: boolean
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentTransaction"]>

  export type PaymentTransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    method?: boolean
    bank?: boolean
    wallet?: boolean
    vpa?: boolean
    email?: boolean
    contact?: boolean
    webhookData?: boolean
    errorCode?: boolean
    errorDescription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    refundId?: boolean
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentTransaction"]>

  export type PaymentTransactionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    method?: boolean
    bank?: boolean
    wallet?: boolean
    vpa?: boolean
    email?: boolean
    contact?: boolean
    webhookData?: boolean
    errorCode?: boolean
    errorDescription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    refundId?: boolean
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentTransaction"]>

  export type PaymentTransactionSelectScalar = {
    id?: boolean
    bookingId?: boolean
    razorpayOrderId?: boolean
    razorpayPaymentId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    method?: boolean
    bank?: boolean
    wallet?: boolean
    vpa?: boolean
    email?: boolean
    contact?: boolean
    webhookData?: boolean
    errorCode?: boolean
    errorDescription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    refundId?: boolean
  }

  export type PaymentTransactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "bookingId" | "razorpayOrderId" | "razorpayPaymentId" | "amount" | "currency" | "status" | "method" | "bank" | "wallet" | "vpa" | "email" | "contact" | "webhookData" | "errorCode" | "errorDescription" | "createdAt" | "updatedAt" | "refundId", ExtArgs["result"]["paymentTransaction"]>
  export type PaymentTransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }
  export type PaymentTransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }
  export type PaymentTransactionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }

  export type $PaymentTransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PaymentTransaction"
    objects: {
      booking: Prisma.$BookingPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      bookingId: string
      razorpayOrderId: string
      razorpayPaymentId: string | null
      amount: Prisma.Decimal
      currency: string
      status: $Enums.PaymentStatus
      method: string | null
      bank: string | null
      wallet: string | null
      vpa: string | null
      email: string | null
      contact: string | null
      webhookData: Prisma.JsonValue | null
      errorCode: string | null
      errorDescription: string | null
      createdAt: Date
      updatedAt: Date
      refundId: string | null
    }, ExtArgs["result"]["paymentTransaction"]>
    composites: {}
  }

  type PaymentTransactionGetPayload<S extends boolean | null | undefined | PaymentTransactionDefaultArgs> = $Result.GetResult<Prisma.$PaymentTransactionPayload, S>

  type PaymentTransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PaymentTransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PaymentTransactionCountAggregateInputType | true
    }

  export interface PaymentTransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PaymentTransaction'], meta: { name: 'PaymentTransaction' } }
    /**
     * Find zero or one PaymentTransaction that matches the filter.
     * @param {PaymentTransactionFindUniqueArgs} args - Arguments to find a PaymentTransaction
     * @example
     * // Get one PaymentTransaction
     * const paymentTransaction = await prisma.paymentTransaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentTransactionFindUniqueArgs>(args: SelectSubset<T, PaymentTransactionFindUniqueArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PaymentTransaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PaymentTransactionFindUniqueOrThrowArgs} args - Arguments to find a PaymentTransaction
     * @example
     * // Get one PaymentTransaction
     * const paymentTransaction = await prisma.paymentTransaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentTransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentTransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PaymentTransaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionFindFirstArgs} args - Arguments to find a PaymentTransaction
     * @example
     * // Get one PaymentTransaction
     * const paymentTransaction = await prisma.paymentTransaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentTransactionFindFirstArgs>(args?: SelectSubset<T, PaymentTransactionFindFirstArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PaymentTransaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionFindFirstOrThrowArgs} args - Arguments to find a PaymentTransaction
     * @example
     * // Get one PaymentTransaction
     * const paymentTransaction = await prisma.paymentTransaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentTransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentTransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PaymentTransactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PaymentTransactions
     * const paymentTransactions = await prisma.paymentTransaction.findMany()
     * 
     * // Get first 10 PaymentTransactions
     * const paymentTransactions = await prisma.paymentTransaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentTransactionWithIdOnly = await prisma.paymentTransaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentTransactionFindManyArgs>(args?: SelectSubset<T, PaymentTransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PaymentTransaction.
     * @param {PaymentTransactionCreateArgs} args - Arguments to create a PaymentTransaction.
     * @example
     * // Create one PaymentTransaction
     * const PaymentTransaction = await prisma.paymentTransaction.create({
     *   data: {
     *     // ... data to create a PaymentTransaction
     *   }
     * })
     * 
     */
    create<T extends PaymentTransactionCreateArgs>(args: SelectSubset<T, PaymentTransactionCreateArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PaymentTransactions.
     * @param {PaymentTransactionCreateManyArgs} args - Arguments to create many PaymentTransactions.
     * @example
     * // Create many PaymentTransactions
     * const paymentTransaction = await prisma.paymentTransaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentTransactionCreateManyArgs>(args?: SelectSubset<T, PaymentTransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PaymentTransactions and returns the data saved in the database.
     * @param {PaymentTransactionCreateManyAndReturnArgs} args - Arguments to create many PaymentTransactions.
     * @example
     * // Create many PaymentTransactions
     * const paymentTransaction = await prisma.paymentTransaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PaymentTransactions and only return the `id`
     * const paymentTransactionWithIdOnly = await prisma.paymentTransaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentTransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentTransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PaymentTransaction.
     * @param {PaymentTransactionDeleteArgs} args - Arguments to delete one PaymentTransaction.
     * @example
     * // Delete one PaymentTransaction
     * const PaymentTransaction = await prisma.paymentTransaction.delete({
     *   where: {
     *     // ... filter to delete one PaymentTransaction
     *   }
     * })
     * 
     */
    delete<T extends PaymentTransactionDeleteArgs>(args: SelectSubset<T, PaymentTransactionDeleteArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PaymentTransaction.
     * @param {PaymentTransactionUpdateArgs} args - Arguments to update one PaymentTransaction.
     * @example
     * // Update one PaymentTransaction
     * const paymentTransaction = await prisma.paymentTransaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentTransactionUpdateArgs>(args: SelectSubset<T, PaymentTransactionUpdateArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PaymentTransactions.
     * @param {PaymentTransactionDeleteManyArgs} args - Arguments to filter PaymentTransactions to delete.
     * @example
     * // Delete a few PaymentTransactions
     * const { count } = await prisma.paymentTransaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentTransactionDeleteManyArgs>(args?: SelectSubset<T, PaymentTransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PaymentTransactions
     * const paymentTransaction = await prisma.paymentTransaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentTransactionUpdateManyArgs>(args: SelectSubset<T, PaymentTransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentTransactions and returns the data updated in the database.
     * @param {PaymentTransactionUpdateManyAndReturnArgs} args - Arguments to update many PaymentTransactions.
     * @example
     * // Update many PaymentTransactions
     * const paymentTransaction = await prisma.paymentTransaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PaymentTransactions and only return the `id`
     * const paymentTransactionWithIdOnly = await prisma.paymentTransaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PaymentTransactionUpdateManyAndReturnArgs>(args: SelectSubset<T, PaymentTransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PaymentTransaction.
     * @param {PaymentTransactionUpsertArgs} args - Arguments to update or create a PaymentTransaction.
     * @example
     * // Update or create a PaymentTransaction
     * const paymentTransaction = await prisma.paymentTransaction.upsert({
     *   create: {
     *     // ... data to create a PaymentTransaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PaymentTransaction we want to update
     *   }
     * })
     */
    upsert<T extends PaymentTransactionUpsertArgs>(args: SelectSubset<T, PaymentTransactionUpsertArgs<ExtArgs>>): Prisma__PaymentTransactionClient<$Result.GetResult<Prisma.$PaymentTransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PaymentTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionCountArgs} args - Arguments to filter PaymentTransactions to count.
     * @example
     * // Count the number of PaymentTransactions
     * const count = await prisma.paymentTransaction.count({
     *   where: {
     *     // ... the filter for the PaymentTransactions we want to count
     *   }
     * })
    **/
    count<T extends PaymentTransactionCountArgs>(
      args?: Subset<T, PaymentTransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentTransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PaymentTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PaymentTransactionAggregateArgs>(args: Subset<T, PaymentTransactionAggregateArgs>): Prisma.PrismaPromise<GetPaymentTransactionAggregateType<T>>

    /**
     * Group by PaymentTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentTransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PaymentTransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentTransactionGroupByArgs['orderBy'] }
        : { orderBy?: PaymentTransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PaymentTransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PaymentTransaction model
   */
  readonly fields: PaymentTransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PaymentTransaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentTransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    booking<T extends BookingDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BookingDefaultArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PaymentTransaction model
   */
  interface PaymentTransactionFieldRefs {
    readonly id: FieldRef<"PaymentTransaction", 'String'>
    readonly bookingId: FieldRef<"PaymentTransaction", 'String'>
    readonly razorpayOrderId: FieldRef<"PaymentTransaction", 'String'>
    readonly razorpayPaymentId: FieldRef<"PaymentTransaction", 'String'>
    readonly amount: FieldRef<"PaymentTransaction", 'Decimal'>
    readonly currency: FieldRef<"PaymentTransaction", 'String'>
    readonly status: FieldRef<"PaymentTransaction", 'PaymentStatus'>
    readonly method: FieldRef<"PaymentTransaction", 'String'>
    readonly bank: FieldRef<"PaymentTransaction", 'String'>
    readonly wallet: FieldRef<"PaymentTransaction", 'String'>
    readonly vpa: FieldRef<"PaymentTransaction", 'String'>
    readonly email: FieldRef<"PaymentTransaction", 'String'>
    readonly contact: FieldRef<"PaymentTransaction", 'String'>
    readonly webhookData: FieldRef<"PaymentTransaction", 'Json'>
    readonly errorCode: FieldRef<"PaymentTransaction", 'String'>
    readonly errorDescription: FieldRef<"PaymentTransaction", 'String'>
    readonly createdAt: FieldRef<"PaymentTransaction", 'DateTime'>
    readonly updatedAt: FieldRef<"PaymentTransaction", 'DateTime'>
    readonly refundId: FieldRef<"PaymentTransaction", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PaymentTransaction findUnique
   */
  export type PaymentTransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * Filter, which PaymentTransaction to fetch.
     */
    where: PaymentTransactionWhereUniqueInput
  }

  /**
   * PaymentTransaction findUniqueOrThrow
   */
  export type PaymentTransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * Filter, which PaymentTransaction to fetch.
     */
    where: PaymentTransactionWhereUniqueInput
  }

  /**
   * PaymentTransaction findFirst
   */
  export type PaymentTransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * Filter, which PaymentTransaction to fetch.
     */
    where?: PaymentTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentTransactions to fetch.
     */
    orderBy?: PaymentTransactionOrderByWithRelationInput | PaymentTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentTransactions.
     */
    cursor?: PaymentTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentTransactions.
     */
    distinct?: PaymentTransactionScalarFieldEnum | PaymentTransactionScalarFieldEnum[]
  }

  /**
   * PaymentTransaction findFirstOrThrow
   */
  export type PaymentTransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * Filter, which PaymentTransaction to fetch.
     */
    where?: PaymentTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentTransactions to fetch.
     */
    orderBy?: PaymentTransactionOrderByWithRelationInput | PaymentTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentTransactions.
     */
    cursor?: PaymentTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentTransactions.
     */
    distinct?: PaymentTransactionScalarFieldEnum | PaymentTransactionScalarFieldEnum[]
  }

  /**
   * PaymentTransaction findMany
   */
  export type PaymentTransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * Filter, which PaymentTransactions to fetch.
     */
    where?: PaymentTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentTransactions to fetch.
     */
    orderBy?: PaymentTransactionOrderByWithRelationInput | PaymentTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PaymentTransactions.
     */
    cursor?: PaymentTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentTransactions.
     */
    skip?: number
    distinct?: PaymentTransactionScalarFieldEnum | PaymentTransactionScalarFieldEnum[]
  }

  /**
   * PaymentTransaction create
   */
  export type PaymentTransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a PaymentTransaction.
     */
    data: XOR<PaymentTransactionCreateInput, PaymentTransactionUncheckedCreateInput>
  }

  /**
   * PaymentTransaction createMany
   */
  export type PaymentTransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PaymentTransactions.
     */
    data: PaymentTransactionCreateManyInput | PaymentTransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PaymentTransaction createManyAndReturn
   */
  export type PaymentTransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * The data used to create many PaymentTransactions.
     */
    data: PaymentTransactionCreateManyInput | PaymentTransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PaymentTransaction update
   */
  export type PaymentTransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a PaymentTransaction.
     */
    data: XOR<PaymentTransactionUpdateInput, PaymentTransactionUncheckedUpdateInput>
    /**
     * Choose, which PaymentTransaction to update.
     */
    where: PaymentTransactionWhereUniqueInput
  }

  /**
   * PaymentTransaction updateMany
   */
  export type PaymentTransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PaymentTransactions.
     */
    data: XOR<PaymentTransactionUpdateManyMutationInput, PaymentTransactionUncheckedUpdateManyInput>
    /**
     * Filter which PaymentTransactions to update
     */
    where?: PaymentTransactionWhereInput
    /**
     * Limit how many PaymentTransactions to update.
     */
    limit?: number
  }

  /**
   * PaymentTransaction updateManyAndReturn
   */
  export type PaymentTransactionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * The data used to update PaymentTransactions.
     */
    data: XOR<PaymentTransactionUpdateManyMutationInput, PaymentTransactionUncheckedUpdateManyInput>
    /**
     * Filter which PaymentTransactions to update
     */
    where?: PaymentTransactionWhereInput
    /**
     * Limit how many PaymentTransactions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PaymentTransaction upsert
   */
  export type PaymentTransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the PaymentTransaction to update in case it exists.
     */
    where: PaymentTransactionWhereUniqueInput
    /**
     * In case the PaymentTransaction found by the `where` argument doesn't exist, create a new PaymentTransaction with this data.
     */
    create: XOR<PaymentTransactionCreateInput, PaymentTransactionUncheckedCreateInput>
    /**
     * In case the PaymentTransaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentTransactionUpdateInput, PaymentTransactionUncheckedUpdateInput>
  }

  /**
   * PaymentTransaction delete
   */
  export type PaymentTransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
    /**
     * Filter which PaymentTransaction to delete.
     */
    where: PaymentTransactionWhereUniqueInput
  }

  /**
   * PaymentTransaction deleteMany
   */
  export type PaymentTransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentTransactions to delete
     */
    where?: PaymentTransactionWhereInput
    /**
     * Limit how many PaymentTransactions to delete.
     */
    limit?: number
  }

  /**
   * PaymentTransaction without action
   */
  export type PaymentTransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentTransaction
     */
    select?: PaymentTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentTransaction
     */
    omit?: PaymentTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentTransactionInclude<ExtArgs> | null
  }


  /**
   * Model Settlement
   */

  export type AggregateSettlement = {
    _count: SettlementCountAggregateOutputType | null
    _avg: SettlementAvgAggregateOutputType | null
    _sum: SettlementSumAggregateOutputType | null
    _min: SettlementMinAggregateOutputType | null
    _max: SettlementMaxAggregateOutputType | null
  }

  export type SettlementAvgAggregateOutputType = {
    organizationAmount: Decimal | null
    platformFee: Decimal | null
    totalAmount: Decimal | null
    retryCount: number | null
  }

  export type SettlementSumAggregateOutputType = {
    organizationAmount: Decimal | null
    platformFee: Decimal | null
    totalAmount: Decimal | null
    retryCount: number | null
  }

  export type SettlementMinAggregateOutputType = {
    id: string | null
    bookingId: string | null
    organizationAmount: Decimal | null
    platformFee: Decimal | null
    status: $Enums.SettlementStatus | null
    razorpayPayoutId: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    ticketId: string | null
    groupId: string | null
    totalAmount: Decimal | null
    settlementType: string | null
    scheduledAt: Date | null
    retryCount: number | null
    hostRazorpayAccountId: string | null
    razorpayTransferId: string | null
  }

  export type SettlementMaxAggregateOutputType = {
    id: string | null
    bookingId: string | null
    organizationAmount: Decimal | null
    platformFee: Decimal | null
    status: $Enums.SettlementStatus | null
    razorpayPayoutId: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    ticketId: string | null
    groupId: string | null
    totalAmount: Decimal | null
    settlementType: string | null
    scheduledAt: Date | null
    retryCount: number | null
    hostRazorpayAccountId: string | null
    razorpayTransferId: string | null
  }

  export type SettlementCountAggregateOutputType = {
    id: number
    bookingId: number
    organizationAmount: number
    platformFee: number
    status: number
    bankDetails: number
    razorpayPayoutId: number
    processedAt: number
    createdAt: number
    updatedAt: number
    ticketId: number
    groupId: number
    totalAmount: number
    settlementType: number
    scheduledAt: number
    retryCount: number
    hostRazorpayAccountId: number
    razorpayTransferId: number
    _all: number
  }


  export type SettlementAvgAggregateInputType = {
    organizationAmount?: true
    platformFee?: true
    totalAmount?: true
    retryCount?: true
  }

  export type SettlementSumAggregateInputType = {
    organizationAmount?: true
    platformFee?: true
    totalAmount?: true
    retryCount?: true
  }

  export type SettlementMinAggregateInputType = {
    id?: true
    bookingId?: true
    organizationAmount?: true
    platformFee?: true
    status?: true
    razorpayPayoutId?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    ticketId?: true
    groupId?: true
    totalAmount?: true
    settlementType?: true
    scheduledAt?: true
    retryCount?: true
    hostRazorpayAccountId?: true
    razorpayTransferId?: true
  }

  export type SettlementMaxAggregateInputType = {
    id?: true
    bookingId?: true
    organizationAmount?: true
    platformFee?: true
    status?: true
    razorpayPayoutId?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    ticketId?: true
    groupId?: true
    totalAmount?: true
    settlementType?: true
    scheduledAt?: true
    retryCount?: true
    hostRazorpayAccountId?: true
    razorpayTransferId?: true
  }

  export type SettlementCountAggregateInputType = {
    id?: true
    bookingId?: true
    organizationAmount?: true
    platformFee?: true
    status?: true
    bankDetails?: true
    razorpayPayoutId?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    ticketId?: true
    groupId?: true
    totalAmount?: true
    settlementType?: true
    scheduledAt?: true
    retryCount?: true
    hostRazorpayAccountId?: true
    razorpayTransferId?: true
    _all?: true
  }

  export type SettlementAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Settlement to aggregate.
     */
    where?: SettlementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settlements to fetch.
     */
    orderBy?: SettlementOrderByWithRelationInput | SettlementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SettlementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settlements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settlements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Settlements
    **/
    _count?: true | SettlementCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SettlementAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SettlementSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SettlementMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SettlementMaxAggregateInputType
  }

  export type GetSettlementAggregateType<T extends SettlementAggregateArgs> = {
        [P in keyof T & keyof AggregateSettlement]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSettlement[P]>
      : GetScalarType<T[P], AggregateSettlement[P]>
  }




  export type SettlementGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SettlementWhereInput
    orderBy?: SettlementOrderByWithAggregationInput | SettlementOrderByWithAggregationInput[]
    by: SettlementScalarFieldEnum[] | SettlementScalarFieldEnum
    having?: SettlementScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SettlementCountAggregateInputType | true
    _avg?: SettlementAvgAggregateInputType
    _sum?: SettlementSumAggregateInputType
    _min?: SettlementMinAggregateInputType
    _max?: SettlementMaxAggregateInputType
  }

  export type SettlementGroupByOutputType = {
    id: string
    bookingId: string
    organizationAmount: Decimal
    platformFee: Decimal
    status: $Enums.SettlementStatus
    bankDetails: JsonValue
    razorpayPayoutId: string | null
    processedAt: Date | null
    createdAt: Date
    updatedAt: Date
    ticketId: string | null
    groupId: string | null
    totalAmount: Decimal | null
    settlementType: string
    scheduledAt: Date | null
    retryCount: number
    hostRazorpayAccountId: string | null
    razorpayTransferId: string | null
    _count: SettlementCountAggregateOutputType | null
    _avg: SettlementAvgAggregateOutputType | null
    _sum: SettlementSumAggregateOutputType | null
    _min: SettlementMinAggregateOutputType | null
    _max: SettlementMaxAggregateOutputType | null
  }

  type GetSettlementGroupByPayload<T extends SettlementGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SettlementGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SettlementGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SettlementGroupByOutputType[P]>
            : GetScalarType<T[P], SettlementGroupByOutputType[P]>
        }
      >
    >


  export type SettlementSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    organizationAmount?: boolean
    platformFee?: boolean
    status?: boolean
    bankDetails?: boolean
    razorpayPayoutId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticketId?: boolean
    groupId?: boolean
    totalAmount?: boolean
    settlementType?: boolean
    scheduledAt?: boolean
    retryCount?: boolean
    hostRazorpayAccountId?: boolean
    razorpayTransferId?: boolean
  }, ExtArgs["result"]["settlement"]>

  export type SettlementSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    organizationAmount?: boolean
    platformFee?: boolean
    status?: boolean
    bankDetails?: boolean
    razorpayPayoutId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticketId?: boolean
    groupId?: boolean
    totalAmount?: boolean
    settlementType?: boolean
    scheduledAt?: boolean
    retryCount?: boolean
    hostRazorpayAccountId?: boolean
    razorpayTransferId?: boolean
  }, ExtArgs["result"]["settlement"]>

  export type SettlementSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    organizationAmount?: boolean
    platformFee?: boolean
    status?: boolean
    bankDetails?: boolean
    razorpayPayoutId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticketId?: boolean
    groupId?: boolean
    totalAmount?: boolean
    settlementType?: boolean
    scheduledAt?: boolean
    retryCount?: boolean
    hostRazorpayAccountId?: boolean
    razorpayTransferId?: boolean
  }, ExtArgs["result"]["settlement"]>

  export type SettlementSelectScalar = {
    id?: boolean
    bookingId?: boolean
    organizationAmount?: boolean
    platformFee?: boolean
    status?: boolean
    bankDetails?: boolean
    razorpayPayoutId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticketId?: boolean
    groupId?: boolean
    totalAmount?: boolean
    settlementType?: boolean
    scheduledAt?: boolean
    retryCount?: boolean
    hostRazorpayAccountId?: boolean
    razorpayTransferId?: boolean
  }

  export type SettlementOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "bookingId" | "organizationAmount" | "platformFee" | "status" | "bankDetails" | "razorpayPayoutId" | "processedAt" | "createdAt" | "updatedAt" | "ticketId" | "groupId" | "totalAmount" | "settlementType" | "scheduledAt" | "retryCount" | "hostRazorpayAccountId" | "razorpayTransferId", ExtArgs["result"]["settlement"]>

  export type $SettlementPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Settlement"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      bookingId: string
      organizationAmount: Prisma.Decimal
      platformFee: Prisma.Decimal
      status: $Enums.SettlementStatus
      bankDetails: Prisma.JsonValue
      razorpayPayoutId: string | null
      processedAt: Date | null
      createdAt: Date
      updatedAt: Date
      ticketId: string | null
      groupId: string | null
      totalAmount: Prisma.Decimal | null
      settlementType: string
      scheduledAt: Date | null
      retryCount: number
      hostRazorpayAccountId: string | null
      razorpayTransferId: string | null
    }, ExtArgs["result"]["settlement"]>
    composites: {}
  }

  type SettlementGetPayload<S extends boolean | null | undefined | SettlementDefaultArgs> = $Result.GetResult<Prisma.$SettlementPayload, S>

  type SettlementCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SettlementFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SettlementCountAggregateInputType | true
    }

  export interface SettlementDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Settlement'], meta: { name: 'Settlement' } }
    /**
     * Find zero or one Settlement that matches the filter.
     * @param {SettlementFindUniqueArgs} args - Arguments to find a Settlement
     * @example
     * // Get one Settlement
     * const settlement = await prisma.settlement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SettlementFindUniqueArgs>(args: SelectSubset<T, SettlementFindUniqueArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Settlement that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SettlementFindUniqueOrThrowArgs} args - Arguments to find a Settlement
     * @example
     * // Get one Settlement
     * const settlement = await prisma.settlement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SettlementFindUniqueOrThrowArgs>(args: SelectSubset<T, SettlementFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Settlement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementFindFirstArgs} args - Arguments to find a Settlement
     * @example
     * // Get one Settlement
     * const settlement = await prisma.settlement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SettlementFindFirstArgs>(args?: SelectSubset<T, SettlementFindFirstArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Settlement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementFindFirstOrThrowArgs} args - Arguments to find a Settlement
     * @example
     * // Get one Settlement
     * const settlement = await prisma.settlement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SettlementFindFirstOrThrowArgs>(args?: SelectSubset<T, SettlementFindFirstOrThrowArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Settlements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Settlements
     * const settlements = await prisma.settlement.findMany()
     * 
     * // Get first 10 Settlements
     * const settlements = await prisma.settlement.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const settlementWithIdOnly = await prisma.settlement.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SettlementFindManyArgs>(args?: SelectSubset<T, SettlementFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Settlement.
     * @param {SettlementCreateArgs} args - Arguments to create a Settlement.
     * @example
     * // Create one Settlement
     * const Settlement = await prisma.settlement.create({
     *   data: {
     *     // ... data to create a Settlement
     *   }
     * })
     * 
     */
    create<T extends SettlementCreateArgs>(args: SelectSubset<T, SettlementCreateArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Settlements.
     * @param {SettlementCreateManyArgs} args - Arguments to create many Settlements.
     * @example
     * // Create many Settlements
     * const settlement = await prisma.settlement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SettlementCreateManyArgs>(args?: SelectSubset<T, SettlementCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Settlements and returns the data saved in the database.
     * @param {SettlementCreateManyAndReturnArgs} args - Arguments to create many Settlements.
     * @example
     * // Create many Settlements
     * const settlement = await prisma.settlement.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Settlements and only return the `id`
     * const settlementWithIdOnly = await prisma.settlement.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SettlementCreateManyAndReturnArgs>(args?: SelectSubset<T, SettlementCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Settlement.
     * @param {SettlementDeleteArgs} args - Arguments to delete one Settlement.
     * @example
     * // Delete one Settlement
     * const Settlement = await prisma.settlement.delete({
     *   where: {
     *     // ... filter to delete one Settlement
     *   }
     * })
     * 
     */
    delete<T extends SettlementDeleteArgs>(args: SelectSubset<T, SettlementDeleteArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Settlement.
     * @param {SettlementUpdateArgs} args - Arguments to update one Settlement.
     * @example
     * // Update one Settlement
     * const settlement = await prisma.settlement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SettlementUpdateArgs>(args: SelectSubset<T, SettlementUpdateArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Settlements.
     * @param {SettlementDeleteManyArgs} args - Arguments to filter Settlements to delete.
     * @example
     * // Delete a few Settlements
     * const { count } = await prisma.settlement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SettlementDeleteManyArgs>(args?: SelectSubset<T, SettlementDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Settlements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Settlements
     * const settlement = await prisma.settlement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SettlementUpdateManyArgs>(args: SelectSubset<T, SettlementUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Settlements and returns the data updated in the database.
     * @param {SettlementUpdateManyAndReturnArgs} args - Arguments to update many Settlements.
     * @example
     * // Update many Settlements
     * const settlement = await prisma.settlement.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Settlements and only return the `id`
     * const settlementWithIdOnly = await prisma.settlement.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SettlementUpdateManyAndReturnArgs>(args: SelectSubset<T, SettlementUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Settlement.
     * @param {SettlementUpsertArgs} args - Arguments to update or create a Settlement.
     * @example
     * // Update or create a Settlement
     * const settlement = await prisma.settlement.upsert({
     *   create: {
     *     // ... data to create a Settlement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Settlement we want to update
     *   }
     * })
     */
    upsert<T extends SettlementUpsertArgs>(args: SelectSubset<T, SettlementUpsertArgs<ExtArgs>>): Prisma__SettlementClient<$Result.GetResult<Prisma.$SettlementPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Settlements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementCountArgs} args - Arguments to filter Settlements to count.
     * @example
     * // Count the number of Settlements
     * const count = await prisma.settlement.count({
     *   where: {
     *     // ... the filter for the Settlements we want to count
     *   }
     * })
    **/
    count<T extends SettlementCountArgs>(
      args?: Subset<T, SettlementCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SettlementCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Settlement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SettlementAggregateArgs>(args: Subset<T, SettlementAggregateArgs>): Prisma.PrismaPromise<GetSettlementAggregateType<T>>

    /**
     * Group by Settlement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettlementGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SettlementGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SettlementGroupByArgs['orderBy'] }
        : { orderBy?: SettlementGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SettlementGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSettlementGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Settlement model
   */
  readonly fields: SettlementFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Settlement.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SettlementClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Settlement model
   */
  interface SettlementFieldRefs {
    readonly id: FieldRef<"Settlement", 'String'>
    readonly bookingId: FieldRef<"Settlement", 'String'>
    readonly organizationAmount: FieldRef<"Settlement", 'Decimal'>
    readonly platformFee: FieldRef<"Settlement", 'Decimal'>
    readonly status: FieldRef<"Settlement", 'SettlementStatus'>
    readonly bankDetails: FieldRef<"Settlement", 'Json'>
    readonly razorpayPayoutId: FieldRef<"Settlement", 'String'>
    readonly processedAt: FieldRef<"Settlement", 'DateTime'>
    readonly createdAt: FieldRef<"Settlement", 'DateTime'>
    readonly updatedAt: FieldRef<"Settlement", 'DateTime'>
    readonly ticketId: FieldRef<"Settlement", 'String'>
    readonly groupId: FieldRef<"Settlement", 'String'>
    readonly totalAmount: FieldRef<"Settlement", 'Decimal'>
    readonly settlementType: FieldRef<"Settlement", 'String'>
    readonly scheduledAt: FieldRef<"Settlement", 'DateTime'>
    readonly retryCount: FieldRef<"Settlement", 'Int'>
    readonly hostRazorpayAccountId: FieldRef<"Settlement", 'String'>
    readonly razorpayTransferId: FieldRef<"Settlement", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Settlement findUnique
   */
  export type SettlementFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * Filter, which Settlement to fetch.
     */
    where: SettlementWhereUniqueInput
  }

  /**
   * Settlement findUniqueOrThrow
   */
  export type SettlementFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * Filter, which Settlement to fetch.
     */
    where: SettlementWhereUniqueInput
  }

  /**
   * Settlement findFirst
   */
  export type SettlementFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * Filter, which Settlement to fetch.
     */
    where?: SettlementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settlements to fetch.
     */
    orderBy?: SettlementOrderByWithRelationInput | SettlementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Settlements.
     */
    cursor?: SettlementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settlements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settlements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Settlements.
     */
    distinct?: SettlementScalarFieldEnum | SettlementScalarFieldEnum[]
  }

  /**
   * Settlement findFirstOrThrow
   */
  export type SettlementFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * Filter, which Settlement to fetch.
     */
    where?: SettlementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settlements to fetch.
     */
    orderBy?: SettlementOrderByWithRelationInput | SettlementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Settlements.
     */
    cursor?: SettlementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settlements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settlements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Settlements.
     */
    distinct?: SettlementScalarFieldEnum | SettlementScalarFieldEnum[]
  }

  /**
   * Settlement findMany
   */
  export type SettlementFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * Filter, which Settlements to fetch.
     */
    where?: SettlementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settlements to fetch.
     */
    orderBy?: SettlementOrderByWithRelationInput | SettlementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Settlements.
     */
    cursor?: SettlementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settlements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settlements.
     */
    skip?: number
    distinct?: SettlementScalarFieldEnum | SettlementScalarFieldEnum[]
  }

  /**
   * Settlement create
   */
  export type SettlementCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * The data needed to create a Settlement.
     */
    data: XOR<SettlementCreateInput, SettlementUncheckedCreateInput>
  }

  /**
   * Settlement createMany
   */
  export type SettlementCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Settlements.
     */
    data: SettlementCreateManyInput | SettlementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Settlement createManyAndReturn
   */
  export type SettlementCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * The data used to create many Settlements.
     */
    data: SettlementCreateManyInput | SettlementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Settlement update
   */
  export type SettlementUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * The data needed to update a Settlement.
     */
    data: XOR<SettlementUpdateInput, SettlementUncheckedUpdateInput>
    /**
     * Choose, which Settlement to update.
     */
    where: SettlementWhereUniqueInput
  }

  /**
   * Settlement updateMany
   */
  export type SettlementUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Settlements.
     */
    data: XOR<SettlementUpdateManyMutationInput, SettlementUncheckedUpdateManyInput>
    /**
     * Filter which Settlements to update
     */
    where?: SettlementWhereInput
    /**
     * Limit how many Settlements to update.
     */
    limit?: number
  }

  /**
   * Settlement updateManyAndReturn
   */
  export type SettlementUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * The data used to update Settlements.
     */
    data: XOR<SettlementUpdateManyMutationInput, SettlementUncheckedUpdateManyInput>
    /**
     * Filter which Settlements to update
     */
    where?: SettlementWhereInput
    /**
     * Limit how many Settlements to update.
     */
    limit?: number
  }

  /**
   * Settlement upsert
   */
  export type SettlementUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * The filter to search for the Settlement to update in case it exists.
     */
    where: SettlementWhereUniqueInput
    /**
     * In case the Settlement found by the `where` argument doesn't exist, create a new Settlement with this data.
     */
    create: XOR<SettlementCreateInput, SettlementUncheckedCreateInput>
    /**
     * In case the Settlement was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SettlementUpdateInput, SettlementUncheckedUpdateInput>
  }

  /**
   * Settlement delete
   */
  export type SettlementDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
    /**
     * Filter which Settlement to delete.
     */
    where: SettlementWhereUniqueInput
  }

  /**
   * Settlement deleteMany
   */
  export type SettlementDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Settlements to delete
     */
    where?: SettlementWhereInput
    /**
     * Limit how many Settlements to delete.
     */
    limit?: number
  }

  /**
   * Settlement without action
   */
  export type SettlementDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Settlement
     */
    select?: SettlementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Settlement
     */
    omit?: SettlementOmit<ExtArgs> | null
  }


  /**
   * Model HostLinkedAccount
   */

  export type AggregateHostLinkedAccount = {
    _count: HostLinkedAccountCountAggregateOutputType | null
    _min: HostLinkedAccountMinAggregateOutputType | null
    _max: HostLinkedAccountMaxAggregateOutputType | null
  }

  export type HostLinkedAccountMinAggregateOutputType = {
    id: string | null
    group_id: string | null
    razorpay_account_id: string | null
    kyc_status: string | null
    business_name: string | null
    email: string | null
    is_active: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type HostLinkedAccountMaxAggregateOutputType = {
    id: string | null
    group_id: string | null
    razorpay_account_id: string | null
    kyc_status: string | null
    business_name: string | null
    email: string | null
    is_active: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type HostLinkedAccountCountAggregateOutputType = {
    id: number
    group_id: number
    razorpay_account_id: number
    kyc_status: number
    business_name: number
    email: number
    is_active: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type HostLinkedAccountMinAggregateInputType = {
    id?: true
    group_id?: true
    razorpay_account_id?: true
    kyc_status?: true
    business_name?: true
    email?: true
    is_active?: true
    created_at?: true
    updated_at?: true
  }

  export type HostLinkedAccountMaxAggregateInputType = {
    id?: true
    group_id?: true
    razorpay_account_id?: true
    kyc_status?: true
    business_name?: true
    email?: true
    is_active?: true
    created_at?: true
    updated_at?: true
  }

  export type HostLinkedAccountCountAggregateInputType = {
    id?: true
    group_id?: true
    razorpay_account_id?: true
    kyc_status?: true
    business_name?: true
    email?: true
    is_active?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type HostLinkedAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HostLinkedAccount to aggregate.
     */
    where?: HostLinkedAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostLinkedAccounts to fetch.
     */
    orderBy?: HostLinkedAccountOrderByWithRelationInput | HostLinkedAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HostLinkedAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostLinkedAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostLinkedAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned HostLinkedAccounts
    **/
    _count?: true | HostLinkedAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HostLinkedAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HostLinkedAccountMaxAggregateInputType
  }

  export type GetHostLinkedAccountAggregateType<T extends HostLinkedAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateHostLinkedAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHostLinkedAccount[P]>
      : GetScalarType<T[P], AggregateHostLinkedAccount[P]>
  }




  export type HostLinkedAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HostLinkedAccountWhereInput
    orderBy?: HostLinkedAccountOrderByWithAggregationInput | HostLinkedAccountOrderByWithAggregationInput[]
    by: HostLinkedAccountScalarFieldEnum[] | HostLinkedAccountScalarFieldEnum
    having?: HostLinkedAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HostLinkedAccountCountAggregateInputType | true
    _min?: HostLinkedAccountMinAggregateInputType
    _max?: HostLinkedAccountMaxAggregateInputType
  }

  export type HostLinkedAccountGroupByOutputType = {
    id: string
    group_id: string
    razorpay_account_id: string
    kyc_status: string
    business_name: string | null
    email: string | null
    is_active: boolean
    created_at: Date
    updated_at: Date
    _count: HostLinkedAccountCountAggregateOutputType | null
    _min: HostLinkedAccountMinAggregateOutputType | null
    _max: HostLinkedAccountMaxAggregateOutputType | null
  }

  type GetHostLinkedAccountGroupByPayload<T extends HostLinkedAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HostLinkedAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HostLinkedAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HostLinkedAccountGroupByOutputType[P]>
            : GetScalarType<T[P], HostLinkedAccountGroupByOutputType[P]>
        }
      >
    >


  export type HostLinkedAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    razorpay_account_id?: boolean
    kyc_status?: boolean
    business_name?: boolean
    email?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["hostLinkedAccount"]>

  export type HostLinkedAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    razorpay_account_id?: boolean
    kyc_status?: boolean
    business_name?: boolean
    email?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["hostLinkedAccount"]>

  export type HostLinkedAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    razorpay_account_id?: boolean
    kyc_status?: boolean
    business_name?: boolean
    email?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["hostLinkedAccount"]>

  export type HostLinkedAccountSelectScalar = {
    id?: boolean
    group_id?: boolean
    razorpay_account_id?: boolean
    kyc_status?: boolean
    business_name?: boolean
    email?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type HostLinkedAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "group_id" | "razorpay_account_id" | "kyc_status" | "business_name" | "email" | "is_active" | "created_at" | "updated_at", ExtArgs["result"]["hostLinkedAccount"]>

  export type $HostLinkedAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "HostLinkedAccount"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      group_id: string
      razorpay_account_id: string
      kyc_status: string
      business_name: string | null
      email: string | null
      is_active: boolean
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["hostLinkedAccount"]>
    composites: {}
  }

  type HostLinkedAccountGetPayload<S extends boolean | null | undefined | HostLinkedAccountDefaultArgs> = $Result.GetResult<Prisma.$HostLinkedAccountPayload, S>

  type HostLinkedAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HostLinkedAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: HostLinkedAccountCountAggregateInputType | true
    }

  export interface HostLinkedAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['HostLinkedAccount'], meta: { name: 'HostLinkedAccount' } }
    /**
     * Find zero or one HostLinkedAccount that matches the filter.
     * @param {HostLinkedAccountFindUniqueArgs} args - Arguments to find a HostLinkedAccount
     * @example
     * // Get one HostLinkedAccount
     * const hostLinkedAccount = await prisma.hostLinkedAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HostLinkedAccountFindUniqueArgs>(args: SelectSubset<T, HostLinkedAccountFindUniqueArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one HostLinkedAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HostLinkedAccountFindUniqueOrThrowArgs} args - Arguments to find a HostLinkedAccount
     * @example
     * // Get one HostLinkedAccount
     * const hostLinkedAccount = await prisma.hostLinkedAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HostLinkedAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, HostLinkedAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HostLinkedAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountFindFirstArgs} args - Arguments to find a HostLinkedAccount
     * @example
     * // Get one HostLinkedAccount
     * const hostLinkedAccount = await prisma.hostLinkedAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HostLinkedAccountFindFirstArgs>(args?: SelectSubset<T, HostLinkedAccountFindFirstArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HostLinkedAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountFindFirstOrThrowArgs} args - Arguments to find a HostLinkedAccount
     * @example
     * // Get one HostLinkedAccount
     * const hostLinkedAccount = await prisma.hostLinkedAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HostLinkedAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, HostLinkedAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more HostLinkedAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HostLinkedAccounts
     * const hostLinkedAccounts = await prisma.hostLinkedAccount.findMany()
     * 
     * // Get first 10 HostLinkedAccounts
     * const hostLinkedAccounts = await prisma.hostLinkedAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const hostLinkedAccountWithIdOnly = await prisma.hostLinkedAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HostLinkedAccountFindManyArgs>(args?: SelectSubset<T, HostLinkedAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a HostLinkedAccount.
     * @param {HostLinkedAccountCreateArgs} args - Arguments to create a HostLinkedAccount.
     * @example
     * // Create one HostLinkedAccount
     * const HostLinkedAccount = await prisma.hostLinkedAccount.create({
     *   data: {
     *     // ... data to create a HostLinkedAccount
     *   }
     * })
     * 
     */
    create<T extends HostLinkedAccountCreateArgs>(args: SelectSubset<T, HostLinkedAccountCreateArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many HostLinkedAccounts.
     * @param {HostLinkedAccountCreateManyArgs} args - Arguments to create many HostLinkedAccounts.
     * @example
     * // Create many HostLinkedAccounts
     * const hostLinkedAccount = await prisma.hostLinkedAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HostLinkedAccountCreateManyArgs>(args?: SelectSubset<T, HostLinkedAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many HostLinkedAccounts and returns the data saved in the database.
     * @param {HostLinkedAccountCreateManyAndReturnArgs} args - Arguments to create many HostLinkedAccounts.
     * @example
     * // Create many HostLinkedAccounts
     * const hostLinkedAccount = await prisma.hostLinkedAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many HostLinkedAccounts and only return the `id`
     * const hostLinkedAccountWithIdOnly = await prisma.hostLinkedAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HostLinkedAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, HostLinkedAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a HostLinkedAccount.
     * @param {HostLinkedAccountDeleteArgs} args - Arguments to delete one HostLinkedAccount.
     * @example
     * // Delete one HostLinkedAccount
     * const HostLinkedAccount = await prisma.hostLinkedAccount.delete({
     *   where: {
     *     // ... filter to delete one HostLinkedAccount
     *   }
     * })
     * 
     */
    delete<T extends HostLinkedAccountDeleteArgs>(args: SelectSubset<T, HostLinkedAccountDeleteArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one HostLinkedAccount.
     * @param {HostLinkedAccountUpdateArgs} args - Arguments to update one HostLinkedAccount.
     * @example
     * // Update one HostLinkedAccount
     * const hostLinkedAccount = await prisma.hostLinkedAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HostLinkedAccountUpdateArgs>(args: SelectSubset<T, HostLinkedAccountUpdateArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more HostLinkedAccounts.
     * @param {HostLinkedAccountDeleteManyArgs} args - Arguments to filter HostLinkedAccounts to delete.
     * @example
     * // Delete a few HostLinkedAccounts
     * const { count } = await prisma.hostLinkedAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HostLinkedAccountDeleteManyArgs>(args?: SelectSubset<T, HostLinkedAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HostLinkedAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HostLinkedAccounts
     * const hostLinkedAccount = await prisma.hostLinkedAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HostLinkedAccountUpdateManyArgs>(args: SelectSubset<T, HostLinkedAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HostLinkedAccounts and returns the data updated in the database.
     * @param {HostLinkedAccountUpdateManyAndReturnArgs} args - Arguments to update many HostLinkedAccounts.
     * @example
     * // Update many HostLinkedAccounts
     * const hostLinkedAccount = await prisma.hostLinkedAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more HostLinkedAccounts and only return the `id`
     * const hostLinkedAccountWithIdOnly = await prisma.hostLinkedAccount.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends HostLinkedAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, HostLinkedAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one HostLinkedAccount.
     * @param {HostLinkedAccountUpsertArgs} args - Arguments to update or create a HostLinkedAccount.
     * @example
     * // Update or create a HostLinkedAccount
     * const hostLinkedAccount = await prisma.hostLinkedAccount.upsert({
     *   create: {
     *     // ... data to create a HostLinkedAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HostLinkedAccount we want to update
     *   }
     * })
     */
    upsert<T extends HostLinkedAccountUpsertArgs>(args: SelectSubset<T, HostLinkedAccountUpsertArgs<ExtArgs>>): Prisma__HostLinkedAccountClient<$Result.GetResult<Prisma.$HostLinkedAccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of HostLinkedAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountCountArgs} args - Arguments to filter HostLinkedAccounts to count.
     * @example
     * // Count the number of HostLinkedAccounts
     * const count = await prisma.hostLinkedAccount.count({
     *   where: {
     *     // ... the filter for the HostLinkedAccounts we want to count
     *   }
     * })
    **/
    count<T extends HostLinkedAccountCountArgs>(
      args?: Subset<T, HostLinkedAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HostLinkedAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HostLinkedAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HostLinkedAccountAggregateArgs>(args: Subset<T, HostLinkedAccountAggregateArgs>): Prisma.PrismaPromise<GetHostLinkedAccountAggregateType<T>>

    /**
     * Group by HostLinkedAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostLinkedAccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HostLinkedAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HostLinkedAccountGroupByArgs['orderBy'] }
        : { orderBy?: HostLinkedAccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HostLinkedAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHostLinkedAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the HostLinkedAccount model
   */
  readonly fields: HostLinkedAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for HostLinkedAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HostLinkedAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the HostLinkedAccount model
   */
  interface HostLinkedAccountFieldRefs {
    readonly id: FieldRef<"HostLinkedAccount", 'String'>
    readonly group_id: FieldRef<"HostLinkedAccount", 'String'>
    readonly razorpay_account_id: FieldRef<"HostLinkedAccount", 'String'>
    readonly kyc_status: FieldRef<"HostLinkedAccount", 'String'>
    readonly business_name: FieldRef<"HostLinkedAccount", 'String'>
    readonly email: FieldRef<"HostLinkedAccount", 'String'>
    readonly is_active: FieldRef<"HostLinkedAccount", 'Boolean'>
    readonly created_at: FieldRef<"HostLinkedAccount", 'DateTime'>
    readonly updated_at: FieldRef<"HostLinkedAccount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * HostLinkedAccount findUnique
   */
  export type HostLinkedAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * Filter, which HostLinkedAccount to fetch.
     */
    where: HostLinkedAccountWhereUniqueInput
  }

  /**
   * HostLinkedAccount findUniqueOrThrow
   */
  export type HostLinkedAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * Filter, which HostLinkedAccount to fetch.
     */
    where: HostLinkedAccountWhereUniqueInput
  }

  /**
   * HostLinkedAccount findFirst
   */
  export type HostLinkedAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * Filter, which HostLinkedAccount to fetch.
     */
    where?: HostLinkedAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostLinkedAccounts to fetch.
     */
    orderBy?: HostLinkedAccountOrderByWithRelationInput | HostLinkedAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HostLinkedAccounts.
     */
    cursor?: HostLinkedAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostLinkedAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostLinkedAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HostLinkedAccounts.
     */
    distinct?: HostLinkedAccountScalarFieldEnum | HostLinkedAccountScalarFieldEnum[]
  }

  /**
   * HostLinkedAccount findFirstOrThrow
   */
  export type HostLinkedAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * Filter, which HostLinkedAccount to fetch.
     */
    where?: HostLinkedAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostLinkedAccounts to fetch.
     */
    orderBy?: HostLinkedAccountOrderByWithRelationInput | HostLinkedAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HostLinkedAccounts.
     */
    cursor?: HostLinkedAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostLinkedAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostLinkedAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HostLinkedAccounts.
     */
    distinct?: HostLinkedAccountScalarFieldEnum | HostLinkedAccountScalarFieldEnum[]
  }

  /**
   * HostLinkedAccount findMany
   */
  export type HostLinkedAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * Filter, which HostLinkedAccounts to fetch.
     */
    where?: HostLinkedAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostLinkedAccounts to fetch.
     */
    orderBy?: HostLinkedAccountOrderByWithRelationInput | HostLinkedAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing HostLinkedAccounts.
     */
    cursor?: HostLinkedAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostLinkedAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostLinkedAccounts.
     */
    skip?: number
    distinct?: HostLinkedAccountScalarFieldEnum | HostLinkedAccountScalarFieldEnum[]
  }

  /**
   * HostLinkedAccount create
   */
  export type HostLinkedAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * The data needed to create a HostLinkedAccount.
     */
    data: XOR<HostLinkedAccountCreateInput, HostLinkedAccountUncheckedCreateInput>
  }

  /**
   * HostLinkedAccount createMany
   */
  export type HostLinkedAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many HostLinkedAccounts.
     */
    data: HostLinkedAccountCreateManyInput | HostLinkedAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HostLinkedAccount createManyAndReturn
   */
  export type HostLinkedAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * The data used to create many HostLinkedAccounts.
     */
    data: HostLinkedAccountCreateManyInput | HostLinkedAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HostLinkedAccount update
   */
  export type HostLinkedAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * The data needed to update a HostLinkedAccount.
     */
    data: XOR<HostLinkedAccountUpdateInput, HostLinkedAccountUncheckedUpdateInput>
    /**
     * Choose, which HostLinkedAccount to update.
     */
    where: HostLinkedAccountWhereUniqueInput
  }

  /**
   * HostLinkedAccount updateMany
   */
  export type HostLinkedAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update HostLinkedAccounts.
     */
    data: XOR<HostLinkedAccountUpdateManyMutationInput, HostLinkedAccountUncheckedUpdateManyInput>
    /**
     * Filter which HostLinkedAccounts to update
     */
    where?: HostLinkedAccountWhereInput
    /**
     * Limit how many HostLinkedAccounts to update.
     */
    limit?: number
  }

  /**
   * HostLinkedAccount updateManyAndReturn
   */
  export type HostLinkedAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * The data used to update HostLinkedAccounts.
     */
    data: XOR<HostLinkedAccountUpdateManyMutationInput, HostLinkedAccountUncheckedUpdateManyInput>
    /**
     * Filter which HostLinkedAccounts to update
     */
    where?: HostLinkedAccountWhereInput
    /**
     * Limit how many HostLinkedAccounts to update.
     */
    limit?: number
  }

  /**
   * HostLinkedAccount upsert
   */
  export type HostLinkedAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * The filter to search for the HostLinkedAccount to update in case it exists.
     */
    where: HostLinkedAccountWhereUniqueInput
    /**
     * In case the HostLinkedAccount found by the `where` argument doesn't exist, create a new HostLinkedAccount with this data.
     */
    create: XOR<HostLinkedAccountCreateInput, HostLinkedAccountUncheckedCreateInput>
    /**
     * In case the HostLinkedAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HostLinkedAccountUpdateInput, HostLinkedAccountUncheckedUpdateInput>
  }

  /**
   * HostLinkedAccount delete
   */
  export type HostLinkedAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
    /**
     * Filter which HostLinkedAccount to delete.
     */
    where: HostLinkedAccountWhereUniqueInput
  }

  /**
   * HostLinkedAccount deleteMany
   */
  export type HostLinkedAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HostLinkedAccounts to delete
     */
    where?: HostLinkedAccountWhereInput
    /**
     * Limit how many HostLinkedAccounts to delete.
     */
    limit?: number
  }

  /**
   * HostLinkedAccount without action
   */
  export type HostLinkedAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostLinkedAccount
     */
    select?: HostLinkedAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostLinkedAccount
     */
    omit?: HostLinkedAccountOmit<ExtArgs> | null
  }


  /**
   * Model Ledger
   */

  export type AggregateLedger = {
    _count: LedgerCountAggregateOutputType | null
    _avg: LedgerAvgAggregateOutputType | null
    _sum: LedgerSumAggregateOutputType | null
    _min: LedgerMinAggregateOutputType | null
    _max: LedgerMaxAggregateOutputType | null
  }

  export type LedgerAvgAggregateOutputType = {
    debit: Decimal | null
    credit: Decimal | null
    balance: Decimal | null
  }

  export type LedgerSumAggregateOutputType = {
    debit: Decimal | null
    credit: Decimal | null
    balance: Decimal | null
  }

  export type LedgerMinAggregateOutputType = {
    id: string | null
    booking_id: string | null
    ticket_id: string | null
    group_id: string | null
    type: string | null
    debit: Decimal | null
    credit: Decimal | null
    balance: Decimal | null
    reference_id: string | null
    description: string | null
    status: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type LedgerMaxAggregateOutputType = {
    id: string | null
    booking_id: string | null
    ticket_id: string | null
    group_id: string | null
    type: string | null
    debit: Decimal | null
    credit: Decimal | null
    balance: Decimal | null
    reference_id: string | null
    description: string | null
    status: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type LedgerCountAggregateOutputType = {
    id: number
    booking_id: number
    ticket_id: number
    group_id: number
    type: number
    debit: number
    credit: number
    balance: number
    reference_id: number
    description: number
    status: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type LedgerAvgAggregateInputType = {
    debit?: true
    credit?: true
    balance?: true
  }

  export type LedgerSumAggregateInputType = {
    debit?: true
    credit?: true
    balance?: true
  }

  export type LedgerMinAggregateInputType = {
    id?: true
    booking_id?: true
    ticket_id?: true
    group_id?: true
    type?: true
    debit?: true
    credit?: true
    balance?: true
    reference_id?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
  }

  export type LedgerMaxAggregateInputType = {
    id?: true
    booking_id?: true
    ticket_id?: true
    group_id?: true
    type?: true
    debit?: true
    credit?: true
    balance?: true
    reference_id?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
  }

  export type LedgerCountAggregateInputType = {
    id?: true
    booking_id?: true
    ticket_id?: true
    group_id?: true
    type?: true
    debit?: true
    credit?: true
    balance?: true
    reference_id?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type LedgerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Ledger to aggregate.
     */
    where?: LedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Ledgers to fetch.
     */
    orderBy?: LedgerOrderByWithRelationInput | LedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Ledgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Ledgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Ledgers
    **/
    _count?: true | LedgerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LedgerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LedgerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LedgerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LedgerMaxAggregateInputType
  }

  export type GetLedgerAggregateType<T extends LedgerAggregateArgs> = {
        [P in keyof T & keyof AggregateLedger]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLedger[P]>
      : GetScalarType<T[P], AggregateLedger[P]>
  }




  export type LedgerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LedgerWhereInput
    orderBy?: LedgerOrderByWithAggregationInput | LedgerOrderByWithAggregationInput[]
    by: LedgerScalarFieldEnum[] | LedgerScalarFieldEnum
    having?: LedgerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LedgerCountAggregateInputType | true
    _avg?: LedgerAvgAggregateInputType
    _sum?: LedgerSumAggregateInputType
    _min?: LedgerMinAggregateInputType
    _max?: LedgerMaxAggregateInputType
  }

  export type LedgerGroupByOutputType = {
    id: string
    booking_id: string
    ticket_id: string | null
    group_id: string | null
    type: string
    debit: Decimal | null
    credit: Decimal | null
    balance: Decimal
    reference_id: string | null
    description: string | null
    status: string
    created_at: Date
    updated_at: Date
    _count: LedgerCountAggregateOutputType | null
    _avg: LedgerAvgAggregateOutputType | null
    _sum: LedgerSumAggregateOutputType | null
    _min: LedgerMinAggregateOutputType | null
    _max: LedgerMaxAggregateOutputType | null
  }

  type GetLedgerGroupByPayload<T extends LedgerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LedgerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LedgerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LedgerGroupByOutputType[P]>
            : GetScalarType<T[P], LedgerGroupByOutputType[P]>
        }
      >
    >


  export type LedgerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    type?: boolean
    debit?: boolean
    credit?: boolean
    balance?: boolean
    reference_id?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["ledger"]>

  export type LedgerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    type?: boolean
    debit?: boolean
    credit?: boolean
    balance?: boolean
    reference_id?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["ledger"]>

  export type LedgerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    type?: boolean
    debit?: boolean
    credit?: boolean
    balance?: boolean
    reference_id?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["ledger"]>

  export type LedgerSelectScalar = {
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    type?: boolean
    debit?: boolean
    credit?: boolean
    balance?: boolean
    reference_id?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type LedgerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "booking_id" | "ticket_id" | "group_id" | "type" | "debit" | "credit" | "balance" | "reference_id" | "description" | "status" | "created_at" | "updated_at", ExtArgs["result"]["ledger"]>

  export type $LedgerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Ledger"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      booking_id: string
      ticket_id: string | null
      group_id: string | null
      type: string
      debit: Prisma.Decimal | null
      credit: Prisma.Decimal | null
      balance: Prisma.Decimal
      reference_id: string | null
      description: string | null
      status: string
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["ledger"]>
    composites: {}
  }

  type LedgerGetPayload<S extends boolean | null | undefined | LedgerDefaultArgs> = $Result.GetResult<Prisma.$LedgerPayload, S>

  type LedgerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LedgerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LedgerCountAggregateInputType | true
    }

  export interface LedgerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Ledger'], meta: { name: 'Ledger' } }
    /**
     * Find zero or one Ledger that matches the filter.
     * @param {LedgerFindUniqueArgs} args - Arguments to find a Ledger
     * @example
     * // Get one Ledger
     * const ledger = await prisma.ledger.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LedgerFindUniqueArgs>(args: SelectSubset<T, LedgerFindUniqueArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Ledger that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LedgerFindUniqueOrThrowArgs} args - Arguments to find a Ledger
     * @example
     * // Get one Ledger
     * const ledger = await prisma.ledger.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LedgerFindUniqueOrThrowArgs>(args: SelectSubset<T, LedgerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Ledger that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerFindFirstArgs} args - Arguments to find a Ledger
     * @example
     * // Get one Ledger
     * const ledger = await prisma.ledger.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LedgerFindFirstArgs>(args?: SelectSubset<T, LedgerFindFirstArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Ledger that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerFindFirstOrThrowArgs} args - Arguments to find a Ledger
     * @example
     * // Get one Ledger
     * const ledger = await prisma.ledger.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LedgerFindFirstOrThrowArgs>(args?: SelectSubset<T, LedgerFindFirstOrThrowArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Ledgers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Ledgers
     * const ledgers = await prisma.ledger.findMany()
     * 
     * // Get first 10 Ledgers
     * const ledgers = await prisma.ledger.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ledgerWithIdOnly = await prisma.ledger.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LedgerFindManyArgs>(args?: SelectSubset<T, LedgerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Ledger.
     * @param {LedgerCreateArgs} args - Arguments to create a Ledger.
     * @example
     * // Create one Ledger
     * const Ledger = await prisma.ledger.create({
     *   data: {
     *     // ... data to create a Ledger
     *   }
     * })
     * 
     */
    create<T extends LedgerCreateArgs>(args: SelectSubset<T, LedgerCreateArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Ledgers.
     * @param {LedgerCreateManyArgs} args - Arguments to create many Ledgers.
     * @example
     * // Create many Ledgers
     * const ledger = await prisma.ledger.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LedgerCreateManyArgs>(args?: SelectSubset<T, LedgerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Ledgers and returns the data saved in the database.
     * @param {LedgerCreateManyAndReturnArgs} args - Arguments to create many Ledgers.
     * @example
     * // Create many Ledgers
     * const ledger = await prisma.ledger.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Ledgers and only return the `id`
     * const ledgerWithIdOnly = await prisma.ledger.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LedgerCreateManyAndReturnArgs>(args?: SelectSubset<T, LedgerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Ledger.
     * @param {LedgerDeleteArgs} args - Arguments to delete one Ledger.
     * @example
     * // Delete one Ledger
     * const Ledger = await prisma.ledger.delete({
     *   where: {
     *     // ... filter to delete one Ledger
     *   }
     * })
     * 
     */
    delete<T extends LedgerDeleteArgs>(args: SelectSubset<T, LedgerDeleteArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Ledger.
     * @param {LedgerUpdateArgs} args - Arguments to update one Ledger.
     * @example
     * // Update one Ledger
     * const ledger = await prisma.ledger.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LedgerUpdateArgs>(args: SelectSubset<T, LedgerUpdateArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Ledgers.
     * @param {LedgerDeleteManyArgs} args - Arguments to filter Ledgers to delete.
     * @example
     * // Delete a few Ledgers
     * const { count } = await prisma.ledger.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LedgerDeleteManyArgs>(args?: SelectSubset<T, LedgerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Ledgers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Ledgers
     * const ledger = await prisma.ledger.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LedgerUpdateManyArgs>(args: SelectSubset<T, LedgerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Ledgers and returns the data updated in the database.
     * @param {LedgerUpdateManyAndReturnArgs} args - Arguments to update many Ledgers.
     * @example
     * // Update many Ledgers
     * const ledger = await prisma.ledger.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Ledgers and only return the `id`
     * const ledgerWithIdOnly = await prisma.ledger.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LedgerUpdateManyAndReturnArgs>(args: SelectSubset<T, LedgerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Ledger.
     * @param {LedgerUpsertArgs} args - Arguments to update or create a Ledger.
     * @example
     * // Update or create a Ledger
     * const ledger = await prisma.ledger.upsert({
     *   create: {
     *     // ... data to create a Ledger
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Ledger we want to update
     *   }
     * })
     */
    upsert<T extends LedgerUpsertArgs>(args: SelectSubset<T, LedgerUpsertArgs<ExtArgs>>): Prisma__LedgerClient<$Result.GetResult<Prisma.$LedgerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Ledgers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerCountArgs} args - Arguments to filter Ledgers to count.
     * @example
     * // Count the number of Ledgers
     * const count = await prisma.ledger.count({
     *   where: {
     *     // ... the filter for the Ledgers we want to count
     *   }
     * })
    **/
    count<T extends LedgerCountArgs>(
      args?: Subset<T, LedgerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LedgerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Ledger.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LedgerAggregateArgs>(args: Subset<T, LedgerAggregateArgs>): Prisma.PrismaPromise<GetLedgerAggregateType<T>>

    /**
     * Group by Ledger.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LedgerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LedgerGroupByArgs['orderBy'] }
        : { orderBy?: LedgerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LedgerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLedgerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Ledger model
   */
  readonly fields: LedgerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Ledger.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LedgerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Ledger model
   */
  interface LedgerFieldRefs {
    readonly id: FieldRef<"Ledger", 'String'>
    readonly booking_id: FieldRef<"Ledger", 'String'>
    readonly ticket_id: FieldRef<"Ledger", 'String'>
    readonly group_id: FieldRef<"Ledger", 'String'>
    readonly type: FieldRef<"Ledger", 'String'>
    readonly debit: FieldRef<"Ledger", 'Decimal'>
    readonly credit: FieldRef<"Ledger", 'Decimal'>
    readonly balance: FieldRef<"Ledger", 'Decimal'>
    readonly reference_id: FieldRef<"Ledger", 'String'>
    readonly description: FieldRef<"Ledger", 'String'>
    readonly status: FieldRef<"Ledger", 'String'>
    readonly created_at: FieldRef<"Ledger", 'DateTime'>
    readonly updated_at: FieldRef<"Ledger", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Ledger findUnique
   */
  export type LedgerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * Filter, which Ledger to fetch.
     */
    where: LedgerWhereUniqueInput
  }

  /**
   * Ledger findUniqueOrThrow
   */
  export type LedgerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * Filter, which Ledger to fetch.
     */
    where: LedgerWhereUniqueInput
  }

  /**
   * Ledger findFirst
   */
  export type LedgerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * Filter, which Ledger to fetch.
     */
    where?: LedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Ledgers to fetch.
     */
    orderBy?: LedgerOrderByWithRelationInput | LedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Ledgers.
     */
    cursor?: LedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Ledgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Ledgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Ledgers.
     */
    distinct?: LedgerScalarFieldEnum | LedgerScalarFieldEnum[]
  }

  /**
   * Ledger findFirstOrThrow
   */
  export type LedgerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * Filter, which Ledger to fetch.
     */
    where?: LedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Ledgers to fetch.
     */
    orderBy?: LedgerOrderByWithRelationInput | LedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Ledgers.
     */
    cursor?: LedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Ledgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Ledgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Ledgers.
     */
    distinct?: LedgerScalarFieldEnum | LedgerScalarFieldEnum[]
  }

  /**
   * Ledger findMany
   */
  export type LedgerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * Filter, which Ledgers to fetch.
     */
    where?: LedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Ledgers to fetch.
     */
    orderBy?: LedgerOrderByWithRelationInput | LedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Ledgers.
     */
    cursor?: LedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Ledgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Ledgers.
     */
    skip?: number
    distinct?: LedgerScalarFieldEnum | LedgerScalarFieldEnum[]
  }

  /**
   * Ledger create
   */
  export type LedgerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * The data needed to create a Ledger.
     */
    data: XOR<LedgerCreateInput, LedgerUncheckedCreateInput>
  }

  /**
   * Ledger createMany
   */
  export type LedgerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Ledgers.
     */
    data: LedgerCreateManyInput | LedgerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Ledger createManyAndReturn
   */
  export type LedgerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * The data used to create many Ledgers.
     */
    data: LedgerCreateManyInput | LedgerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Ledger update
   */
  export type LedgerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * The data needed to update a Ledger.
     */
    data: XOR<LedgerUpdateInput, LedgerUncheckedUpdateInput>
    /**
     * Choose, which Ledger to update.
     */
    where: LedgerWhereUniqueInput
  }

  /**
   * Ledger updateMany
   */
  export type LedgerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Ledgers.
     */
    data: XOR<LedgerUpdateManyMutationInput, LedgerUncheckedUpdateManyInput>
    /**
     * Filter which Ledgers to update
     */
    where?: LedgerWhereInput
    /**
     * Limit how many Ledgers to update.
     */
    limit?: number
  }

  /**
   * Ledger updateManyAndReturn
   */
  export type LedgerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * The data used to update Ledgers.
     */
    data: XOR<LedgerUpdateManyMutationInput, LedgerUncheckedUpdateManyInput>
    /**
     * Filter which Ledgers to update
     */
    where?: LedgerWhereInput
    /**
     * Limit how many Ledgers to update.
     */
    limit?: number
  }

  /**
   * Ledger upsert
   */
  export type LedgerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * The filter to search for the Ledger to update in case it exists.
     */
    where: LedgerWhereUniqueInput
    /**
     * In case the Ledger found by the `where` argument doesn't exist, create a new Ledger with this data.
     */
    create: XOR<LedgerCreateInput, LedgerUncheckedCreateInput>
    /**
     * In case the Ledger was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LedgerUpdateInput, LedgerUncheckedUpdateInput>
  }

  /**
   * Ledger delete
   */
  export type LedgerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
    /**
     * Filter which Ledger to delete.
     */
    where: LedgerWhereUniqueInput
  }

  /**
   * Ledger deleteMany
   */
  export type LedgerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Ledgers to delete
     */
    where?: LedgerWhereInput
    /**
     * Limit how many Ledgers to delete.
     */
    limit?: number
  }

  /**
   * Ledger without action
   */
  export type LedgerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ledger
     */
    select?: LedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ledger
     */
    omit?: LedgerOmit<ExtArgs> | null
  }


  /**
   * Model HostAdjustment
   */

  export type AggregateHostAdjustment = {
    _count: HostAdjustmentCountAggregateOutputType | null
    _avg: HostAdjustmentAvgAggregateOutputType | null
    _sum: HostAdjustmentSumAggregateOutputType | null
    _min: HostAdjustmentMinAggregateOutputType | null
    _max: HostAdjustmentMaxAggregateOutputType | null
  }

  export type HostAdjustmentAvgAggregateOutputType = {
    adjustment_amount: Decimal | null
  }

  export type HostAdjustmentSumAggregateOutputType = {
    adjustment_amount: Decimal | null
  }

  export type HostAdjustmentMinAggregateOutputType = {
    id: string | null
    group_id: string | null
    booking_id: string | null
    settlement_id: string | null
    adjustment_amount: Decimal | null
    reason: string | null
    status: string | null
    applied_at: Date | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type HostAdjustmentMaxAggregateOutputType = {
    id: string | null
    group_id: string | null
    booking_id: string | null
    settlement_id: string | null
    adjustment_amount: Decimal | null
    reason: string | null
    status: string | null
    applied_at: Date | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type HostAdjustmentCountAggregateOutputType = {
    id: number
    group_id: number
    booking_id: number
    settlement_id: number
    adjustment_amount: number
    reason: number
    status: number
    applied_at: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type HostAdjustmentAvgAggregateInputType = {
    adjustment_amount?: true
  }

  export type HostAdjustmentSumAggregateInputType = {
    adjustment_amount?: true
  }

  export type HostAdjustmentMinAggregateInputType = {
    id?: true
    group_id?: true
    booking_id?: true
    settlement_id?: true
    adjustment_amount?: true
    reason?: true
    status?: true
    applied_at?: true
    created_at?: true
    updated_at?: true
  }

  export type HostAdjustmentMaxAggregateInputType = {
    id?: true
    group_id?: true
    booking_id?: true
    settlement_id?: true
    adjustment_amount?: true
    reason?: true
    status?: true
    applied_at?: true
    created_at?: true
    updated_at?: true
  }

  export type HostAdjustmentCountAggregateInputType = {
    id?: true
    group_id?: true
    booking_id?: true
    settlement_id?: true
    adjustment_amount?: true
    reason?: true
    status?: true
    applied_at?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type HostAdjustmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HostAdjustment to aggregate.
     */
    where?: HostAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostAdjustments to fetch.
     */
    orderBy?: HostAdjustmentOrderByWithRelationInput | HostAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HostAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned HostAdjustments
    **/
    _count?: true | HostAdjustmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HostAdjustmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HostAdjustmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HostAdjustmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HostAdjustmentMaxAggregateInputType
  }

  export type GetHostAdjustmentAggregateType<T extends HostAdjustmentAggregateArgs> = {
        [P in keyof T & keyof AggregateHostAdjustment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHostAdjustment[P]>
      : GetScalarType<T[P], AggregateHostAdjustment[P]>
  }




  export type HostAdjustmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HostAdjustmentWhereInput
    orderBy?: HostAdjustmentOrderByWithAggregationInput | HostAdjustmentOrderByWithAggregationInput[]
    by: HostAdjustmentScalarFieldEnum[] | HostAdjustmentScalarFieldEnum
    having?: HostAdjustmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HostAdjustmentCountAggregateInputType | true
    _avg?: HostAdjustmentAvgAggregateInputType
    _sum?: HostAdjustmentSumAggregateInputType
    _min?: HostAdjustmentMinAggregateInputType
    _max?: HostAdjustmentMaxAggregateInputType
  }

  export type HostAdjustmentGroupByOutputType = {
    id: string
    group_id: string
    booking_id: string
    settlement_id: string
    adjustment_amount: Decimal
    reason: string | null
    status: string
    applied_at: Date | null
    created_at: Date
    updated_at: Date
    _count: HostAdjustmentCountAggregateOutputType | null
    _avg: HostAdjustmentAvgAggregateOutputType | null
    _sum: HostAdjustmentSumAggregateOutputType | null
    _min: HostAdjustmentMinAggregateOutputType | null
    _max: HostAdjustmentMaxAggregateOutputType | null
  }

  type GetHostAdjustmentGroupByPayload<T extends HostAdjustmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HostAdjustmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HostAdjustmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HostAdjustmentGroupByOutputType[P]>
            : GetScalarType<T[P], HostAdjustmentGroupByOutputType[P]>
        }
      >
    >


  export type HostAdjustmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    booking_id?: boolean
    settlement_id?: boolean
    adjustment_amount?: boolean
    reason?: boolean
    status?: boolean
    applied_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["hostAdjustment"]>

  export type HostAdjustmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    booking_id?: boolean
    settlement_id?: boolean
    adjustment_amount?: boolean
    reason?: boolean
    status?: boolean
    applied_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["hostAdjustment"]>

  export type HostAdjustmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    booking_id?: boolean
    settlement_id?: boolean
    adjustment_amount?: boolean
    reason?: boolean
    status?: boolean
    applied_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["hostAdjustment"]>

  export type HostAdjustmentSelectScalar = {
    id?: boolean
    group_id?: boolean
    booking_id?: boolean
    settlement_id?: boolean
    adjustment_amount?: boolean
    reason?: boolean
    status?: boolean
    applied_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type HostAdjustmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "group_id" | "booking_id" | "settlement_id" | "adjustment_amount" | "reason" | "status" | "applied_at" | "created_at" | "updated_at", ExtArgs["result"]["hostAdjustment"]>

  export type $HostAdjustmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "HostAdjustment"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      group_id: string
      booking_id: string
      settlement_id: string
      adjustment_amount: Prisma.Decimal
      reason: string | null
      status: string
      applied_at: Date | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["hostAdjustment"]>
    composites: {}
  }

  type HostAdjustmentGetPayload<S extends boolean | null | undefined | HostAdjustmentDefaultArgs> = $Result.GetResult<Prisma.$HostAdjustmentPayload, S>

  type HostAdjustmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HostAdjustmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: HostAdjustmentCountAggregateInputType | true
    }

  export interface HostAdjustmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['HostAdjustment'], meta: { name: 'HostAdjustment' } }
    /**
     * Find zero or one HostAdjustment that matches the filter.
     * @param {HostAdjustmentFindUniqueArgs} args - Arguments to find a HostAdjustment
     * @example
     * // Get one HostAdjustment
     * const hostAdjustment = await prisma.hostAdjustment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HostAdjustmentFindUniqueArgs>(args: SelectSubset<T, HostAdjustmentFindUniqueArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one HostAdjustment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HostAdjustmentFindUniqueOrThrowArgs} args - Arguments to find a HostAdjustment
     * @example
     * // Get one HostAdjustment
     * const hostAdjustment = await prisma.hostAdjustment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HostAdjustmentFindUniqueOrThrowArgs>(args: SelectSubset<T, HostAdjustmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HostAdjustment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentFindFirstArgs} args - Arguments to find a HostAdjustment
     * @example
     * // Get one HostAdjustment
     * const hostAdjustment = await prisma.hostAdjustment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HostAdjustmentFindFirstArgs>(args?: SelectSubset<T, HostAdjustmentFindFirstArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HostAdjustment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentFindFirstOrThrowArgs} args - Arguments to find a HostAdjustment
     * @example
     * // Get one HostAdjustment
     * const hostAdjustment = await prisma.hostAdjustment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HostAdjustmentFindFirstOrThrowArgs>(args?: SelectSubset<T, HostAdjustmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more HostAdjustments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HostAdjustments
     * const hostAdjustments = await prisma.hostAdjustment.findMany()
     * 
     * // Get first 10 HostAdjustments
     * const hostAdjustments = await prisma.hostAdjustment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const hostAdjustmentWithIdOnly = await prisma.hostAdjustment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HostAdjustmentFindManyArgs>(args?: SelectSubset<T, HostAdjustmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a HostAdjustment.
     * @param {HostAdjustmentCreateArgs} args - Arguments to create a HostAdjustment.
     * @example
     * // Create one HostAdjustment
     * const HostAdjustment = await prisma.hostAdjustment.create({
     *   data: {
     *     // ... data to create a HostAdjustment
     *   }
     * })
     * 
     */
    create<T extends HostAdjustmentCreateArgs>(args: SelectSubset<T, HostAdjustmentCreateArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many HostAdjustments.
     * @param {HostAdjustmentCreateManyArgs} args - Arguments to create many HostAdjustments.
     * @example
     * // Create many HostAdjustments
     * const hostAdjustment = await prisma.hostAdjustment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HostAdjustmentCreateManyArgs>(args?: SelectSubset<T, HostAdjustmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many HostAdjustments and returns the data saved in the database.
     * @param {HostAdjustmentCreateManyAndReturnArgs} args - Arguments to create many HostAdjustments.
     * @example
     * // Create many HostAdjustments
     * const hostAdjustment = await prisma.hostAdjustment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many HostAdjustments and only return the `id`
     * const hostAdjustmentWithIdOnly = await prisma.hostAdjustment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HostAdjustmentCreateManyAndReturnArgs>(args?: SelectSubset<T, HostAdjustmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a HostAdjustment.
     * @param {HostAdjustmentDeleteArgs} args - Arguments to delete one HostAdjustment.
     * @example
     * // Delete one HostAdjustment
     * const HostAdjustment = await prisma.hostAdjustment.delete({
     *   where: {
     *     // ... filter to delete one HostAdjustment
     *   }
     * })
     * 
     */
    delete<T extends HostAdjustmentDeleteArgs>(args: SelectSubset<T, HostAdjustmentDeleteArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one HostAdjustment.
     * @param {HostAdjustmentUpdateArgs} args - Arguments to update one HostAdjustment.
     * @example
     * // Update one HostAdjustment
     * const hostAdjustment = await prisma.hostAdjustment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HostAdjustmentUpdateArgs>(args: SelectSubset<T, HostAdjustmentUpdateArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more HostAdjustments.
     * @param {HostAdjustmentDeleteManyArgs} args - Arguments to filter HostAdjustments to delete.
     * @example
     * // Delete a few HostAdjustments
     * const { count } = await prisma.hostAdjustment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HostAdjustmentDeleteManyArgs>(args?: SelectSubset<T, HostAdjustmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HostAdjustments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HostAdjustments
     * const hostAdjustment = await prisma.hostAdjustment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HostAdjustmentUpdateManyArgs>(args: SelectSubset<T, HostAdjustmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HostAdjustments and returns the data updated in the database.
     * @param {HostAdjustmentUpdateManyAndReturnArgs} args - Arguments to update many HostAdjustments.
     * @example
     * // Update many HostAdjustments
     * const hostAdjustment = await prisma.hostAdjustment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more HostAdjustments and only return the `id`
     * const hostAdjustmentWithIdOnly = await prisma.hostAdjustment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends HostAdjustmentUpdateManyAndReturnArgs>(args: SelectSubset<T, HostAdjustmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one HostAdjustment.
     * @param {HostAdjustmentUpsertArgs} args - Arguments to update or create a HostAdjustment.
     * @example
     * // Update or create a HostAdjustment
     * const hostAdjustment = await prisma.hostAdjustment.upsert({
     *   create: {
     *     // ... data to create a HostAdjustment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HostAdjustment we want to update
     *   }
     * })
     */
    upsert<T extends HostAdjustmentUpsertArgs>(args: SelectSubset<T, HostAdjustmentUpsertArgs<ExtArgs>>): Prisma__HostAdjustmentClient<$Result.GetResult<Prisma.$HostAdjustmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of HostAdjustments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentCountArgs} args - Arguments to filter HostAdjustments to count.
     * @example
     * // Count the number of HostAdjustments
     * const count = await prisma.hostAdjustment.count({
     *   where: {
     *     // ... the filter for the HostAdjustments we want to count
     *   }
     * })
    **/
    count<T extends HostAdjustmentCountArgs>(
      args?: Subset<T, HostAdjustmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HostAdjustmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HostAdjustment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HostAdjustmentAggregateArgs>(args: Subset<T, HostAdjustmentAggregateArgs>): Prisma.PrismaPromise<GetHostAdjustmentAggregateType<T>>

    /**
     * Group by HostAdjustment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HostAdjustmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HostAdjustmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HostAdjustmentGroupByArgs['orderBy'] }
        : { orderBy?: HostAdjustmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HostAdjustmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHostAdjustmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the HostAdjustment model
   */
  readonly fields: HostAdjustmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for HostAdjustment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HostAdjustmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the HostAdjustment model
   */
  interface HostAdjustmentFieldRefs {
    readonly id: FieldRef<"HostAdjustment", 'String'>
    readonly group_id: FieldRef<"HostAdjustment", 'String'>
    readonly booking_id: FieldRef<"HostAdjustment", 'String'>
    readonly settlement_id: FieldRef<"HostAdjustment", 'String'>
    readonly adjustment_amount: FieldRef<"HostAdjustment", 'Decimal'>
    readonly reason: FieldRef<"HostAdjustment", 'String'>
    readonly status: FieldRef<"HostAdjustment", 'String'>
    readonly applied_at: FieldRef<"HostAdjustment", 'DateTime'>
    readonly created_at: FieldRef<"HostAdjustment", 'DateTime'>
    readonly updated_at: FieldRef<"HostAdjustment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * HostAdjustment findUnique
   */
  export type HostAdjustmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * Filter, which HostAdjustment to fetch.
     */
    where: HostAdjustmentWhereUniqueInput
  }

  /**
   * HostAdjustment findUniqueOrThrow
   */
  export type HostAdjustmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * Filter, which HostAdjustment to fetch.
     */
    where: HostAdjustmentWhereUniqueInput
  }

  /**
   * HostAdjustment findFirst
   */
  export type HostAdjustmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * Filter, which HostAdjustment to fetch.
     */
    where?: HostAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostAdjustments to fetch.
     */
    orderBy?: HostAdjustmentOrderByWithRelationInput | HostAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HostAdjustments.
     */
    cursor?: HostAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HostAdjustments.
     */
    distinct?: HostAdjustmentScalarFieldEnum | HostAdjustmentScalarFieldEnum[]
  }

  /**
   * HostAdjustment findFirstOrThrow
   */
  export type HostAdjustmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * Filter, which HostAdjustment to fetch.
     */
    where?: HostAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostAdjustments to fetch.
     */
    orderBy?: HostAdjustmentOrderByWithRelationInput | HostAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HostAdjustments.
     */
    cursor?: HostAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HostAdjustments.
     */
    distinct?: HostAdjustmentScalarFieldEnum | HostAdjustmentScalarFieldEnum[]
  }

  /**
   * HostAdjustment findMany
   */
  export type HostAdjustmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * Filter, which HostAdjustments to fetch.
     */
    where?: HostAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HostAdjustments to fetch.
     */
    orderBy?: HostAdjustmentOrderByWithRelationInput | HostAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing HostAdjustments.
     */
    cursor?: HostAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HostAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HostAdjustments.
     */
    skip?: number
    distinct?: HostAdjustmentScalarFieldEnum | HostAdjustmentScalarFieldEnum[]
  }

  /**
   * HostAdjustment create
   */
  export type HostAdjustmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * The data needed to create a HostAdjustment.
     */
    data: XOR<HostAdjustmentCreateInput, HostAdjustmentUncheckedCreateInput>
  }

  /**
   * HostAdjustment createMany
   */
  export type HostAdjustmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many HostAdjustments.
     */
    data: HostAdjustmentCreateManyInput | HostAdjustmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HostAdjustment createManyAndReturn
   */
  export type HostAdjustmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * The data used to create many HostAdjustments.
     */
    data: HostAdjustmentCreateManyInput | HostAdjustmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HostAdjustment update
   */
  export type HostAdjustmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * The data needed to update a HostAdjustment.
     */
    data: XOR<HostAdjustmentUpdateInput, HostAdjustmentUncheckedUpdateInput>
    /**
     * Choose, which HostAdjustment to update.
     */
    where: HostAdjustmentWhereUniqueInput
  }

  /**
   * HostAdjustment updateMany
   */
  export type HostAdjustmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update HostAdjustments.
     */
    data: XOR<HostAdjustmentUpdateManyMutationInput, HostAdjustmentUncheckedUpdateManyInput>
    /**
     * Filter which HostAdjustments to update
     */
    where?: HostAdjustmentWhereInput
    /**
     * Limit how many HostAdjustments to update.
     */
    limit?: number
  }

  /**
   * HostAdjustment updateManyAndReturn
   */
  export type HostAdjustmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * The data used to update HostAdjustments.
     */
    data: XOR<HostAdjustmentUpdateManyMutationInput, HostAdjustmentUncheckedUpdateManyInput>
    /**
     * Filter which HostAdjustments to update
     */
    where?: HostAdjustmentWhereInput
    /**
     * Limit how many HostAdjustments to update.
     */
    limit?: number
  }

  /**
   * HostAdjustment upsert
   */
  export type HostAdjustmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * The filter to search for the HostAdjustment to update in case it exists.
     */
    where: HostAdjustmentWhereUniqueInput
    /**
     * In case the HostAdjustment found by the `where` argument doesn't exist, create a new HostAdjustment with this data.
     */
    create: XOR<HostAdjustmentCreateInput, HostAdjustmentUncheckedCreateInput>
    /**
     * In case the HostAdjustment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HostAdjustmentUpdateInput, HostAdjustmentUncheckedUpdateInput>
  }

  /**
   * HostAdjustment delete
   */
  export type HostAdjustmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
    /**
     * Filter which HostAdjustment to delete.
     */
    where: HostAdjustmentWhereUniqueInput
  }

  /**
   * HostAdjustment deleteMany
   */
  export type HostAdjustmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HostAdjustments to delete
     */
    where?: HostAdjustmentWhereInput
    /**
     * Limit how many HostAdjustments to delete.
     */
    limit?: number
  }

  /**
   * HostAdjustment without action
   */
  export type HostAdjustmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HostAdjustment
     */
    select?: HostAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HostAdjustment
     */
    omit?: HostAdjustmentOmit<ExtArgs> | null
  }


  /**
   * Model OrganizerTrustScore
   */

  export type AggregateOrganizerTrustScore = {
    _count: OrganizerTrustScoreCountAggregateOutputType | null
    _avg: OrganizerTrustScoreAvgAggregateOutputType | null
    _sum: OrganizerTrustScoreSumAggregateOutputType | null
    _min: OrganizerTrustScoreMinAggregateOutputType | null
    _max: OrganizerTrustScoreMaxAggregateOutputType | null
  }

  export type OrganizerTrustScoreAvgAggregateOutputType = {
    trust_score: number | null
    total_events: number | null
    refund_rate: Decimal | null
    completion_rate: Decimal | null
    complaint_rate: Decimal | null
    total_revenue: Decimal | null
  }

  export type OrganizerTrustScoreSumAggregateOutputType = {
    trust_score: number | null
    total_events: number | null
    refund_rate: Decimal | null
    completion_rate: Decimal | null
    complaint_rate: Decimal | null
    total_revenue: Decimal | null
  }

  export type OrganizerTrustScoreMinAggregateOutputType = {
    id: string | null
    group_id: string | null
    trust_score: number | null
    total_events: number | null
    refund_rate: Decimal | null
    completion_rate: Decimal | null
    complaint_rate: Decimal | null
    total_revenue: Decimal | null
    last_updated: Date | null
  }

  export type OrganizerTrustScoreMaxAggregateOutputType = {
    id: string | null
    group_id: string | null
    trust_score: number | null
    total_events: number | null
    refund_rate: Decimal | null
    completion_rate: Decimal | null
    complaint_rate: Decimal | null
    total_revenue: Decimal | null
    last_updated: Date | null
  }

  export type OrganizerTrustScoreCountAggregateOutputType = {
    id: number
    group_id: number
    trust_score: number
    total_events: number
    refund_rate: number
    completion_rate: number
    complaint_rate: number
    total_revenue: number
    last_updated: number
    _all: number
  }


  export type OrganizerTrustScoreAvgAggregateInputType = {
    trust_score?: true
    total_events?: true
    refund_rate?: true
    completion_rate?: true
    complaint_rate?: true
    total_revenue?: true
  }

  export type OrganizerTrustScoreSumAggregateInputType = {
    trust_score?: true
    total_events?: true
    refund_rate?: true
    completion_rate?: true
    complaint_rate?: true
    total_revenue?: true
  }

  export type OrganizerTrustScoreMinAggregateInputType = {
    id?: true
    group_id?: true
    trust_score?: true
    total_events?: true
    refund_rate?: true
    completion_rate?: true
    complaint_rate?: true
    total_revenue?: true
    last_updated?: true
  }

  export type OrganizerTrustScoreMaxAggregateInputType = {
    id?: true
    group_id?: true
    trust_score?: true
    total_events?: true
    refund_rate?: true
    completion_rate?: true
    complaint_rate?: true
    total_revenue?: true
    last_updated?: true
  }

  export type OrganizerTrustScoreCountAggregateInputType = {
    id?: true
    group_id?: true
    trust_score?: true
    total_events?: true
    refund_rate?: true
    completion_rate?: true
    complaint_rate?: true
    total_revenue?: true
    last_updated?: true
    _all?: true
  }

  export type OrganizerTrustScoreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrganizerTrustScore to aggregate.
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrganizerTrustScores to fetch.
     */
    orderBy?: OrganizerTrustScoreOrderByWithRelationInput | OrganizerTrustScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrganizerTrustScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrganizerTrustScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrganizerTrustScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OrganizerTrustScores
    **/
    _count?: true | OrganizerTrustScoreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrganizerTrustScoreAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrganizerTrustScoreSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrganizerTrustScoreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrganizerTrustScoreMaxAggregateInputType
  }

  export type GetOrganizerTrustScoreAggregateType<T extends OrganizerTrustScoreAggregateArgs> = {
        [P in keyof T & keyof AggregateOrganizerTrustScore]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrganizerTrustScore[P]>
      : GetScalarType<T[P], AggregateOrganizerTrustScore[P]>
  }




  export type OrganizerTrustScoreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrganizerTrustScoreWhereInput
    orderBy?: OrganizerTrustScoreOrderByWithAggregationInput | OrganizerTrustScoreOrderByWithAggregationInput[]
    by: OrganizerTrustScoreScalarFieldEnum[] | OrganizerTrustScoreScalarFieldEnum
    having?: OrganizerTrustScoreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrganizerTrustScoreCountAggregateInputType | true
    _avg?: OrganizerTrustScoreAvgAggregateInputType
    _sum?: OrganizerTrustScoreSumAggregateInputType
    _min?: OrganizerTrustScoreMinAggregateInputType
    _max?: OrganizerTrustScoreMaxAggregateInputType
  }

  export type OrganizerTrustScoreGroupByOutputType = {
    id: string
    group_id: string
    trust_score: number
    total_events: number
    refund_rate: Decimal
    completion_rate: Decimal
    complaint_rate: Decimal
    total_revenue: Decimal
    last_updated: Date
    _count: OrganizerTrustScoreCountAggregateOutputType | null
    _avg: OrganizerTrustScoreAvgAggregateOutputType | null
    _sum: OrganizerTrustScoreSumAggregateOutputType | null
    _min: OrganizerTrustScoreMinAggregateOutputType | null
    _max: OrganizerTrustScoreMaxAggregateOutputType | null
  }

  type GetOrganizerTrustScoreGroupByPayload<T extends OrganizerTrustScoreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrganizerTrustScoreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrganizerTrustScoreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrganizerTrustScoreGroupByOutputType[P]>
            : GetScalarType<T[P], OrganizerTrustScoreGroupByOutputType[P]>
        }
      >
    >


  export type OrganizerTrustScoreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    trust_score?: boolean
    total_events?: boolean
    refund_rate?: boolean
    completion_rate?: boolean
    complaint_rate?: boolean
    total_revenue?: boolean
    last_updated?: boolean
  }, ExtArgs["result"]["organizerTrustScore"]>

  export type OrganizerTrustScoreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    trust_score?: boolean
    total_events?: boolean
    refund_rate?: boolean
    completion_rate?: boolean
    complaint_rate?: boolean
    total_revenue?: boolean
    last_updated?: boolean
  }, ExtArgs["result"]["organizerTrustScore"]>

  export type OrganizerTrustScoreSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    group_id?: boolean
    trust_score?: boolean
    total_events?: boolean
    refund_rate?: boolean
    completion_rate?: boolean
    complaint_rate?: boolean
    total_revenue?: boolean
    last_updated?: boolean
  }, ExtArgs["result"]["organizerTrustScore"]>

  export type OrganizerTrustScoreSelectScalar = {
    id?: boolean
    group_id?: boolean
    trust_score?: boolean
    total_events?: boolean
    refund_rate?: boolean
    completion_rate?: boolean
    complaint_rate?: boolean
    total_revenue?: boolean
    last_updated?: boolean
  }

  export type OrganizerTrustScoreOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "group_id" | "trust_score" | "total_events" | "refund_rate" | "completion_rate" | "complaint_rate" | "total_revenue" | "last_updated", ExtArgs["result"]["organizerTrustScore"]>

  export type $OrganizerTrustScorePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OrganizerTrustScore"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      group_id: string
      trust_score: number
      total_events: number
      refund_rate: Prisma.Decimal
      completion_rate: Prisma.Decimal
      complaint_rate: Prisma.Decimal
      total_revenue: Prisma.Decimal
      last_updated: Date
    }, ExtArgs["result"]["organizerTrustScore"]>
    composites: {}
  }

  type OrganizerTrustScoreGetPayload<S extends boolean | null | undefined | OrganizerTrustScoreDefaultArgs> = $Result.GetResult<Prisma.$OrganizerTrustScorePayload, S>

  type OrganizerTrustScoreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrganizerTrustScoreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrganizerTrustScoreCountAggregateInputType | true
    }

  export interface OrganizerTrustScoreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OrganizerTrustScore'], meta: { name: 'OrganizerTrustScore' } }
    /**
     * Find zero or one OrganizerTrustScore that matches the filter.
     * @param {OrganizerTrustScoreFindUniqueArgs} args - Arguments to find a OrganizerTrustScore
     * @example
     * // Get one OrganizerTrustScore
     * const organizerTrustScore = await prisma.organizerTrustScore.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrganizerTrustScoreFindUniqueArgs>(args: SelectSubset<T, OrganizerTrustScoreFindUniqueArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OrganizerTrustScore that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrganizerTrustScoreFindUniqueOrThrowArgs} args - Arguments to find a OrganizerTrustScore
     * @example
     * // Get one OrganizerTrustScore
     * const organizerTrustScore = await prisma.organizerTrustScore.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrganizerTrustScoreFindUniqueOrThrowArgs>(args: SelectSubset<T, OrganizerTrustScoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrganizerTrustScore that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreFindFirstArgs} args - Arguments to find a OrganizerTrustScore
     * @example
     * // Get one OrganizerTrustScore
     * const organizerTrustScore = await prisma.organizerTrustScore.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrganizerTrustScoreFindFirstArgs>(args?: SelectSubset<T, OrganizerTrustScoreFindFirstArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrganizerTrustScore that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreFindFirstOrThrowArgs} args - Arguments to find a OrganizerTrustScore
     * @example
     * // Get one OrganizerTrustScore
     * const organizerTrustScore = await prisma.organizerTrustScore.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrganizerTrustScoreFindFirstOrThrowArgs>(args?: SelectSubset<T, OrganizerTrustScoreFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OrganizerTrustScores that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OrganizerTrustScores
     * const organizerTrustScores = await prisma.organizerTrustScore.findMany()
     * 
     * // Get first 10 OrganizerTrustScores
     * const organizerTrustScores = await prisma.organizerTrustScore.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const organizerTrustScoreWithIdOnly = await prisma.organizerTrustScore.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrganizerTrustScoreFindManyArgs>(args?: SelectSubset<T, OrganizerTrustScoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OrganizerTrustScore.
     * @param {OrganizerTrustScoreCreateArgs} args - Arguments to create a OrganizerTrustScore.
     * @example
     * // Create one OrganizerTrustScore
     * const OrganizerTrustScore = await prisma.organizerTrustScore.create({
     *   data: {
     *     // ... data to create a OrganizerTrustScore
     *   }
     * })
     * 
     */
    create<T extends OrganizerTrustScoreCreateArgs>(args: SelectSubset<T, OrganizerTrustScoreCreateArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OrganizerTrustScores.
     * @param {OrganizerTrustScoreCreateManyArgs} args - Arguments to create many OrganizerTrustScores.
     * @example
     * // Create many OrganizerTrustScores
     * const organizerTrustScore = await prisma.organizerTrustScore.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrganizerTrustScoreCreateManyArgs>(args?: SelectSubset<T, OrganizerTrustScoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OrganizerTrustScores and returns the data saved in the database.
     * @param {OrganizerTrustScoreCreateManyAndReturnArgs} args - Arguments to create many OrganizerTrustScores.
     * @example
     * // Create many OrganizerTrustScores
     * const organizerTrustScore = await prisma.organizerTrustScore.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OrganizerTrustScores and only return the `id`
     * const organizerTrustScoreWithIdOnly = await prisma.organizerTrustScore.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrganizerTrustScoreCreateManyAndReturnArgs>(args?: SelectSubset<T, OrganizerTrustScoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a OrganizerTrustScore.
     * @param {OrganizerTrustScoreDeleteArgs} args - Arguments to delete one OrganizerTrustScore.
     * @example
     * // Delete one OrganizerTrustScore
     * const OrganizerTrustScore = await prisma.organizerTrustScore.delete({
     *   where: {
     *     // ... filter to delete one OrganizerTrustScore
     *   }
     * })
     * 
     */
    delete<T extends OrganizerTrustScoreDeleteArgs>(args: SelectSubset<T, OrganizerTrustScoreDeleteArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OrganizerTrustScore.
     * @param {OrganizerTrustScoreUpdateArgs} args - Arguments to update one OrganizerTrustScore.
     * @example
     * // Update one OrganizerTrustScore
     * const organizerTrustScore = await prisma.organizerTrustScore.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrganizerTrustScoreUpdateArgs>(args: SelectSubset<T, OrganizerTrustScoreUpdateArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OrganizerTrustScores.
     * @param {OrganizerTrustScoreDeleteManyArgs} args - Arguments to filter OrganizerTrustScores to delete.
     * @example
     * // Delete a few OrganizerTrustScores
     * const { count } = await prisma.organizerTrustScore.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrganizerTrustScoreDeleteManyArgs>(args?: SelectSubset<T, OrganizerTrustScoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrganizerTrustScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OrganizerTrustScores
     * const organizerTrustScore = await prisma.organizerTrustScore.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrganizerTrustScoreUpdateManyArgs>(args: SelectSubset<T, OrganizerTrustScoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrganizerTrustScores and returns the data updated in the database.
     * @param {OrganizerTrustScoreUpdateManyAndReturnArgs} args - Arguments to update many OrganizerTrustScores.
     * @example
     * // Update many OrganizerTrustScores
     * const organizerTrustScore = await prisma.organizerTrustScore.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more OrganizerTrustScores and only return the `id`
     * const organizerTrustScoreWithIdOnly = await prisma.organizerTrustScore.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OrganizerTrustScoreUpdateManyAndReturnArgs>(args: SelectSubset<T, OrganizerTrustScoreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one OrganizerTrustScore.
     * @param {OrganizerTrustScoreUpsertArgs} args - Arguments to update or create a OrganizerTrustScore.
     * @example
     * // Update or create a OrganizerTrustScore
     * const organizerTrustScore = await prisma.organizerTrustScore.upsert({
     *   create: {
     *     // ... data to create a OrganizerTrustScore
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OrganizerTrustScore we want to update
     *   }
     * })
     */
    upsert<T extends OrganizerTrustScoreUpsertArgs>(args: SelectSubset<T, OrganizerTrustScoreUpsertArgs<ExtArgs>>): Prisma__OrganizerTrustScoreClient<$Result.GetResult<Prisma.$OrganizerTrustScorePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OrganizerTrustScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreCountArgs} args - Arguments to filter OrganizerTrustScores to count.
     * @example
     * // Count the number of OrganizerTrustScores
     * const count = await prisma.organizerTrustScore.count({
     *   where: {
     *     // ... the filter for the OrganizerTrustScores we want to count
     *   }
     * })
    **/
    count<T extends OrganizerTrustScoreCountArgs>(
      args?: Subset<T, OrganizerTrustScoreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrganizerTrustScoreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OrganizerTrustScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrganizerTrustScoreAggregateArgs>(args: Subset<T, OrganizerTrustScoreAggregateArgs>): Prisma.PrismaPromise<GetOrganizerTrustScoreAggregateType<T>>

    /**
     * Group by OrganizerTrustScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizerTrustScoreGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrganizerTrustScoreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrganizerTrustScoreGroupByArgs['orderBy'] }
        : { orderBy?: OrganizerTrustScoreGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrganizerTrustScoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrganizerTrustScoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OrganizerTrustScore model
   */
  readonly fields: OrganizerTrustScoreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OrganizerTrustScore.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrganizerTrustScoreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OrganizerTrustScore model
   */
  interface OrganizerTrustScoreFieldRefs {
    readonly id: FieldRef<"OrganizerTrustScore", 'String'>
    readonly group_id: FieldRef<"OrganizerTrustScore", 'String'>
    readonly trust_score: FieldRef<"OrganizerTrustScore", 'Int'>
    readonly total_events: FieldRef<"OrganizerTrustScore", 'Int'>
    readonly refund_rate: FieldRef<"OrganizerTrustScore", 'Decimal'>
    readonly completion_rate: FieldRef<"OrganizerTrustScore", 'Decimal'>
    readonly complaint_rate: FieldRef<"OrganizerTrustScore", 'Decimal'>
    readonly total_revenue: FieldRef<"OrganizerTrustScore", 'Decimal'>
    readonly last_updated: FieldRef<"OrganizerTrustScore", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * OrganizerTrustScore findUnique
   */
  export type OrganizerTrustScoreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * Filter, which OrganizerTrustScore to fetch.
     */
    where: OrganizerTrustScoreWhereUniqueInput
  }

  /**
   * OrganizerTrustScore findUniqueOrThrow
   */
  export type OrganizerTrustScoreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * Filter, which OrganizerTrustScore to fetch.
     */
    where: OrganizerTrustScoreWhereUniqueInput
  }

  /**
   * OrganizerTrustScore findFirst
   */
  export type OrganizerTrustScoreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * Filter, which OrganizerTrustScore to fetch.
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrganizerTrustScores to fetch.
     */
    orderBy?: OrganizerTrustScoreOrderByWithRelationInput | OrganizerTrustScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrganizerTrustScores.
     */
    cursor?: OrganizerTrustScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrganizerTrustScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrganizerTrustScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrganizerTrustScores.
     */
    distinct?: OrganizerTrustScoreScalarFieldEnum | OrganizerTrustScoreScalarFieldEnum[]
  }

  /**
   * OrganizerTrustScore findFirstOrThrow
   */
  export type OrganizerTrustScoreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * Filter, which OrganizerTrustScore to fetch.
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrganizerTrustScores to fetch.
     */
    orderBy?: OrganizerTrustScoreOrderByWithRelationInput | OrganizerTrustScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrganizerTrustScores.
     */
    cursor?: OrganizerTrustScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrganizerTrustScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrganizerTrustScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrganizerTrustScores.
     */
    distinct?: OrganizerTrustScoreScalarFieldEnum | OrganizerTrustScoreScalarFieldEnum[]
  }

  /**
   * OrganizerTrustScore findMany
   */
  export type OrganizerTrustScoreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * Filter, which OrganizerTrustScores to fetch.
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrganizerTrustScores to fetch.
     */
    orderBy?: OrganizerTrustScoreOrderByWithRelationInput | OrganizerTrustScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OrganizerTrustScores.
     */
    cursor?: OrganizerTrustScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrganizerTrustScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrganizerTrustScores.
     */
    skip?: number
    distinct?: OrganizerTrustScoreScalarFieldEnum | OrganizerTrustScoreScalarFieldEnum[]
  }

  /**
   * OrganizerTrustScore create
   */
  export type OrganizerTrustScoreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * The data needed to create a OrganizerTrustScore.
     */
    data: XOR<OrganizerTrustScoreCreateInput, OrganizerTrustScoreUncheckedCreateInput>
  }

  /**
   * OrganizerTrustScore createMany
   */
  export type OrganizerTrustScoreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OrganizerTrustScores.
     */
    data: OrganizerTrustScoreCreateManyInput | OrganizerTrustScoreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OrganizerTrustScore createManyAndReturn
   */
  export type OrganizerTrustScoreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * The data used to create many OrganizerTrustScores.
     */
    data: OrganizerTrustScoreCreateManyInput | OrganizerTrustScoreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OrganizerTrustScore update
   */
  export type OrganizerTrustScoreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * The data needed to update a OrganizerTrustScore.
     */
    data: XOR<OrganizerTrustScoreUpdateInput, OrganizerTrustScoreUncheckedUpdateInput>
    /**
     * Choose, which OrganizerTrustScore to update.
     */
    where: OrganizerTrustScoreWhereUniqueInput
  }

  /**
   * OrganizerTrustScore updateMany
   */
  export type OrganizerTrustScoreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OrganizerTrustScores.
     */
    data: XOR<OrganizerTrustScoreUpdateManyMutationInput, OrganizerTrustScoreUncheckedUpdateManyInput>
    /**
     * Filter which OrganizerTrustScores to update
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * Limit how many OrganizerTrustScores to update.
     */
    limit?: number
  }

  /**
   * OrganizerTrustScore updateManyAndReturn
   */
  export type OrganizerTrustScoreUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * The data used to update OrganizerTrustScores.
     */
    data: XOR<OrganizerTrustScoreUpdateManyMutationInput, OrganizerTrustScoreUncheckedUpdateManyInput>
    /**
     * Filter which OrganizerTrustScores to update
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * Limit how many OrganizerTrustScores to update.
     */
    limit?: number
  }

  /**
   * OrganizerTrustScore upsert
   */
  export type OrganizerTrustScoreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * The filter to search for the OrganizerTrustScore to update in case it exists.
     */
    where: OrganizerTrustScoreWhereUniqueInput
    /**
     * In case the OrganizerTrustScore found by the `where` argument doesn't exist, create a new OrganizerTrustScore with this data.
     */
    create: XOR<OrganizerTrustScoreCreateInput, OrganizerTrustScoreUncheckedCreateInput>
    /**
     * In case the OrganizerTrustScore was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrganizerTrustScoreUpdateInput, OrganizerTrustScoreUncheckedUpdateInput>
  }

  /**
   * OrganizerTrustScore delete
   */
  export type OrganizerTrustScoreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
    /**
     * Filter which OrganizerTrustScore to delete.
     */
    where: OrganizerTrustScoreWhereUniqueInput
  }

  /**
   * OrganizerTrustScore deleteMany
   */
  export type OrganizerTrustScoreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrganizerTrustScores to delete
     */
    where?: OrganizerTrustScoreWhereInput
    /**
     * Limit how many OrganizerTrustScores to delete.
     */
    limit?: number
  }

  /**
   * OrganizerTrustScore without action
   */
  export type OrganizerTrustScoreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizerTrustScore
     */
    select?: OrganizerTrustScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrganizerTrustScore
     */
    omit?: OrganizerTrustScoreOmit<ExtArgs> | null
  }


  /**
   * Model EventUserResponse
   */

  export type AggregateEventUserResponse = {
    _count: EventUserResponseCountAggregateOutputType | null
    _avg: EventUserResponseAvgAggregateOutputType | null
    _sum: EventUserResponseSumAggregateOutputType | null
    _min: EventUserResponseMinAggregateOutputType | null
    _max: EventUserResponseMaxAggregateOutputType | null
  }

  export type EventUserResponseAvgAggregateOutputType = {
    food_quantity: number | null
    food_price: Decimal | null
    accommodation_quantity: number | null
    accommodation_price: Decimal | null
  }

  export type EventUserResponseSumAggregateOutputType = {
    food_quantity: number | null
    food_price: Decimal | null
    accommodation_quantity: number | null
    accommodation_price: Decimal | null
  }

  export type EventUserResponseMinAggregateOutputType = {
    id: string | null
    booking_id: string | null
    ticket_id: string | null
    group_id: string | null
    user_id: string | null
    answer_name: string | null
    answer_email: string | null
    answer_phone: string | null
    answer_position: string | null
    food_selected: boolean | null
    food_quantity: number | null
    food_catering_name: string | null
    food_price: Decimal | null
    food_picture: string | null
    accommodation_selected: boolean | null
    accommodation_quantity: number | null
    accommodation_catering_name: string | null
    accommodation_price: Decimal | null
    accommodation_picture: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type EventUserResponseMaxAggregateOutputType = {
    id: string | null
    booking_id: string | null
    ticket_id: string | null
    group_id: string | null
    user_id: string | null
    answer_name: string | null
    answer_email: string | null
    answer_phone: string | null
    answer_position: string | null
    food_selected: boolean | null
    food_quantity: number | null
    food_catering_name: string | null
    food_price: Decimal | null
    food_picture: string | null
    accommodation_selected: boolean | null
    accommodation_quantity: number | null
    accommodation_catering_name: string | null
    accommodation_price: Decimal | null
    accommodation_picture: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type EventUserResponseCountAggregateOutputType = {
    id: number
    booking_id: number
    ticket_id: number
    group_id: number
    user_id: number
    answer_name: number
    answer_email: number
    answer_phone: number
    answer_position: number
    custom_answers: number
    food_selected: number
    food_quantity: number
    food_menu: number
    food_catering_name: number
    food_price: number
    food_picture: number
    accommodation_selected: number
    accommodation_quantity: number
    accommodation_type: number
    accommodation_catering_name: number
    accommodation_price: number
    accommodation_picture: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type EventUserResponseAvgAggregateInputType = {
    food_quantity?: true
    food_price?: true
    accommodation_quantity?: true
    accommodation_price?: true
  }

  export type EventUserResponseSumAggregateInputType = {
    food_quantity?: true
    food_price?: true
    accommodation_quantity?: true
    accommodation_price?: true
  }

  export type EventUserResponseMinAggregateInputType = {
    id?: true
    booking_id?: true
    ticket_id?: true
    group_id?: true
    user_id?: true
    answer_name?: true
    answer_email?: true
    answer_phone?: true
    answer_position?: true
    food_selected?: true
    food_quantity?: true
    food_catering_name?: true
    food_price?: true
    food_picture?: true
    accommodation_selected?: true
    accommodation_quantity?: true
    accommodation_catering_name?: true
    accommodation_price?: true
    accommodation_picture?: true
    created_at?: true
    updated_at?: true
  }

  export type EventUserResponseMaxAggregateInputType = {
    id?: true
    booking_id?: true
    ticket_id?: true
    group_id?: true
    user_id?: true
    answer_name?: true
    answer_email?: true
    answer_phone?: true
    answer_position?: true
    food_selected?: true
    food_quantity?: true
    food_catering_name?: true
    food_price?: true
    food_picture?: true
    accommodation_selected?: true
    accommodation_quantity?: true
    accommodation_catering_name?: true
    accommodation_price?: true
    accommodation_picture?: true
    created_at?: true
    updated_at?: true
  }

  export type EventUserResponseCountAggregateInputType = {
    id?: true
    booking_id?: true
    ticket_id?: true
    group_id?: true
    user_id?: true
    answer_name?: true
    answer_email?: true
    answer_phone?: true
    answer_position?: true
    custom_answers?: true
    food_selected?: true
    food_quantity?: true
    food_menu?: true
    food_catering_name?: true
    food_price?: true
    food_picture?: true
    accommodation_selected?: true
    accommodation_quantity?: true
    accommodation_type?: true
    accommodation_catering_name?: true
    accommodation_price?: true
    accommodation_picture?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type EventUserResponseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventUserResponse to aggregate.
     */
    where?: EventUserResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventUserResponses to fetch.
     */
    orderBy?: EventUserResponseOrderByWithRelationInput | EventUserResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventUserResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventUserResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventUserResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventUserResponses
    **/
    _count?: true | EventUserResponseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventUserResponseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventUserResponseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventUserResponseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventUserResponseMaxAggregateInputType
  }

  export type GetEventUserResponseAggregateType<T extends EventUserResponseAggregateArgs> = {
        [P in keyof T & keyof AggregateEventUserResponse]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventUserResponse[P]>
      : GetScalarType<T[P], AggregateEventUserResponse[P]>
  }




  export type EventUserResponseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventUserResponseWhereInput
    orderBy?: EventUserResponseOrderByWithAggregationInput | EventUserResponseOrderByWithAggregationInput[]
    by: EventUserResponseScalarFieldEnum[] | EventUserResponseScalarFieldEnum
    having?: EventUserResponseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventUserResponseCountAggregateInputType | true
    _avg?: EventUserResponseAvgAggregateInputType
    _sum?: EventUserResponseSumAggregateInputType
    _min?: EventUserResponseMinAggregateInputType
    _max?: EventUserResponseMaxAggregateInputType
  }

  export type EventUserResponseGroupByOutputType = {
    id: string
    booking_id: string
    ticket_id: string
    group_id: string
    user_id: string
    answer_name: string | null
    answer_email: string | null
    answer_phone: string | null
    answer_position: string | null
    custom_answers: JsonValue | null
    food_selected: boolean
    food_quantity: number
    food_menu: JsonValue | null
    food_catering_name: string | null
    food_price: Decimal
    food_picture: string | null
    accommodation_selected: boolean
    accommodation_quantity: number
    accommodation_type: JsonValue | null
    accommodation_catering_name: string | null
    accommodation_price: Decimal
    accommodation_picture: string | null
    created_at: Date
    updated_at: Date
    _count: EventUserResponseCountAggregateOutputType | null
    _avg: EventUserResponseAvgAggregateOutputType | null
    _sum: EventUserResponseSumAggregateOutputType | null
    _min: EventUserResponseMinAggregateOutputType | null
    _max: EventUserResponseMaxAggregateOutputType | null
  }

  type GetEventUserResponseGroupByPayload<T extends EventUserResponseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventUserResponseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventUserResponseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventUserResponseGroupByOutputType[P]>
            : GetScalarType<T[P], EventUserResponseGroupByOutputType[P]>
        }
      >
    >


  export type EventUserResponseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    user_id?: boolean
    answer_name?: boolean
    answer_email?: boolean
    answer_phone?: boolean
    answer_position?: boolean
    custom_answers?: boolean
    food_selected?: boolean
    food_quantity?: boolean
    food_menu?: boolean
    food_catering_name?: boolean
    food_price?: boolean
    food_picture?: boolean
    accommodation_selected?: boolean
    accommodation_quantity?: boolean
    accommodation_type?: boolean
    accommodation_catering_name?: boolean
    accommodation_price?: boolean
    accommodation_picture?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["eventUserResponse"]>

  export type EventUserResponseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    user_id?: boolean
    answer_name?: boolean
    answer_email?: boolean
    answer_phone?: boolean
    answer_position?: boolean
    custom_answers?: boolean
    food_selected?: boolean
    food_quantity?: boolean
    food_menu?: boolean
    food_catering_name?: boolean
    food_price?: boolean
    food_picture?: boolean
    accommodation_selected?: boolean
    accommodation_quantity?: boolean
    accommodation_type?: boolean
    accommodation_catering_name?: boolean
    accommodation_price?: boolean
    accommodation_picture?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["eventUserResponse"]>

  export type EventUserResponseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    user_id?: boolean
    answer_name?: boolean
    answer_email?: boolean
    answer_phone?: boolean
    answer_position?: boolean
    custom_answers?: boolean
    food_selected?: boolean
    food_quantity?: boolean
    food_menu?: boolean
    food_catering_name?: boolean
    food_price?: boolean
    food_picture?: boolean
    accommodation_selected?: boolean
    accommodation_quantity?: boolean
    accommodation_type?: boolean
    accommodation_catering_name?: boolean
    accommodation_price?: boolean
    accommodation_picture?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["eventUserResponse"]>

  export type EventUserResponseSelectScalar = {
    id?: boolean
    booking_id?: boolean
    ticket_id?: boolean
    group_id?: boolean
    user_id?: boolean
    answer_name?: boolean
    answer_email?: boolean
    answer_phone?: boolean
    answer_position?: boolean
    custom_answers?: boolean
    food_selected?: boolean
    food_quantity?: boolean
    food_menu?: boolean
    food_catering_name?: boolean
    food_price?: boolean
    food_picture?: boolean
    accommodation_selected?: boolean
    accommodation_quantity?: boolean
    accommodation_type?: boolean
    accommodation_catering_name?: boolean
    accommodation_price?: boolean
    accommodation_picture?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type EventUserResponseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "booking_id" | "ticket_id" | "group_id" | "user_id" | "answer_name" | "answer_email" | "answer_phone" | "answer_position" | "custom_answers" | "food_selected" | "food_quantity" | "food_menu" | "food_catering_name" | "food_price" | "food_picture" | "accommodation_selected" | "accommodation_quantity" | "accommodation_type" | "accommodation_catering_name" | "accommodation_price" | "accommodation_picture" | "created_at" | "updated_at", ExtArgs["result"]["eventUserResponse"]>

  export type $EventUserResponsePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventUserResponse"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      booking_id: string
      ticket_id: string
      group_id: string
      user_id: string
      answer_name: string | null
      answer_email: string | null
      answer_phone: string | null
      answer_position: string | null
      custom_answers: Prisma.JsonValue | null
      food_selected: boolean
      food_quantity: number
      food_menu: Prisma.JsonValue | null
      food_catering_name: string | null
      food_price: Prisma.Decimal
      food_picture: string | null
      accommodation_selected: boolean
      accommodation_quantity: number
      accommodation_type: Prisma.JsonValue | null
      accommodation_catering_name: string | null
      accommodation_price: Prisma.Decimal
      accommodation_picture: string | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["eventUserResponse"]>
    composites: {}
  }

  type EventUserResponseGetPayload<S extends boolean | null | undefined | EventUserResponseDefaultArgs> = $Result.GetResult<Prisma.$EventUserResponsePayload, S>

  type EventUserResponseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventUserResponseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventUserResponseCountAggregateInputType | true
    }

  export interface EventUserResponseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventUserResponse'], meta: { name: 'EventUserResponse' } }
    /**
     * Find zero or one EventUserResponse that matches the filter.
     * @param {EventUserResponseFindUniqueArgs} args - Arguments to find a EventUserResponse
     * @example
     * // Get one EventUserResponse
     * const eventUserResponse = await prisma.eventUserResponse.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventUserResponseFindUniqueArgs>(args: SelectSubset<T, EventUserResponseFindUniqueArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventUserResponse that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventUserResponseFindUniqueOrThrowArgs} args - Arguments to find a EventUserResponse
     * @example
     * // Get one EventUserResponse
     * const eventUserResponse = await prisma.eventUserResponse.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventUserResponseFindUniqueOrThrowArgs>(args: SelectSubset<T, EventUserResponseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventUserResponse that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseFindFirstArgs} args - Arguments to find a EventUserResponse
     * @example
     * // Get one EventUserResponse
     * const eventUserResponse = await prisma.eventUserResponse.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventUserResponseFindFirstArgs>(args?: SelectSubset<T, EventUserResponseFindFirstArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventUserResponse that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseFindFirstOrThrowArgs} args - Arguments to find a EventUserResponse
     * @example
     * // Get one EventUserResponse
     * const eventUserResponse = await prisma.eventUserResponse.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventUserResponseFindFirstOrThrowArgs>(args?: SelectSubset<T, EventUserResponseFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventUserResponses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventUserResponses
     * const eventUserResponses = await prisma.eventUserResponse.findMany()
     * 
     * // Get first 10 EventUserResponses
     * const eventUserResponses = await prisma.eventUserResponse.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventUserResponseWithIdOnly = await prisma.eventUserResponse.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventUserResponseFindManyArgs>(args?: SelectSubset<T, EventUserResponseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventUserResponse.
     * @param {EventUserResponseCreateArgs} args - Arguments to create a EventUserResponse.
     * @example
     * // Create one EventUserResponse
     * const EventUserResponse = await prisma.eventUserResponse.create({
     *   data: {
     *     // ... data to create a EventUserResponse
     *   }
     * })
     * 
     */
    create<T extends EventUserResponseCreateArgs>(args: SelectSubset<T, EventUserResponseCreateArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventUserResponses.
     * @param {EventUserResponseCreateManyArgs} args - Arguments to create many EventUserResponses.
     * @example
     * // Create many EventUserResponses
     * const eventUserResponse = await prisma.eventUserResponse.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventUserResponseCreateManyArgs>(args?: SelectSubset<T, EventUserResponseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventUserResponses and returns the data saved in the database.
     * @param {EventUserResponseCreateManyAndReturnArgs} args - Arguments to create many EventUserResponses.
     * @example
     * // Create many EventUserResponses
     * const eventUserResponse = await prisma.eventUserResponse.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventUserResponses and only return the `id`
     * const eventUserResponseWithIdOnly = await prisma.eventUserResponse.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventUserResponseCreateManyAndReturnArgs>(args?: SelectSubset<T, EventUserResponseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventUserResponse.
     * @param {EventUserResponseDeleteArgs} args - Arguments to delete one EventUserResponse.
     * @example
     * // Delete one EventUserResponse
     * const EventUserResponse = await prisma.eventUserResponse.delete({
     *   where: {
     *     // ... filter to delete one EventUserResponse
     *   }
     * })
     * 
     */
    delete<T extends EventUserResponseDeleteArgs>(args: SelectSubset<T, EventUserResponseDeleteArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventUserResponse.
     * @param {EventUserResponseUpdateArgs} args - Arguments to update one EventUserResponse.
     * @example
     * // Update one EventUserResponse
     * const eventUserResponse = await prisma.eventUserResponse.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventUserResponseUpdateArgs>(args: SelectSubset<T, EventUserResponseUpdateArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventUserResponses.
     * @param {EventUserResponseDeleteManyArgs} args - Arguments to filter EventUserResponses to delete.
     * @example
     * // Delete a few EventUserResponses
     * const { count } = await prisma.eventUserResponse.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventUserResponseDeleteManyArgs>(args?: SelectSubset<T, EventUserResponseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventUserResponses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventUserResponses
     * const eventUserResponse = await prisma.eventUserResponse.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventUserResponseUpdateManyArgs>(args: SelectSubset<T, EventUserResponseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventUserResponses and returns the data updated in the database.
     * @param {EventUserResponseUpdateManyAndReturnArgs} args - Arguments to update many EventUserResponses.
     * @example
     * // Update many EventUserResponses
     * const eventUserResponse = await prisma.eventUserResponse.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventUserResponses and only return the `id`
     * const eventUserResponseWithIdOnly = await prisma.eventUserResponse.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventUserResponseUpdateManyAndReturnArgs>(args: SelectSubset<T, EventUserResponseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventUserResponse.
     * @param {EventUserResponseUpsertArgs} args - Arguments to update or create a EventUserResponse.
     * @example
     * // Update or create a EventUserResponse
     * const eventUserResponse = await prisma.eventUserResponse.upsert({
     *   create: {
     *     // ... data to create a EventUserResponse
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventUserResponse we want to update
     *   }
     * })
     */
    upsert<T extends EventUserResponseUpsertArgs>(args: SelectSubset<T, EventUserResponseUpsertArgs<ExtArgs>>): Prisma__EventUserResponseClient<$Result.GetResult<Prisma.$EventUserResponsePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventUserResponses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseCountArgs} args - Arguments to filter EventUserResponses to count.
     * @example
     * // Count the number of EventUserResponses
     * const count = await prisma.eventUserResponse.count({
     *   where: {
     *     // ... the filter for the EventUserResponses we want to count
     *   }
     * })
    **/
    count<T extends EventUserResponseCountArgs>(
      args?: Subset<T, EventUserResponseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventUserResponseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventUserResponse.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventUserResponseAggregateArgs>(args: Subset<T, EventUserResponseAggregateArgs>): Prisma.PrismaPromise<GetEventUserResponseAggregateType<T>>

    /**
     * Group by EventUserResponse.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUserResponseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventUserResponseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventUserResponseGroupByArgs['orderBy'] }
        : { orderBy?: EventUserResponseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventUserResponseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventUserResponseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventUserResponse model
   */
  readonly fields: EventUserResponseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventUserResponse.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventUserResponseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventUserResponse model
   */
  interface EventUserResponseFieldRefs {
    readonly id: FieldRef<"EventUserResponse", 'String'>
    readonly booking_id: FieldRef<"EventUserResponse", 'String'>
    readonly ticket_id: FieldRef<"EventUserResponse", 'String'>
    readonly group_id: FieldRef<"EventUserResponse", 'String'>
    readonly user_id: FieldRef<"EventUserResponse", 'String'>
    readonly answer_name: FieldRef<"EventUserResponse", 'String'>
    readonly answer_email: FieldRef<"EventUserResponse", 'String'>
    readonly answer_phone: FieldRef<"EventUserResponse", 'String'>
    readonly answer_position: FieldRef<"EventUserResponse", 'String'>
    readonly custom_answers: FieldRef<"EventUserResponse", 'Json'>
    readonly food_selected: FieldRef<"EventUserResponse", 'Boolean'>
    readonly food_quantity: FieldRef<"EventUserResponse", 'Int'>
    readonly food_menu: FieldRef<"EventUserResponse", 'Json'>
    readonly food_catering_name: FieldRef<"EventUserResponse", 'String'>
    readonly food_price: FieldRef<"EventUserResponse", 'Decimal'>
    readonly food_picture: FieldRef<"EventUserResponse", 'String'>
    readonly accommodation_selected: FieldRef<"EventUserResponse", 'Boolean'>
    readonly accommodation_quantity: FieldRef<"EventUserResponse", 'Int'>
    readonly accommodation_type: FieldRef<"EventUserResponse", 'Json'>
    readonly accommodation_catering_name: FieldRef<"EventUserResponse", 'String'>
    readonly accommodation_price: FieldRef<"EventUserResponse", 'Decimal'>
    readonly accommodation_picture: FieldRef<"EventUserResponse", 'String'>
    readonly created_at: FieldRef<"EventUserResponse", 'DateTime'>
    readonly updated_at: FieldRef<"EventUserResponse", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EventUserResponse findUnique
   */
  export type EventUserResponseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * Filter, which EventUserResponse to fetch.
     */
    where: EventUserResponseWhereUniqueInput
  }

  /**
   * EventUserResponse findUniqueOrThrow
   */
  export type EventUserResponseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * Filter, which EventUserResponse to fetch.
     */
    where: EventUserResponseWhereUniqueInput
  }

  /**
   * EventUserResponse findFirst
   */
  export type EventUserResponseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * Filter, which EventUserResponse to fetch.
     */
    where?: EventUserResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventUserResponses to fetch.
     */
    orderBy?: EventUserResponseOrderByWithRelationInput | EventUserResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventUserResponses.
     */
    cursor?: EventUserResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventUserResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventUserResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventUserResponses.
     */
    distinct?: EventUserResponseScalarFieldEnum | EventUserResponseScalarFieldEnum[]
  }

  /**
   * EventUserResponse findFirstOrThrow
   */
  export type EventUserResponseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * Filter, which EventUserResponse to fetch.
     */
    where?: EventUserResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventUserResponses to fetch.
     */
    orderBy?: EventUserResponseOrderByWithRelationInput | EventUserResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventUserResponses.
     */
    cursor?: EventUserResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventUserResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventUserResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventUserResponses.
     */
    distinct?: EventUserResponseScalarFieldEnum | EventUserResponseScalarFieldEnum[]
  }

  /**
   * EventUserResponse findMany
   */
  export type EventUserResponseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * Filter, which EventUserResponses to fetch.
     */
    where?: EventUserResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventUserResponses to fetch.
     */
    orderBy?: EventUserResponseOrderByWithRelationInput | EventUserResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventUserResponses.
     */
    cursor?: EventUserResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventUserResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventUserResponses.
     */
    skip?: number
    distinct?: EventUserResponseScalarFieldEnum | EventUserResponseScalarFieldEnum[]
  }

  /**
   * EventUserResponse create
   */
  export type EventUserResponseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * The data needed to create a EventUserResponse.
     */
    data: XOR<EventUserResponseCreateInput, EventUserResponseUncheckedCreateInput>
  }

  /**
   * EventUserResponse createMany
   */
  export type EventUserResponseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventUserResponses.
     */
    data: EventUserResponseCreateManyInput | EventUserResponseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventUserResponse createManyAndReturn
   */
  export type EventUserResponseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * The data used to create many EventUserResponses.
     */
    data: EventUserResponseCreateManyInput | EventUserResponseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventUserResponse update
   */
  export type EventUserResponseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * The data needed to update a EventUserResponse.
     */
    data: XOR<EventUserResponseUpdateInput, EventUserResponseUncheckedUpdateInput>
    /**
     * Choose, which EventUserResponse to update.
     */
    where: EventUserResponseWhereUniqueInput
  }

  /**
   * EventUserResponse updateMany
   */
  export type EventUserResponseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventUserResponses.
     */
    data: XOR<EventUserResponseUpdateManyMutationInput, EventUserResponseUncheckedUpdateManyInput>
    /**
     * Filter which EventUserResponses to update
     */
    where?: EventUserResponseWhereInput
    /**
     * Limit how many EventUserResponses to update.
     */
    limit?: number
  }

  /**
   * EventUserResponse updateManyAndReturn
   */
  export type EventUserResponseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * The data used to update EventUserResponses.
     */
    data: XOR<EventUserResponseUpdateManyMutationInput, EventUserResponseUncheckedUpdateManyInput>
    /**
     * Filter which EventUserResponses to update
     */
    where?: EventUserResponseWhereInput
    /**
     * Limit how many EventUserResponses to update.
     */
    limit?: number
  }

  /**
   * EventUserResponse upsert
   */
  export type EventUserResponseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * The filter to search for the EventUserResponse to update in case it exists.
     */
    where: EventUserResponseWhereUniqueInput
    /**
     * In case the EventUserResponse found by the `where` argument doesn't exist, create a new EventUserResponse with this data.
     */
    create: XOR<EventUserResponseCreateInput, EventUserResponseUncheckedCreateInput>
    /**
     * In case the EventUserResponse was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventUserResponseUpdateInput, EventUserResponseUncheckedUpdateInput>
  }

  /**
   * EventUserResponse delete
   */
  export type EventUserResponseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
    /**
     * Filter which EventUserResponse to delete.
     */
    where: EventUserResponseWhereUniqueInput
  }

  /**
   * EventUserResponse deleteMany
   */
  export type EventUserResponseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventUserResponses to delete
     */
    where?: EventUserResponseWhereInput
    /**
     * Limit how many EventUserResponses to delete.
     */
    limit?: number
  }

  /**
   * EventUserResponse without action
   */
  export type EventUserResponseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventUserResponse
     */
    select?: EventUserResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventUserResponse
     */
    omit?: EventUserResponseOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const BookingScalarFieldEnum: {
    id: 'id',
    bookingId: 'bookingId',
    userId: 'userId',
    ticketId: 'ticketId',
    groupId: 'groupId',
    ticketType: 'ticketType',
    quantity: 'quantity',
    pricePerTicket: 'pricePerTicket',
    subtotal: 'subtotal',
    tax: 'tax',
    platformFee: 'platformFee',
    totalAmount: 'totalAmount',
    currency: 'currency',
    paymentStatus: 'paymentStatus',
    paymentMethod: 'paymentMethod',
    razorpayOrderId: 'razorpayOrderId',
    razorpayPaymentId: 'razorpayPaymentId',
    razorpaySignature: 'razorpaySignature',
    bookingStatus: 'bookingStatus',
    userDetails: 'userDetails',
    eventDetails: 'eventDetails',
    qrCode: 'qrCode',
    qrCodeUrl: 'qrCodeUrl',
    isVerified: 'isVerified',
    verifiedAt: 'verifiedAt',
    verifiedBy: 'verifiedBy',
    cancellationReason: 'cancellationReason',
    cancelledAt: 'cancelledAt',
    refundAmount: 'refundAmount',
    refundStatus: 'refundStatus',
    refundProcessedAt: 'refundProcessedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    cancellationCount: 'cancellationCount',
    refundId: 'refundId',
    refundInitiatedAt: 'refundInitiatedAt',
    seatDetails: 'seatDetails',
    refund_retry_count: 'refund_retry_count',
    convenienceFee: 'convenienceFee',
    organizerGst: 'organizerGst',
    platformGst: 'platformGst',
    settlementMode: 'settlementMode',
    refundPolicyId: 'refundPolicyId',
    financialState: 'financialState',
    refundReason: 'refundReason',
    isAdminCancelled: 'isAdminCancelled',
    isRead: 'isRead',
    food_addon_amount: 'food_addon_amount',
    accommodation_addon_amount: 'accommodation_addon_amount'
  };

  export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum]


  export const InteractionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    ticketId: 'ticketId',
    interactionType: 'interactionType',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InteractionScalarFieldEnum = (typeof InteractionScalarFieldEnum)[keyof typeof InteractionScalarFieldEnum]


  export const PaymentTransactionScalarFieldEnum: {
    id: 'id',
    bookingId: 'bookingId',
    razorpayOrderId: 'razorpayOrderId',
    razorpayPaymentId: 'razorpayPaymentId',
    amount: 'amount',
    currency: 'currency',
    status: 'status',
    method: 'method',
    bank: 'bank',
    wallet: 'wallet',
    vpa: 'vpa',
    email: 'email',
    contact: 'contact',
    webhookData: 'webhookData',
    errorCode: 'errorCode',
    errorDescription: 'errorDescription',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    refundId: 'refundId'
  };

  export type PaymentTransactionScalarFieldEnum = (typeof PaymentTransactionScalarFieldEnum)[keyof typeof PaymentTransactionScalarFieldEnum]


  export const SettlementScalarFieldEnum: {
    id: 'id',
    bookingId: 'bookingId',
    organizationAmount: 'organizationAmount',
    platformFee: 'platformFee',
    status: 'status',
    bankDetails: 'bankDetails',
    razorpayPayoutId: 'razorpayPayoutId',
    processedAt: 'processedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    ticketId: 'ticketId',
    groupId: 'groupId',
    totalAmount: 'totalAmount',
    settlementType: 'settlementType',
    scheduledAt: 'scheduledAt',
    retryCount: 'retryCount',
    hostRazorpayAccountId: 'hostRazorpayAccountId',
    razorpayTransferId: 'razorpayTransferId'
  };

  export type SettlementScalarFieldEnum = (typeof SettlementScalarFieldEnum)[keyof typeof SettlementScalarFieldEnum]


  export const HostLinkedAccountScalarFieldEnum: {
    id: 'id',
    group_id: 'group_id',
    razorpay_account_id: 'razorpay_account_id',
    kyc_status: 'kyc_status',
    business_name: 'business_name',
    email: 'email',
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type HostLinkedAccountScalarFieldEnum = (typeof HostLinkedAccountScalarFieldEnum)[keyof typeof HostLinkedAccountScalarFieldEnum]


  export const LedgerScalarFieldEnum: {
    id: 'id',
    booking_id: 'booking_id',
    ticket_id: 'ticket_id',
    group_id: 'group_id',
    type: 'type',
    debit: 'debit',
    credit: 'credit',
    balance: 'balance',
    reference_id: 'reference_id',
    description: 'description',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type LedgerScalarFieldEnum = (typeof LedgerScalarFieldEnum)[keyof typeof LedgerScalarFieldEnum]


  export const HostAdjustmentScalarFieldEnum: {
    id: 'id',
    group_id: 'group_id',
    booking_id: 'booking_id',
    settlement_id: 'settlement_id',
    adjustment_amount: 'adjustment_amount',
    reason: 'reason',
    status: 'status',
    applied_at: 'applied_at',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type HostAdjustmentScalarFieldEnum = (typeof HostAdjustmentScalarFieldEnum)[keyof typeof HostAdjustmentScalarFieldEnum]


  export const OrganizerTrustScoreScalarFieldEnum: {
    id: 'id',
    group_id: 'group_id',
    trust_score: 'trust_score',
    total_events: 'total_events',
    refund_rate: 'refund_rate',
    completion_rate: 'completion_rate',
    complaint_rate: 'complaint_rate',
    total_revenue: 'total_revenue',
    last_updated: 'last_updated'
  };

  export type OrganizerTrustScoreScalarFieldEnum = (typeof OrganizerTrustScoreScalarFieldEnum)[keyof typeof OrganizerTrustScoreScalarFieldEnum]


  export const EventUserResponseScalarFieldEnum: {
    id: 'id',
    booking_id: 'booking_id',
    ticket_id: 'ticket_id',
    group_id: 'group_id',
    user_id: 'user_id',
    answer_name: 'answer_name',
    answer_email: 'answer_email',
    answer_phone: 'answer_phone',
    answer_position: 'answer_position',
    custom_answers: 'custom_answers',
    food_selected: 'food_selected',
    food_quantity: 'food_quantity',
    food_menu: 'food_menu',
    food_catering_name: 'food_catering_name',
    food_price: 'food_price',
    food_picture: 'food_picture',
    accommodation_selected: 'accommodation_selected',
    accommodation_quantity: 'accommodation_quantity',
    accommodation_type: 'accommodation_type',
    accommodation_catering_name: 'accommodation_catering_name',
    accommodation_price: 'accommodation_price',
    accommodation_picture: 'accommodation_picture',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type EventUserResponseScalarFieldEnum = (typeof EventUserResponseScalarFieldEnum)[keyof typeof EventUserResponseScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'PaymentStatus'
   */
  export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>
    


  /**
   * Reference to a field of type 'PaymentStatus[]'
   */
  export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>
    


  /**
   * Reference to a field of type 'BookingStatus'
   */
  export type EnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus'>
    


  /**
   * Reference to a field of type 'BookingStatus[]'
   */
  export type ListEnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'RefundStatus'
   */
  export type EnumRefundStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RefundStatus'>
    


  /**
   * Reference to a field of type 'RefundStatus[]'
   */
  export type ListEnumRefundStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RefundStatus[]'>
    


  /**
   * Reference to a field of type 'InteractionType'
   */
  export type EnumInteractionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InteractionType'>
    


  /**
   * Reference to a field of type 'InteractionType[]'
   */
  export type ListEnumInteractionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InteractionType[]'>
    


  /**
   * Reference to a field of type 'SettlementStatus'
   */
  export type EnumSettlementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SettlementStatus'>
    


  /**
   * Reference to a field of type 'SettlementStatus[]'
   */
  export type ListEnumSettlementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SettlementStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type BookingWhereInput = {
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    id?: UuidFilter<"Booking"> | string
    bookingId?: StringFilter<"Booking"> | string
    userId?: UuidFilter<"Booking"> | string
    ticketId?: StringFilter<"Booking"> | string
    groupId?: StringFilter<"Booking"> | string
    ticketType?: StringFilter<"Booking"> | string
    quantity?: IntFilter<"Booking"> | number
    pricePerTicket?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    tax?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Booking"> | string
    paymentStatus?: EnumPaymentStatusFilter<"Booking"> | $Enums.PaymentStatus
    paymentMethod?: StringNullableFilter<"Booking"> | string | null
    razorpayOrderId?: StringNullableFilter<"Booking"> | string | null
    razorpayPaymentId?: StringNullableFilter<"Booking"> | string | null
    razorpaySignature?: StringNullableFilter<"Booking"> | string | null
    bookingStatus?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    userDetails?: JsonFilter<"Booking">
    eventDetails?: JsonFilter<"Booking">
    qrCode?: StringNullableFilter<"Booking"> | string | null
    qrCodeUrl?: StringNullableFilter<"Booking"> | string | null
    isVerified?: BoolFilter<"Booking"> | boolean
    verifiedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    verifiedBy?: StringNullableFilter<"Booking"> | string | null
    cancellationReason?: StringNullableFilter<"Booking"> | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    refundAmount?: DecimalNullableFilter<"Booking"> | Decimal | DecimalJsLike | number | string | null
    refundStatus?: EnumRefundStatusNullableFilter<"Booking"> | $Enums.RefundStatus | null
    refundProcessedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    cancellationCount?: IntFilter<"Booking"> | number
    refundId?: StringNullableFilter<"Booking"> | string | null
    refundInitiatedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    seatDetails?: JsonNullableFilter<"Booking">
    refund_retry_count?: IntFilter<"Booking"> | number
    convenienceFee?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFilter<"Booking"> | string
    refundPolicyId?: StringFilter<"Booking"> | string
    financialState?: StringFilter<"Booking"> | string
    refundReason?: StringNullableFilter<"Booking"> | string | null
    isAdminCancelled?: BoolFilter<"Booking"> | boolean
    isRead?: BoolFilter<"Booking"> | boolean
    food_addon_amount?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    paymentTransactions?: PaymentTransactionListRelationFilter
  }

  export type BookingOrderByWithRelationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    ticketType?: SortOrder
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    currency?: SortOrder
    paymentStatus?: SortOrder
    paymentMethod?: SortOrderInput | SortOrder
    razorpayOrderId?: SortOrderInput | SortOrder
    razorpayPaymentId?: SortOrderInput | SortOrder
    razorpaySignature?: SortOrderInput | SortOrder
    bookingStatus?: SortOrder
    userDetails?: SortOrder
    eventDetails?: SortOrder
    qrCode?: SortOrderInput | SortOrder
    qrCodeUrl?: SortOrderInput | SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    verifiedBy?: SortOrderInput | SortOrder
    cancellationReason?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    refundAmount?: SortOrderInput | SortOrder
    refundStatus?: SortOrderInput | SortOrder
    refundProcessedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    cancellationCount?: SortOrder
    refundId?: SortOrderInput | SortOrder
    refundInitiatedAt?: SortOrderInput | SortOrder
    seatDetails?: SortOrderInput | SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    settlementMode?: SortOrder
    refundPolicyId?: SortOrder
    financialState?: SortOrder
    refundReason?: SortOrderInput | SortOrder
    isAdminCancelled?: SortOrder
    isRead?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
    paymentTransactions?: PaymentTransactionOrderByRelationAggregateInput
  }

  export type BookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    bookingId?: string
    razorpayOrderId?: string
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    userId?: UuidFilter<"Booking"> | string
    ticketId?: StringFilter<"Booking"> | string
    groupId?: StringFilter<"Booking"> | string
    ticketType?: StringFilter<"Booking"> | string
    quantity?: IntFilter<"Booking"> | number
    pricePerTicket?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    tax?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Booking"> | string
    paymentStatus?: EnumPaymentStatusFilter<"Booking"> | $Enums.PaymentStatus
    paymentMethod?: StringNullableFilter<"Booking"> | string | null
    razorpayPaymentId?: StringNullableFilter<"Booking"> | string | null
    razorpaySignature?: StringNullableFilter<"Booking"> | string | null
    bookingStatus?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    userDetails?: JsonFilter<"Booking">
    eventDetails?: JsonFilter<"Booking">
    qrCode?: StringNullableFilter<"Booking"> | string | null
    qrCodeUrl?: StringNullableFilter<"Booking"> | string | null
    isVerified?: BoolFilter<"Booking"> | boolean
    verifiedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    verifiedBy?: StringNullableFilter<"Booking"> | string | null
    cancellationReason?: StringNullableFilter<"Booking"> | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    refundAmount?: DecimalNullableFilter<"Booking"> | Decimal | DecimalJsLike | number | string | null
    refundStatus?: EnumRefundStatusNullableFilter<"Booking"> | $Enums.RefundStatus | null
    refundProcessedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    cancellationCount?: IntFilter<"Booking"> | number
    refundId?: StringNullableFilter<"Booking"> | string | null
    refundInitiatedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    seatDetails?: JsonNullableFilter<"Booking">
    refund_retry_count?: IntFilter<"Booking"> | number
    convenienceFee?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFilter<"Booking"> | string
    refundPolicyId?: StringFilter<"Booking"> | string
    financialState?: StringFilter<"Booking"> | string
    refundReason?: StringNullableFilter<"Booking"> | string | null
    isAdminCancelled?: BoolFilter<"Booking"> | boolean
    isRead?: BoolFilter<"Booking"> | boolean
    food_addon_amount?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    paymentTransactions?: PaymentTransactionListRelationFilter
  }, "id" | "bookingId" | "razorpayOrderId">

  export type BookingOrderByWithAggregationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    ticketType?: SortOrder
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    currency?: SortOrder
    paymentStatus?: SortOrder
    paymentMethod?: SortOrderInput | SortOrder
    razorpayOrderId?: SortOrderInput | SortOrder
    razorpayPaymentId?: SortOrderInput | SortOrder
    razorpaySignature?: SortOrderInput | SortOrder
    bookingStatus?: SortOrder
    userDetails?: SortOrder
    eventDetails?: SortOrder
    qrCode?: SortOrderInput | SortOrder
    qrCodeUrl?: SortOrderInput | SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    verifiedBy?: SortOrderInput | SortOrder
    cancellationReason?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    refundAmount?: SortOrderInput | SortOrder
    refundStatus?: SortOrderInput | SortOrder
    refundProcessedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    cancellationCount?: SortOrder
    refundId?: SortOrderInput | SortOrder
    refundInitiatedAt?: SortOrderInput | SortOrder
    seatDetails?: SortOrderInput | SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    settlementMode?: SortOrder
    refundPolicyId?: SortOrder
    financialState?: SortOrder
    refundReason?: SortOrderInput | SortOrder
    isAdminCancelled?: SortOrder
    isRead?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
    _count?: BookingCountOrderByAggregateInput
    _avg?: BookingAvgOrderByAggregateInput
    _max?: BookingMaxOrderByAggregateInput
    _min?: BookingMinOrderByAggregateInput
    _sum?: BookingSumOrderByAggregateInput
  }

  export type BookingScalarWhereWithAggregatesInput = {
    AND?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    OR?: BookingScalarWhereWithAggregatesInput[]
    NOT?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Booking"> | string
    bookingId?: StringWithAggregatesFilter<"Booking"> | string
    userId?: UuidWithAggregatesFilter<"Booking"> | string
    ticketId?: StringWithAggregatesFilter<"Booking"> | string
    groupId?: StringWithAggregatesFilter<"Booking"> | string
    ticketType?: StringWithAggregatesFilter<"Booking"> | string
    quantity?: IntWithAggregatesFilter<"Booking"> | number
    pricePerTicket?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    tax?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"Booking"> | string
    paymentStatus?: EnumPaymentStatusWithAggregatesFilter<"Booking"> | $Enums.PaymentStatus
    paymentMethod?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    razorpayOrderId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    razorpayPaymentId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    razorpaySignature?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    bookingStatus?: EnumBookingStatusWithAggregatesFilter<"Booking"> | $Enums.BookingStatus
    userDetails?: JsonWithAggregatesFilter<"Booking">
    eventDetails?: JsonWithAggregatesFilter<"Booking">
    qrCode?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    qrCodeUrl?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    isVerified?: BoolWithAggregatesFilter<"Booking"> | boolean
    verifiedAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    verifiedBy?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    cancellationReason?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    cancelledAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    refundAmount?: DecimalNullableWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string | null
    refundStatus?: EnumRefundStatusNullableWithAggregatesFilter<"Booking"> | $Enums.RefundStatus | null
    refundProcessedAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    cancellationCount?: IntWithAggregatesFilter<"Booking"> | number
    refundId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    refundInitiatedAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    seatDetails?: JsonNullableWithAggregatesFilter<"Booking">
    refund_retry_count?: IntWithAggregatesFilter<"Booking"> | number
    convenienceFee?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    settlementMode?: StringWithAggregatesFilter<"Booking"> | string
    refundPolicyId?: StringWithAggregatesFilter<"Booking"> | string
    financialState?: StringWithAggregatesFilter<"Booking"> | string
    refundReason?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    isAdminCancelled?: BoolWithAggregatesFilter<"Booking"> | boolean
    isRead?: BoolWithAggregatesFilter<"Booking"> | boolean
    food_addon_amount?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalWithAggregatesFilter<"Booking"> | Decimal | DecimalJsLike | number | string
  }

  export type InteractionWhereInput = {
    AND?: InteractionWhereInput | InteractionWhereInput[]
    OR?: InteractionWhereInput[]
    NOT?: InteractionWhereInput | InteractionWhereInput[]
    id?: UuidFilter<"Interaction"> | string
    userId?: UuidFilter<"Interaction"> | string
    ticketId?: StringFilter<"Interaction"> | string
    interactionType?: EnumInteractionTypeFilter<"Interaction"> | $Enums.InteractionType
    metadata?: JsonNullableFilter<"Interaction">
    createdAt?: DateTimeFilter<"Interaction"> | Date | string
    updatedAt?: DateTimeFilter<"Interaction"> | Date | string
  }

  export type InteractionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    interactionType?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InteractionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_ticketId_interactionType?: InteractionUserIdTicketIdInteractionTypeCompoundUniqueInput
    AND?: InteractionWhereInput | InteractionWhereInput[]
    OR?: InteractionWhereInput[]
    NOT?: InteractionWhereInput | InteractionWhereInput[]
    userId?: UuidFilter<"Interaction"> | string
    ticketId?: StringFilter<"Interaction"> | string
    interactionType?: EnumInteractionTypeFilter<"Interaction"> | $Enums.InteractionType
    metadata?: JsonNullableFilter<"Interaction">
    createdAt?: DateTimeFilter<"Interaction"> | Date | string
    updatedAt?: DateTimeFilter<"Interaction"> | Date | string
  }, "id" | "userId_ticketId_interactionType">

  export type InteractionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    interactionType?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InteractionCountOrderByAggregateInput
    _max?: InteractionMaxOrderByAggregateInput
    _min?: InteractionMinOrderByAggregateInput
  }

  export type InteractionScalarWhereWithAggregatesInput = {
    AND?: InteractionScalarWhereWithAggregatesInput | InteractionScalarWhereWithAggregatesInput[]
    OR?: InteractionScalarWhereWithAggregatesInput[]
    NOT?: InteractionScalarWhereWithAggregatesInput | InteractionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Interaction"> | string
    userId?: UuidWithAggregatesFilter<"Interaction"> | string
    ticketId?: StringWithAggregatesFilter<"Interaction"> | string
    interactionType?: EnumInteractionTypeWithAggregatesFilter<"Interaction"> | $Enums.InteractionType
    metadata?: JsonNullableWithAggregatesFilter<"Interaction">
    createdAt?: DateTimeWithAggregatesFilter<"Interaction"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Interaction"> | Date | string
  }

  export type PaymentTransactionWhereInput = {
    AND?: PaymentTransactionWhereInput | PaymentTransactionWhereInput[]
    OR?: PaymentTransactionWhereInput[]
    NOT?: PaymentTransactionWhereInput | PaymentTransactionWhereInput[]
    id?: UuidFilter<"PaymentTransaction"> | string
    bookingId?: UuidFilter<"PaymentTransaction"> | string
    razorpayOrderId?: StringFilter<"PaymentTransaction"> | string
    razorpayPaymentId?: StringNullableFilter<"PaymentTransaction"> | string | null
    amount?: DecimalFilter<"PaymentTransaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"PaymentTransaction"> | string
    status?: EnumPaymentStatusFilter<"PaymentTransaction"> | $Enums.PaymentStatus
    method?: StringNullableFilter<"PaymentTransaction"> | string | null
    bank?: StringNullableFilter<"PaymentTransaction"> | string | null
    wallet?: StringNullableFilter<"PaymentTransaction"> | string | null
    vpa?: StringNullableFilter<"PaymentTransaction"> | string | null
    email?: StringNullableFilter<"PaymentTransaction"> | string | null
    contact?: StringNullableFilter<"PaymentTransaction"> | string | null
    webhookData?: JsonNullableFilter<"PaymentTransaction">
    errorCode?: StringNullableFilter<"PaymentTransaction"> | string | null
    errorDescription?: StringNullableFilter<"PaymentTransaction"> | string | null
    createdAt?: DateTimeFilter<"PaymentTransaction"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentTransaction"> | Date | string
    refundId?: StringNullableFilter<"PaymentTransaction"> | string | null
    booking?: XOR<BookingScalarRelationFilter, BookingWhereInput>
  }

  export type PaymentTransactionOrderByWithRelationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrderInput | SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    method?: SortOrderInput | SortOrder
    bank?: SortOrderInput | SortOrder
    wallet?: SortOrderInput | SortOrder
    vpa?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    contact?: SortOrderInput | SortOrder
    webhookData?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    errorDescription?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    refundId?: SortOrderInput | SortOrder
    booking?: BookingOrderByWithRelationInput
  }

  export type PaymentTransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PaymentTransactionWhereInput | PaymentTransactionWhereInput[]
    OR?: PaymentTransactionWhereInput[]
    NOT?: PaymentTransactionWhereInput | PaymentTransactionWhereInput[]
    bookingId?: UuidFilter<"PaymentTransaction"> | string
    razorpayOrderId?: StringFilter<"PaymentTransaction"> | string
    razorpayPaymentId?: StringNullableFilter<"PaymentTransaction"> | string | null
    amount?: DecimalFilter<"PaymentTransaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"PaymentTransaction"> | string
    status?: EnumPaymentStatusFilter<"PaymentTransaction"> | $Enums.PaymentStatus
    method?: StringNullableFilter<"PaymentTransaction"> | string | null
    bank?: StringNullableFilter<"PaymentTransaction"> | string | null
    wallet?: StringNullableFilter<"PaymentTransaction"> | string | null
    vpa?: StringNullableFilter<"PaymentTransaction"> | string | null
    email?: StringNullableFilter<"PaymentTransaction"> | string | null
    contact?: StringNullableFilter<"PaymentTransaction"> | string | null
    webhookData?: JsonNullableFilter<"PaymentTransaction">
    errorCode?: StringNullableFilter<"PaymentTransaction"> | string | null
    errorDescription?: StringNullableFilter<"PaymentTransaction"> | string | null
    createdAt?: DateTimeFilter<"PaymentTransaction"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentTransaction"> | Date | string
    refundId?: StringNullableFilter<"PaymentTransaction"> | string | null
    booking?: XOR<BookingScalarRelationFilter, BookingWhereInput>
  }, "id">

  export type PaymentTransactionOrderByWithAggregationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrderInput | SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    method?: SortOrderInput | SortOrder
    bank?: SortOrderInput | SortOrder
    wallet?: SortOrderInput | SortOrder
    vpa?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    contact?: SortOrderInput | SortOrder
    webhookData?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    errorDescription?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    refundId?: SortOrderInput | SortOrder
    _count?: PaymentTransactionCountOrderByAggregateInput
    _avg?: PaymentTransactionAvgOrderByAggregateInput
    _max?: PaymentTransactionMaxOrderByAggregateInput
    _min?: PaymentTransactionMinOrderByAggregateInput
    _sum?: PaymentTransactionSumOrderByAggregateInput
  }

  export type PaymentTransactionScalarWhereWithAggregatesInput = {
    AND?: PaymentTransactionScalarWhereWithAggregatesInput | PaymentTransactionScalarWhereWithAggregatesInput[]
    OR?: PaymentTransactionScalarWhereWithAggregatesInput[]
    NOT?: PaymentTransactionScalarWhereWithAggregatesInput | PaymentTransactionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PaymentTransaction"> | string
    bookingId?: UuidWithAggregatesFilter<"PaymentTransaction"> | string
    razorpayOrderId?: StringWithAggregatesFilter<"PaymentTransaction"> | string
    razorpayPaymentId?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    amount?: DecimalWithAggregatesFilter<"PaymentTransaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"PaymentTransaction"> | string
    status?: EnumPaymentStatusWithAggregatesFilter<"PaymentTransaction"> | $Enums.PaymentStatus
    method?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    bank?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    wallet?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    vpa?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    email?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    contact?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    webhookData?: JsonNullableWithAggregatesFilter<"PaymentTransaction">
    errorCode?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    errorDescription?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PaymentTransaction"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PaymentTransaction"> | Date | string
    refundId?: StringNullableWithAggregatesFilter<"PaymentTransaction"> | string | null
  }

  export type SettlementWhereInput = {
    AND?: SettlementWhereInput | SettlementWhereInput[]
    OR?: SettlementWhereInput[]
    NOT?: SettlementWhereInput | SettlementWhereInput[]
    id?: UuidFilter<"Settlement"> | string
    bookingId?: UuidFilter<"Settlement"> | string
    organizationAmount?: DecimalFilter<"Settlement"> | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFilter<"Settlement"> | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusFilter<"Settlement"> | $Enums.SettlementStatus
    bankDetails?: JsonFilter<"Settlement">
    razorpayPayoutId?: StringNullableFilter<"Settlement"> | string | null
    processedAt?: DateTimeNullableFilter<"Settlement"> | Date | string | null
    createdAt?: DateTimeFilter<"Settlement"> | Date | string
    updatedAt?: DateTimeFilter<"Settlement"> | Date | string
    ticketId?: StringNullableFilter<"Settlement"> | string | null
    groupId?: StringNullableFilter<"Settlement"> | string | null
    totalAmount?: DecimalNullableFilter<"Settlement"> | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringFilter<"Settlement"> | string
    scheduledAt?: DateTimeNullableFilter<"Settlement"> | Date | string | null
    retryCount?: IntFilter<"Settlement"> | number
    hostRazorpayAccountId?: StringNullableFilter<"Settlement"> | string | null
    razorpayTransferId?: StringNullableFilter<"Settlement"> | string | null
  }

  export type SettlementOrderByWithRelationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    status?: SortOrder
    bankDetails?: SortOrder
    razorpayPayoutId?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticketId?: SortOrderInput | SortOrder
    groupId?: SortOrderInput | SortOrder
    totalAmount?: SortOrderInput | SortOrder
    settlementType?: SortOrder
    scheduledAt?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    hostRazorpayAccountId?: SortOrderInput | SortOrder
    razorpayTransferId?: SortOrderInput | SortOrder
  }

  export type SettlementWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SettlementWhereInput | SettlementWhereInput[]
    OR?: SettlementWhereInput[]
    NOT?: SettlementWhereInput | SettlementWhereInput[]
    bookingId?: UuidFilter<"Settlement"> | string
    organizationAmount?: DecimalFilter<"Settlement"> | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFilter<"Settlement"> | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusFilter<"Settlement"> | $Enums.SettlementStatus
    bankDetails?: JsonFilter<"Settlement">
    razorpayPayoutId?: StringNullableFilter<"Settlement"> | string | null
    processedAt?: DateTimeNullableFilter<"Settlement"> | Date | string | null
    createdAt?: DateTimeFilter<"Settlement"> | Date | string
    updatedAt?: DateTimeFilter<"Settlement"> | Date | string
    ticketId?: StringNullableFilter<"Settlement"> | string | null
    groupId?: StringNullableFilter<"Settlement"> | string | null
    totalAmount?: DecimalNullableFilter<"Settlement"> | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringFilter<"Settlement"> | string
    scheduledAt?: DateTimeNullableFilter<"Settlement"> | Date | string | null
    retryCount?: IntFilter<"Settlement"> | number
    hostRazorpayAccountId?: StringNullableFilter<"Settlement"> | string | null
    razorpayTransferId?: StringNullableFilter<"Settlement"> | string | null
  }, "id">

  export type SettlementOrderByWithAggregationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    status?: SortOrder
    bankDetails?: SortOrder
    razorpayPayoutId?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticketId?: SortOrderInput | SortOrder
    groupId?: SortOrderInput | SortOrder
    totalAmount?: SortOrderInput | SortOrder
    settlementType?: SortOrder
    scheduledAt?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    hostRazorpayAccountId?: SortOrderInput | SortOrder
    razorpayTransferId?: SortOrderInput | SortOrder
    _count?: SettlementCountOrderByAggregateInput
    _avg?: SettlementAvgOrderByAggregateInput
    _max?: SettlementMaxOrderByAggregateInput
    _min?: SettlementMinOrderByAggregateInput
    _sum?: SettlementSumOrderByAggregateInput
  }

  export type SettlementScalarWhereWithAggregatesInput = {
    AND?: SettlementScalarWhereWithAggregatesInput | SettlementScalarWhereWithAggregatesInput[]
    OR?: SettlementScalarWhereWithAggregatesInput[]
    NOT?: SettlementScalarWhereWithAggregatesInput | SettlementScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Settlement"> | string
    bookingId?: UuidWithAggregatesFilter<"Settlement"> | string
    organizationAmount?: DecimalWithAggregatesFilter<"Settlement"> | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalWithAggregatesFilter<"Settlement"> | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusWithAggregatesFilter<"Settlement"> | $Enums.SettlementStatus
    bankDetails?: JsonWithAggregatesFilter<"Settlement">
    razorpayPayoutId?: StringNullableWithAggregatesFilter<"Settlement"> | string | null
    processedAt?: DateTimeNullableWithAggregatesFilter<"Settlement"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Settlement"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Settlement"> | Date | string
    ticketId?: StringNullableWithAggregatesFilter<"Settlement"> | string | null
    groupId?: StringNullableWithAggregatesFilter<"Settlement"> | string | null
    totalAmount?: DecimalNullableWithAggregatesFilter<"Settlement"> | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringWithAggregatesFilter<"Settlement"> | string
    scheduledAt?: DateTimeNullableWithAggregatesFilter<"Settlement"> | Date | string | null
    retryCount?: IntWithAggregatesFilter<"Settlement"> | number
    hostRazorpayAccountId?: StringNullableWithAggregatesFilter<"Settlement"> | string | null
    razorpayTransferId?: StringNullableWithAggregatesFilter<"Settlement"> | string | null
  }

  export type HostLinkedAccountWhereInput = {
    AND?: HostLinkedAccountWhereInput | HostLinkedAccountWhereInput[]
    OR?: HostLinkedAccountWhereInput[]
    NOT?: HostLinkedAccountWhereInput | HostLinkedAccountWhereInput[]
    id?: UuidFilter<"HostLinkedAccount"> | string
    group_id?: StringFilter<"HostLinkedAccount"> | string
    razorpay_account_id?: StringFilter<"HostLinkedAccount"> | string
    kyc_status?: StringFilter<"HostLinkedAccount"> | string
    business_name?: StringNullableFilter<"HostLinkedAccount"> | string | null
    email?: StringNullableFilter<"HostLinkedAccount"> | string | null
    is_active?: BoolFilter<"HostLinkedAccount"> | boolean
    created_at?: DateTimeFilter<"HostLinkedAccount"> | Date | string
    updated_at?: DateTimeFilter<"HostLinkedAccount"> | Date | string
  }

  export type HostLinkedAccountOrderByWithRelationInput = {
    id?: SortOrder
    group_id?: SortOrder
    razorpay_account_id?: SortOrder
    kyc_status?: SortOrder
    business_name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostLinkedAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    group_id?: string
    AND?: HostLinkedAccountWhereInput | HostLinkedAccountWhereInput[]
    OR?: HostLinkedAccountWhereInput[]
    NOT?: HostLinkedAccountWhereInput | HostLinkedAccountWhereInput[]
    razorpay_account_id?: StringFilter<"HostLinkedAccount"> | string
    kyc_status?: StringFilter<"HostLinkedAccount"> | string
    business_name?: StringNullableFilter<"HostLinkedAccount"> | string | null
    email?: StringNullableFilter<"HostLinkedAccount"> | string | null
    is_active?: BoolFilter<"HostLinkedAccount"> | boolean
    created_at?: DateTimeFilter<"HostLinkedAccount"> | Date | string
    updated_at?: DateTimeFilter<"HostLinkedAccount"> | Date | string
  }, "id" | "group_id">

  export type HostLinkedAccountOrderByWithAggregationInput = {
    id?: SortOrder
    group_id?: SortOrder
    razorpay_account_id?: SortOrder
    kyc_status?: SortOrder
    business_name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: HostLinkedAccountCountOrderByAggregateInput
    _max?: HostLinkedAccountMaxOrderByAggregateInput
    _min?: HostLinkedAccountMinOrderByAggregateInput
  }

  export type HostLinkedAccountScalarWhereWithAggregatesInput = {
    AND?: HostLinkedAccountScalarWhereWithAggregatesInput | HostLinkedAccountScalarWhereWithAggregatesInput[]
    OR?: HostLinkedAccountScalarWhereWithAggregatesInput[]
    NOT?: HostLinkedAccountScalarWhereWithAggregatesInput | HostLinkedAccountScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"HostLinkedAccount"> | string
    group_id?: StringWithAggregatesFilter<"HostLinkedAccount"> | string
    razorpay_account_id?: StringWithAggregatesFilter<"HostLinkedAccount"> | string
    kyc_status?: StringWithAggregatesFilter<"HostLinkedAccount"> | string
    business_name?: StringNullableWithAggregatesFilter<"HostLinkedAccount"> | string | null
    email?: StringNullableWithAggregatesFilter<"HostLinkedAccount"> | string | null
    is_active?: BoolWithAggregatesFilter<"HostLinkedAccount"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"HostLinkedAccount"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"HostLinkedAccount"> | Date | string
  }

  export type LedgerWhereInput = {
    AND?: LedgerWhereInput | LedgerWhereInput[]
    OR?: LedgerWhereInput[]
    NOT?: LedgerWhereInput | LedgerWhereInput[]
    id?: UuidFilter<"Ledger"> | string
    booking_id?: StringFilter<"Ledger"> | string
    ticket_id?: StringNullableFilter<"Ledger"> | string | null
    group_id?: StringNullableFilter<"Ledger"> | string | null
    type?: StringFilter<"Ledger"> | string
    debit?: DecimalNullableFilter<"Ledger"> | Decimal | DecimalJsLike | number | string | null
    credit?: DecimalNullableFilter<"Ledger"> | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalFilter<"Ledger"> | Decimal | DecimalJsLike | number | string
    reference_id?: StringNullableFilter<"Ledger"> | string | null
    description?: StringNullableFilter<"Ledger"> | string | null
    status?: StringFilter<"Ledger"> | string
    created_at?: DateTimeFilter<"Ledger"> | Date | string
    updated_at?: DateTimeFilter<"Ledger"> | Date | string
  }

  export type LedgerOrderByWithRelationInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrderInput | SortOrder
    group_id?: SortOrderInput | SortOrder
    type?: SortOrder
    debit?: SortOrderInput | SortOrder
    credit?: SortOrderInput | SortOrder
    balance?: SortOrder
    reference_id?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type LedgerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LedgerWhereInput | LedgerWhereInput[]
    OR?: LedgerWhereInput[]
    NOT?: LedgerWhereInput | LedgerWhereInput[]
    booking_id?: StringFilter<"Ledger"> | string
    ticket_id?: StringNullableFilter<"Ledger"> | string | null
    group_id?: StringNullableFilter<"Ledger"> | string | null
    type?: StringFilter<"Ledger"> | string
    debit?: DecimalNullableFilter<"Ledger"> | Decimal | DecimalJsLike | number | string | null
    credit?: DecimalNullableFilter<"Ledger"> | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalFilter<"Ledger"> | Decimal | DecimalJsLike | number | string
    reference_id?: StringNullableFilter<"Ledger"> | string | null
    description?: StringNullableFilter<"Ledger"> | string | null
    status?: StringFilter<"Ledger"> | string
    created_at?: DateTimeFilter<"Ledger"> | Date | string
    updated_at?: DateTimeFilter<"Ledger"> | Date | string
  }, "id">

  export type LedgerOrderByWithAggregationInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrderInput | SortOrder
    group_id?: SortOrderInput | SortOrder
    type?: SortOrder
    debit?: SortOrderInput | SortOrder
    credit?: SortOrderInput | SortOrder
    balance?: SortOrder
    reference_id?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: LedgerCountOrderByAggregateInput
    _avg?: LedgerAvgOrderByAggregateInput
    _max?: LedgerMaxOrderByAggregateInput
    _min?: LedgerMinOrderByAggregateInput
    _sum?: LedgerSumOrderByAggregateInput
  }

  export type LedgerScalarWhereWithAggregatesInput = {
    AND?: LedgerScalarWhereWithAggregatesInput | LedgerScalarWhereWithAggregatesInput[]
    OR?: LedgerScalarWhereWithAggregatesInput[]
    NOT?: LedgerScalarWhereWithAggregatesInput | LedgerScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Ledger"> | string
    booking_id?: StringWithAggregatesFilter<"Ledger"> | string
    ticket_id?: StringNullableWithAggregatesFilter<"Ledger"> | string | null
    group_id?: StringNullableWithAggregatesFilter<"Ledger"> | string | null
    type?: StringWithAggregatesFilter<"Ledger"> | string
    debit?: DecimalNullableWithAggregatesFilter<"Ledger"> | Decimal | DecimalJsLike | number | string | null
    credit?: DecimalNullableWithAggregatesFilter<"Ledger"> | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalWithAggregatesFilter<"Ledger"> | Decimal | DecimalJsLike | number | string
    reference_id?: StringNullableWithAggregatesFilter<"Ledger"> | string | null
    description?: StringNullableWithAggregatesFilter<"Ledger"> | string | null
    status?: StringWithAggregatesFilter<"Ledger"> | string
    created_at?: DateTimeWithAggregatesFilter<"Ledger"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Ledger"> | Date | string
  }

  export type HostAdjustmentWhereInput = {
    AND?: HostAdjustmentWhereInput | HostAdjustmentWhereInput[]
    OR?: HostAdjustmentWhereInput[]
    NOT?: HostAdjustmentWhereInput | HostAdjustmentWhereInput[]
    id?: UuidFilter<"HostAdjustment"> | string
    group_id?: StringFilter<"HostAdjustment"> | string
    booking_id?: StringFilter<"HostAdjustment"> | string
    settlement_id?: StringFilter<"HostAdjustment"> | string
    adjustment_amount?: DecimalFilter<"HostAdjustment"> | Decimal | DecimalJsLike | number | string
    reason?: StringNullableFilter<"HostAdjustment"> | string | null
    status?: StringFilter<"HostAdjustment"> | string
    applied_at?: DateTimeNullableFilter<"HostAdjustment"> | Date | string | null
    created_at?: DateTimeFilter<"HostAdjustment"> | Date | string
    updated_at?: DateTimeFilter<"HostAdjustment"> | Date | string
  }

  export type HostAdjustmentOrderByWithRelationInput = {
    id?: SortOrder
    group_id?: SortOrder
    booking_id?: SortOrder
    settlement_id?: SortOrder
    adjustment_amount?: SortOrder
    reason?: SortOrderInput | SortOrder
    status?: SortOrder
    applied_at?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostAdjustmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: HostAdjustmentWhereInput | HostAdjustmentWhereInput[]
    OR?: HostAdjustmentWhereInput[]
    NOT?: HostAdjustmentWhereInput | HostAdjustmentWhereInput[]
    group_id?: StringFilter<"HostAdjustment"> | string
    booking_id?: StringFilter<"HostAdjustment"> | string
    settlement_id?: StringFilter<"HostAdjustment"> | string
    adjustment_amount?: DecimalFilter<"HostAdjustment"> | Decimal | DecimalJsLike | number | string
    reason?: StringNullableFilter<"HostAdjustment"> | string | null
    status?: StringFilter<"HostAdjustment"> | string
    applied_at?: DateTimeNullableFilter<"HostAdjustment"> | Date | string | null
    created_at?: DateTimeFilter<"HostAdjustment"> | Date | string
    updated_at?: DateTimeFilter<"HostAdjustment"> | Date | string
  }, "id">

  export type HostAdjustmentOrderByWithAggregationInput = {
    id?: SortOrder
    group_id?: SortOrder
    booking_id?: SortOrder
    settlement_id?: SortOrder
    adjustment_amount?: SortOrder
    reason?: SortOrderInput | SortOrder
    status?: SortOrder
    applied_at?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: HostAdjustmentCountOrderByAggregateInput
    _avg?: HostAdjustmentAvgOrderByAggregateInput
    _max?: HostAdjustmentMaxOrderByAggregateInput
    _min?: HostAdjustmentMinOrderByAggregateInput
    _sum?: HostAdjustmentSumOrderByAggregateInput
  }

  export type HostAdjustmentScalarWhereWithAggregatesInput = {
    AND?: HostAdjustmentScalarWhereWithAggregatesInput | HostAdjustmentScalarWhereWithAggregatesInput[]
    OR?: HostAdjustmentScalarWhereWithAggregatesInput[]
    NOT?: HostAdjustmentScalarWhereWithAggregatesInput | HostAdjustmentScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"HostAdjustment"> | string
    group_id?: StringWithAggregatesFilter<"HostAdjustment"> | string
    booking_id?: StringWithAggregatesFilter<"HostAdjustment"> | string
    settlement_id?: StringWithAggregatesFilter<"HostAdjustment"> | string
    adjustment_amount?: DecimalWithAggregatesFilter<"HostAdjustment"> | Decimal | DecimalJsLike | number | string
    reason?: StringNullableWithAggregatesFilter<"HostAdjustment"> | string | null
    status?: StringWithAggregatesFilter<"HostAdjustment"> | string
    applied_at?: DateTimeNullableWithAggregatesFilter<"HostAdjustment"> | Date | string | null
    created_at?: DateTimeWithAggregatesFilter<"HostAdjustment"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"HostAdjustment"> | Date | string
  }

  export type OrganizerTrustScoreWhereInput = {
    AND?: OrganizerTrustScoreWhereInput | OrganizerTrustScoreWhereInput[]
    OR?: OrganizerTrustScoreWhereInput[]
    NOT?: OrganizerTrustScoreWhereInput | OrganizerTrustScoreWhereInput[]
    id?: UuidFilter<"OrganizerTrustScore"> | string
    group_id?: StringFilter<"OrganizerTrustScore"> | string
    trust_score?: IntFilter<"OrganizerTrustScore"> | number
    total_events?: IntFilter<"OrganizerTrustScore"> | number
    refund_rate?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeFilter<"OrganizerTrustScore"> | Date | string
  }

  export type OrganizerTrustScoreOrderByWithRelationInput = {
    id?: SortOrder
    group_id?: SortOrder
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
    last_updated?: SortOrder
  }

  export type OrganizerTrustScoreWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    group_id?: string
    AND?: OrganizerTrustScoreWhereInput | OrganizerTrustScoreWhereInput[]
    OR?: OrganizerTrustScoreWhereInput[]
    NOT?: OrganizerTrustScoreWhereInput | OrganizerTrustScoreWhereInput[]
    trust_score?: IntFilter<"OrganizerTrustScore"> | number
    total_events?: IntFilter<"OrganizerTrustScore"> | number
    refund_rate?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeFilter<"OrganizerTrustScore"> | Date | string
  }, "id" | "group_id">

  export type OrganizerTrustScoreOrderByWithAggregationInput = {
    id?: SortOrder
    group_id?: SortOrder
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
    last_updated?: SortOrder
    _count?: OrganizerTrustScoreCountOrderByAggregateInput
    _avg?: OrganizerTrustScoreAvgOrderByAggregateInput
    _max?: OrganizerTrustScoreMaxOrderByAggregateInput
    _min?: OrganizerTrustScoreMinOrderByAggregateInput
    _sum?: OrganizerTrustScoreSumOrderByAggregateInput
  }

  export type OrganizerTrustScoreScalarWhereWithAggregatesInput = {
    AND?: OrganizerTrustScoreScalarWhereWithAggregatesInput | OrganizerTrustScoreScalarWhereWithAggregatesInput[]
    OR?: OrganizerTrustScoreScalarWhereWithAggregatesInput[]
    NOT?: OrganizerTrustScoreScalarWhereWithAggregatesInput | OrganizerTrustScoreScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"OrganizerTrustScore"> | string
    group_id?: StringWithAggregatesFilter<"OrganizerTrustScore"> | string
    trust_score?: IntWithAggregatesFilter<"OrganizerTrustScore"> | number
    total_events?: IntWithAggregatesFilter<"OrganizerTrustScore"> | number
    refund_rate?: DecimalWithAggregatesFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalWithAggregatesFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalWithAggregatesFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalWithAggregatesFilter<"OrganizerTrustScore"> | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeWithAggregatesFilter<"OrganizerTrustScore"> | Date | string
  }

  export type EventUserResponseWhereInput = {
    AND?: EventUserResponseWhereInput | EventUserResponseWhereInput[]
    OR?: EventUserResponseWhereInput[]
    NOT?: EventUserResponseWhereInput | EventUserResponseWhereInput[]
    id?: UuidFilter<"EventUserResponse"> | string
    booking_id?: StringFilter<"EventUserResponse"> | string
    ticket_id?: StringFilter<"EventUserResponse"> | string
    group_id?: StringFilter<"EventUserResponse"> | string
    user_id?: UuidFilter<"EventUserResponse"> | string
    answer_name?: StringNullableFilter<"EventUserResponse"> | string | null
    answer_email?: StringNullableFilter<"EventUserResponse"> | string | null
    answer_phone?: StringNullableFilter<"EventUserResponse"> | string | null
    answer_position?: StringNullableFilter<"EventUserResponse"> | string | null
    custom_answers?: JsonNullableFilter<"EventUserResponse">
    food_selected?: BoolFilter<"EventUserResponse"> | boolean
    food_quantity?: IntFilter<"EventUserResponse"> | number
    food_menu?: JsonNullableFilter<"EventUserResponse">
    food_catering_name?: StringNullableFilter<"EventUserResponse"> | string | null
    food_price?: DecimalFilter<"EventUserResponse"> | Decimal | DecimalJsLike | number | string
    food_picture?: StringNullableFilter<"EventUserResponse"> | string | null
    accommodation_selected?: BoolFilter<"EventUserResponse"> | boolean
    accommodation_quantity?: IntFilter<"EventUserResponse"> | number
    accommodation_type?: JsonNullableFilter<"EventUserResponse">
    accommodation_catering_name?: StringNullableFilter<"EventUserResponse"> | string | null
    accommodation_price?: DecimalFilter<"EventUserResponse"> | Decimal | DecimalJsLike | number | string
    accommodation_picture?: StringNullableFilter<"EventUserResponse"> | string | null
    created_at?: DateTimeFilter<"EventUserResponse"> | Date | string
    updated_at?: DateTimeFilter<"EventUserResponse"> | Date | string
  }

  export type EventUserResponseOrderByWithRelationInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    user_id?: SortOrder
    answer_name?: SortOrderInput | SortOrder
    answer_email?: SortOrderInput | SortOrder
    answer_phone?: SortOrderInput | SortOrder
    answer_position?: SortOrderInput | SortOrder
    custom_answers?: SortOrderInput | SortOrder
    food_selected?: SortOrder
    food_quantity?: SortOrder
    food_menu?: SortOrderInput | SortOrder
    food_catering_name?: SortOrderInput | SortOrder
    food_price?: SortOrder
    food_picture?: SortOrderInput | SortOrder
    accommodation_selected?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_type?: SortOrderInput | SortOrder
    accommodation_catering_name?: SortOrderInput | SortOrder
    accommodation_price?: SortOrder
    accommodation_picture?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type EventUserResponseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EventUserResponseWhereInput | EventUserResponseWhereInput[]
    OR?: EventUserResponseWhereInput[]
    NOT?: EventUserResponseWhereInput | EventUserResponseWhereInput[]
    booking_id?: StringFilter<"EventUserResponse"> | string
    ticket_id?: StringFilter<"EventUserResponse"> | string
    group_id?: StringFilter<"EventUserResponse"> | string
    user_id?: UuidFilter<"EventUserResponse"> | string
    answer_name?: StringNullableFilter<"EventUserResponse"> | string | null
    answer_email?: StringNullableFilter<"EventUserResponse"> | string | null
    answer_phone?: StringNullableFilter<"EventUserResponse"> | string | null
    answer_position?: StringNullableFilter<"EventUserResponse"> | string | null
    custom_answers?: JsonNullableFilter<"EventUserResponse">
    food_selected?: BoolFilter<"EventUserResponse"> | boolean
    food_quantity?: IntFilter<"EventUserResponse"> | number
    food_menu?: JsonNullableFilter<"EventUserResponse">
    food_catering_name?: StringNullableFilter<"EventUserResponse"> | string | null
    food_price?: DecimalFilter<"EventUserResponse"> | Decimal | DecimalJsLike | number | string
    food_picture?: StringNullableFilter<"EventUserResponse"> | string | null
    accommodation_selected?: BoolFilter<"EventUserResponse"> | boolean
    accommodation_quantity?: IntFilter<"EventUserResponse"> | number
    accommodation_type?: JsonNullableFilter<"EventUserResponse">
    accommodation_catering_name?: StringNullableFilter<"EventUserResponse"> | string | null
    accommodation_price?: DecimalFilter<"EventUserResponse"> | Decimal | DecimalJsLike | number | string
    accommodation_picture?: StringNullableFilter<"EventUserResponse"> | string | null
    created_at?: DateTimeFilter<"EventUserResponse"> | Date | string
    updated_at?: DateTimeFilter<"EventUserResponse"> | Date | string
  }, "id">

  export type EventUserResponseOrderByWithAggregationInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    user_id?: SortOrder
    answer_name?: SortOrderInput | SortOrder
    answer_email?: SortOrderInput | SortOrder
    answer_phone?: SortOrderInput | SortOrder
    answer_position?: SortOrderInput | SortOrder
    custom_answers?: SortOrderInput | SortOrder
    food_selected?: SortOrder
    food_quantity?: SortOrder
    food_menu?: SortOrderInput | SortOrder
    food_catering_name?: SortOrderInput | SortOrder
    food_price?: SortOrder
    food_picture?: SortOrderInput | SortOrder
    accommodation_selected?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_type?: SortOrderInput | SortOrder
    accommodation_catering_name?: SortOrderInput | SortOrder
    accommodation_price?: SortOrder
    accommodation_picture?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: EventUserResponseCountOrderByAggregateInput
    _avg?: EventUserResponseAvgOrderByAggregateInput
    _max?: EventUserResponseMaxOrderByAggregateInput
    _min?: EventUserResponseMinOrderByAggregateInput
    _sum?: EventUserResponseSumOrderByAggregateInput
  }

  export type EventUserResponseScalarWhereWithAggregatesInput = {
    AND?: EventUserResponseScalarWhereWithAggregatesInput | EventUserResponseScalarWhereWithAggregatesInput[]
    OR?: EventUserResponseScalarWhereWithAggregatesInput[]
    NOT?: EventUserResponseScalarWhereWithAggregatesInput | EventUserResponseScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"EventUserResponse"> | string
    booking_id?: StringWithAggregatesFilter<"EventUserResponse"> | string
    ticket_id?: StringWithAggregatesFilter<"EventUserResponse"> | string
    group_id?: StringWithAggregatesFilter<"EventUserResponse"> | string
    user_id?: UuidWithAggregatesFilter<"EventUserResponse"> | string
    answer_name?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    answer_email?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    answer_phone?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    answer_position?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    custom_answers?: JsonNullableWithAggregatesFilter<"EventUserResponse">
    food_selected?: BoolWithAggregatesFilter<"EventUserResponse"> | boolean
    food_quantity?: IntWithAggregatesFilter<"EventUserResponse"> | number
    food_menu?: JsonNullableWithAggregatesFilter<"EventUserResponse">
    food_catering_name?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    food_price?: DecimalWithAggregatesFilter<"EventUserResponse"> | Decimal | DecimalJsLike | number | string
    food_picture?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    accommodation_selected?: BoolWithAggregatesFilter<"EventUserResponse"> | boolean
    accommodation_quantity?: IntWithAggregatesFilter<"EventUserResponse"> | number
    accommodation_type?: JsonNullableWithAggregatesFilter<"EventUserResponse">
    accommodation_catering_name?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    accommodation_price?: DecimalWithAggregatesFilter<"EventUserResponse"> | Decimal | DecimalJsLike | number | string
    accommodation_picture?: StringNullableWithAggregatesFilter<"EventUserResponse"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"EventUserResponse"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"EventUserResponse"> | Date | string
  }

  export type BookingCreateInput = {
    id?: string
    bookingId: string
    userId: string
    ticketId: string
    groupId: string
    ticketType: string
    quantity?: number
    pricePerTicket: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax?: Decimal | DecimalJsLike | number | string
    platformFee?: Decimal | DecimalJsLike | number | string
    totalAmount: Decimal | DecimalJsLike | number | string
    currency?: string
    paymentStatus?: $Enums.PaymentStatus
    paymentMethod?: string | null
    razorpayOrderId?: string | null
    razorpayPaymentId?: string | null
    razorpaySignature?: string | null
    bookingStatus?: $Enums.BookingStatus
    userDetails: JsonNullValueInput | InputJsonValue
    eventDetails: JsonNullValueInput | InputJsonValue
    qrCode?: string | null
    qrCodeUrl?: string | null
    isVerified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | string | null
    refundAmount?: Decimal | DecimalJsLike | number | string | null
    refundStatus?: $Enums.RefundStatus | null
    refundProcessedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cancellationCount?: number
    refundId?: string | null
    refundInitiatedAt?: Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: number
    convenienceFee?: Decimal | DecimalJsLike | number | string
    organizerGst?: Decimal | DecimalJsLike | number | string
    platformGst?: Decimal | DecimalJsLike | number | string
    settlementMode?: string
    refundPolicyId?: string
    financialState?: string
    refundReason?: string | null
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: Decimal | DecimalJsLike | number | string
    paymentTransactions?: PaymentTransactionCreateNestedManyWithoutBookingInput
  }

  export type BookingUncheckedCreateInput = {
    id?: string
    bookingId: string
    userId: string
    ticketId: string
    groupId: string
    ticketType: string
    quantity?: number
    pricePerTicket: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax?: Decimal | DecimalJsLike | number | string
    platformFee?: Decimal | DecimalJsLike | number | string
    totalAmount: Decimal | DecimalJsLike | number | string
    currency?: string
    paymentStatus?: $Enums.PaymentStatus
    paymentMethod?: string | null
    razorpayOrderId?: string | null
    razorpayPaymentId?: string | null
    razorpaySignature?: string | null
    bookingStatus?: $Enums.BookingStatus
    userDetails: JsonNullValueInput | InputJsonValue
    eventDetails: JsonNullValueInput | InputJsonValue
    qrCode?: string | null
    qrCodeUrl?: string | null
    isVerified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | string | null
    refundAmount?: Decimal | DecimalJsLike | number | string | null
    refundStatus?: $Enums.RefundStatus | null
    refundProcessedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cancellationCount?: number
    refundId?: string | null
    refundInitiatedAt?: Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: number
    convenienceFee?: Decimal | DecimalJsLike | number | string
    organizerGst?: Decimal | DecimalJsLike | number | string
    platformGst?: Decimal | DecimalJsLike | number | string
    settlementMode?: string
    refundPolicyId?: string
    financialState?: string
    refundReason?: string | null
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: Decimal | DecimalJsLike | number | string
    paymentTransactions?: PaymentTransactionUncheckedCreateNestedManyWithoutBookingInput
  }

  export type BookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    groupId?: StringFieldUpdateOperationsInput | string
    ticketType?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    pricePerTicket?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    paymentMethod?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpaySignature?: NullableStringFieldUpdateOperationsInput | string | null
    bookingStatus?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    userDetails?: JsonNullValueInput | InputJsonValue
    eventDetails?: JsonNullValueInput | InputJsonValue
    qrCode?: NullableStringFieldUpdateOperationsInput | string | null
    qrCodeUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    cancellationReason?: NullableStringFieldUpdateOperationsInput | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refundAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    refundStatus?: NullableEnumRefundStatusFieldUpdateOperationsInput | $Enums.RefundStatus | null
    refundProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cancellationCount?: IntFieldUpdateOperationsInput | number
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    refundInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: IntFieldUpdateOperationsInput | number
    convenienceFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFieldUpdateOperationsInput | string
    refundPolicyId?: StringFieldUpdateOperationsInput | string
    financialState?: StringFieldUpdateOperationsInput | string
    refundReason?: NullableStringFieldUpdateOperationsInput | string | null
    isAdminCancelled?: BoolFieldUpdateOperationsInput | boolean
    isRead?: BoolFieldUpdateOperationsInput | boolean
    food_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentTransactions?: PaymentTransactionUpdateManyWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    groupId?: StringFieldUpdateOperationsInput | string
    ticketType?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    pricePerTicket?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    paymentMethod?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpaySignature?: NullableStringFieldUpdateOperationsInput | string | null
    bookingStatus?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    userDetails?: JsonNullValueInput | InputJsonValue
    eventDetails?: JsonNullValueInput | InputJsonValue
    qrCode?: NullableStringFieldUpdateOperationsInput | string | null
    qrCodeUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    cancellationReason?: NullableStringFieldUpdateOperationsInput | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refundAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    refundStatus?: NullableEnumRefundStatusFieldUpdateOperationsInput | $Enums.RefundStatus | null
    refundProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cancellationCount?: IntFieldUpdateOperationsInput | number
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    refundInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: IntFieldUpdateOperationsInput | number
    convenienceFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFieldUpdateOperationsInput | string
    refundPolicyId?: StringFieldUpdateOperationsInput | string
    financialState?: StringFieldUpdateOperationsInput | string
    refundReason?: NullableStringFieldUpdateOperationsInput | string | null
    isAdminCancelled?: BoolFieldUpdateOperationsInput | boolean
    isRead?: BoolFieldUpdateOperationsInput | boolean
    food_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentTransactions?: PaymentTransactionUncheckedUpdateManyWithoutBookingNestedInput
  }

  export type BookingCreateManyInput = {
    id?: string
    bookingId: string
    userId: string
    ticketId: string
    groupId: string
    ticketType: string
    quantity?: number
    pricePerTicket: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax?: Decimal | DecimalJsLike | number | string
    platformFee?: Decimal | DecimalJsLike | number | string
    totalAmount: Decimal | DecimalJsLike | number | string
    currency?: string
    paymentStatus?: $Enums.PaymentStatus
    paymentMethod?: string | null
    razorpayOrderId?: string | null
    razorpayPaymentId?: string | null
    razorpaySignature?: string | null
    bookingStatus?: $Enums.BookingStatus
    userDetails: JsonNullValueInput | InputJsonValue
    eventDetails: JsonNullValueInput | InputJsonValue
    qrCode?: string | null
    qrCodeUrl?: string | null
    isVerified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | string | null
    refundAmount?: Decimal | DecimalJsLike | number | string | null
    refundStatus?: $Enums.RefundStatus | null
    refundProcessedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cancellationCount?: number
    refundId?: string | null
    refundInitiatedAt?: Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: number
    convenienceFee?: Decimal | DecimalJsLike | number | string
    organizerGst?: Decimal | DecimalJsLike | number | string
    platformGst?: Decimal | DecimalJsLike | number | string
    settlementMode?: string
    refundPolicyId?: string
    financialState?: string
    refundReason?: string | null
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: Decimal | DecimalJsLike | number | string
  }

  export type BookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    groupId?: StringFieldUpdateOperationsInput | string
    ticketType?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    pricePerTicket?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    paymentMethod?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpaySignature?: NullableStringFieldUpdateOperationsInput | string | null
    bookingStatus?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    userDetails?: JsonNullValueInput | InputJsonValue
    eventDetails?: JsonNullValueInput | InputJsonValue
    qrCode?: NullableStringFieldUpdateOperationsInput | string | null
    qrCodeUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    cancellationReason?: NullableStringFieldUpdateOperationsInput | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refundAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    refundStatus?: NullableEnumRefundStatusFieldUpdateOperationsInput | $Enums.RefundStatus | null
    refundProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cancellationCount?: IntFieldUpdateOperationsInput | number
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    refundInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: IntFieldUpdateOperationsInput | number
    convenienceFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFieldUpdateOperationsInput | string
    refundPolicyId?: StringFieldUpdateOperationsInput | string
    financialState?: StringFieldUpdateOperationsInput | string
    refundReason?: NullableStringFieldUpdateOperationsInput | string | null
    isAdminCancelled?: BoolFieldUpdateOperationsInput | boolean
    isRead?: BoolFieldUpdateOperationsInput | boolean
    food_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type BookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    groupId?: StringFieldUpdateOperationsInput | string
    ticketType?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    pricePerTicket?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    paymentMethod?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpaySignature?: NullableStringFieldUpdateOperationsInput | string | null
    bookingStatus?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    userDetails?: JsonNullValueInput | InputJsonValue
    eventDetails?: JsonNullValueInput | InputJsonValue
    qrCode?: NullableStringFieldUpdateOperationsInput | string | null
    qrCodeUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    cancellationReason?: NullableStringFieldUpdateOperationsInput | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refundAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    refundStatus?: NullableEnumRefundStatusFieldUpdateOperationsInput | $Enums.RefundStatus | null
    refundProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cancellationCount?: IntFieldUpdateOperationsInput | number
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    refundInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: IntFieldUpdateOperationsInput | number
    convenienceFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFieldUpdateOperationsInput | string
    refundPolicyId?: StringFieldUpdateOperationsInput | string
    financialState?: StringFieldUpdateOperationsInput | string
    refundReason?: NullableStringFieldUpdateOperationsInput | string | null
    isAdminCancelled?: BoolFieldUpdateOperationsInput | boolean
    isRead?: BoolFieldUpdateOperationsInput | boolean
    food_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type InteractionCreateInput = {
    id?: string
    userId: string
    ticketId: string
    interactionType: $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InteractionUncheckedCreateInput = {
    id?: string
    userId: string
    ticketId: string
    interactionType: $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InteractionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    interactionType?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InteractionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    interactionType?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InteractionCreateManyInput = {
    id?: string
    userId: string
    ticketId: string
    interactionType: $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InteractionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    interactionType?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InteractionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    interactionType?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentTransactionCreateInput = {
    id?: string
    razorpayOrderId: string
    razorpayPaymentId?: string | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status: $Enums.PaymentStatus
    method?: string | null
    bank?: string | null
    wallet?: string | null
    vpa?: string | null
    email?: string | null
    contact?: string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: string | null
    errorDescription?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refundId?: string | null
    booking: BookingCreateNestedOneWithoutPaymentTransactionsInput
  }

  export type PaymentTransactionUncheckedCreateInput = {
    id?: string
    bookingId: string
    razorpayOrderId: string
    razorpayPaymentId?: string | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status: $Enums.PaymentStatus
    method?: string | null
    bank?: string | null
    wallet?: string | null
    vpa?: string | null
    email?: string | null
    contact?: string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: string | null
    errorDescription?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refundId?: string | null
  }

  export type PaymentTransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    booking?: BookingUpdateOneRequiredWithoutPaymentTransactionsNestedInput
  }

  export type PaymentTransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PaymentTransactionCreateManyInput = {
    id?: string
    bookingId: string
    razorpayOrderId: string
    razorpayPaymentId?: string | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status: $Enums.PaymentStatus
    method?: string | null
    bank?: string | null
    wallet?: string | null
    vpa?: string | null
    email?: string | null
    contact?: string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: string | null
    errorDescription?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refundId?: string | null
  }

  export type PaymentTransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PaymentTransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SettlementCreateInput = {
    id?: string
    bookingId: string
    organizationAmount: Decimal | DecimalJsLike | number | string
    platformFee: Decimal | DecimalJsLike | number | string
    status?: $Enums.SettlementStatus
    bankDetails: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ticketId?: string | null
    groupId?: string | null
    totalAmount?: Decimal | DecimalJsLike | number | string | null
    settlementType?: string
    scheduledAt?: Date | string | null
    retryCount?: number
    hostRazorpayAccountId?: string | null
    razorpayTransferId?: string | null
  }

  export type SettlementUncheckedCreateInput = {
    id?: string
    bookingId: string
    organizationAmount: Decimal | DecimalJsLike | number | string
    platformFee: Decimal | DecimalJsLike | number | string
    status?: $Enums.SettlementStatus
    bankDetails: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ticketId?: string | null
    groupId?: string | null
    totalAmount?: Decimal | DecimalJsLike | number | string | null
    settlementType?: string
    scheduledAt?: Date | string | null
    retryCount?: number
    hostRazorpayAccountId?: string | null
    razorpayTransferId?: string | null
  }

  export type SettlementUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    organizationAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusFieldUpdateOperationsInput | $Enums.SettlementStatus
    bankDetails?: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringFieldUpdateOperationsInput | string
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    hostRazorpayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayTransferId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SettlementUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    organizationAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusFieldUpdateOperationsInput | $Enums.SettlementStatus
    bankDetails?: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringFieldUpdateOperationsInput | string
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    hostRazorpayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayTransferId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SettlementCreateManyInput = {
    id?: string
    bookingId: string
    organizationAmount: Decimal | DecimalJsLike | number | string
    platformFee: Decimal | DecimalJsLike | number | string
    status?: $Enums.SettlementStatus
    bankDetails: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ticketId?: string | null
    groupId?: string | null
    totalAmount?: Decimal | DecimalJsLike | number | string | null
    settlementType?: string
    scheduledAt?: Date | string | null
    retryCount?: number
    hostRazorpayAccountId?: string | null
    razorpayTransferId?: string | null
  }

  export type SettlementUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    organizationAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusFieldUpdateOperationsInput | $Enums.SettlementStatus
    bankDetails?: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringFieldUpdateOperationsInput | string
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    hostRazorpayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayTransferId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SettlementUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    organizationAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSettlementStatusFieldUpdateOperationsInput | $Enums.SettlementStatus
    bankDetails?: JsonNullValueInput | InputJsonValue
    razorpayPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    settlementType?: StringFieldUpdateOperationsInput | string
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    hostRazorpayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayTransferId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type HostLinkedAccountCreateInput = {
    id?: string
    group_id: string
    razorpay_account_id: string
    kyc_status?: string
    business_name?: string | null
    email?: string | null
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type HostLinkedAccountUncheckedCreateInput = {
    id?: string
    group_id: string
    razorpay_account_id: string
    kyc_status?: string
    business_name?: string | null
    email?: string | null
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type HostLinkedAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    razorpay_account_id?: StringFieldUpdateOperationsInput | string
    kyc_status?: StringFieldUpdateOperationsInput | string
    business_name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostLinkedAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    razorpay_account_id?: StringFieldUpdateOperationsInput | string
    kyc_status?: StringFieldUpdateOperationsInput | string
    business_name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostLinkedAccountCreateManyInput = {
    id?: string
    group_id: string
    razorpay_account_id: string
    kyc_status?: string
    business_name?: string | null
    email?: string | null
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type HostLinkedAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    razorpay_account_id?: StringFieldUpdateOperationsInput | string
    kyc_status?: StringFieldUpdateOperationsInput | string
    business_name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostLinkedAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    razorpay_account_id?: StringFieldUpdateOperationsInput | string
    kyc_status?: StringFieldUpdateOperationsInput | string
    business_name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerCreateInput = {
    id?: string
    booking_id: string
    ticket_id?: string | null
    group_id?: string | null
    type: string
    debit?: Decimal | DecimalJsLike | number | string | null
    credit?: Decimal | DecimalJsLike | number | string | null
    balance: Decimal | DecimalJsLike | number | string
    reference_id?: string | null
    description?: string | null
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type LedgerUncheckedCreateInput = {
    id?: string
    booking_id: string
    ticket_id?: string | null
    group_id?: string | null
    type: string
    debit?: Decimal | DecimalJsLike | number | string | null
    credit?: Decimal | DecimalJsLike | number | string | null
    balance: Decimal | DecimalJsLike | number | string
    reference_id?: string | null
    description?: string | null
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type LedgerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: NullableStringFieldUpdateOperationsInput | string | null
    group_id?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    debit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    credit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reference_id?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: NullableStringFieldUpdateOperationsInput | string | null
    group_id?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    debit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    credit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reference_id?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerCreateManyInput = {
    id?: string
    booking_id: string
    ticket_id?: string | null
    group_id?: string | null
    type: string
    debit?: Decimal | DecimalJsLike | number | string | null
    credit?: Decimal | DecimalJsLike | number | string | null
    balance: Decimal | DecimalJsLike | number | string
    reference_id?: string | null
    description?: string | null
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type LedgerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: NullableStringFieldUpdateOperationsInput | string | null
    group_id?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    debit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    credit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reference_id?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: NullableStringFieldUpdateOperationsInput | string | null
    group_id?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    debit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    credit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reference_id?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostAdjustmentCreateInput = {
    id?: string
    group_id: string
    booking_id: string
    settlement_id: string
    adjustment_amount: Decimal | DecimalJsLike | number | string
    reason?: string | null
    status?: string
    applied_at?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type HostAdjustmentUncheckedCreateInput = {
    id?: string
    group_id: string
    booking_id: string
    settlement_id: string
    adjustment_amount: Decimal | DecimalJsLike | number | string
    reason?: string | null
    status?: string
    applied_at?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type HostAdjustmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    settlement_id?: StringFieldUpdateOperationsInput | string
    adjustment_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    applied_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostAdjustmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    settlement_id?: StringFieldUpdateOperationsInput | string
    adjustment_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    applied_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostAdjustmentCreateManyInput = {
    id?: string
    group_id: string
    booking_id: string
    settlement_id: string
    adjustment_amount: Decimal | DecimalJsLike | number | string
    reason?: string | null
    status?: string
    applied_at?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type HostAdjustmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    settlement_id?: StringFieldUpdateOperationsInput | string
    adjustment_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    applied_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HostAdjustmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    settlement_id?: StringFieldUpdateOperationsInput | string
    adjustment_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    applied_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrganizerTrustScoreCreateInput = {
    id?: string
    group_id: string
    trust_score?: number
    total_events?: number
    refund_rate?: Decimal | DecimalJsLike | number | string
    completion_rate?: Decimal | DecimalJsLike | number | string
    complaint_rate?: Decimal | DecimalJsLike | number | string
    total_revenue?: Decimal | DecimalJsLike | number | string
    last_updated?: Date | string
  }

  export type OrganizerTrustScoreUncheckedCreateInput = {
    id?: string
    group_id: string
    trust_score?: number
    total_events?: number
    refund_rate?: Decimal | DecimalJsLike | number | string
    completion_rate?: Decimal | DecimalJsLike | number | string
    complaint_rate?: Decimal | DecimalJsLike | number | string
    total_revenue?: Decimal | DecimalJsLike | number | string
    last_updated?: Date | string
  }

  export type OrganizerTrustScoreUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    trust_score?: IntFieldUpdateOperationsInput | number
    total_events?: IntFieldUpdateOperationsInput | number
    refund_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrganizerTrustScoreUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    trust_score?: IntFieldUpdateOperationsInput | number
    total_events?: IntFieldUpdateOperationsInput | number
    refund_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrganizerTrustScoreCreateManyInput = {
    id?: string
    group_id: string
    trust_score?: number
    total_events?: number
    refund_rate?: Decimal | DecimalJsLike | number | string
    completion_rate?: Decimal | DecimalJsLike | number | string
    complaint_rate?: Decimal | DecimalJsLike | number | string
    total_revenue?: Decimal | DecimalJsLike | number | string
    last_updated?: Date | string
  }

  export type OrganizerTrustScoreUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    trust_score?: IntFieldUpdateOperationsInput | number
    total_events?: IntFieldUpdateOperationsInput | number
    refund_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrganizerTrustScoreUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    trust_score?: IntFieldUpdateOperationsInput | number
    total_events?: IntFieldUpdateOperationsInput | number
    refund_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completion_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    complaint_rate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total_revenue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    last_updated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventUserResponseCreateInput = {
    id?: string
    booking_id: string
    ticket_id: string
    group_id: string
    user_id: string
    answer_name?: string | null
    answer_email?: string | null
    answer_phone?: string | null
    answer_position?: string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: boolean
    food_quantity?: number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: string | null
    food_price?: Decimal | DecimalJsLike | number | string
    food_picture?: string | null
    accommodation_selected?: boolean
    accommodation_quantity?: number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: string | null
    accommodation_price?: Decimal | DecimalJsLike | number | string
    accommodation_picture?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type EventUserResponseUncheckedCreateInput = {
    id?: string
    booking_id: string
    ticket_id: string
    group_id: string
    user_id: string
    answer_name?: string | null
    answer_email?: string | null
    answer_phone?: string | null
    answer_position?: string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: boolean
    food_quantity?: number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: string | null
    food_price?: Decimal | DecimalJsLike | number | string
    food_picture?: string | null
    accommodation_selected?: boolean
    accommodation_quantity?: number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: string | null
    accommodation_price?: Decimal | DecimalJsLike | number | string
    accommodation_picture?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type EventUserResponseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    answer_name?: NullableStringFieldUpdateOperationsInput | string | null
    answer_email?: NullableStringFieldUpdateOperationsInput | string | null
    answer_phone?: NullableStringFieldUpdateOperationsInput | string | null
    answer_position?: NullableStringFieldUpdateOperationsInput | string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: BoolFieldUpdateOperationsInput | boolean
    food_quantity?: IntFieldUpdateOperationsInput | number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    food_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    food_picture?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_selected?: BoolFieldUpdateOperationsInput | boolean
    accommodation_quantity?: IntFieldUpdateOperationsInput | number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_picture?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventUserResponseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    answer_name?: NullableStringFieldUpdateOperationsInput | string | null
    answer_email?: NullableStringFieldUpdateOperationsInput | string | null
    answer_phone?: NullableStringFieldUpdateOperationsInput | string | null
    answer_position?: NullableStringFieldUpdateOperationsInput | string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: BoolFieldUpdateOperationsInput | boolean
    food_quantity?: IntFieldUpdateOperationsInput | number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    food_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    food_picture?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_selected?: BoolFieldUpdateOperationsInput | boolean
    accommodation_quantity?: IntFieldUpdateOperationsInput | number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_picture?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventUserResponseCreateManyInput = {
    id?: string
    booking_id: string
    ticket_id: string
    group_id: string
    user_id: string
    answer_name?: string | null
    answer_email?: string | null
    answer_phone?: string | null
    answer_position?: string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: boolean
    food_quantity?: number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: string | null
    food_price?: Decimal | DecimalJsLike | number | string
    food_picture?: string | null
    accommodation_selected?: boolean
    accommodation_quantity?: number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: string | null
    accommodation_price?: Decimal | DecimalJsLike | number | string
    accommodation_picture?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type EventUserResponseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    answer_name?: NullableStringFieldUpdateOperationsInput | string | null
    answer_email?: NullableStringFieldUpdateOperationsInput | string | null
    answer_phone?: NullableStringFieldUpdateOperationsInput | string | null
    answer_position?: NullableStringFieldUpdateOperationsInput | string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: BoolFieldUpdateOperationsInput | boolean
    food_quantity?: IntFieldUpdateOperationsInput | number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    food_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    food_picture?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_selected?: BoolFieldUpdateOperationsInput | boolean
    accommodation_quantity?: IntFieldUpdateOperationsInput | number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_picture?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventUserResponseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    booking_id?: StringFieldUpdateOperationsInput | string
    ticket_id?: StringFieldUpdateOperationsInput | string
    group_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    answer_name?: NullableStringFieldUpdateOperationsInput | string | null
    answer_email?: NullableStringFieldUpdateOperationsInput | string | null
    answer_phone?: NullableStringFieldUpdateOperationsInput | string | null
    answer_position?: NullableStringFieldUpdateOperationsInput | string | null
    custom_answers?: NullableJsonNullValueInput | InputJsonValue
    food_selected?: BoolFieldUpdateOperationsInput | boolean
    food_quantity?: IntFieldUpdateOperationsInput | number
    food_menu?: NullableJsonNullValueInput | InputJsonValue
    food_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    food_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    food_picture?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_selected?: BoolFieldUpdateOperationsInput | boolean
    accommodation_quantity?: IntFieldUpdateOperationsInput | number
    accommodation_type?: NullableJsonNullValueInput | InputJsonValue
    accommodation_catering_name?: NullableStringFieldUpdateOperationsInput | string | null
    accommodation_price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_picture?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type EnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type EnumRefundStatusNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.RefundStatus | EnumRefundStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumRefundStatusNullableFilter<$PrismaModel> | $Enums.RefundStatus | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type PaymentTransactionListRelationFilter = {
    every?: PaymentTransactionWhereInput
    some?: PaymentTransactionWhereInput
    none?: PaymentTransactionWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PaymentTransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BookingCountOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    ticketType?: SortOrder
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    currency?: SortOrder
    paymentStatus?: SortOrder
    paymentMethod?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrder
    razorpaySignature?: SortOrder
    bookingStatus?: SortOrder
    userDetails?: SortOrder
    eventDetails?: SortOrder
    qrCode?: SortOrder
    qrCodeUrl?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrder
    verifiedBy?: SortOrder
    cancellationReason?: SortOrder
    cancelledAt?: SortOrder
    refundAmount?: SortOrder
    refundStatus?: SortOrder
    refundProcessedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    cancellationCount?: SortOrder
    refundId?: SortOrder
    refundInitiatedAt?: SortOrder
    seatDetails?: SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    settlementMode?: SortOrder
    refundPolicyId?: SortOrder
    financialState?: SortOrder
    refundReason?: SortOrder
    isAdminCancelled?: SortOrder
    isRead?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
  }

  export type BookingAvgOrderByAggregateInput = {
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    refundAmount?: SortOrder
    cancellationCount?: SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
  }

  export type BookingMaxOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    ticketType?: SortOrder
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    currency?: SortOrder
    paymentStatus?: SortOrder
    paymentMethod?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrder
    razorpaySignature?: SortOrder
    bookingStatus?: SortOrder
    qrCode?: SortOrder
    qrCodeUrl?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrder
    verifiedBy?: SortOrder
    cancellationReason?: SortOrder
    cancelledAt?: SortOrder
    refundAmount?: SortOrder
    refundStatus?: SortOrder
    refundProcessedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    cancellationCount?: SortOrder
    refundId?: SortOrder
    refundInitiatedAt?: SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    settlementMode?: SortOrder
    refundPolicyId?: SortOrder
    financialState?: SortOrder
    refundReason?: SortOrder
    isAdminCancelled?: SortOrder
    isRead?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
  }

  export type BookingMinOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    ticketType?: SortOrder
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    currency?: SortOrder
    paymentStatus?: SortOrder
    paymentMethod?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrder
    razorpaySignature?: SortOrder
    bookingStatus?: SortOrder
    qrCode?: SortOrder
    qrCodeUrl?: SortOrder
    isVerified?: SortOrder
    verifiedAt?: SortOrder
    verifiedBy?: SortOrder
    cancellationReason?: SortOrder
    cancelledAt?: SortOrder
    refundAmount?: SortOrder
    refundStatus?: SortOrder
    refundProcessedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    cancellationCount?: SortOrder
    refundId?: SortOrder
    refundInitiatedAt?: SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    settlementMode?: SortOrder
    refundPolicyId?: SortOrder
    financialState?: SortOrder
    refundReason?: SortOrder
    isAdminCancelled?: SortOrder
    isRead?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
  }

  export type BookingSumOrderByAggregateInput = {
    quantity?: SortOrder
    pricePerTicket?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    refundAmount?: SortOrder
    cancellationCount?: SortOrder
    refund_retry_count?: SortOrder
    convenienceFee?: SortOrder
    organizerGst?: SortOrder
    platformGst?: SortOrder
    food_addon_amount?: SortOrder
    accommodation_addon_amount?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type EnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type EnumRefundStatusNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RefundStatus | EnumRefundStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumRefundStatusNullableWithAggregatesFilter<$PrismaModel> | $Enums.RefundStatus | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumRefundStatusNullableFilter<$PrismaModel>
    _max?: NestedEnumRefundStatusNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumInteractionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeFilter<$PrismaModel> | $Enums.InteractionType
  }

  export type InteractionUserIdTicketIdInteractionTypeCompoundUniqueInput = {
    userId: string
    ticketId: string
    interactionType: $Enums.InteractionType
  }

  export type InteractionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    interactionType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InteractionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    interactionType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InteractionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    ticketId?: SortOrder
    interactionType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumInteractionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeWithAggregatesFilter<$PrismaModel> | $Enums.InteractionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInteractionTypeFilter<$PrismaModel>
    _max?: NestedEnumInteractionTypeFilter<$PrismaModel>
  }

  export type BookingScalarRelationFilter = {
    is?: BookingWhereInput
    isNot?: BookingWhereInput
  }

  export type PaymentTransactionCountOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    method?: SortOrder
    bank?: SortOrder
    wallet?: SortOrder
    vpa?: SortOrder
    email?: SortOrder
    contact?: SortOrder
    webhookData?: SortOrder
    errorCode?: SortOrder
    errorDescription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    refundId?: SortOrder
  }

  export type PaymentTransactionAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type PaymentTransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    method?: SortOrder
    bank?: SortOrder
    wallet?: SortOrder
    vpa?: SortOrder
    email?: SortOrder
    contact?: SortOrder
    errorCode?: SortOrder
    errorDescription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    refundId?: SortOrder
  }

  export type PaymentTransactionMinOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    razorpayOrderId?: SortOrder
    razorpayPaymentId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    method?: SortOrder
    bank?: SortOrder
    wallet?: SortOrder
    vpa?: SortOrder
    email?: SortOrder
    contact?: SortOrder
    errorCode?: SortOrder
    errorDescription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    refundId?: SortOrder
  }

  export type PaymentTransactionSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type EnumSettlementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SettlementStatus | EnumSettlementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSettlementStatusFilter<$PrismaModel> | $Enums.SettlementStatus
  }

  export type SettlementCountOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    status?: SortOrder
    bankDetails?: SortOrder
    razorpayPayoutId?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    totalAmount?: SortOrder
    settlementType?: SortOrder
    scheduledAt?: SortOrder
    retryCount?: SortOrder
    hostRazorpayAccountId?: SortOrder
    razorpayTransferId?: SortOrder
  }

  export type SettlementAvgOrderByAggregateInput = {
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    retryCount?: SortOrder
  }

  export type SettlementMaxOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    status?: SortOrder
    razorpayPayoutId?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    totalAmount?: SortOrder
    settlementType?: SortOrder
    scheduledAt?: SortOrder
    retryCount?: SortOrder
    hostRazorpayAccountId?: SortOrder
    razorpayTransferId?: SortOrder
  }

  export type SettlementMinOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    status?: SortOrder
    razorpayPayoutId?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticketId?: SortOrder
    groupId?: SortOrder
    totalAmount?: SortOrder
    settlementType?: SortOrder
    scheduledAt?: SortOrder
    retryCount?: SortOrder
    hostRazorpayAccountId?: SortOrder
    razorpayTransferId?: SortOrder
  }

  export type SettlementSumOrderByAggregateInput = {
    organizationAmount?: SortOrder
    platformFee?: SortOrder
    totalAmount?: SortOrder
    retryCount?: SortOrder
  }

  export type EnumSettlementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SettlementStatus | EnumSettlementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSettlementStatusWithAggregatesFilter<$PrismaModel> | $Enums.SettlementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSettlementStatusFilter<$PrismaModel>
    _max?: NestedEnumSettlementStatusFilter<$PrismaModel>
  }

  export type HostLinkedAccountCountOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    razorpay_account_id?: SortOrder
    kyc_status?: SortOrder
    business_name?: SortOrder
    email?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostLinkedAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    razorpay_account_id?: SortOrder
    kyc_status?: SortOrder
    business_name?: SortOrder
    email?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostLinkedAccountMinOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    razorpay_account_id?: SortOrder
    kyc_status?: SortOrder
    business_name?: SortOrder
    email?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type LedgerCountOrderByAggregateInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    type?: SortOrder
    debit?: SortOrder
    credit?: SortOrder
    balance?: SortOrder
    reference_id?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type LedgerAvgOrderByAggregateInput = {
    debit?: SortOrder
    credit?: SortOrder
    balance?: SortOrder
  }

  export type LedgerMaxOrderByAggregateInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    type?: SortOrder
    debit?: SortOrder
    credit?: SortOrder
    balance?: SortOrder
    reference_id?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type LedgerMinOrderByAggregateInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    type?: SortOrder
    debit?: SortOrder
    credit?: SortOrder
    balance?: SortOrder
    reference_id?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type LedgerSumOrderByAggregateInput = {
    debit?: SortOrder
    credit?: SortOrder
    balance?: SortOrder
  }

  export type HostAdjustmentCountOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    booking_id?: SortOrder
    settlement_id?: SortOrder
    adjustment_amount?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    applied_at?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostAdjustmentAvgOrderByAggregateInput = {
    adjustment_amount?: SortOrder
  }

  export type HostAdjustmentMaxOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    booking_id?: SortOrder
    settlement_id?: SortOrder
    adjustment_amount?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    applied_at?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostAdjustmentMinOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    booking_id?: SortOrder
    settlement_id?: SortOrder
    adjustment_amount?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    applied_at?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type HostAdjustmentSumOrderByAggregateInput = {
    adjustment_amount?: SortOrder
  }

  export type OrganizerTrustScoreCountOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
    last_updated?: SortOrder
  }

  export type OrganizerTrustScoreAvgOrderByAggregateInput = {
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
  }

  export type OrganizerTrustScoreMaxOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
    last_updated?: SortOrder
  }

  export type OrganizerTrustScoreMinOrderByAggregateInput = {
    id?: SortOrder
    group_id?: SortOrder
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
    last_updated?: SortOrder
  }

  export type OrganizerTrustScoreSumOrderByAggregateInput = {
    trust_score?: SortOrder
    total_events?: SortOrder
    refund_rate?: SortOrder
    completion_rate?: SortOrder
    complaint_rate?: SortOrder
    total_revenue?: SortOrder
  }

  export type EventUserResponseCountOrderByAggregateInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    user_id?: SortOrder
    answer_name?: SortOrder
    answer_email?: SortOrder
    answer_phone?: SortOrder
    answer_position?: SortOrder
    custom_answers?: SortOrder
    food_selected?: SortOrder
    food_quantity?: SortOrder
    food_menu?: SortOrder
    food_catering_name?: SortOrder
    food_price?: SortOrder
    food_picture?: SortOrder
    accommodation_selected?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_type?: SortOrder
    accommodation_catering_name?: SortOrder
    accommodation_price?: SortOrder
    accommodation_picture?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type EventUserResponseAvgOrderByAggregateInput = {
    food_quantity?: SortOrder
    food_price?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_price?: SortOrder
  }

  export type EventUserResponseMaxOrderByAggregateInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    user_id?: SortOrder
    answer_name?: SortOrder
    answer_email?: SortOrder
    answer_phone?: SortOrder
    answer_position?: SortOrder
    food_selected?: SortOrder
    food_quantity?: SortOrder
    food_catering_name?: SortOrder
    food_price?: SortOrder
    food_picture?: SortOrder
    accommodation_selected?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_catering_name?: SortOrder
    accommodation_price?: SortOrder
    accommodation_picture?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type EventUserResponseMinOrderByAggregateInput = {
    id?: SortOrder
    booking_id?: SortOrder
    ticket_id?: SortOrder
    group_id?: SortOrder
    user_id?: SortOrder
    answer_name?: SortOrder
    answer_email?: SortOrder
    answer_phone?: SortOrder
    answer_position?: SortOrder
    food_selected?: SortOrder
    food_quantity?: SortOrder
    food_catering_name?: SortOrder
    food_price?: SortOrder
    food_picture?: SortOrder
    accommodation_selected?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_catering_name?: SortOrder
    accommodation_price?: SortOrder
    accommodation_picture?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type EventUserResponseSumOrderByAggregateInput = {
    food_quantity?: SortOrder
    food_price?: SortOrder
    accommodation_quantity?: SortOrder
    accommodation_price?: SortOrder
  }

  export type PaymentTransactionCreateNestedManyWithoutBookingInput = {
    create?: XOR<PaymentTransactionCreateWithoutBookingInput, PaymentTransactionUncheckedCreateWithoutBookingInput> | PaymentTransactionCreateWithoutBookingInput[] | PaymentTransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: PaymentTransactionCreateOrConnectWithoutBookingInput | PaymentTransactionCreateOrConnectWithoutBookingInput[]
    createMany?: PaymentTransactionCreateManyBookingInputEnvelope
    connect?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
  }

  export type PaymentTransactionUncheckedCreateNestedManyWithoutBookingInput = {
    create?: XOR<PaymentTransactionCreateWithoutBookingInput, PaymentTransactionUncheckedCreateWithoutBookingInput> | PaymentTransactionCreateWithoutBookingInput[] | PaymentTransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: PaymentTransactionCreateOrConnectWithoutBookingInput | PaymentTransactionCreateOrConnectWithoutBookingInput[]
    createMany?: PaymentTransactionCreateManyBookingInputEnvelope
    connect?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type EnumPaymentStatusFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumBookingStatusFieldUpdateOperationsInput = {
    set?: $Enums.BookingStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableEnumRefundStatusFieldUpdateOperationsInput = {
    set?: $Enums.RefundStatus | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PaymentTransactionUpdateManyWithoutBookingNestedInput = {
    create?: XOR<PaymentTransactionCreateWithoutBookingInput, PaymentTransactionUncheckedCreateWithoutBookingInput> | PaymentTransactionCreateWithoutBookingInput[] | PaymentTransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: PaymentTransactionCreateOrConnectWithoutBookingInput | PaymentTransactionCreateOrConnectWithoutBookingInput[]
    upsert?: PaymentTransactionUpsertWithWhereUniqueWithoutBookingInput | PaymentTransactionUpsertWithWhereUniqueWithoutBookingInput[]
    createMany?: PaymentTransactionCreateManyBookingInputEnvelope
    set?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    disconnect?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    delete?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    connect?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    update?: PaymentTransactionUpdateWithWhereUniqueWithoutBookingInput | PaymentTransactionUpdateWithWhereUniqueWithoutBookingInput[]
    updateMany?: PaymentTransactionUpdateManyWithWhereWithoutBookingInput | PaymentTransactionUpdateManyWithWhereWithoutBookingInput[]
    deleteMany?: PaymentTransactionScalarWhereInput | PaymentTransactionScalarWhereInput[]
  }

  export type PaymentTransactionUncheckedUpdateManyWithoutBookingNestedInput = {
    create?: XOR<PaymentTransactionCreateWithoutBookingInput, PaymentTransactionUncheckedCreateWithoutBookingInput> | PaymentTransactionCreateWithoutBookingInput[] | PaymentTransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: PaymentTransactionCreateOrConnectWithoutBookingInput | PaymentTransactionCreateOrConnectWithoutBookingInput[]
    upsert?: PaymentTransactionUpsertWithWhereUniqueWithoutBookingInput | PaymentTransactionUpsertWithWhereUniqueWithoutBookingInput[]
    createMany?: PaymentTransactionCreateManyBookingInputEnvelope
    set?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    disconnect?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    delete?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    connect?: PaymentTransactionWhereUniqueInput | PaymentTransactionWhereUniqueInput[]
    update?: PaymentTransactionUpdateWithWhereUniqueWithoutBookingInput | PaymentTransactionUpdateWithWhereUniqueWithoutBookingInput[]
    updateMany?: PaymentTransactionUpdateManyWithWhereWithoutBookingInput | PaymentTransactionUpdateManyWithWhereWithoutBookingInput[]
    deleteMany?: PaymentTransactionScalarWhereInput | PaymentTransactionScalarWhereInput[]
  }

  export type EnumInteractionTypeFieldUpdateOperationsInput = {
    set?: $Enums.InteractionType
  }

  export type BookingCreateNestedOneWithoutPaymentTransactionsInput = {
    create?: XOR<BookingCreateWithoutPaymentTransactionsInput, BookingUncheckedCreateWithoutPaymentTransactionsInput>
    connectOrCreate?: BookingCreateOrConnectWithoutPaymentTransactionsInput
    connect?: BookingWhereUniqueInput
  }

  export type BookingUpdateOneRequiredWithoutPaymentTransactionsNestedInput = {
    create?: XOR<BookingCreateWithoutPaymentTransactionsInput, BookingUncheckedCreateWithoutPaymentTransactionsInput>
    connectOrCreate?: BookingCreateOrConnectWithoutPaymentTransactionsInput
    upsert?: BookingUpsertWithoutPaymentTransactionsInput
    connect?: BookingWhereUniqueInput
    update?: XOR<XOR<BookingUpdateToOneWithWhereWithoutPaymentTransactionsInput, BookingUpdateWithoutPaymentTransactionsInput>, BookingUncheckedUpdateWithoutPaymentTransactionsInput>
  }

  export type EnumSettlementStatusFieldUpdateOperationsInput = {
    set?: $Enums.SettlementStatus
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedEnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedEnumRefundStatusNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.RefundStatus | EnumRefundStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumRefundStatusNullableFilter<$PrismaModel> | $Enums.RefundStatus | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedEnumRefundStatusNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RefundStatus | EnumRefundStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.RefundStatus[] | ListEnumRefundStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumRefundStatusNullableWithAggregatesFilter<$PrismaModel> | $Enums.RefundStatus | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumRefundStatusNullableFilter<$PrismaModel>
    _max?: NestedEnumRefundStatusNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumInteractionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeFilter<$PrismaModel> | $Enums.InteractionType
  }

  export type NestedEnumInteractionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeWithAggregatesFilter<$PrismaModel> | $Enums.InteractionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInteractionTypeFilter<$PrismaModel>
    _max?: NestedEnumInteractionTypeFilter<$PrismaModel>
  }

  export type NestedEnumSettlementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SettlementStatus | EnumSettlementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSettlementStatusFilter<$PrismaModel> | $Enums.SettlementStatus
  }

  export type NestedEnumSettlementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SettlementStatus | EnumSettlementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SettlementStatus[] | ListEnumSettlementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSettlementStatusWithAggregatesFilter<$PrismaModel> | $Enums.SettlementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSettlementStatusFilter<$PrismaModel>
    _max?: NestedEnumSettlementStatusFilter<$PrismaModel>
  }

  export type PaymentTransactionCreateWithoutBookingInput = {
    id?: string
    razorpayOrderId: string
    razorpayPaymentId?: string | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status: $Enums.PaymentStatus
    method?: string | null
    bank?: string | null
    wallet?: string | null
    vpa?: string | null
    email?: string | null
    contact?: string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: string | null
    errorDescription?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refundId?: string | null
  }

  export type PaymentTransactionUncheckedCreateWithoutBookingInput = {
    id?: string
    razorpayOrderId: string
    razorpayPaymentId?: string | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status: $Enums.PaymentStatus
    method?: string | null
    bank?: string | null
    wallet?: string | null
    vpa?: string | null
    email?: string | null
    contact?: string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: string | null
    errorDescription?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refundId?: string | null
  }

  export type PaymentTransactionCreateOrConnectWithoutBookingInput = {
    where: PaymentTransactionWhereUniqueInput
    create: XOR<PaymentTransactionCreateWithoutBookingInput, PaymentTransactionUncheckedCreateWithoutBookingInput>
  }

  export type PaymentTransactionCreateManyBookingInputEnvelope = {
    data: PaymentTransactionCreateManyBookingInput | PaymentTransactionCreateManyBookingInput[]
    skipDuplicates?: boolean
  }

  export type PaymentTransactionUpsertWithWhereUniqueWithoutBookingInput = {
    where: PaymentTransactionWhereUniqueInput
    update: XOR<PaymentTransactionUpdateWithoutBookingInput, PaymentTransactionUncheckedUpdateWithoutBookingInput>
    create: XOR<PaymentTransactionCreateWithoutBookingInput, PaymentTransactionUncheckedCreateWithoutBookingInput>
  }

  export type PaymentTransactionUpdateWithWhereUniqueWithoutBookingInput = {
    where: PaymentTransactionWhereUniqueInput
    data: XOR<PaymentTransactionUpdateWithoutBookingInput, PaymentTransactionUncheckedUpdateWithoutBookingInput>
  }

  export type PaymentTransactionUpdateManyWithWhereWithoutBookingInput = {
    where: PaymentTransactionScalarWhereInput
    data: XOR<PaymentTransactionUpdateManyMutationInput, PaymentTransactionUncheckedUpdateManyWithoutBookingInput>
  }

  export type PaymentTransactionScalarWhereInput = {
    AND?: PaymentTransactionScalarWhereInput | PaymentTransactionScalarWhereInput[]
    OR?: PaymentTransactionScalarWhereInput[]
    NOT?: PaymentTransactionScalarWhereInput | PaymentTransactionScalarWhereInput[]
    id?: UuidFilter<"PaymentTransaction"> | string
    bookingId?: UuidFilter<"PaymentTransaction"> | string
    razorpayOrderId?: StringFilter<"PaymentTransaction"> | string
    razorpayPaymentId?: StringNullableFilter<"PaymentTransaction"> | string | null
    amount?: DecimalFilter<"PaymentTransaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"PaymentTransaction"> | string
    status?: EnumPaymentStatusFilter<"PaymentTransaction"> | $Enums.PaymentStatus
    method?: StringNullableFilter<"PaymentTransaction"> | string | null
    bank?: StringNullableFilter<"PaymentTransaction"> | string | null
    wallet?: StringNullableFilter<"PaymentTransaction"> | string | null
    vpa?: StringNullableFilter<"PaymentTransaction"> | string | null
    email?: StringNullableFilter<"PaymentTransaction"> | string | null
    contact?: StringNullableFilter<"PaymentTransaction"> | string | null
    webhookData?: JsonNullableFilter<"PaymentTransaction">
    errorCode?: StringNullableFilter<"PaymentTransaction"> | string | null
    errorDescription?: StringNullableFilter<"PaymentTransaction"> | string | null
    createdAt?: DateTimeFilter<"PaymentTransaction"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentTransaction"> | Date | string
    refundId?: StringNullableFilter<"PaymentTransaction"> | string | null
  }

  export type BookingCreateWithoutPaymentTransactionsInput = {
    id?: string
    bookingId: string
    userId: string
    ticketId: string
    groupId: string
    ticketType: string
    quantity?: number
    pricePerTicket: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax?: Decimal | DecimalJsLike | number | string
    platformFee?: Decimal | DecimalJsLike | number | string
    totalAmount: Decimal | DecimalJsLike | number | string
    currency?: string
    paymentStatus?: $Enums.PaymentStatus
    paymentMethod?: string | null
    razorpayOrderId?: string | null
    razorpayPaymentId?: string | null
    razorpaySignature?: string | null
    bookingStatus?: $Enums.BookingStatus
    userDetails: JsonNullValueInput | InputJsonValue
    eventDetails: JsonNullValueInput | InputJsonValue
    qrCode?: string | null
    qrCodeUrl?: string | null
    isVerified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | string | null
    refundAmount?: Decimal | DecimalJsLike | number | string | null
    refundStatus?: $Enums.RefundStatus | null
    refundProcessedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cancellationCount?: number
    refundId?: string | null
    refundInitiatedAt?: Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: number
    convenienceFee?: Decimal | DecimalJsLike | number | string
    organizerGst?: Decimal | DecimalJsLike | number | string
    platformGst?: Decimal | DecimalJsLike | number | string
    settlementMode?: string
    refundPolicyId?: string
    financialState?: string
    refundReason?: string | null
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: Decimal | DecimalJsLike | number | string
  }

  export type BookingUncheckedCreateWithoutPaymentTransactionsInput = {
    id?: string
    bookingId: string
    userId: string
    ticketId: string
    groupId: string
    ticketType: string
    quantity?: number
    pricePerTicket: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax?: Decimal | DecimalJsLike | number | string
    platformFee?: Decimal | DecimalJsLike | number | string
    totalAmount: Decimal | DecimalJsLike | number | string
    currency?: string
    paymentStatus?: $Enums.PaymentStatus
    paymentMethod?: string | null
    razorpayOrderId?: string | null
    razorpayPaymentId?: string | null
    razorpaySignature?: string | null
    bookingStatus?: $Enums.BookingStatus
    userDetails: JsonNullValueInput | InputJsonValue
    eventDetails: JsonNullValueInput | InputJsonValue
    qrCode?: string | null
    qrCodeUrl?: string | null
    isVerified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | string | null
    refundAmount?: Decimal | DecimalJsLike | number | string | null
    refundStatus?: $Enums.RefundStatus | null
    refundProcessedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    cancellationCount?: number
    refundId?: string | null
    refundInitiatedAt?: Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: number
    convenienceFee?: Decimal | DecimalJsLike | number | string
    organizerGst?: Decimal | DecimalJsLike | number | string
    platformGst?: Decimal | DecimalJsLike | number | string
    settlementMode?: string
    refundPolicyId?: string
    financialState?: string
    refundReason?: string | null
    isAdminCancelled?: boolean
    isRead?: boolean
    food_addon_amount?: Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: Decimal | DecimalJsLike | number | string
  }

  export type BookingCreateOrConnectWithoutPaymentTransactionsInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutPaymentTransactionsInput, BookingUncheckedCreateWithoutPaymentTransactionsInput>
  }

  export type BookingUpsertWithoutPaymentTransactionsInput = {
    update: XOR<BookingUpdateWithoutPaymentTransactionsInput, BookingUncheckedUpdateWithoutPaymentTransactionsInput>
    create: XOR<BookingCreateWithoutPaymentTransactionsInput, BookingUncheckedCreateWithoutPaymentTransactionsInput>
    where?: BookingWhereInput
  }

  export type BookingUpdateToOneWithWhereWithoutPaymentTransactionsInput = {
    where?: BookingWhereInput
    data: XOR<BookingUpdateWithoutPaymentTransactionsInput, BookingUncheckedUpdateWithoutPaymentTransactionsInput>
  }

  export type BookingUpdateWithoutPaymentTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    groupId?: StringFieldUpdateOperationsInput | string
    ticketType?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    pricePerTicket?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    paymentMethod?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpaySignature?: NullableStringFieldUpdateOperationsInput | string | null
    bookingStatus?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    userDetails?: JsonNullValueInput | InputJsonValue
    eventDetails?: JsonNullValueInput | InputJsonValue
    qrCode?: NullableStringFieldUpdateOperationsInput | string | null
    qrCodeUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    cancellationReason?: NullableStringFieldUpdateOperationsInput | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refundAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    refundStatus?: NullableEnumRefundStatusFieldUpdateOperationsInput | $Enums.RefundStatus | null
    refundProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cancellationCount?: IntFieldUpdateOperationsInput | number
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    refundInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: IntFieldUpdateOperationsInput | number
    convenienceFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFieldUpdateOperationsInput | string
    refundPolicyId?: StringFieldUpdateOperationsInput | string
    financialState?: StringFieldUpdateOperationsInput | string
    refundReason?: NullableStringFieldUpdateOperationsInput | string | null
    isAdminCancelled?: BoolFieldUpdateOperationsInput | boolean
    isRead?: BoolFieldUpdateOperationsInput | boolean
    food_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type BookingUncheckedUpdateWithoutPaymentTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    groupId?: StringFieldUpdateOperationsInput | string
    ticketType?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    pricePerTicket?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    paymentMethod?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    razorpaySignature?: NullableStringFieldUpdateOperationsInput | string | null
    bookingStatus?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    userDetails?: JsonNullValueInput | InputJsonValue
    eventDetails?: JsonNullValueInput | InputJsonValue
    qrCode?: NullableStringFieldUpdateOperationsInput | string | null
    qrCodeUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    cancellationReason?: NullableStringFieldUpdateOperationsInput | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refundAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    refundStatus?: NullableEnumRefundStatusFieldUpdateOperationsInput | $Enums.RefundStatus | null
    refundProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    cancellationCount?: IntFieldUpdateOperationsInput | number
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
    refundInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    seatDetails?: NullableJsonNullValueInput | InputJsonValue
    refund_retry_count?: IntFieldUpdateOperationsInput | number
    convenienceFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    organizerGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    platformGst?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    settlementMode?: StringFieldUpdateOperationsInput | string
    refundPolicyId?: StringFieldUpdateOperationsInput | string
    financialState?: StringFieldUpdateOperationsInput | string
    refundReason?: NullableStringFieldUpdateOperationsInput | string | null
    isAdminCancelled?: BoolFieldUpdateOperationsInput | boolean
    isRead?: BoolFieldUpdateOperationsInput | boolean
    food_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    accommodation_addon_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PaymentTransactionCreateManyBookingInput = {
    id?: string
    razorpayOrderId: string
    razorpayPaymentId?: string | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status: $Enums.PaymentStatus
    method?: string | null
    bank?: string | null
    wallet?: string | null
    vpa?: string | null
    email?: string | null
    contact?: string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: string | null
    errorDescription?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refundId?: string | null
  }

  export type PaymentTransactionUpdateWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PaymentTransactionUncheckedUpdateWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PaymentTransactionUncheckedUpdateManyWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    razorpayOrderId?: StringFieldUpdateOperationsInput | string
    razorpayPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    method?: NullableStringFieldUpdateOperationsInput | string | null
    bank?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: NullableStringFieldUpdateOperationsInput | string | null
    vpa?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    contact?: NullableStringFieldUpdateOperationsInput | string | null
    webhookData?: NullableJsonNullValueInput | InputJsonValue
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    errorDescription?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refundId?: NullableStringFieldUpdateOperationsInput | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}