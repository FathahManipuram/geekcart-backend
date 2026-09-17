import { Server } from "socket.io";
import registerSocketHandler from "./socket.handler.js";


let io;

const initializeSocket= (server)=>{
	 console.log("Initializing Socket.IO...");
	io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URLS.split(","),
	  credentials: true,
    },
  });
  registerSocketHandler(io)
}

export {io}
export default initializeSocket