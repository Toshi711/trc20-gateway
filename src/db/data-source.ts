import {DataSource} from "typeorm";
import path from "path"
import {getDataSourceOptions} from "./get-data-source-options";


export default new DataSource(getDataSourceOptions()) // FOR CLI

