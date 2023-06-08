import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { AbilityCheckerBuilderInterface, AbilityMetadata } from "../casl.types";
import { Reflector } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { subject } from "@casl/ability";

class AbilityGuard<JwtPayload> implements CanActivate {
  constructor(
    @Inject("AbilityCheckerBuilderProvider")
    private readonly abilityCheckerBuilderProvider: AbilityCheckerBuilderInterface<JwtPayload>,
    @Inject("PrismaService") private readonly prismaService: PrismaClient,
    @Inject(Reflector) private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const resourceId: number = +request.params?.id;
    const user: JwtPayload = request.user;

    const { action, resourceName, possession } = this.reflector.get(
      "ABILITY",
      context.getHandler()
    ) as AbilityMetadata;

    const resource =
      possession === "own"
        ? await (this.prismaService[resourceName].findUnique as any)({
            where: { id: resourceId },
          })
        : resourceId;

    if (!resource) throw new NotFoundException(`${resourceName} not found`);

    const abilityChecker = this.abilityCheckerBuilderProvider.buildFor(user);

    return abilityChecker.can(action, subject(resourceName, resource));
  }
}
