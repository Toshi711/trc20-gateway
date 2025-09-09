import {Expose, plainToInstance, Transform} from "class-transformer";
import {IsNumber, IsNumberString, IsString, IsUrl, validateSync} from "class-validator";
import * as path from "path";

export const ToNumber = () => Transform(({value}) => Number(value))

export abstract class EnvConfig {

	protected constructor() {}

	static getConfig<T>() {
		const config = plainToInstance(this as unknown as new() => {}, process.env, {exposeDefaultValues: true})
		EnvConfig.validate(config)
		return config as T
	}

	private static validate(config: object) {
		const errors = validateSync(config, {whitelist: true})
		if (errors.length !== 0) {
			throw new Error(errors.toString())
		}
	}

}



export class DatabaseConfigDto extends EnvConfig {
	@IsString()
	POSTGRES_HOST: string
	@IsNumberString()
	POSTGRES_PORT: string
	@IsString()
	POSTGRES_USER: string
	@IsString()
	POSTGRES_PASSWORD: string
	@IsString()
	POSTGRES_DB: string
}

export class RedisConfigDto extends EnvConfig {
	@IsString()
	@Expose({name: "REDIS_HOST"})
	HOST: string

	@Expose({name: "REDIS_PORT"})
	@IsString()
	PORT: string

	@IsNumber()
	@Expose({name: "REDIS_DB"})
	@Transform(({value}) => Number(value))
	DB: number = 0

	public getDSN() {
		return `redis://${this.HOST}:${this.PORT}/${this.DB}`
	}
}

export class TronConfigDto extends EnvConfig {
	@Expose({name: "TRON_WALLET_PRIVATE_KEY"})
	@IsString()
	walletPrivateKey: string

	@Expose({name: "TRON_API_KEY"})
	@IsString()
	trongridApiKey: string

	@Expose({name: "TRON_ADDRESS"})
	@IsString()
	tronAddress: string

	@Expose({name: "WEBHOOK_URL"})
	@IsString()
	webhookUrl: string
}