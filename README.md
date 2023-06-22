[![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](https://github.com/CJR-UnB/autho/blob/main/README.pt-br.md)

# @cjr-unb/autho

Module for authorization in NestJS built with CASL and integrated with Prisma.

# Installation

Nest and Prisma must be installed with at least one migration executed. Then, run the following command:

```bash
npm install @cjr-unb/autho
```

# How to use

## Defining Rules

Define the authorization rules for your application in a callback function of type Rules. This function receives the type of user stored in the JWT token and an object with the properties _can_, _cannot_, and _user_.

```typescript
import { Rules } from "@cjr-unb/nest-autho";
import { JwtPayload } from "./auth/dtos/jwt-payload.dto";

export const rules: Rules<JwtPayload> = ({ can, cannot, user }) => {
  // Define your application's authorization rules here. Example:

  if (user.roles.includes("admin")) can("manage", "all");

  can("read", "post", { authorId: user.id });
};
```

The possible action names are: _manage_, _create_, _read_, _update_, and _delete_.
The possible resource names are: _all_ and the names of entities in your database.
You can define custom actions and resources. See the [Defining Custom Actions and Resources](#defining-custom-actions-and-resources) section.

The rules are defined as described in the [CASL documentation](https://casl.js.org/v6/en/guide/define-rules).

## AuthoModule

Add the AuthoModule using the forRoot method in one of your application's modules. The arguments that the method receives are:

- **\<JwtPayload\>:** Type of user stored in the JWT token
- Options:
  - **PrismaModule:** Prisma module that should export the PrismaService
  - **rules:** Callback function that contains the authentication rules. Receives an object with the properties _can_, _cannot_, and _user_.
  - **userProperty?:** Name of the property that contains the authenticated user in the request. Default: _user_
  - **exceptionIfNotFound?:** Type of exception to be thrown if the resource is not found in the database. Possible values are: _not found_, _forbidden_, and _prisma_. Default: _not found_
  - **numberIdName?:** Name of the property that contains the resource ID in Prisma. Should be used when the resource ID is a number. You must choose between _numberIdName_ and _stringIdName_.
    Default: _id_
  - **stringIdName?:** Name of the property that contains the resource ID in Prisma. Should be used when the resource ID is a string. You must choose between _numberIdName_ and _stringIdName_. Default: _undefined_

```typescript
import { AuthoModule } from "@cjr-unb/nest-autho";
import { JwtPayload } from "./auth/dtos/jwt-payload.dto";
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { rules } from "./auth/auth.rules";

@Module({
  imports: [
    AuthoModule.forRoot<JwtPayload>({
      PrismaModule,
      rules,
    }),
  ],
})
export class AppModule {}
```

## Ability Decorator

Now you can use the @Ability decorator on any route of your application. The decorator receives the action the user is trying to perform, the name of the resource they are trying to access, and additional options.

```typescript
import { Ability } from "@cjr-unb/nest-autho";
import { Controller, Get

, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Controller("post")
export class PostsController {
  @Ability("read", "post")
  @UseGuards(AuthGuard("jwt")) // The authentication guard must be executed before the authorization guard
  @Get()
  findAll() {
    // ...
  }
}
```

If it's necessary to query the database to check if the user has permission to access the resource, you can use the _useDb_ option. The resource will be fetched using the ID passed in the route parameter.

The name of the property that contains the resource ID is defined in the _numberIdName_ or _stringIdName_ options.

If the property name in your route that contains the resource ID is different from the one defined in the _numberIdName_ or _stringIdName_ option, you can pass the correct name in the _param_ option.

If the resource is not found, Autho will throw an exception of the type defined in the _exceptionIfNotFound_ option.

```typescript
import { Ability } from "@cjr-unb/nest-autho";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Controller("post")
export class PostsController {
  @Ability("read", "post", { useDb: true, param: "postId" })
  @UseGuards(AuthGuard("jwt"))
  @Get(":postId")
  findOne() {
    // ...
  }
}
```

Now, when a user who doesn't have permission tries to access the route, a _ForbiddenException_ will be thrown.

## Defining Custom Actions and Resources

You can define your own custom actions and resources by creating a type that contains the _action_ and _resource_ properties and passing that type as a parameter to the rules function, the @Ability decorator, and the AuthoModule.

You can extend the default Actions and Resources using the _DefaultActions_ and _DefaultResources_ types.

```typescript
import { DefaultActions, DefaultResources } from "@cjr-unb/nest-autho";

export type CustomOptions = {
  actions: "operate" | DefaultActions;
  resources: "calculator" | DefaultResources;
};
```

```typescript
import { Rules } from "@cjr-unb/nest-autho";
import { JwtPayload } from "./auth/dtos/jwt-payload.dto";
import { CustomOptions } from "./custom-options";

export const rules: Rules<JwtPayload, CustomOptions> = ({
  can,
  cannot,
  user,
}) => {
  if (user.roles.includes("admin")) can("operate", "calculator");
};
```

```typescript
import { AuthoModule } from "@cjr-unb/nest-autho";
import { JwtPayload } from "./auth/dtos/jwt-payload.dto";
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { rules } from "./auth/auth.rules";
import { CustomOptions } from "./custom-options";

@Module({
  imports: [
    AuthoModule.forRoot<JwtPayload, CustomOptions>({
      PrismaModule,
      rules,
    }),
  ],
})
export class AppModule {}
```

```typescript
import { Ability } from "@cjr-unb/nest-autho";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CustomOptions } from "./custom-options";

@Controller("calculator")
export class CalculatorController {
  @Ability<CustomOptions>("operate", "calculator")
  @UseGuards(AuthGuard("jwt"))
  @Get()


  operate() {
    // ...
  }
}
```

# Limitations

Currently, for Autho to work correctly, all Prisma models must have the same column name for the primary key.

Additionally, Autho does not support defining aliases for actions.