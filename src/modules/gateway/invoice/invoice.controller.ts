import {BadRequestException, Body, Controller, Get, HttpCode, Logger, Param, Post} from "@nestjs/common";
import {InvoiceService} from "@modules/gateway/invoice/invoice.service";
import {WithdrawInvoiceDto} from "@modules/gateway/invoice/dto/WithdrawInvoice.dto";
import {CreateInvoiceDto} from "@modules/gateway/invoice/dto/CreateInvoice.dto";
import {sleep} from "@modules/contrib/other/sleep";
import {PinoLogger} from "nestjs-pino";
import {SendDto} from "@modules/gateway/invoice/dto/Send.dto";


@Controller("invoice")
export class InvoiceController {

	protected logger = new Logger(InvoiceController.name)

	constructor(
		protected invoiceService: InvoiceService
	) {}


	@Get("retrieve/:id")
	@HttpCode(200)
	async retrieve(@Param("id") id: string) {
		return this.invoiceService.repository.findOneByOrFail({id})
	}


	@Post("create")
	@HttpCode(200)
	async create(@Body() {price}: CreateInvoiceDto) {
		return await this.invoiceService.create(price)
	}

	@Post("withdraw")
	@HttpCode(200)
	async withdraw(@Body() {id, to}: WithdrawInvoiceDto) {
		try {
			await this.invoiceService.withdraw(id, to)
		} catch (e: any) {
			this.logger.error(e, e.stack)
			throw new BadRequestException(e.message)
		}
	}

	@Post("send")
	@HttpCode(200)
	async send(@Body() {to, amount}: SendDto) {
		try {
			await this.invoiceService.send(to, amount)
		} catch (e: any) {
			this.logger.error(e, e.stack)
			throw new BadRequestException(e.message)
		}
	}


}