import { AbilityBuilder, PureAbility } from "@casl/ability";
import { PrismaClient, Prisma } from "@prisma/client";

// Prisma Types

type Models = {
  [key in keyof PrismaClient as Exclude<key, `$${string}`>]: PrismaClient[key];
};

type Entities = {
  [key in keyof Models]: Models[key] extends {
    findUnique: (args: any) => infer PromisedEntity;
  }
    ? Awaited<PromisedEntity>
    : never;
};

export type DefaultResources = keyof Entities;
export type DefaultActions = "manage" | "create" | "read" | "update" | "delete";

// Wrapper Types

export type CanReturn = ReturnType<AbilityBuilder<PureAbility>["can"]>;
export type CannotReturn = ReturnType<AbilityBuilder<PureAbility>["cannot"]>;
export type AbilityChecker = ReturnType<AbilityBuilder<PureAbility>["build"]>;

export type CanWrapper<Actions, Resource> = <Name extends Resource>(
  action: Actions,
  resourceName: Name,
  resource?: Name extends DefaultResources ? Partial<Entities[Name]> : any
) => CanReturn;

export type CannotWrapper<Actions, Resource> = <Name extends Resource>(
  action: Actions,
  resourceName: Name,
  resource?: Name extends DefaultResources ? Partial<Entities[Name]> : any
) => CannotReturn;

// Module Types

export type StringOrDefault<T, Default> = T extends string ? T : Default;

export type AbilityOptions = {
  actions?: string;
  resources?: string;
};
export type DefaultAbilityOptions = {
  actions: DefaultActions;
  resources: DefaultResources;
};

export type Rules<
  JwtPayload,
  Options extends AbilityOptions = DefaultAbilityOptions
> = (args: {
  can: CanWrapper<
    StringOrDefault<Options["actions"], DefaultActions>,
    StringOrDefault<Options["resources"], DefaultResources>
  >;
  cannot: CannotWrapper<
    StringOrDefault<Options["actions"], DefaultActions>,
    StringOrDefault<Options["resources"], DefaultResources>
  >;
  user: JwtPayload;
}) => void;

export type AbilityDecoratorOptions = { useDb?: boolean; param?: string };

export type AbilityMetadata = {
  action: string;
  resource: string;
  options?: AbilityDecoratorOptions;
};

// Adicionar opções para definir comportamento caso recurso não seja encontrado
// Adicionar possibilidade do usuario definir o tipo de id do recurso
// OBS: casl não lança erro caso não encontre a propriedade no recurso, apenas retorna false
type ExceptionIfNotFound = "none" | "prisma" | "http";

export type ModuleOptions<
  JwtPayload,
  Options extends AbilityOptions = DefaultAbilityOptions
> = {
  PrismaModule: any;
  rules: Rules<
    JwtPayload,
    {
      actions: StringOrDefault<Options["actions"], DefaultActions>;
      resources: StringOrDefault<Options["resources"], DefaultResources>;
    }
  >;
  userProperty?: string;
  exceptionIfNotFound?: ExceptionIfNotFound;
};

