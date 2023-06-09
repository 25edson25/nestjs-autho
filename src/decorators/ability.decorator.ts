import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { AbilityMetadata, Actions, EntitiesNames } from "../casl/casl.types";
import { AbilityGuard } from "../guards/ability.guard";
import { ABILITY_METADATA } from "../casl/casl.constants";

export function Ability(
  action: Actions,
  resourceName: EntitiesNames,
  possession: "any" | "own" = "any",
  resourceParamName: string = "id"
) {
  const AbilityMetadata: AbilityMetadata = {
    action,
    resourceName,
    possession,
    resourceParamName,
  };
  return applyDecorators(
    SetMetadata(ABILITY_METADATA, AbilityMetadata),
    UseGuards(AbilityGuard)
  );
}
