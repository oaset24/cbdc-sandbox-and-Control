import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";

@Module({
  imports: [ComplianceModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
