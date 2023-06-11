import { AbilityBuilder } from "@casl/ability";
import {
  AbilityChecker,
  AbilityCheckerBuilderInterface,
  Actions,
  Entities,
  EntitiesNames,
  ModuleOptions,
  RulesFunction,
} from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";
import { Inject, Injectable } from "@nestjs/common";
import { PROVIDERS } from "./casl.constants";

@Injectable()
export class AbilityCheckerBuilder implements AbilityCheckerBuilderInterface {
  private readonly can: Function;
  private readonly cannot: Function;
  private readonly build: Function;
  private readonly rulesFunction: RulesFunction<any>;

  constructor(@Inject(PROVIDERS.MODULE_OPTIONS) options: ModuleOptions<any>) {
    const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);
    this.can = can;
    this.cannot = cannot;
    this.build = build;
    this.rulesFunction = options.rulesFunction;
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

  buildFor(user: any): AbilityChecker {
    this.rulesFunction({
      user,
      can: this.canWrapper.bind(this),
      cannot: this.cannotWrapper.bind(this),
    });
    return this.build();
  }
}
