import {CreateDateColumn as CDC, UpdateDateColumn as UDC} from "typeorm";


export const CreateDateColumn = () =>  CDC({
	type: "timestamptz"
})
export const UpdateDateColumn = () => UDC({
	type: "timestamptz"
})
