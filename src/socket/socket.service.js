import { io } from "./index.js"

export const emitNotification= (userId, notification)=>{
io.to(userId.toString()).emit("notification", notification)
}
