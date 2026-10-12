import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BulkCreateUsersProvider } from './providers/create-bulk-users.provider';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { HashModule } from 'src/common/hash/hash.module';
import { UserSettings } from './entities/user-settings.entity';
import { LibraryAccess } from '../library/entities/library-content-access.entity';
import { UserRegistrationProvider } from './providers/create-user.provider';
import { UserSettingsProvider } from './providers/user-settings.provider';
import { StorageModule } from 'src/storage/storage.module';
import { EmailVerificationProvider } from './providers/email-verification.provider';
import { Otp } from 'src/auth/entities/otp.entity';
import { OtpProvider } from 'src/auth/providers/otp.provider';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    BulkCreateUsersProvider,
    UserRegistrationProvider,
    UserSettingsProvider,
    EmailVerificationProvider,
    OtpProvider,
  ],
  exports: [UserService, TypeOrmModule, UserRegistrationProvider],
  imports: [
    TypeOrmModule.forFeature([User, UserSettings, LibraryAccess, Otp]),
    PaginationModule,
    HashModule,
    StorageModule,
    MailModule,
  ],
})
export class UserModule {}
