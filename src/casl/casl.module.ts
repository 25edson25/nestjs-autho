import { DynamicModule, Module } from "@nestjs/common";
import { ModuleOptions } from "./casl.types";
import { AbilityCheckerBuilder } from "./casl.wrapper";
import { PROVIDERS } from "./casl.constants";

@Module({})
export class AuthoModule {
  static forRoot<JwtPayload>(
    options: ModuleOptions<JwtPayload>
  ): DynamicModule {
    return {
      module: AuthoModule,
      providers: [
        {
          provide: PROVIDERS.MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: PROVIDERS.PRISMA_SERVICE,
          useExisting: options.PrismaService,
        },
        {
          provide: PROVIDERS.ABILITY_CHECKER_BUILDER,
          useClass: AbilityCheckerBuilder,
        },
      ],
    };
  }
}
