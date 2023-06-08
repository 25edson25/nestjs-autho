import { AbilityBuilder } from "@casl/ability";
import {
  Actions,
  Entities,
  EntitiesNames,
  WrappersFunction,
} from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";

class Wrapper {
  can: Function;
  cannot: Function;
  build: Function;

  constructor() {
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

  public abilityCheckerBuilder(
    rules: (can: WrappersFunction, cannot: WrappersFunction) => void
  ) {
    rules(this.canWrapper, this.cannotWrapper);
    return this.build();
  }
}

const wrapper = new Wrapper();
wrapper.abilityCheckerBuilder((can, cannot) => {
    
});
