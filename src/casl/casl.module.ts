import { Global, Module } from "@nestjs/common";
import { AbilityCheckerBuilder } from "./casl.wrappers";
import { RulesFunction } from "./casl.types";

export function AuthoModule<JwtPayload>(args: {
  rulesFunction: RulesFunction<JwtPayload>;
}) {
  const AbilityCheckerBuilderProvider = AbilityCheckerBuilder<JwtPayload>(
    args.rulesFunction
  );

  @Global()
  @Module({
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
