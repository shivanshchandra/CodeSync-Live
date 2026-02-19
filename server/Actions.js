const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",

  // chat
  SEND_MESSAGE: "SEND_MESSAGE",
  RECEIVE_MESSAGE: "RECEIVE_MESSAGE",

  // typing
  TYPING: "TYPING",
  STOP_TYPING: "STOP_TYPING",
  USER_TYPING: "USER_TYPING",

  // read receipts (light)
  CHAT_OPEN: "CHAT_OPEN",
  CHAT_CLOSE: "CHAT_CLOSE",
  MESSAGE_SEEN: "MESSAGE_SEEN",
};

module.exports = ACTIONS;
