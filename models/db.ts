import "reflect-metadata";
import { DataSource } from "typeorm";

require('dotenv').config();

const AppDataSource = new DataSource ({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true,
});

AppDataSource.initialize();

export { AppDataSource };