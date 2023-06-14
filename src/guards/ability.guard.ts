import {
  CanActivate,
  ExecutionContext,
  Inject,
  InternalServerErrorException,
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

    const resourceId: number = +request.params[options.param];

    let resource = { id: resourceId };

    if (options.useDb)
      resource = await this.prismaService[resourceName]
        .findUniqueOrThrow({
          where: { id: resourceId },
        })
        .catch((err) => {
          if (err instanceof Prisma.PrismaClientValidationError)
            // id property error | resource name error | id type error
            throw new InternalServerErrorException();

          throw err;
        });

    const abilityChecker: AbilityChecker =
      this.abilityCheckerBuilder.buildFor(user);

    const hasPermission = abilityChecker.can(
      action,
      subject(resourceName, resource)
    );

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
            code: 'P2025',
            clientVersion: Prisma.prismaVersion.client,
          }
        );
    }
  }
}
