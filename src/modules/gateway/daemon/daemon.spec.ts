import {Test} from "@nestjs/testing";
import {getDataSourceToken, TypeOrmModule} from "@nestjs/typeorm";
import {getDataSourceOptions} from "@db/get-data-source-options";
import {DataSource} from "typeorm";
import {InvoiceService} from "@modules/gateway/invoice/invoice.service";
import {subDays, subMinutes} from "date-fns";
import {Invoice, InvoiceStatus} from "@modules/gateway/invoice/invoice.entity";
import {Daemon, DaemonProvider} from "@modules/gateway/daemon/daemon";
import {TRXWalletService} from "@modules/gateway/invoice/trx-wallet.service";
import {sleep} from "@modules/contrib/other/sleep";
import {WebhookService} from "@modules/gateway/webhook/webhook.service";

describe('Daemon', function () {

	let dataSource: DataSource
	let invoiceService: InvoiceService
	let daemon: Daemon

	beforeAll(async () => {
		// @ts-ignore
		Daemon.expireCheckFrequency = 1000
		const module = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(getDataSourceOptions()),
				TypeOrmModule.forFeature([Invoice]),
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

	it('should return watching invoices', async () => {
		const invoice1 = await invoiceService.create(100)
		await invoiceService.repository.update({id: invoice1.id}, {expireAt: subDays(new Date(), 1)})
		const invoice2 = await invoiceService.create(100)
		await invoiceService.repository.update({id: invoice2.id}, {status: InvoiceStatus.EXPIRED})
		const invoice3 = await invoiceService.create(100)

		const watchingInvoices = await daemon.getWatchingInvoices()
		expect(watchingInvoices.length).toBe(1)
		expect(watchingInvoices[0]).toBe(invoice3.address)
	});


	it('should expire checker works', async () => {
		const invoice = await invoiceService.create(100)
		await invoiceService.repository.update({id: invoice.id}, {expireAt: subMinutes(new Date(), 1)})
		await sleep(3_000)
		const updatedInvoice = await invoiceService.repository.findOneByOrFail({id: invoice.id})
		expect(updatedInvoice.status).toBe(InvoiceStatus.EXPIRED)
	});

	it('should ', async () => {

	});
});