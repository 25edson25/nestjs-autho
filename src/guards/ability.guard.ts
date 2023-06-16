import {
  CanActivate,
  ExecutionContext,
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

    let resourceId: string = request.params[options.param];

    let resource = {
      [idName]: this.moduleOptions.numberIdName
        ? Number(resourceId)
        : resourceId,
    };

    if (!resource[idName])
      throw new AuthoError(
        "Received id is not compatible with id type.\n" +
          "If you are using a string id, make sure to set the stringIdName option.\n"
      );

    if (!this.prismaService[resourceName] && options.useDb)
      throw new AuthoError(
        `'${resourceName}' name is not a valid Prisma model name\n` +
          "If you are using a custom resource, make sure to set the useDb option to false.\n"
      );

    if (options.useDb)
      resource = await this.prismaService[resourceName]
        .findUnique({
          where: resource,
        })
        .catch((err) => {
          if (err instanceof Prisma.PrismaClientValidationError)
            throw new AuthoError(
              "Invalid id property\n" +
                "If your id property is not called 'id', " +
                "make sure to set the numberIdName or the stringIdName option.\n"
            );
          throw err;
        });

    const abilityChecker: AbilityChecker =
      this.abilityCheckerBuilder.buildFor(user);

    const hasPermission = abilityChecker.can(
      action,
      subject(resourceName, resource)
    );

    if (!options.useDb) return hasPermission;

    if (!hasPermission) return false;

    if (resource) return true;

    // Resource not found, but user has permission
    switch (this.moduleOptions.exceptionIfNotFound) {
      case "none":
        return true;
      case "http":
        throw new NotFoundException(`${resourceName} not found`);
      case "prisma":
        throw new Prisma.PrismaClientKnownRequestError(
          `No ${resourceName} found`,
          {
            code: "P2025",
            clientVersion: Prisma.prismaVersion.client,
          }
        );
    }
  }
}
