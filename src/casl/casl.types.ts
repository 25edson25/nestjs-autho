import { AbilityBuilder, PureAbility } from "@casl/ability";
import { PrismaClient, Prisma } from "@prisma/client";

export type DefaultActions = "manage" | "create" | "read" | "update" | "delete";

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

export type CanReturn = ReturnType<AbilityBuilder<PureAbility>["can"]>;
export type CannotReturn = ReturnType<AbilityBuilder<PureAbility>["cannot"]>;

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


type AbilityOptions = {
  actions?: string;
  resources?: string;
};
type DefaultAbilityOptions = {
  actions: DefaultActions;
  resources: DefaultResources;
};

type StringOrDefault<T, Default> = T extends string ? T : Default;

export type RulesFunction<
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

export type AbilityChecker = ReturnType<AbilityBuilder<PureAbility>["build"]>;

export type AbilityMetadata<Actions, Resources> = {
  action: Actions;
  resource: Resources;
  options?: { useDb?: boolean; param?: string };
};

export type AbilityDecorator<
  Actions extends string = DefaultActions,
  Resources extends string = DefaultResources
> = (
  action: AbilityMetadata<Actions, Resources>["action"],
  resource: AbilityMetadata<Actions, Resources>["resource"],
  options?: AbilityMetadata<Actions, Resources>["options"]
) => MethodDecorator;

// Adicionar opções para definir comportamento caso recurso não seja encontrado
// Adicionar possibilidade do usuario definir o tipo de id dorecurso
export type ModuleOptions<
  JwtPayload,
  Options extends AbilityOptions = DefaultAbilityOptions
> = {
  PrismaModule: any;
  rulesFunction: RulesFunction<
    JwtPayload,
    {
      actions: StringOrDefault<Options["actions"], DefaultActions>;
      resources: StringOrDefault<Options["resources"], DefaultResources>;
    }
  >;
  userProperty?: string;
};


// OBS: casl não lança erro caso não encontre a propriedade no recurso, apenas retorna false
