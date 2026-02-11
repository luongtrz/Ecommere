import { Module, forwardRef } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { AuthModule } from '@/auth/auth.module';

@Module({
    controllers: [ReferralsController],
    providers: [ReferralsService],
    exports: [ReferralsService],
})
export class ReferralsModule { }
