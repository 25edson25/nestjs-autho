import { AbilityBuilder } from "@casl/ability";
import { Actions, Entities, EntitiesNames, RulesFunction } from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";

export function AbilityCheckerBuilder<JwtPayload>(
  rulesFunction: RulesFunction<JwtPayload>
) {
  return class AbilityCheckerBuilderClass {
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

    public buildFor(user: JwtPayload) {
      rulesFunction(
        this.canWrapper.bind(this),
        this.cannotWrapper.bind(this),
        user
      );
      return this.build();
    }
  };
}
