/**
 * Necessary to establish the connection
 */
import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';

/**
 * Class that communicates with the onirix-line-server
 */
class OxExperienceSocket {
  /**
   * URL of the place where the server is displyed
   */
  SOCKET_URL = `http://192.168.1.137:3000`;

  /**
   * Create the socket and connect.
   */
  socket = io(this.SOCKET_URL);

  /**
   * Agrupates a number os scenes
   */
  roomName = '';

  /**
   * Allow to control the scene content
   */
  embedSDK = '';

  /**
   * The diferents events can do with the embedsdk
   */
  Events = {
    ROTATE: 'rotate',
    TOGGLE: 'toggle',
    SET_LABEL_TEXT: 'setLabelText',
  };

  /**
   * Indicate the action send o recive from the server
   */
  ACTIONS = {
    SEND_ACTION: 'send-action',
    RECIVE_ACTION: 'recive-action',
  };

  /**
   * Constructor
   * Initialize the embedSDK and the listeners
   *
   * @param   embedsdk allows you to lister to events and control the scene content
   */
  constructor(sdk) {
    this.embedSDK = sdk;
    this.eventListeners = {};
    this.eventListenersCount = 0;
  }

  /**
   * Prepare the scene to the comunication
   *
   * @param   name of the room
   */
  initSocket(roomName) {
    this.roomName = roomName;

    this.socket.on('connect', () => {
      this.socket.emit('join-room', roomName);
    });

    /*
     * Handle 'published' message. This is a custom message sent from the server.
     */
    this.socket.on('published', (data) => {
      switch (data.action) {
        case this.Events.ROTATE:
          this.embedSDK.rotate(data.element, 0, 365, 0, 5, false);
          break;
        case this.Events.TOGGLE:
          this.embedSDK.toggle(data.element);
          break;
        case this.Events.SET_LABEL_TEXT:
          this.embedSDK.setLabelText(data.element, data.text);
          break;
      }
      this.triggerEvent(this.ACTIONS.RECIVE_ACTION, data);
    });
  }

  /**
   * Send a message to the server
   *
   * @param   info to send
   */
  sendAction(data) {
    data['room'] = this.roomName;
    this.socket.emit('recive-action', data);
    this.triggerEvent(this.ACTIONS.SEND_ACTION, data);
  }

  /**
   * Add new event to subscribe
   * @param ev name of the event
   * @param func function to execute when a actions is dispatch
   * @returns identifier of the listener
   */
  addEventListener(ev, func) {
    if (!this.eventListeners[ev]) {
      this.eventListeners[ev] = [];
    }
    const listenerId = this.eventListenersCount++;
    this.eventListeners[ev].push({
      id: listenerId,
      func: func,
    });
    return listenerId;
  }

  /**
   * Dispatch an event
   * @param ev name of the event
   * @param args data to send
   */
  triggerEvent(ev, args) {
    if (this.eventListeners[ev]) {
      this.eventListeners[ev].map((listener) => listener.func(args));
    }
  }

  /**
   * Hear an event
   * @param event name of the event
   * @param func function to execute
   * @returns the listener
   */
  subscribe(event, func) {
    return this.addEventListener(event, func);
  }
}

/**
 * This class is in charge of handling the interaction with the AR experience through the EmbedSDK.
 */
class OxExperience {
  /**
   * Ar element
   */
  LABEL_OID = '30d68225f4af4e24852458b25bc0d5f1';
  ICON_OID = '922f11793cff4874aa5f5fff42718e04';

  counter = 0;

  /**
   * Constructor
   * Initialize the embedSDK and te points of the table
   *
   * @param   embedsdk allows you to lister to events and control the scene content
   */
  constructor(embedSDK) {
    this.embedSDK = embedSDK;
  }

  /**
   * Update the value of the counter
   * @param counter new value
   */
  setCounter(counter) {
    this.counter = counter;
  }

  /**
   * Indicates the value of the counter
   * @returns number
   */
  getCounter() {
    return this.counter;
  }
}

/**
 * Onirix Embed SDK allows you to listen to events and control the scene when embedding experiences in a custom domain or from the online code editor.
 * For more information visit https://docs.onirix.com/onirix-sdk/embed-sdk
 */
import OnirixEmbedSDK from 'https://unpkg.com/@onirix/embed-sdk@1.2.3/dist/ox-embed-sdk.esm.js';
const embedSDK = new OnirixEmbedSDK(null, 'https://stage.onirix.com');
await embedSDK.connect();
const oxExperience = new OxExperience(embedSDK);
const oxExperienceSocket = new OxExperienceSocket(embedSDK);

oxExperienceSocket.initSocket('roomName');

/**
 * Listens when a user clicks on an element in the scene.
 */
embedSDK.subscribe(OnirixEmbedSDK.Events.ELEMENT_CLICK, (params) => {
  if (params.oid == oxExperience.ICON_OID) {
    oxExperience.setCounter(oxExperience.getCounter() + 1);
    const data = {
      action: oxExperienceSocket.Events.SET_LABEL_TEXT,
      element: oxExperience.LABEL_OID,
      text: 'Counter: ' + oxExperience.getCounter(),
      counter: oxExperience.getCounter(),
    };
    oxExperienceSocket.sendAction(data);
  }
});

/**
 * Listens when the scene recive an action.
 */
oxExperienceSocket.subscribe(
  oxExperienceSocket.ACTIONS.RECIVE_ACTION,
  (params) => {
    oxExperience.setCounter(params.counter);
  },
);
