import { Global, Module } from "@nestjs/common";
import { AbilityCheckerBuilder } from "./casl.wrappers";
import { RulesFunction } from "./casl.types";

export function AuthoModule<JwtPayload>(args: {
  userProperty?: string;
  rulesFunction: RulesFunction<JwtPayload>;
}) {

  const AbilityCheckerBuilderProvider = AbilityCheckerBuilder<JwtPayload>(args.rulesFunction)

  @Global()
  @Module({
    providers: [AbilityCheckerBuilderProvider],
    exports: [AbilityCheckerBuilderProvider],
  })
  class CaslModule {}

  return CaslModule;
}

