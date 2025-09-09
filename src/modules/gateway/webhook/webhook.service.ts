import {Injectable, Logger} from "@nestjs/common";
import {TronConfig} from "@config";
import {WebhookMessage} from "@modules/gateway/webhook/webhook-message.interface";
import {defer, from, lastValueFrom, retry} from "rxjs";
import axios from "axios";

@Injectable()
export class WebhookService {
	protected static webhookUrl = TronConfig.webhookUrl
	protected logger = new Logger(WebhookService.name)


	protected async request(msg: WebhookMessage) {
		const source = defer(() => from(axios.post(WebhookService.webhookUrl, msg)))
		return lastValueFrom(source.pipe(retry({count: 5, delay: 5_000})))
	}

	public async send(msg: WebhookMessage) {
		try {
			await this.request(msg)
		} catch (e: any) {
			this.logger.error(e, e.stack)
		}
	}
}