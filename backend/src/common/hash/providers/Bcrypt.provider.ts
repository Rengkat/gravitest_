import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashProvider } from './Hash.provider';

@Injectable()
export class BcryptProvider implements HashProvider {
  async hashPassword(plainPassword: string | Buffer): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plainPassword, salt);
  }

  async comparePassword(
    plainPassword: string | Buffer,
    encryptedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, encryptedPassword);
  }
}
