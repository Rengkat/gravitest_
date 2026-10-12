import { Module } from '@nestjs/common';
import { HashProvider } from './providers/Hash.provider';
import { BcryptProvider } from './providers/Bcrypt.provider';

@Module({
  providers: [
    {
      provide: HashProvider,
      useClass: BcryptProvider,
    },
  ],
  exports: [HashProvider],
})
export class HashModule {}
