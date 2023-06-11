import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import {
  AbilityDecorator,
  AbilityMetadata,
  Actions,
  DecoratorOptions,
  EntitiesNames,
} from "../casl/casl.types";
import { AbilityGuard } from "../guards/ability.guard";
import { ABILITY_METADATA } from "../casl/casl.constants";

export const Ability: AbilityDecorator = (
  action: Actions,
  resource: EntitiesNames,
  options?: DecoratorOptions
) => {
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
};
