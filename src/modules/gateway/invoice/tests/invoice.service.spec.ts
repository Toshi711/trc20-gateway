import {DataSource} from "typeorm";
import {InvoiceService} from "@modules/gateway/invoice/invoice.service";
import {Daemon, DaemonProvider} from "@modules/gateway/daemon/daemon";
import {Test} from "@nestjs/testing";
import {getDataSourceToken, TypeOrmModule} from "@nestjs/typeorm";
import {getDataSourceOptions} from "@db/get-data-source-options";
import {Invoice, InvoiceStatus} from "@modules/gateway/invoice/invoice.entity";
import {TRXWalletService} from "@modules/gateway/invoice/trx-wallet.service";
import {Webhook} from "@modules/gateway/webhook/webhook.entity";
import {WebhookService} from "@modules/gateway/webhook/webhook.service";

describe('InvoiceService', function () {
	let dataSource: DataSource
	let invoiceService: InvoiceService
	let daemon: Daemon

	beforeAll(async () => {
		// @ts-ignore
		Daemon.expireCheckFrequency = 1000
		const module = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(getDataSourceOptions()),
				TypeOrmModule.forFeature([Invoice, Webhook]),
				// GatewayModule
			],
			providers: [
				InvoiceService,
				TRXWalletService,
				DaemonProvider,
				WebhookService
			]
		}).compile()

		dataSource = module.get(getDataSourceToken())
		invoiceService = module.get(InvoiceService)
		daemon = module.get(Daemon)
	})
	beforeEach(async () => {
		await dataSource.synchronize(true)
	})

	it('should create invoice', async () => {
		const price = 100
		const invoice = await invoiceService.create(price)
		expect(invoice.price).toBe(price * 1e6)
		expect(invoice.status).toBe(InvoiceStatus.PENDING)
	});

	it('should is paid return correct result', async () => {

	});
});