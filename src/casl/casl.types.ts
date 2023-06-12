import { AbilityBuilder, PureAbility } from "@casl/ability";
import { PrismaClient } from "@prisma/client";

export type DefaultActions = "manage" | "create" | "read" | "update" | "delete";

type Models = {
  [key in keyof PrismaClient as Exclude<key, `$${string}`>]: PrismaClient[key];
};

type DefaultEntities = {
  [key in keyof Models]: Models[key] extends {
    findUnique: (args: any) => infer PromisedEntity;
  }
    ? Awaited<PromisedEntity>
    : never;
};

export type DefaultEntitiesNames = keyof DefaultEntities;

export type CanReturn = ReturnType<AbilityBuilder<PureAbility>["can"]>;
export type CannotReturn = ReturnType<AbilityBuilder<PureAbility>["cannot"]>;

export type CanWrapper<Actions, Resource> = <Name extends Resource>(
  action: Actions,
  resourceName: Name,
  resource?: Name extends DefaultEntitiesNames ? DefaultEntities[Name] : any
) => CanReturn;

export type CannotWrapper<Actions, Resource> = <Name extends Resource>(
  action: Actions,
  resourceName: Name,
  resource?: Name extends DefaultEntitiesNames ? DefaultEntities[Name] : any
) => CannotReturn;

export type RulesFunction<
  JwtPayload,
  Actions = DefaultActions,
  Resources = DefaultEntitiesNames
> = (args: {
  can: CanWrapper<Actions, Resources>;
  cannot: CannotWrapper<Actions, Resources>;
  user: JwtPayload;
}) => void;

export type AbilityChecker = ReturnType<AbilityBuilder<PureAbility>["build"]>;

export type AbilityMetadata<Actions, Resources> = {
  action: Actions;
  resource: Resources;
  options?: { useDb?: boolean; param?: string };
};

export type AbilityDecorator<
  Actions = DefaultActions,
  Resources = DefaultEntitiesNames
> = (
  action: AbilityMetadata<Actions, Resources>["action"],
  resource: AbilityMetadata<Actions, Resources>["resource"],
  options?: AbilityMetadata<Actions, Resources>["options"]
) => void;

// Adicionar opções para definir comportamento caso recurso não seja encontrado
// Adicionar possiblidade do usuario definir actions e resources
// Adicionar possibilidade do usuario o tipo de id do recurso

export type ModuleOptions<
  JwtPayload,
  Actions extends string = DefaultActions,
  Resources extends string = DefaultEntitiesNames
> = {
  PrismaModule: any;
  rulesFunction: RulesFunction<JwtPayload, Actions, Resources>;
  userProperty?: string;
};

// OBS: casl não lança erro caso não encontre a propriedade no recurso, apenas retorna false
