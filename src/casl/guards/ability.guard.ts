import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import {
  AbilityCheckerBuilderInterface,
  AbilityMetadata,
  ModuleOptions,
} from "../casl.types";
import { Reflector } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { subject } from "@casl/ability";

export class AbilityGuard<JwtPayload = any> implements CanActivate {
  constructor(
    @Inject("AbilityCheckerBuilder")
    private readonly abilityCheckerBuilderProvider: AbilityCheckerBuilderInterface<JwtPayload>,
    @Inject("AUTHO_MODULE_OPTIONS")
    private readonly moduleOptions: ModuleOptions<JwtPayload>,
    @Inject(Reflector) private readonly reflector: Reflector
  ) {}

  private getPrismaService(): PrismaClient {
    return Reflect.getMetadata("providers", this.moduleOptions.PrismaModule)[0];
  }
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request[this.moduleOptions.userProperty];
    const prismaService = this.getPrismaService();

    const { action, resourceName, possession, resourceParamName } =
      this.reflector.get(
        "NESTJS_AUTHO_ABILITY",
        context.getHandler()
      ) as AbilityMetadata;

    const resourceId: number = +request.params[resourceParamName];

    const resource =
      possession === "own"
        ? await (prismaService[resourceName].findUnique as any)({
            where: { id: resourceId },
          })
        : resourceId;

    if (!resource) throw new NotFoundException(`${resourceName} not found`);

    const abilityChecker = this.abilityCheckerBuilderProvider.buildFor(user);

    return abilityChecker.can(action, subject(resourceName, resource));
  }
}
