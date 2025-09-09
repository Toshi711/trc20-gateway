import {InvoiceStatus} from "@modules/gateway/invoice/invoice.entity";


export interface WebhookMessage {
	invoiceId: string
	status: InvoiceStatus.PAID | InvoiceStatus.PARTIALLY_PAID | InvoiceStatus.EXPIRED
	amount?: number
}

