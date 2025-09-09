import {TRXWalletService} from "@modules/gateway/invoice/trx-wallet.service";
import {tron, TronConfig} from "@config";
import {waitForSuccessTxStatus} from "@modules/contrib/wait-for-success-tx-status";

jest.setTimeout(1000 * 60 * 60)
describe('TRXWalletService', function () {

	let privateKey = TronConfig.trxWallet.privateKey
	let address = tron.address.fromPrivateKey(privateKey)


	let wallet = new TRXWalletService()


	it('should return balance', async () => {
		const balance = await wallet.getBalance()
		expect(typeof balance).toBe("number")
	});

	it('should send works', async () => {
		const to = "TPdDYhvjPKt9cyTvp1GeTt186edDzfAYj9"
		const {txid} = await wallet.send(to, 10 * 1e6)
		const result = await waitForSuccessTxStatus(txid, 60 * 5)
	});

});