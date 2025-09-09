import {DatabaseConfigDto} from "../config/configs.dto";
import {DataSourceOptions} from "typeorm";
import path from "path";
import {DEVELOPMENT, PRODUCTION, PROJECT_DIR} from "@config";

type Logging = Array<"error" | "query" | "schema" | "warn" | "info" | "log" | "migration"> | true
export function getDataSourceOptions() {

	const DB_LOGGING: Logging = ["error", "migration"]
	const {
		POSTGRES_HOST,
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_DB,
		POSTGRES_PORT
	} = DatabaseConfigDto.getConfig<DatabaseConfigDto>()
	const DB_CONFIG = {
		type: "postgres",
		host: POSTGRES_HOST,
		port: parseInt(POSTGRES_PORT),
		username: POSTGRES_USER,
		password: POSTGRES_PASSWORD,
		database: POSTGRES_DB,
	} as DataSourceOptions
	const sharedOptions = {
		schema: "public",
		logging: DB_LOGGING,
		entities: [path.join(PROJECT_DIR, "**/*.entity.{ts,js}")],
	}
	let dataSourceOptions: DataSourceOptions

	if (DEVELOPMENT || PRODUCTION) {
		dataSourceOptions = {
			extra: 16,
			...DB_CONFIG,
			...sharedOptions,
			migrationsRun: true,
			dropSchema: false,
			synchronize: false,
			migrations: [path.join(PROJECT_DIR, "db/migrations/**/*.{ts,js}")],
			migrationsTableName: "migrations",
		}
		return dataSourceOptions
	} else {
		dataSourceOptions = {
			...DB_CONFIG,
			...sharedOptions,
			synchronize: true,
			dropSchema: true,
		}
		return dataSourceOptions
	}
}