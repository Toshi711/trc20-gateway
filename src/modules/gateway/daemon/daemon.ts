import {ConsoleLogger, Injectable, Provider} from "@nestjs/common";
import {Invoice, InvoiceStatus} from "@modules/gateway/invoice/invoice.entity";
import {In, MoreThan} from "typeorm";
import {catchError, concatMap, EMPTY, filter, forkJoin, interval, map, of} from "rxjs";
import {chunk, isEmpty} from "lodash";
import {TRC20Contract} from "@modules/contrib/trc20-contract";
import {TronConfig} from "@config";
import {InvoiceService} from "@modules/gateway/invoice/invoice.service";
import {WebhookService} from "@modules/gateway/webhook/webhook.service";

@Injectable()
export class Daemon {
	// Засекай платеж хотя бы на 95% опталы
	protected logger = new ConsoleLogger(Daemon.name)
	protected contract: TRC20Contract

	protected static balanceCheckFrequency = 1000 * 60 * 1
	protected static expireCheckFrequency = 1000 * 30

	protected constructor(
		protected invoiceService: InvoiceService,
		protected webhookService: WebhookService
	) {
	}


	static async init(
		invoiceService: InvoiceService,
		webhookService: WebhookService
	) {
		const daemon = new Daemon(invoiceService, webhookService)
		daemon.contract = await TRC20Contract.init(TronConfig.usdtContract)
		daemon.startWatcher()
		daemon.startExpireChecker()
		return daemon
	}


	async getWatchingInvoices() { // load not-expired not-paid invoices
		const invoices = await this.invoiceService.repository.find({
			where: {
				expireAt: MoreThan(new Date()),
				status: In([InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PENDING])
			},
			select: {
				address: true
			}
		})
		return invoices.map((inv) => inv.address)
	}


	startWatcher() {
		return interval(Daemon.balanceCheckFrequency).pipe(
			concatMap(() => this.getWatchingInvoices()),
			filter((addresses) => !isEmpty(addresses)),
			concatMap((addresses) => {
				this.logger.log(`Number of tracked addresses: ${addresses.length}`)
				const chunks = chunk(addresses, 10)
				return of(...chunks)
			}),
			concatMap((addresses) => {
				const addressesBalances: Promise<number>[] = []
				for (let addr of addresses) {
					addressesBalances.push(this.contract.balanceOf(addr))
				}
				return forkJoin(addressesBalances).pipe(
					map((paymentBalances) => {
						const balances: Record<string, number> = {}
						for (let [index, id] of addresses.entries()) {
							balances[id] = paymentBalances[index]
						}
						return balances
					}),
					catchError((e) => {
						this.logger.error(e, e.stack)
						return EMPTY
					})
				)
			}),
			concatMap(async (balances) => {
				for (let [address, balance] of Object.entries(balances)) {

					const isZero = balance === 0
					if (isZero) {
						continue
					}
					const invoice = await this.invoiceService.repository.findOneByOrFail({address})
					if (this.invoiceService.isPaid(balance, invoice.price)) {
						// webhook send
						await this.invoiceService.updateStatus(address, InvoiceStatus.PAID)
						await this.webhookService.send({
							invoiceId: invoice.id,
							status: InvoiceStatus.PAID,
							amount: balance / 1e6
						})
						this.logger.debug(`Invoice(${invoice.id}) is paid`)
					} else {
						await this.invoiceService.updateStatus(address, InvoiceStatus.PARTIALLY_PAID)
						await this.webhookService.send({
							invoiceId: invoice.id,
							status: InvoiceStatus.PARTIALLY_PAID,
							amount: balance / 1e6
						})
						this.logger.debug(`Invoice(${invoice.id}) is partially paid`)
					}

				}
			})
		).subscribe()
	}

	public startExpireChecker() {
		return interval(Daemon.expireCheckFrequency).pipe(
			concatMap(async () => {
				const updateResult = await this.invoiceService.repository.createQueryBuilder()
					.update(Invoice)
					.set({status: InvoiceStatus.EXPIRED})
					.where("status IN (:...statuses)",
						{statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID]})
					.andWhere(`"expireAt" < NOW()`)
					.returning("*")
					.execute()
				return this.invoiceService.repository.create(updateResult.raw)
			}),
			filter((invoices) => !isEmpty(invoices)),
			concatMap(async (invoices) => {
				for (let invoice of invoices) {
					this.logger.debug(`Invoice(${invoice.id}) is expired`)
					await this.webhookService.send({invoiceId: invoice.id, status: InvoiceStatus.EXPIRED})
				}
			})
		).subscribe()
	}

}

export const DaemonProvider: Provider = {
	provide: Daemon,
	inject: [InvoiceService, WebhookService],
	useFactory: async (invoiceService: InvoiceService, webhookService: WebhookService) => {
		return await Daemon.init(invoiceService, webhookService)
	}
}