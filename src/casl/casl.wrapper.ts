import { AbilityBuilder } from "@casl/ability";
import {
  AbilityChecker,
  CanReturn,
  CanWrapper,
  CannotReturn,
  CannotWrapper,
  ModuleOptions,
  Rules,
} from "./casl.types";
import { createPrismaAbility } from "@casl/prisma";
import { Inject, Injectable } from "@nestjs/common";
import { PROVIDERS } from "./casl.constants";

@Injectable()
export class AbilityCheckerBuilder {
  private readonly can: Function;
  private readonly cannot: Function;
  private readonly build: Function;
  private readonly rules: Rules<any>;

  constructor(@Inject(PROVIDERS.MODULE_OPTIONS) options: ModuleOptions<any>) {
    const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);
    this.can = can;
    this.cannot = cannot;
    this.build = build;
    this.rules = options.rules;
  }

  private canWrapper(...args: Parameters<CanWrapper<any, any>>): CanReturn {
    return this.can(...args);
  }

  private cannotWrapper(...args: Parameters<CannotWrapper<any, any>>): CannotReturn {
    return this.cannot(...args);
  }

  buildFor(user: any): AbilityChecker {
    this.rules({
      user,
      can: this.canWrapper.bind(this),
      cannot: this.cannotWrapper.bind(this),
    });
    return this.build();
  }
}
