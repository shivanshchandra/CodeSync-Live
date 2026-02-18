# CodeCast - Real-time Code Collaboration

CodeSync Live is a real-time collaborative code editor where multiple users can join a shared room and edit code together with instant sync. It also supports multi-language code execution via the JDoodle Compiler API.

## Features

- Create or join rooms using a unique Room ID
- Real-time multi-user editing with Socket.IO
- User presence (join/leave notifications)
- Code editor with syntax highlighting (CodeMirror)
- Run code in multiple languages (JDoodle API)

## Technologies Used

- Express.js: Handling API requests.
- React: Building the front-end interface.
- Node.js: Running the server.
- Socket.IO: Enabling real-time communication.
- uuid: Generating unique room IDs.
- CodeMirror: Providing the code editor.
- Code Execution: JDoodle Compiler API


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