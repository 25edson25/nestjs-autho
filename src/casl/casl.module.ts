import { DynamicModule, Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ModuleOptions, RulesFunction } from "./casl.types";
import { AbilityCheckerBuilder } from "./casl.wrappers";

@Module({})
export class AuthoModule {
  static forRoot<JwtPayload>(
    options: ModuleOptions<JwtPayload>
  ): DynamicModule {
    return {
      module: AuthoModule,
      imports: [options.PrismaModule],
      providers: [
        {
          provide: "AUTHO_MODULE_OPTIONS",
          useValue: options,
        },
      ],
      exports: [
        {
          provide: "AbilityCheckerBuilder",
          useClass: AbilityCheckerBuilder<JwtPayload>,
        },
      ],
    };
  }
}

const authoModule = AuthoModule.forRoot<{id:number}>({
  PrismaModule: undefined,
  rulesFunction: (can, cannot, user) =>{
    can('update', 'user', {id: user.id})
  }
})
