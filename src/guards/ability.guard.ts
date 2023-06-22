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
          `'${this.moduleOptions.userProperty}' is not a valid property of the request object.\n` +
          "If your user property is not called 'user', " +
          "make sure to set the userProperty option.\n" +
          "Alternatively, ensure that the user is authenticated " +
          "and attached to the request object.\n"
      );

    const {
      action,
      resource: resourceName,
      options,
    } = this.reflector.get(
      ABILITY_METADATA,
      context.getHandler()
    ) as AbilityMetadata;

    const abilityChecker: AbilityChecker =
      this.abilityCheckerBuilder.buildFor(user);

    if (!options.useDb) return abilityChecker.can(action, subject(resourceName, {}));

    const resourceIdName =
      this.moduleOptions.stringIdName || this.moduleOptions.numberIdName;

    const id: string = request.params[options.param || resourceIdName];

    if (!id)
      throw new AuthoError(
        "No id found in request object.\n" +
          `'${
            options.param || resourceIdName
          }' is not a valid property of the request params.\n` +
          "If your param property is not the same as your id property, " +
          "make sure to set the param option.\n"
      );

    const where = {
      [resourceIdName]: this.moduleOptions.numberIdName ? Number(id) : id,
    };

    // if the id is NaN
    if (!where[resourceIdName])
      throw new AuthoError(
        "Received id is not compatible with excepted id type.\n" +
          "If you are using a string id, make sure to set the stringIdName option.\n"
      );

    if (!this.prismaService[resourceName])
      throw new AuthoError(
        `'${resourceName}' is not a valid Prisma model name\n` +
          "If you are using a custom resource, make sure to set the useDb option to false.\n"
      );

    const resource = await this.prismaService[resourceName]
      .findUniqueOrThrow({
        where,
      })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientValidationError)
          throw new AuthoError(
            "Invalid id property\n" +
              `'${resourceIdName}' is not a valid property of ${resourceName}.\n` +
              "If your id property is not called 'id', " +
              "make sure to set the numberIdName or the stringIdName option.\n"
          );
        if (err instanceof Prisma.PrismaClientKnownRequestError)
          switch (this.moduleOptions.exceptionIfNotFound) {
            case "404":
              throw new NotFoundException(`${resourceName} not found`);
            case "403":
              return new ForbiddenException();
            case "prisma":
              throw err;
          }
        throw err;
      });

    return abilityChecker.can(action, subject(resourceName, resource));
  }
}
