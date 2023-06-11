import { AbilityBuilder, PureAbility } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
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

type CanReturn = ReturnType<AbilityBuilder<PureAbility>['can']>;
type CannotReturn = ReturnType<AbilityBuilder<PureAbility>['cannot']>;

type CanWrapper = <EntityName extends EntitiesNames>(
  action: Actions,
  resourceName: EntityName,
  resource?: Partial<Entities[EntityName]>
) => CanReturn;

type CannotWrapper = <EntityName extends EntitiesNames>(
  action: Actions,
  resourceName: EntityName,
  resource?: Partial<Entities[EntityName]>
) => CannotReturn;

export type RulesFunction<JwtPayload> = (args: {
  can: CanWrapper;
  cannot: CannotWrapper;
  user: JwtPayload;
}) => void;

export type AbilityChecker = ReturnType<AbilityBuilder<PureAbility>['build']>
export interface AbilityCheckerBuilderInterface {
  buildFor(user: any): AbilityChecker;
}

// Mudar possession para useDatabase
// Mudar resourceParamName para param
// Colocar campos opcionais em objeto separado
export type AbilityMetadata = {
  action: Actions;
  resourceName: EntitiesNames;
  possession: "own" | "any";
  resourceParamName?: string;
};


// Adicionar opções para definir comportamento caso recurso não seja encontrado
// Adicionar possiblidade do usuario definir actions e resources
// Adicionar possibilidade do usuario o tipo de id do recurso
export type ModuleOptions<JwtPayload> = {
  PrismaModule: any;
  rulesFunction: RulesFunction<JwtPayload>;
  userProperty?: string;
};