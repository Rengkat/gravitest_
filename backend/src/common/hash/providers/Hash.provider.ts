export abstract class HashProvider {
  abstract hashPassword(plainPassword: string | Buffer): Promise<string>;
  abstract comparePassword(
    plainPassword: string | Buffer,
    encryptedPassword: string,
  ): Promise<boolean>;
}
