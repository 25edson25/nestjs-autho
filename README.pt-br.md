# @cjr-unb/autho

Módulo para autorização em NestJS construído com CASL e integrado com o Prisma.

# Instalação

É necessário ter Nest e o Prisma instalados com pelo menos uma migração executada. Em seguida, execute o comando:

```bash
npm install @cjr-unb/autho
```

# Como usar

## Definindo as regras

Defina as regras de autorização da sua aplicação numa função de callback do tipo Rules. Essa função recebe o tipo do usuário armazenado no token JWT e um objeto com as propriedades _can_, _cannot_ e _user_.

```typescript
import { Rules } from "@cjr-unb/nest-autho";
import { JwtPayload } from "./auth/dtos/jwt-payload.dto";

export const rules: Rules<JwtPayload> = ({ can, cannot, user }) => {
  // Defina aqui as regras de autorização da sua aplicação. Exemplo:

  if (user.roles.includes("admin")) can("manage", "all");

  can("read", "post", { authorId: user.id });
};
```

Os nomes das possíveis actions são: _manage_, _create_, _read_, _update_ e _delete_.
Os nomes dos possíveis resources são: _all_ e o nome das entidades do seu banco de dados.
Você pode definir actions e resources customizados. Veja a seção [Definindo Actions e Resources Customizados](#definindo-actions-e-resources-customizados).

A definição das regras é feita como descrito na documentação do [CASL](https://casl.js.org/v6/en/guide/define-rules).

## AuthoModule

Adicione o AuthoModule utilizando o método forRoot em um dos módulos da sua aplicação. Os argumentos que o método recebe são:

- **\<JwtPayload\>:** Tipo do usuário armazenado no token JWT
- Options:
  - **PrismaModule:** Módulo do prisma que deve exportar o PrismaService
  - **rules:** Função de callback que contém as regras de autenticação. Recebe um objeto com as propriedades _can_, _cannot_ e _user_.
  - **userProperty?:** Nome da propriedade que contém o usuário autenticado noh request. Default: _user_
  - **exceptionIfNotFound?:** Tipo de exceção que deve ser lançada caso o recurso não seja encontrado no banco de dados. Os possíveis valores são: _not found_, _forbidden_ e _prisma_. Default: _not found_
  - **numberIdName?:** Nome da propriedade que contém o id do recurso no Prisma. Deve ser utilizado quando o id do recurso é um número. Você deve escolher entre _numberIdName_ e _stringIdName_.
    Default: _id_
  - **stringIdName?:** Nome da propriedade que contém o id do recurso no Prisma. Deve ser utilizado quando o id do recurso é uma string. Você deve escolher entre _numberIdName_ e _stringIdName_. Default: _undefined_

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

## Decorator Ability

Agora você pode utilizar o decorator @Ability em qualquer rota da sua aplicação. O decorator recebe a ação que o usuário está tentando executa, o nome do recurso que ele está tentando acessar e opções adicionais.

```typescript
import { Ability } from "@cjr-unb/nest-autho";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Controller("post")
export class PostsController {
  @Ability("read", "post")
  @UseGuards(AuthGuard("jwt")) // O guard de autenticação deve ser executado antes do guard de autorização
  @Get()
  findAll() {
    // ...
  }
}
```

Caso seja necessário consultar o banco de dados para verificar se o usuário tem permissão para acessar o recurso, você pode utilizar a opção _useDb_. O recurso será buscado através do id passado no parâmetro da rota.

O nome da propriedade que contém o id do recurso no é definido nas opções _numberIdName_ ou _stringIdName_.

Se na sua rota, o nome da propriedade que contém o id do recurso no for diferente do definido na opção _numberIdName_ ou _stringIdName_, você pode passar o nome correto na opção _param_.

Caso o recurso não seja encontrado, o Autho lançará uma exceção do tipo definido na opção _exceptionIfNotFound_.

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

Agora quando um usuário que não tem permissão tentar acessar a rota, uma exceção do tipo _ForbiddenException_ será lançada.

## Definindo Actions e Resources Customizados

É possível definir seus próprios actions e resources customizados criando um tipo que contém as propriedades _action_ e _resource_ e passando esse tipo como parâmetro para a função rules, para o decorator @Ability e para o AuthoModule.

Você pode extender as Actions e Resources padrões através dos tipos _DefaultActions_ e _DefaultResources_.

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

# Limitações

Atualmente, para o funcionamento correto do Autho, é necessário que em todas as models do Prisma o nome da coluna que contém a PK sejam iguais.

Além disso, o Autho não tem suporte para definição de aliases para as actions.