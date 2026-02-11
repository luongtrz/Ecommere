import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { UpdateReferralConfigDto } from './dtos/update-referral-config.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
    constructor(private referralsService: ReferralsService) { }

    @Get('config')
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lay cau hinh referral' })
    async getConfig() {
        return this.referralsService.getConfig();
    }

    @Put('config')
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cap nhat cau hinh referral' })
    async updateConfig(@Body() dto: UpdateReferralConfigDto) {
        return this.referralsService.updateConfig(dto);
    }

    @Get('stats')
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Thong ke referral' })
    async getStats() {
        return this.referralsService.getStats();
    }

    @Get('list')
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Danh sach tat ca referrals' })
    async getAllReferrals(@Query() paginationDto: PaginationDto) {
        return this.referralsService.getAllReferrals(paginationDto);
    }
}
