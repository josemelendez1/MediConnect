import "reflect-metadata";
import { DataSource } from "typeorm";

const AppDataSource = new DataSource ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: 'mediconnect',
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true,
});

AppDataSource.initialize();

export { AppDataSource };