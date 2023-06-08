import { AbilityBuilder } from "@casl/ability";
import { Actions, Entities, EntitiesNames, RulesFunction } from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";

export class AbilityCheckerBuilder<JwtPayload> {
  can: Function;
  cannot: Function;
  build: Function;

  constructor(
    private readonly user: JwtPayload,
    private readonly rulesFunction: RulesFunction<JwtPayload>
  ) {
    const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);

    this.can = can;
    this.cannot = cannot;
    this.build = build;
  }

  private canWrapper<EntityName extends EntitiesNames>(
    action: Actions,
    resourceName: EntityName,
    resource?: Partial<Entities[EntityName]>
  ) {
    return this.can(action, resourceName, resource);
  }

  private cannotWrapper<EntityName extends EntitiesNames>(
    action: Actions,
    resourceName: EntityName,
    resource?: Partial<Entities[EntityName]>
  ) {
    return this.cannot(action, resourceName, resource);
  }

  public buildChecker() {
    this.rulesFunction(
      this.canWrapper.bind(this),
      this.cannotWrapper.bind(this),
      this.user
    );
    return this.build();
  }
}
