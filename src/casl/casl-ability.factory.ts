import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any) {
   const { can, cannot, build } = new AbilityBuilder(createPrismaAbility)

    
  }
}
