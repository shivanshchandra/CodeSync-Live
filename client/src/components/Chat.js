import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ACTIONS } from "../Actions";

export default function Chat({
  isOpen,
  onClose,
  socketRef,
  roomId,
  me,
  onIncomingWhileClosed,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [typingUsers, setTypingUsers] = useState({}); // { userId: name }
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);

  const bodyRef = useRef(null);
  const typingStopTimerRef = useRef(null);

  const formatTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isNearBottom = () => {
    const el = bodyRef.current;
    if (!el) return true;
    const threshold = 120;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < threshold;
  };

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      if (!bodyRef.current) return;
      bodyRef.current.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  };

  // ✅ Load history on open
  useEffect(() => {
    if (!isOpen || !roomId) return;

    const token = localStorage.getItem("token");
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/messages/${roomId}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data || []);
        scrollToBottom(false);
      })
      .catch(() => setMessages([]));
  }, [isOpen, roomId]);

  // ✅ Tell server chat is open/close (required for "Seen")
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    if (isOpen) socket.emit(ACTIONS.CHAT_OPEN, { roomId });
    else socket.emit(ACTIONS.CHAT_CLOSE, { roomId });

    return () => {
      try {
        socket.emit(ACTIONS.CHAT_CLOSE, { roomId });
      } catch {}
    };
  }, [isOpen, roomId, socketRef]);

  // ✅ Robust listener attach (wait for socket)
  useEffect(() => {
    let intervalId;

    const attach = () => {
      const socket = socketRef?.current;
      if (!socket || !roomId) return;

      // ---- RECEIVE_MESSAGE ----
      const onReceive = (msg) => {
        if (!msg || msg.roomId !== roomId) return;

        const fromMe =
          me &&
          (String(msg.sender) === String(me._id) ||
            String(msg.sender?._id) === String(me._id));

        if (!isOpen && !fromMe) onIncomingWhileClosed?.();

        const shouldScroll = isNearBottom();

        setMessages((prev) => {
          // replace optimistic via clientId
          if (msg.clientId) {
            const idx = prev.findIndex(
              (m) => m.clientId === msg.clientId || m._id === msg.clientId
            );
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = { ...msg, pending: false };
              return copy;
            }
          }

          // prevent duplicates by _id
          const already = prev.some((m) => String(m._id) === String(msg._id));
          if (already) return prev;

          return [...prev, { ...msg, pending: false }];
        });

        if (shouldScroll) scrollToBottom(true);
      };

      socket.off(ACTIONS.RECEIVE_MESSAGE);
      socket.on(ACTIONS.RECEIVE_MESSAGE, onReceive);

      // ---- USER_TYPING ----
      const onUserTyping = ({ roomId: r, userId, name, isTyping }) => {
        if (r !== roomId) return;
        if (me && String(userId) === String(me._id)) return;

        setTypingUsers((prev) => {
          const next = { ...prev };
          if (isTyping) next[userId] = name;
          else delete next[userId];
          return next;
        });
      };

      socket.off(ACTIONS.USER_TYPING);
      socket.on(ACTIONS.USER_TYPING, onUserTyping);

      // ---- MESSAGE_SEEN ----
      const onSeen = ({ roomId: r, messageId, seen }) => {
        if (r !== roomId || !seen) return;
        setLastSeenMessageId(messageId);
      };

      socket.off(ACTIONS.MESSAGE_SEEN);
      socket.on(ACTIONS.MESSAGE_SEEN, onSeen);

      clearInterval(intervalId);
    };

    attach();
    intervalId = setInterval(attach, 250);

    return () => clearInterval(intervalId);
  }, [roomId, socketRef, me, isOpen, onIncomingWhileClosed]);

  const typingLine = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `Multiple people are typing…`;
  }, [typingUsers]);

  const send = () => {
    const value = text.trim();
    if (!value) return;

    const socket = socketRef?.current;
    if (!socket) return;

    const clientId = `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const tempMsg = {
      _id: clientId,
      clientId,
      roomId,
      sender: me?._id,
      senderName: me?.name || me?.email || "Me",
      text: value,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    const shouldScroll = isNearBottom();
    setMessages((prev) => [...prev, tempMsg]);
    if (shouldScroll) scrollToBottom(true);

    socket.emit(ACTIONS.SEND_MESSAGE, { roomId, text: value, clientId });
    setText("");

    try {
      socket.emit(ACTIONS.STOP_TYPING, { roomId });
    } catch {}
  };

  const handleTextChange = (v) => {
    setText(v);

    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    socket.emit(ACTIONS.TYPING, { roomId });

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      socket.emit(ACTIONS.STOP_TYPING, { roomId });
    }, 800);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isSendDisabled = text.trim().length === 0;

  return (
    <div className={`cs-chat-drawer ${isOpen ? "open" : ""}`}>
      <div className="cs-chat-header">
        <div>
          <div className="cs-chat-title">Room Chat</div>
          <div className="cs-chat-subtitle">{typingLine || "Talk with your teammates"}</div>
        </div>
        <button className="cs-chat-close" onClick={onClose} type="button">
          ✕
        </button>
      </div>

      <div className="cs-chat-body" ref={bodyRef}>
        {messages.length === 0 ? (
          <div className="cs-chat-empty">No messages yet. Start the conversation 👇</div>
        ) : (
          messages.map((m) => {
            const mine =
              me &&
              (String(m.sender) === String(me._id) ||
                String(m.sender?._id) === String(me._id));

            const name = m.senderName || "User";
            const initial = name.trim()?.[0]?.toUpperCase() || "U";

            const showSeen =
              mine &&
              lastSeenMessageId &&
              String(m._id) === String(lastSeenMessageId);

            return (
              <div key={m._id} className={`cs-msg-row ${mine ? "mine" : ""}`}>
                {!mine && <div className="cs-avatar">{initial}</div>}

                <div className={`cs-msg-bubble ${mine ? "mine" : ""}`}>
                  <div className="cs-msg-top">
                    <span className="cs-msg-name">{name}</span>
                    <span className="cs-msg-time">{formatTime(m.createdAt)}</span>
                  </div>

                  <div className="cs-msg-text">{m.text}</div>

                  <div className="cs-msg-footer">
                    {m.pending ? <span className="cs-msg-pending">Sending…</span> : null}
                    {!m.pending && showSeen ? <span className="cs-msg-seen">Seen</span> : null}
                  </div>
                </div>

                {mine && <div className="cs-avatar mine">{initial}</div>}
              </div>
            );
          })
        )}
      </div>

      <div className="cs-chat-input">
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={onKeyDown}
          rows={2}
        />
        <button onClick={send} type="button" disabled={isSendDisabled}>
          Send
        </button>
      </div>
    </div>
  );
}
