import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdminService, ReportsService, CustomersService],
  controllers: [AdminController, ReportsController, CustomersController],
  exports: [AdminService, ReportsService, CustomersService],
})
export class AdminModule {}
