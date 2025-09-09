import {IsNumber, Min} from "class-validator";
import {InvoiceService} from "@modules/gateway/invoice/invoice.service";


export class CreateInvoiceDto {
	@IsNumber()
	@Min(InvoiceService.MIN_USDT_INVOICE_PRICE)
	price: number
}