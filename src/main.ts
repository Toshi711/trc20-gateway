import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {CommonValidationPipe} from "@modules/contrib/pipes/common-validation.pipe";
import { Logger } from 'nestjs-pino';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {bufferLogs: true});
	app.useLogger(app.get(Logger))
	app.useGlobalPipes(new CommonValidationPipe())
	const server = await app.listen(8000)
	server.setTimeout(600_000)
}
void bootstrap();
