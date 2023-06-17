import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import {
  AbilityChecker,
  AbilityMetadata,
  ModuleOptions,
} from "../casl/casl.types";
import { Reflector } from "@nestjs/core";
import { subject } from "@casl/ability";
import { Prisma, PrismaClient } from "@prisma/client";
import { ABILITY_METADATA, PROVIDERS } from "../casl/casl.constants";
import { AbilityCheckerBuilder } from "../casl/casl.wrapper";
import { AuthoError } from "../casl/casl.types";

export class AbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PROVIDERS.ABILITY_CHECKER_BUILDER)
    private readonly abilityCheckerBuilder: AbilityCheckerBuilder,
    @Inject(PROVIDERS.MODULE_OPTIONS)
    private readonly moduleOptions: ModuleOptions<any>,
    @Inject(PROVIDERS.PRISMA_SERVICE)
    private readonly prismaService: PrismaClient
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request[this.moduleOptions.userProperty];

    if (!user)
      throw new AuthoError(
        "No user found in request object.\n" +
          `${this.moduleOptions.userProperty} is not a valid property of the request object.\n` +
          "If your user property is not called 'user', " +
          "make sure to set the userProperty option.\n"
      );

    const {
      action,
      resource: resourceName,
      options,
    } = this.reflector.get(
      ABILITY_METADATA,
      context.getHandler()
    ) as AbilityMetadata;

    const idName =
      this.moduleOptions.stringIdName || this.moduleOptions.numberIdName;

    const resourceId: string = request.params[options.param || idName];

    const resourceWithoutDb = {
      [idName]: this.moduleOptions.numberIdName
        ? Number(resourceId)
        : resourceId,
    };

    if (!resourceWithoutDb[idName])
      throw new AuthoError(
        "Received id is not compatible with id type.\n" +
          "If you are using a string id, make sure to set the stringIdName option.\n"
      );

    if (!this.prismaService[resourceName] && options.useDb)
      throw new AuthoError(
        `'${resourceName}' name is not a valid Prisma model name\n` +
          "If you are using a custom resource, make sure to set the useDb option to false.\n"
      );

    let resourceWithDb: any;
    if (options.useDb) {
      resourceWithDb = await this.prismaService[resourceName]
        .findUniqueOrThrow({
          where: resourceWithoutDb,
        })
        .catch((err) => {
          if (err instanceof Prisma.PrismaClientValidationError)
            throw new AuthoError(
              "Invalid id property\n" +
                `${
                  options.param || idName
                } is not a valid property of ${resourceName}.\n` +
                "If your id property is not called 'id', " +
                "make sure to set the numberIdName or the stringIdName option.\n"
            );
          if (err instanceof Prisma.PrismaClientKnownRequestError)
            switch (this.moduleOptions.exceptionIfNotFound) {
              case "not found":
                throw new NotFoundException(`${resourceName} not found`);
              case "forbidden":
                return new ForbiddenException();
              case "prisma":
                throw err;
            }
          throw err;
        });
    }

    const resource = options.useDb ? resourceWithDb : resourceWithoutDb;

    const abilityChecker: AbilityChecker =
      this.abilityCheckerBuilder.buildFor(user);

    return abilityChecker.can(action, subject(resourceName, resource));
  }
}
