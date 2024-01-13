import { Test, TestingModule } from '@nestjs/testing';
import { AppGateway } from './app.gateway';
import { Server, Socket } from 'socket.io';
import { PublishDTO } from '../dtos/publish.dto';
import WebSocket from 'jest-websocket-mock';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { RoomInfo } from '../../models/room-info';
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

it('should handle leave room', () => {
    const spy = jest.spyOn(appGateway, 'handleLeaveRoom');
    appGateway.handleLeaveRoom('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
    expect(spy).toHaveBeenCalledWith('room', client);
});

it('should handle leave room when client is part of the room', () => {
  // Arrange
  const room = 'room';
  const hostClient = {
    id: 'hostId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const otherClient = {
    id: 'otherId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const roomInfo = new RoomInfo(1, hostClient.id);
  roomInfo.addPlayer(hostClient.id);
  roomInfo.addPlayer(otherClient.id);
  appGateway.rooms.set(room, roomInfo);

  // Act
  appGateway.handleLeaveRoom(room, otherClient);

  // Assert
  expect(otherClient.leave).toHaveBeenCalledWith(room);
  expect(appGateway.rooms.get(room).players).not.toContain(otherClient.id);
});

it('should handle close room', () => {
  const spy = jest.spyOn(appGateway, 'handleCloseRoom');
  appGateway.handleCloseRoom('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith('room', client);
});

// Try to delete a room that you didn't create
it('should not close room when client is not the creator', () => {
  // Arrange
  const room = 'room';
  const hostClient = {
    id: 'hostId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const otherClient = {
    id: 'otherId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const roomInfo = new RoomInfo(1, hostClient.id);
  roomInfo.addPlayer(hostClient.id);
  roomInfo.addPlayer(otherClient.id);
  appGateway.rooms.set(room, roomInfo);

  // Act
  const result = appGateway.handleCloseRoom(room, otherClient);

  // Assert
  expect(result).toBe(false);
  expect(otherClient.leave).not.toHaveBeenCalled();
  expect(appGateway.rooms.has(room)).toBe(true);
});

it('should handle join room when room is already created', () => {
  // Arrange
  const room = 'room';
  const hostClient = {
    id: 'hostId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const otherClient = {
    id: 'otherId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const roomInfo = new RoomInfo(1, hostClient.id);
  roomInfo.addPlayer(hostClient.id);
  appGateway.rooms.set(room, roomInfo);

  // Act
  appGateway.handleJoinRoom(room, otherClient);

  // Assert
  expect(otherClient.join).toHaveBeenCalledWith(room);
  expect(appGateway.rooms.get(room).players).toContain(otherClient.id);
});


it('should handle create room', () => {
  const client = {
    id: 'testId',
    join: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  
  const spy = jest.spyOn(appGateway, 'handleCreateRoom');
  appGateway.handleCreateRoom('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith('room', client);
});

it('should not create room when room already exists', () => {
  // Arrange
  const room = 'room';
  const hostClient = {
    id: 'hostId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const otherClient = {
    id: 'otherId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const roomInfo = new RoomInfo(1, hostClient.id);
  roomInfo.addPlayer(hostClient.id);
  appGateway.rooms.set(room, roomInfo);

  // Act
  const result = appGateway.handleCreateRoom(room, otherClient);

  // Assert
  expect(result).toBe(false);
  expect(otherClient.join).not.toHaveBeenCalled();
  expect(appGateway.rooms.get(room).hostId).toBe(hostClient.id);
});

it('should handle receive action', () => {
  const data = { action: 'testAction' };
  const spy = jest.spyOn(appGateway, 'handleReciveAction');
  appGateway.handleReciveAction(data, client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith(data, client);
});

it('should handle start', () => {
  const spy = jest.spyOn(appGateway, 'handleStart');
  appGateway.handleStart('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith('room', client);
});

it('should handle game start when client is the creator of the room', () => {
  // Arrange
  const room = 'room';
  const hostClient = {
    id: 'hostId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const otherClient = {
    id: 'otherId',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  const roomInfo = new RoomInfo(0, hostClient.id);
  roomInfo.addPlayer(hostClient.id);
  roomInfo.addPlayer(otherClient.id);
  appGateway.rooms.set(room, roomInfo);

  // Act
  const result = appGateway.handleStart(room, hostClient);

  // Assert
  expect(result).toBe(true);
  expect(appGateway.rooms.get(room).numberOfPlayers).toBe(2);
});

it('should handle is turn', () => {
  const spy = jest.spyOn(appGateway, 'handleIsTurn');
  appGateway.handleIsTurn('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith('room', client);
});


it('should handle win', () => {
  const spy = jest.spyOn(appGateway, 'handleWin');
  appGateway.handleWin('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith('room', client);
});

it('should handle pass turn', () => {
  const spy = jest.spyOn(appGateway, 'handlePassTurn');
  appGateway.handlePassTurn('room', client as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>);
  expect(spy).toHaveBeenCalledWith('room', client);
});



});