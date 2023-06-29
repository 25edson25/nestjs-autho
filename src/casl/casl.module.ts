import { DynamicModule, Global, Module } from "@nestjs/common";
import {
  AbilityOptions,
  AuthoError,
  DefaultAbilityOptions,
  DefaultActions,
  DefaultResources,
  ModuleOptions,
  StringOrDefault,
} from "./casl.types";
import { AbilityCheckerBuilder } from "./casl.wrapper";
import { PROVIDERS } from "./casl.constants";
import { PrismaClient } from "@prisma/client";

@Global()
@Module({})
export class AuthoModule {
  static forRoot<
    JwtPayload,
    Options extends AbilityOptions = DefaultAbilityOptions
  >(
    options: ModuleOptions<
      JwtPayload,
      {
        actions: StringOrDefault<Options["actions"], DefaultActions>;
        resources: StringOrDefault<Options["resources"], DefaultResources>;
      }
    >
  ): DynamicModule {
    options.userProperty = options.userProperty || "user";
    options.exceptionIfNotFound = options.exceptionIfNotFound || "404";
    options.numberIdName = options.stringIdName? undefined: options.numberIdName || "id";

    const PrismaService = Reflect.getMetadata(
      "providers",
      options.PrismaModule
    )?.[0];

    if (!(PrismaService?.prototype instanceof PrismaClient))
      throw new AuthoError("PrismaModule must export a service that extends PrismaClient")

    return {
      module: AuthoModule,
      imports: [options.PrismaModule],
      providers: [
        {
          provide: PROVIDERS.MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: PROVIDERS.PRISMA_SERVICE,
          useExisting: PrismaService,
        },
        {
          provide: PROVIDERS.ABILITY_CHECKER_BUILDER,
          useClass: AbilityCheckerBuilder,
        },
      ],
      exports: [
        {
          provide: PROVIDERS.PRISMA_SERVICE,
          useExisting: PrismaService,
        },
        {
          provide: PROVIDERS.ABILITY_CHECKER_BUILDER,
          useClass: AbilityCheckerBuilder,
        },
        {
          provide: PROVIDERS.MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }
}
