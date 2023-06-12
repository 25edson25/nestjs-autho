import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import {
  AbilityDecorator,
  AbilityMetadata,
  DefaultActions,
  DefaultEntitiesNames,
} from "../casl/casl.types";
import { AbilityGuard } from "../guards/ability.guard";
import { ABILITY_METADATA } from "../casl/casl.constants";

export function Ability<
  Actions = DefaultActions,
  Resources = DefaultEntitiesNames
>(...args: Parameters<AbilityDecorator<Actions, Resources>>) {
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
}

