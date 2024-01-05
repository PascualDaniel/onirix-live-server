import { Test, TestingModule } from '@nestjs/testing';
import { AppGateway } from './app.gateway';
import { Server, Socket } from 'socket.io';
import { PublishDTO } from './publish.dto';
import WebSocket from 'jest-websocket-mock';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
describe('AppGateway', () => {
  let appGateway: AppGateway;
  let client: WebSocket;
  let server: Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppGateway],
    }).compile();

    appGateway = module.get<AppGateway>(AppGateway);
    client = new WebSocket( 'http://localhost:3000');
    server = new Server();
    appGateway.server = server;
  });

  afterEach(() => {
 
    client.close();
  });

it('should handle broadcast', () => {
    const dto: PublishDTO = { 
            sender: 'sender',
            message: 'message',
            room: 'room'
     };
    const spy = jest.spyOn(appGateway, 'handleBroadcast');
    appGateway.handleBroadcast(dto, client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
    expect(spy).toHaveBeenCalledWith(dto, client);
});

it('should handle send to room', () => {
    const dto: PublishDTO = { 
            sender: 'sender',
            message: 'message',
            room: 'room'
     };
    const spy = jest.spyOn(appGateway, 'handleSendToRoom');
    appGateway.handleSendToRoom(dto, client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
    expect(spy).toHaveBeenCalledWith(dto, client);
});


it('should handle join room', () => {
    const spy = jest.spyOn(appGateway, 'handleJoinRoom');
    appGateway.handleJoinRoom('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
    expect(spy).toHaveBeenCalledWith('room', client);
});

});