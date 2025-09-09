import {IsNumber, IsString} from "class-validator";


export class SendDto {

	@IsString()
	to: string

	@IsNumber()
	amount: number
}