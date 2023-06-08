import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { AbilityMetadata, Actions, EntitiesNames } from "../casl.types";
import { AbilityGuard } from "../guards/ability.guard";

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
    SetMetadata("AUTHO_ABILITY", AbilityMetadata),
    UseGuards(AbilityGuard)
  );
}
