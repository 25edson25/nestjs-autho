import { Global, Module } from '@nestjs/common'

@Global()
@Module({

})
export class CaslModule {}


function Teste(rules: Function) {
  return class TesteModule{

  }
}


// Preciso receber uma função no module contendo as rules
// Preciso passar os wrappers de can para essa função
// Preciso criar uma função que retorna um module
// Preciso criar um provider que recebe a função e retorna o ability checker