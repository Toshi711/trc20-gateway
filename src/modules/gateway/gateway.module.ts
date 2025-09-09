import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Invoice} from "@modules/gateway/invoice/invoice.entity";
import {InvoiceController} from "@modules/gateway/invoice/invoice.controller";
import {InvoiceService} from "@modules/gateway/invoice/invoice.service";
import {TRXWalletService} from "@modules/gateway/invoice/trx-wallet.service";
import {DaemonProvider} from "@modules/gateway/daemon/daemon";
import {WebhookService} from "@modules/gateway/webhook/webhook.service";


@Module({
	imports: [
		TypeOrmModule.forFeature([Invoice])
	],
	providers: [
		InvoiceService,
		TRXWalletService,
		DaemonProvider,
		WebhookService
	],
	controllers: [InvoiceController]
})
export class GatewayModule {}