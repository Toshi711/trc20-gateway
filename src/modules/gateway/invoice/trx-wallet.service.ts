import {Injectable} from "@nestjs/common";
import {tron, TronConfig} from "@config";
import {estimateEnergy} from "@modules/contrib/estimate-energy";


@Injectable()
export class TRXWalletService {
	protected address: string
	protected privateKey: string

	constructor() {
		this.privateKey = TronConfig.trxWallet.privateKey
		this.address = tron.address.fromPrivateKey(this.privateKey)
	}


	async getBalance() {
		return +(await tron.trx.getBalance(this.address))
	}

	async estimateTokenTransferCost(sender: string, recipient: string, amount: number) {
		const bandwidth = 345
		const energy = await estimateEnergy({
			contractAddress: TronConfig.usdtContract,
			sender,
			recipient,
			amount
		})
		return energy * TronConfig.energyPrice + bandwidth * TronConfig.bandwidthPrice
	}


	async send(to: string, amount: number) {
		const from = tron.address.fromPrivateKey(this.privateKey)
		const obj = await tron.transactionBuilder.sendTrx(
			to,
			amount,
			from
		)
		const signedTx = await tron.trx.sign(obj, this.privateKey)
		return await tron.trx.sendRawTransaction(signedTx)

	}
}