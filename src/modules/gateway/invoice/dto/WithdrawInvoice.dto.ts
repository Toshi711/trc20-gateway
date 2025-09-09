import {IsNumber, IsNumberString, Matches} from "class-validator";


export class WithdrawInvoiceDto {

	@IsNumberString()
	id: string

	@Matches(/T[A-Za-z1-9]{33}/)
	to: string
}