import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PublishDTO } from './publish.dto';
import { RoomInfo } from './room-info';

/**
 * Single gateway of the application. There is only a single gateway since this
 * is a simple prototype but there could be more. Gateways have the same job as
 * controllers on HTTP application.
 */
@WebSocketGateway({
  cors: true, // Allow requests through CORS.
})
export class AppGateway {



  /**
   * This is an instance of the WebSocket server.
   */
  @WebSocketServer() server: Server;

  //list of rooms with a counter of users
  rooms: Map<string, RoomInfo> = new Map<string, RoomInfo>();




  /**
   * This is the handler of the message 'broadcast'. This would be equivalent\
   * to the handler of the route '/broadcast' of an HTTP application.
   * @param dto This is the data of the message.
   * @param client This is the socket of the client who sent the data.
   * @returns A boolean that will be sent back to the client.
   */
  @SubscribeMessage('broadcast')
  handleBroadcast(
    @MessageBody() dto: PublishDTO,
    @ConnectedSocket() client: Socket,
  ): boolean {
    console.log(
      `${new Date().toISOString()}\t[${client.id}]: broadcast ${JSON.stringify(
        dto,
      )}`,
    );
    /* This sends the published message to EVERY client, including the
           sender.
        */
    return this.server.sockets.emit('published', dto);
    /* If the sender must be excluded (that is, send to everyone except the
           sender of the 'broadcast' message), the client's broadcast socket can
           be used:

           return client.broadcast.emit('published', dto);
        */
  }

  /**
   * This is the handler of the message 'send-to-room'.
   * @param dto This is the data of the message.
   * @param client This is the socket of the client who sent the data.
   * @returns A boolean that will be sent back to the client.
   */
  @SubscribeMessage('send-to-room')
  handleSendToRoom(
    @MessageBody() dto: PublishDTO,
    @ConnectedSocket() client: Socket,
  ): boolean {
    console.log(
      `${new Date().toISOString()}\t[${client.id
      }]: send-to-room ${JSON.stringify(dto)}`,
    );
    /* This sends the published message to EVERY client in the room
           the client is in, including the sender.
        */
    return this.server.to(dto.room).emit('published', dto);
    /* If the sender must be excluded (that is, send to everyone in the room
           except the sender of the 'send-to-room' message), the client's socket
           can be used:

           return client.to(dto.room).emit('published', dto);
        */
  }

  /**
   * Handler for the message 'join-room' that allows a user to join a room,
   * that is a group of clients that will receive the same information.
   * @param room Name of the room (data of the message).
   * @param client Client socket.
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id}]: join-room ${JSON.stringify(
        room,
      )}`,
    );

    //add a room to the list of rooms
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new RoomInfo(1, client.id));
      this.rooms.get(room).addPlayer(client.id);
    } else {
      //this.rooms.set(room, new RoomInfo(this.rooms.get(room).numberOfPlayers+1, this.rooms.get(room).hostId));

      this.rooms.get(room).numberOfPlayers = this.rooms.get(room).numberOfPlayers + 1;
      this.rooms.get(room).addPlayer(client.id);
    }
    /* Joins the room specified. All the rooms a socket has joined are
           listed in client.rooms.
        */
    client.join(room);
    this.server.to(client.id).emit('room-info', this.rooms.get(room).numberOfPlayers);
    console.log("room " + client.id + " " + this.rooms.get(room));
  }

  /**
   * Handler for the message 'leave-room' that allows a user to leave a room.
   * @param room Name of the room (data of the message).
   * @param client Client socket.
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id}]: leave-room ${JSON.stringify(
        room,
      )}`,
    );

    //remove a room from the list of rooms
    if (this.rooms.has(room)) {
      this.rooms.get(room).numberOfPlayers = this.rooms.get(room).numberOfPlayers - 1;
      this.rooms.get(room).removePlayer(client.id);

      //  this.rooms.set(room, new RoomInfo(this.rooms.get(room).numberOfPlayers-1, this.rooms.get(room).hostId) );

    } else if (this.rooms.get(room).numberOfPlayers == 1) {
      this.rooms.delete(room);
    }

    // Leaves the room specified:
    client.leave(room);
  }

  /**
   * Handler for the message 'recive-action' that allows to recive abd send differents actions
   * @param data Info about the action.
   * @param client Client socket.
   */
  @SubscribeMessage('recive-action')
  handleReciveAction(
    @MessageBody() data: object,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id
      }]: recive-data ${JSON.stringify(data)}`,
    );

    return this.server.to(data['room']).emit('published', data);
  }


  @SubscribeMessage('game-start')
  handleStart(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id
      }]: start ${JSON.stringify(room)}`,
    );
    if (this.rooms.has(room)) {
      if (this.rooms.get(room).hostId == client.id) {

        this.rooms.get(room).playerturn = 1;
        this.rooms.get(room).playerturnID = this.rooms.get(room).hostId;

        this.server.to(room).emit('start')
      }
    }
  }

  @SubscribeMessage('is-my-turn')
  handleIsTurn(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id
      }]: turn ${JSON.stringify(client.id)}`,
    );

    if (this.rooms.has(room)) {
      if (this.rooms.get(room).playerturnID == client.id) {
        this.server.to(client.id).emit('your-turn', this.rooms.get(room).playerturnID);
      }
    }


  }

  @SubscribeMessage('win')
  handleWin(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id
      }]: win ${JSON.stringify(client.id)}`,
    );

    if (this.rooms.has(room)) {
      if (this.rooms.get(room).playerturnID == client.id) {
        this.server.to(room).emit('winner', client.id)
      }
    }

  }
  @SubscribeMessage('pass-turn')
  handlePassTurn(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `${new Date().toISOString()}\t[${client.id
      }]: pass ${JSON.stringify(client.id)}`,
    );

    if (this.rooms.has(room)) {
      if (this.rooms.get(room).playerturnID == client.id) {
        if (this.rooms.get(room).playerturn == this.rooms.get(room).numberOfPlayers) {
          this.rooms.get(room).playerturn = 1;
          this.rooms.get(room).playerturnID = this.rooms.get(room).players[this.rooms.get(room).playerturn - 1];
          this.server.to(room).emit('next-turn', this.rooms.get(room).playerturnID);

        } else {
          this.rooms.get(room).playerturn = this.rooms.get(room).playerturn + 1;
          this.rooms.get(room).playerturnID = this.rooms.get(room).players[this.rooms.get(room).playerturn - 1];
          this.server.to(room).emit('next-turn', this.rooms.get(room).playerturnID);
        }
      }
    }

  }



}