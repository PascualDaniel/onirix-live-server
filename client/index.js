const SOCKET_URL = `${window.location}`;

// Retrieve relevant HTML elements.
const broadcastButton = document.querySelector('#broadcast-button');
const sendToRoomButton = document.querySelector('#send-to-room-button');
const statusMessage = document.querySelector('#status-message');
const messageLog = document.querySelector('#message-log');
const enterButton = document.querySelector('#enter-button');
const leaveButton = document.querySelector('#leave-button');

// Create the socket and connect.
const socket = io(SOCKET_URL);

// Socket connection logic.
socket.on('connect', () => {
    // Log for debug purposes
    console.info('Connected to server.');
    // Update UI
    broadcastButton.disabled = false;
    sendToRoomButton.disabled = false;
    enterButton.disabled = false;
    leaveButton.disabled = false;
    document.querySelector('[name="room"]').disabled = false;
    statusMessage.innerText = 'Connected';
});



// Socket disconnection logic.
socket.on('disconnect', () => {
    // Log for debug purposes
    console.info('Disconnected from server.');
    // Update UI
    broadcastButton.disabled = true;
    sendToRoomButton.disabled = true;
    enterButton.disabled = true;
    leaveButton.disabled = true;
    statusMessage.innerText = 'Disconnected';
});



// Handle 'published' message. This is a custom message sent from the server.
socket.on('published', dto => {
    addMessage(dto.sender, dto.message, dto.room);
})



// Adds a message to the message log in the HTML view.
function addMessage(sender, message, room) {
    // Update UI
    const logLineElement = document.createElement('li');
    const senderElement = document.createElement('span');
    senderElement.classList.add('sender');
    if (!room) {
        senderElement.innerText = sender;
    } else {
        senderElement.innerText = `${sender}@${room}`;
    }
    logLineElement.appendChild(senderElement);
    const messageElement = document.createElement('span');
    messageElement.classList.add('message');
    messageElement.innerText = message;
    logLineElement.appendChild(messageElement);
    messageLog.appendChild(logLineElement);
}



// Room managing.
function onEnterRoom() {
    // Get the room to join from the UI
    const room = document.querySelector('[name="room"]').value;
    /* Send the join-room message (this message is a custom message defined
       in the server)
    */
    socket.emit('join-room', room);
    /* Note that the call to emit does not return any reply from the server. If
       a success confirmation is needed, the server can send a message, e.g.,
       room-joined or join-room-reply, back to the client.
    */
    // Update UI
    document.querySelector('[name="room"]').disabled = true;
    enterButton.disabled = true;
    leaveButton.disabled = false;
    sendToRoomButton.disabled = false;
}

function onLeaveRoom() {
    // Get the room to leave from the UI
    const room = document.querySelector('[name="room"]').value;
    /* Send the leave-room message (this message is a custom message defined
       in the server)
    */
    socket.emit('leave-room', room);
    // Update UI
    document.querySelector('[name="room"]').disabled = false;
    enterButton.disabled = false;
    leaveButton.disabled = true;
    sendToRoomButton.disabled = true;
}



// Broadcast a message from the server.
function onBroadcast(event) {
    // Do not try to send if the socket is not connected.
    if (!socket?.connected) {
        console.error('Cannot send because the socket is not connected.');
    }
    // Get name and message from UI
    const name = document.querySelector('[name="name"]').value;
    const message = document.querySelector('[name="message"]').value;
    // This will be the custom data that we send to the server.
    const dto = {
        sender: name,
        message,
    };
    // Send the message 'broadcast' to the server (this message is
    // defined in the gateway).
    socket.emit('broadcast', dto);
}



// Send to room a message from the server.
function onSendToRoom(event) {
    // Do not try to send if the socket is not connected.
    if (!socket?.connected) {
        console.error('Cannot send because the socket is not connected.');
    }
    // Get name, message and room from UI
    const name = document.querySelector('[name="name"]').value;
    const message = document.querySelector('[name="message"]').value;
    const room = document.querySelector('[name="room"]').value;
    // This will be the custom data that we send to the server.
    const dto = {
        sender: name,
        message,
        room,
    };
    /* Send the custom message 'send-to-room' to the server (this message is
       defined in the gateway).
    */
    socket.emit('send-to-room', dto);
}
