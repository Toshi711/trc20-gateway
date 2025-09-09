import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import {CreateDateColumn} from "@db/db-columns";


export enum InvoiceStatus {
	PENDING = "PENDING",
	PAID = "PAID",
	PARTIALLY_PAID = "PARTIALLY_PAID",
	EXPIRED = "EXPIRED",
	WITHDRAWN = "WITHDRAWN"
}



@Entity()
export class Invoice {
	@PrimaryGeneratedColumn("increment", {type: "bigint"})
	id: string

	@Column("integer")
	price: number // min unit


	@Column("varchar", {
		unique: false,
		length: 34
	})
	address: string // base58

	@Column("varchar", {
		length: 64
	})
	privateKey: string

	@Column("enum", {
		enum: InvoiceStatus
	})
	status: InvoiceStatus


	@CreateDateColumn()
	createdAt: Date

	@Column("timestamptz")
	expireAt: Date
}