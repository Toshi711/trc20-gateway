import {ConsoleLogger, Inject, Injectable} from "@nestjs/common";
import {getRepositoryToken} from "@nestjs/typeorm";
import {Invoice, InvoiceStatus} from "@modules/gateway/invoice/invoice.entity";
import {Repository} from "typeorm";
import {_TronConfig, tron, TronConfig} from "@config";
import addMinutes from "date-fns/addMinutes"
import {TRC20Contract} from "@modules/contrib/trc20-contract";
import {TRXWalletService} from "@modules/gateway/invoice/trx-wallet.service";
import {waitForSuccessTxStatus} from "@modules/contrib/wait-for-success-tx-status";


@Injectable()
export class InvoiceService {

	protected logger = new ConsoleLogger(InvoiceService.name)

	public static MIN_USDT_WITHDRAW_VALUE = 1 // :TODO change to 10
	public static MIN_USDT_INVOICE_PRICE = InvoiceService.MIN_USDT_WITHDRAW_VALUE

	constructor(
		@Inject(getRepositoryToken(Invoice)) public repository: Repository<Invoice>,
		protected trxWallet: TRXWalletService,
	) {}


	async create(price: number) {
		const {privateKey, address: {base58: tronAddress}} = await tron.createAccount()

		const invoiceLifetime = 10
		const insertResult = await this.repository.createQueryBuilder()
			.insert()
			.into(Invoice)
			.values({
				address: tronAddress,
				privateKey,
				expireAt: addMinutes(new Date(), invoiceLifetime),
				price: price * 1e6,
				status: InvoiceStatus.PENDING
			})
			.returning("*")
			.execute()

		const invoice = this.repository.create(insertResult.raw[0] as object)
		this.logger.debug(`Invoice(${invoice.id}) is created`)
		return invoice
	}

	async withdraw(id: string, to: string) {
		const invoice = await this.repository.findOneByOrFail({id})

		if (!(invoice.status === InvoiceStatus.PARTIALLY_PAID || invoice.status === InvoiceStatus.PAID)) {
			throw new Error("No sense. Invoice has zero balance.")
		}

		const trc20Contract = await TRC20Contract.init(TronConfig.usdtContract)
		const invoiceBalance = await trc20Contract.balanceOf(invoice.address)
		if (invoiceBalance === 0 || (invoiceBalance / 1e6) < InvoiceService.MIN_USDT_WITHDRAW_VALUE) {
			throw new Error("Low balance for withdraw")
		}

		const trxWalletBalance = await this.trxWallet.getBalance()
		const cost = await this.trxWallet.estimateTokenTransferCost(invoice.address, to, invoiceBalance)
		const FeeLimit = Math.ceil(cost) // * 1.1

		this.logger.debug(`USDT Transfer Cost: ${FeeLimit / 1e6} TRX`)
		if (trxWalletBalance <= FeeLimit) {
			throw new Error("TRXWallet has zero balance, or hasn't enough for cover token transfer's cost.")
		}

		const {txid} = await this.trxWallet.send(invoice.address, FeeLimit)
		waitForSuccessTxStatus(txid, 45)
			.then((isOk) => {
				if (!isOk) {
					throw new Error("Failed to transfer from TRON_WALLET.")
				}
			})
			.then(() => {
				return trc20Contract.transfer(invoice.privateKey, to, invoiceBalance, FeeLimit)
			}).then((tokenTransferTxid) => {
			return waitForSuccessTxStatus(tokenTransferTxid, 45)
		})
			.then((isTokenTransferIsOk) => {
				if (!isTokenTransferIsOk) {
					throw new Error("Failed to transfer tokens.")
				}
			}).then(() => {
			this.logger.debug(`Invoice(${invoice.id}) is withdrawn(${invoiceBalance / 1e6}).`)
			return this.updateStatus(invoice.address, InvoiceStatus.WITHDRAWN)
		}).catch((e: any) => {
			this.logger.error(e, e.stack)
		})
	}

	async send(to: string, amount: number) {
		const trc20Contract = await this.trxWallet.send(to, amount)
		return trc20Contract.result
	}

	async updateStatus(address: string, status: InvoiceStatus) {
		await this.repository.update({address}, {status})
	}

	isPaid(paid: number, price: number) {
		const percent = paid / price * 100
		return percent > 95
	}


}