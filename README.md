# CodeSync Live - Real-time Collaborative Code Editor

CodeSync Live is a full-stack real-time collaborative coding platform where multiple users can join a shared room and edit code together instantly. It also supports secure authentication, persistent chat, and multi-language code execution using the JDoodle Compiler API.

---

## 🚀 Features

- Create or join rooms using a unique Room ID
- Real-time collaborative code editing with Socket.IO
- Secure user authentication (JWT + hashed passwords)
- Persistent real-time room chat (stored in MongoDB)
- User presence system (join/leave notifications)
- Syntax highlighting code editor (CodeMirror)
- Multi-language code execution (JDoodle API)
- Protected routes for authenticated users
- Scalable backend architecture with REST + WebSockets

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Context API
- CodeMirror
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Socket.IO
- JWT Authentication
- bcrypt password hashing

### APIs & Tools
- JDoodle Compiler API
- UUID (Room ID generation)

---

## 🔐 Authentication System

- Secure registration and login
- JWT-based session handling
- Password hashing with bcrypt
- Protected routes for editor access
- Persistent login using localStorage tokens

---

## 💬 Real-time Chat System

Each room includes a built-in live chat panel allowing users to communicate while collaborating. Messages are:

- Sent instantly via WebSockets
- Stored in MongoDB
- Loaded automatically when joining a room
- Scoped per room (no cross-room messages)

---

## 🧠 Architecture Overview

CodeSync Live uses a hybrid communication architecture:

- REST API → Authentication + data fetching
- WebSockets → Real-time editor sync + chat + presence

This ensures low latency collaboration while maintaining scalable backend structure.

---


## Development

If you want to run CodeSync-Live locally or contribute to its development, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/codesync-live.git
   cd codesync-live
   ```
2. Install dependencies:
   ```
   cd server
   npm install

   cd ../client
   npm install

   ```
3. Start the development server:
   ```
   npm start
   ```