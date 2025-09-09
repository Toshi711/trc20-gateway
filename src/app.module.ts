import {Global, Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {getDataSourceOptions} from "@db/get-data-source-options";
import {GatewayModule} from "@modules/gateway/gateway.module";
import { LoggerModule } from 'nestjs-pino';
@Global()
@Module({
  imports: [
	  LoggerModule.forRoot({
		  pinoHttp: {
			  level: "trace"
		  }
	  }),
	  TypeOrmModule.forRoot(getDataSourceOptions()),
	  GatewayModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
