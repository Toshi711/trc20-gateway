import * as path from "path";
import * as dotenv from "dotenv"
import process from "process";
import {Logger} from "@nestjs/common";
import {RedisConfigDto, TronConfigDto} from "./config/configs.dto";
// @ts-ignore
import TronWeb from "tronweb"
const logger = new Logger("Configuration")

const _isSrcDir = path.resolve(__dirname).split("/").at(-1) === "src"
logger.warn(_isSrcDir ? "IN SRC" : "IN DIST")
export const ROOT_DIR = path.join(path.resolve(__dirname), "../")
export const PROJECT_DIR = _isSrcDir ? path.join(ROOT_DIR, "src") : path.join(ROOT_DIR, "dist")

export const DEVELOPMENT = process.env.NODE_ENV === "development"
export const PRODUCTION = process.env.NODE_ENV === "production"
export const TEST = process.env.NODE_ENV === "test"



function _setEnvironment() {
	if (PRODUCTION) {
		logger.log("Production environment")
	} else if (DEVELOPMENT) {
		logger.log("Development environment")
		dotenv.config({path: path.join(ROOT_DIR, ".env.development")})
	} else if (TEST) {
		dotenv.config({path: path.join(ROOT_DIR, ".env.development")})
		logger.log("Test Environment")
	} else {
		throw new Error("Set correct NODE_ENV")
	}
}

_setEnvironment()

// export const RedisConfig = RedisConfigDto.getConfig<RedisConfigDto>()
export const _TronConfig = TronConfigDto.getConfig<TronConfigDto>()

export const TronConfig = {
	usdtContract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
	energyPrice: 420,
	bandwidthPrice: 10,
	trxWallet: {
		privateKey: _TronConfig.walletPrivateKey
	},
	webhookUrl: _TronConfig.webhookUrl
}


export const tron = new TronWeb({
	fullHost: 'https://api.trongrid.io',
	headers: {"TRON-PRO-API-KEY": _TronConfig.trongridApiKey},
	privateKey: _TronConfig.walletPrivateKey
})