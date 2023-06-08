import { PrismaClient } from "@prisma/client";

export type Actions = "manage" | "create" | "read" | "update" | "delete";

type Models = {
  [key in keyof PrismaClient as Exclude<key, `$${string}`>]: PrismaClient[key];
};

export type Entities = {
  [key in keyof Models]: Models[key] extends {
    findUnique: (args: any) => infer PromisedEntity;
  }
    ? Awaited<PromisedEntity>
    : never;
};

export type EntitiesNames = keyof Entities;

type WrappersFunction = <EntityName extends EntitiesNames>(
  action: Actions,
  resourceName: EntityName,
  resource?: Partial<Entities[EntityName]>
) => any;

export type RulesFunction<JwtPayload> = (
  can: WrappersFunction,
  cannot: WrappersFunction,
  user: JwtPayload
) => void;

export interface AbilityCheckerBuilderInterface<JwtPayload> {
  buildFor(user: JwtPayload);
}

export type AbilityMetadata = {
  action: Actions;
  resourceName: EntitiesNames;
  possession: "own" | "any";
  resourceParamName?: string;
}

export type ModuleOptions<JwtPayload> = {
  PrismaModule:any,
  rulesFunction: RulesFunction<JwtPayload>,
  userProperty?: string
}