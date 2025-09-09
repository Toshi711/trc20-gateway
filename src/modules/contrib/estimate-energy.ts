import {ethers} from "ethers";
import {tron} from "@config";
import {TRC20Contract} from "@modules/contrib/trc20-contract";
import {toHex} from "web3-utils";
// @ts-ignore
// import {logger} from "@logger";
import axios from "axios";

export type EstimateEnergyParams = {
	sender: string
	recipient: string
	contractAddress: string
	amount: number
}

export async function estimateEnergy({sender, recipient, amount, contractAddress}: EstimateEnergyParams) {
	async function encodeParams(inputs: any) {
		const AbiCoder = ethers.utils.AbiCoder;
		const ADDRESS_PREFIX_REGEX = /^(41)/;
		let typesValues = inputs
		let parameters = ''

		if (typesValues.length == 0)
			return parameters
		const abiCoder = new AbiCoder();
		let types = [];
		const values = [];

		for (let i = 0; i < typesValues.length; i++) {
			let {type, value} = typesValues[i];
			if (type == 'address')
				value = value.replace(ADDRESS_PREFIX_REGEX, '0x');
			else if (type == 'address[]')
				value = value.map((v: string) => toHex(v).replace(ADDRESS_PREFIX_REGEX, '0x'));
			types.push(type);
			values.push(value);
		}
		try {
			parameters = abiCoder.encode(types, values).replace(/^(0x)/, '');
		} catch (ex: any) {
			// logger.error(ex, ex.stack)
		}
		return parameters

	}

	const trc20Contract = await TRC20Contract.init(contractAddress)
	const balance = await trc20Contract.balanceOf(sender)
	if (balance === 0 || balance < amount) {
		throw new Error("Provided [amount] must be to equal [sender]'s balance or be lower")
	}
	const functionSelector = 'transfer(address,uint256)';
	const parameters = [{type: 'address', value: tron.address.toHex(recipient)}, {type: 'uint256', value: amount}]

	const resp = await axios.post(
		"https://api.trongrid.io/wallet/triggerconstantcontract",
		{
			owner_address: sender,
			contract_address: contractAddress,
			function_selector: functionSelector,
			visible: true,
			parameter: await encodeParams(parameters)
		},
		{responseType: "json"}
	)
	const data = resp.data as { energy_used: number, result: { message?: string } }
	if (data.result.message?.includes("REVERT")) {
		throw new Error(`Failed. ${data.result.message}`)
	}

	return data.energy_used
}