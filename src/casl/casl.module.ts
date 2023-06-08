import { Global, Module } from "@nestjs/common";
import { AbilityCheckerBuilder } from "./casl.wrappers";
import { RulesFunction } from "./casl.types";

export function NestjsAuthoModule<JwtPayload>(
  PrismaModule: any,
  rulesFunction: RulesFunction<JwtPayload>
) {
  const AbilityCheckerBuilderProvider =
    AbilityCheckerBuilder<JwtPayload>(rulesFunction);

  @Global()
  @Module({
    imports: [PrismaModule],
    providers: [
      {
        provide: "AbilityCheckerBuilderProvider",
        useClass: AbilityCheckerBuilderProvider,
      },
    ],
    exports: [
      {
        provide: "AbilityCheckerBuilderProvider",
        useClass: AbilityCheckerBuilderProvider,
      },
    ],
  })
  class CaslModule {}

  return CaslModule;
}
