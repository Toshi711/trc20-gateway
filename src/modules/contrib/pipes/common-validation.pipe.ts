import {ValidationError, ValidationPipe, ValidationPipeOptions} from "@nestjs/common";
import {ClassTransformOptions} from "class-transformer";


export const CommonTransformOptions: ClassTransformOptions = {
	exposeDefaultValues: true,
	excludeExtraneousValues: false, // Используем whitelist
	enableImplicitConversion: false
}

export class CommonValidationPipe extends ValidationPipe {
	constructor(options?: ValidationPipeOptions) {

		const opts: ValidationPipeOptions = {
			whitelist: true,
			errorHttpStatusCode: 400,
			validateCustomDecorators: true,
			transform: true,
			transformOptions: {
				...CommonTransformOptions
			},
			forbidUnknownValues: true,
			...options
		}
		super(opts)
	}

}

