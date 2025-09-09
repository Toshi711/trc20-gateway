import {tron} from "@config";
import {BigNumber} from "ethers";

export class TRC20Contract {

	protected contract: any

	protected constructor() {}

	static async init(contractAddress: string) {
		const trc20Contract = new TRC20Contract()
		const {abi} = await tron.trx.getContract(contractAddress);
		trc20Contract.contract = tron.contract(abi.entrys, contractAddress);
		return trc20Contract
	}


	async balanceOf(address: string) {
		const _balance = await this.contract.methods.balanceOf(address).call() as BigNumber
		return _balance.toNumber()
	}

	async transfer(senderPrivateKey: string, to: string, amount: number, feeLimit: number) {
		tron.setPrivateKey(senderPrivateKey)
		return await this.contract.methods.transfer(to, amount).send({
			feeLimit,
			callValue: 0
		}) as string
	}
}
