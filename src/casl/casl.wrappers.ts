import { AbilityBuilder } from "@casl/ability";
import { AbilityCheckerBuilderInterface, Actions, Entities, EntitiesNames, RulesFunction } from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";
import { Injectable } from "@nestjs/common";

export function AbilityCheckerBuilder<JwtPayload>(
  rulesFunction: RulesFunction<JwtPayload>
) {
  @Injectable()
  class AbilityCheckerBuilderClass implements AbilityCheckerBuilderInterface<JwtPayload> {
    readonly can: Function;
    readonly cannot: Function;
    readonly build: Function;

    constructor() {
      const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);

      this.can = can;
      this.cannot = cannot;
      this.build = build;
    }

    canWrapper<EntityName extends EntitiesNames>(
      action: Actions,
      resourceName: EntityName,
      resource?: Partial<Entities[EntityName]>
    ) {
      return this.can(action, resourceName, resource);
    }

    cannotWrapper<EntityName extends EntitiesNames>(
      action: Actions,
      resourceName: EntityName,
      resource?: Partial<Entities[EntityName]>
    ) {
      return this.cannot(action, resourceName, resource);
    }

    buildFor(user: JwtPayload) {
      rulesFunction(
        this.canWrapper.bind(this),
        this.cannotWrapper.bind(this),
        user
      );
      return this.build();
    }
  }

  return AbilityCheckerBuilderClass;
}
