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
  SOCKET_URL = `http://192.168.1.104:3000`;

  /**
   * Create the socket and connect.
   */
  socket = io(this.SOCKET_URL);

  /**
   * Agrupates a number os scenes
   */
  roomName = '';

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
      if (data.action === 'rotate') {
        const params = {
          element: data.element,
          x: 0,
          y: 360,
          z: 0,
          time: 5,
          loop: false,
        };
        this.onRotate(params);
      } else if (data.action === 'toggleVisibility') {
        const params = {
          element: data.element,
        };

        this.onToggleVisibility(params);
      }
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
  }
}

/**
 * This class is in charge of handling the interaction with the AR experience through the EmbedSDK.
 */
class OxExperience {
  /**
   * Ar element
   */
  LABEL_ROTATE_OID = 'c03b5ac1466e48849d02dacc8e9bbd1c';
  LABEL_VISIBILITY_OID = '2973aad8811d4b3f8189708101d586cf';
  ICON_OID = '922f11793cff4874aa5f5fff42718e04';

  /**
   * Constructor
   * Initialize the embedSDK
   *
   * @param   embedsdk allows you to lister to events and control the scene content
   */
  constructor(embedSDK) {
    this.embedSDK = embedSDK;
  }

  /**
   * Rotate the selected element
   *
   * @param   info about the element to rotate
   */
  rotate(data) {
    this.embedSDK.rotate(
      data.element,
      data.x,
      data.y,
      data.z,
      data.time,
      data.loop,
    );
  }

  /**
   * Enable o disable the visibility of the element
   *
   * @param   info abaut the elemnt
   */
  toggleVisibility(data) {
    this.embedSDK.toggle(data.element);
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
const oxExperienceSocket = new OxExperienceSocket();

oxExperienceSocket.initSocket('roomName');

oxExperienceSocket.onRotate = function (data) {
  oxExperience.rotate(data);
};

oxExperienceSocket.onToggleVisibility = function (data) {
  oxExperience.toggleVisibility(data);
};

/**
 * Listens when a user clicks on an element in the scene.
 */
embedSDK.subscribe(OnirixEmbedSDK.Events.ELEMENT_CLICK, (params) => {
  if (params.oid == oxExperience.LABEL_ROTATE_OID) {
    const data = {
      action: 'rotate',
      element: oxExperience.ICON_OID,
    };
    oxExperienceSocket.sendAction(data);
  } else if (params.oid === oxExperience.LABEL_VISIBILITY_OID) {
    const data = {
      action: 'toggleVisibility',
      element: oxExperience.ICON_OID,
    };
    oxExperienceSocket.sendAction(data);
  }
});
