export class RoomInfo {
    numberOfPlayers: number;
    hostId: string;
    playerturn?: number;
    playerturnID?: string;
    
    players: string[] = [];


    constructor(numberOfPlayers: number = 0, hostId: string, playerturn?: number, playerturnID?: string) {
        this.numberOfPlayers = numberOfPlayers;
        this.hostId = hostId;
        this.playerturn = playerturn;
        this.playerturnID = playerturnID;
    }



    addPlayer(player: string){
        this.players.push(player);
    }

    removePlayer(player: string){
        this.players = this.players.filter(item => item !== player);
    }
    
}
