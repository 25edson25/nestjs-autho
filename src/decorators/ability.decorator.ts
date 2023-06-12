import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import {
  AbilityDecorator,
  AbilityMetadata,
  DefaultActions,
  DefaultResources,
} from "../casl/casl.types";
import { AbilityGuard } from "../guards/ability.guard";
import { ABILITY_METADATA } from "../casl/casl.constants";

export const Ability: AbilityDecorator = <
  Actions extends string = DefaultActions,
  Resources extends string = DefaultResources
>(
  ...args: Parameters<AbilityDecorator<Actions, Resources>>
): MethodDecorator => {
  const [action, resource, options] = args;

  options.param = options.param || "id";
  options.useDb = options.useDb || false;

  const abilityMetadata: AbilityMetadata<Actions, Resources> = {
    action,
    resource,
    options,
  };

  return applyDecorators(
    SetMetadata(ABILITY_METADATA, abilityMetadata),
    UseGuards(AbilityGuard)
  );
};
