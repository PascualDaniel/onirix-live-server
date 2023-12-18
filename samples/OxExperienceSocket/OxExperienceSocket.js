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
  SOCKET_URL = 'URL';

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
    ENABLE: 'enable',
    DISABLE: 'disable',
    ROTATE: 'rotate',
    TOGGLE: 'toggle',
    SET_LABEL_TEXT: 'setLabelText',
    ENABLE_ALL: 'enableAll',
    DISABLE_ALL: 'disableAll',
    PLAY: 'play',
    PAUSE: 'pause',
    TRANSLATE: 'translate',
    ROTATE_TO: 'rotateTo',
    ROTATE_TO_QUATERNION: 'rotateToQuaternion',
    SCALE: 'scale',
    PLAY_ANIMATION: 'playAnimation',
    STOP_ANIMATION: 'stopAnimation',
    TRANSLATE_TO_POSITION: 'translateToPosition',
    TRANSLATE_TO_ELEMENT: 'translateToElement',
    RESET_SCENES: 'resetScenes',
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
        case this.Events.ENABLE:
          this.embedSDK.enable(
            data.element,
            data.transition != null ? data.transition : 0,
            data.time != null ? data.time : 1,
          );
          break;
        case this.Events.DISABLE:
          this.embedSDK.disable(
            data.element,
            data.transition != null ? data.transition : 0,
            data.time != null ? data.time : 1,
          );
          break;
        case this.Events.ENABLE_ALL:
          this.embedSDK.enableAll();
          break;
        case this.Events.DISABLE_ALL:
          this.embedSDK.disableAll();
          break;
        case this.Events.ROTATE:
          this.embedSDK.rotate(
            data.element,
            data.x,
            data.y,
            data.z,
            data.time,
            data.loop,
          );
          break;
        case this.Events.TOGGLE:
          this.embedSDK.toggle(
            data.element,
            data.transition != null ? data.transition : 0,
            data.time != null ? data.time : 1,
          );
          break;
        case this.Events.SET_LABEL_TEXT:
          this.embedSDK.setLabelText(data.element, data.text);
          break;
        case this.Events.PLAY:
          this.embedSDK.play(data.element);
          break;
        case this.Events.PAUSE:
          this.embedSDK.pause(data.element);
          break;
        case this.Events.TRANSLATE:
          this.embedSDK.translate(
            data.element,
            data.x,
            data.y,
            data.z,
            data.time,
            data.loop,
          );
          break;
        case this.Events.ROTATE_TO:
          this.embedSDK.rotateTo(
            data.element,
            data.x,
            data.y,
            data.z,
            data.time,
            data.loop,
          );
          break;
        case this.Events.ROTATE_TO_QUATERNION:
          this.embedSDK.rotateToQuaternion(
            data.element,
            data.x,
            data.y,
            data.z,
            data.w,
            data.time,
            data.loop,
          );
          break;
        case this.Events.SCALE:
          this.embedSDK.scale(
            data.element,
            data.x,
            data.y,
            data.z,
            data.time,
            data.loop,
          );
          break;
        case this.Events.PLAY_ANIMATION:
          this.embedSDK.playAnimation(
            data.element,
            data.name,
            data.loop,
            data.autoStop != null ? data.autoStop : false,
            data.time,
          );
          break;
        case this.Events.STOP_ANIMATION:
          this.embedSDK(data.element);
          break;
        case this.Events.TRANSLATE_TO_POSITION:
          this.embedSDK.translateToPosition(
            data.element,
            data.x,
            data.y,
            data.z,
            data.time,
            data.lookAt,
          );
          break;
        case this.Events.TRANSLATE_TO_ELEMENT:
          this.embedSDK.translateToElement(
            data.element,
            data.target,
            data.time,
            data.lookAt,
          );
          break;
        case this.Events.RESET_SCENES:
          this.embedSDK.resetScenes();
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
 * Listens when the scene recive an action.
 */
// oxExperienceSocket.subscribe(
//     oxExperienceSocket.ACTIONS.RECIVE_ACTION,
//     (params) => {
//       // TO-DO
//     },
//   );
