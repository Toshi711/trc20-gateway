import {tron} from "@config";
import utils from "tronweb";
import {sleep} from "@modules/contrib/other/sleep";
// @ts-ignore
// import {logger} from "@logger";


export async function waitForSuccessTxStatus(txid: string, seconds: number) {
	for (let i = 0; i < seconds; i++) {
		await sleep(1000)
		const tx = await tron.trx.getTransaction(txid)
		// logger.debug(tx)
		if (tx.ret[0].contractRet === "SUCCESS") {
			return true
		}
	}
	return false
}