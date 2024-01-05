import { Module } from '@nestjs/common';
import { AppGateway } from './gateways/app.gateway';
import { AppController } from './controllers/app.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'client'),
  }),],
  controllers: [AppController],
  providers: [ AppGateway],
})
export class AppModule { }
