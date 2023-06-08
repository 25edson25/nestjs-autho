import { AbilityBuilder } from "@casl/ability";
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

export type WrappersFunction = <EntityName extends EntitiesNames>(
  action: Actions,
  resourceName: EntityName,
  resource?: Partial<Entities[EntityName]>
) => any;
