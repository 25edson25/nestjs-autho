import { AbilityBuilder } from "@casl/ability";
import {
  AbilityCheckerBuilderInterface,
  Actions,
  Entities,
  EntitiesNames,
  ModuleOptions,
  RulesFunction,
} from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class AbilityCheckerBuilder<JwtPayload>
  implements AbilityCheckerBuilderInterface<JwtPayload>
{
  private readonly can: Function;
  private readonly cannot: Function;
  private readonly build: Function;
  private readonly rulesFunction: RulesFunction<JwtPayload>;

  constructor(
    @Inject("AUTHO_MODULE_OPTIONS") options: ModuleOptions<JwtPayload>
  ) {
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

  buildFor(user: JwtPayload) {
    this.rulesFunction(
      this.canWrapper.bind(this),
      this.cannotWrapper.bind(this),
      user
    );
    return this.build();
  }
}
