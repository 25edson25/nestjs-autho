import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import {
  AbilityDecoratorOptions,
  AbilityMetadata,
  AbilityOptions,
  DefaultAbilityOptions,
  DefaultActions,
  DefaultResources,
  StringOrDefault,
} from "../casl/casl.types";
import { AbilityGuard } from "../guards/ability.guard";
import { ABILITY_METADATA } from "../casl/casl.constants";

export function Ability<
  Options extends AbilityOptions = DefaultAbilityOptions
>(
  action: StringOrDefault<Options["actions"], DefaultActions>,
  resource: StringOrDefault<Options["resources"], DefaultResources>,
  options: AbilityDecoratorOptions = {}
): MethodDecorator {
  options.param = options.param || "id";
  options.useDb = options.useDb || false;

  const abilityMetadata: AbilityMetadata = {
    action,
    resource,
    options,
  };

  return applyDecorators(
    SetMetadata(ABILITY_METADATA, abilityMetadata),
    UseGuards(AbilityGuard)
  );
}
