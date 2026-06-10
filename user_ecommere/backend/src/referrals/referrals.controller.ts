import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
    constructor(private referralsService: ReferralsService) { }

    @Get('me')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lấy thông tin referral của user hiện tại' })
    async getMyReferralInfo(@CurrentUser('id') userId: string) {
        return this.referralsService.getMyReferralInfo(userId);
    }

    @Get('my-referrals')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Danh sách bạn bè đã mời' })
    async getMyReferrals(
        @CurrentUser('id') userId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.referralsService.getMyReferrals(userId, paginationDto);
    }

    @Get('my-coupons')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Danh sách coupon từ referral' })
    async getMyCouponsFromReferral(@CurrentUser('id') userId: string) {
        return this.referralsService.getMyCouponsFromReferral(userId);
    }
}
