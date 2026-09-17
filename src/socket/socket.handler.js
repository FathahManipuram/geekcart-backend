const registerSocketHandler= (io)=>{
	io.on("connection", (socket)=>{
		console.log("Connected socket:", socket.id)

		socket.emit("welcome", {
      message: "Welcome to GeekCart 🚀",
    });

	    socket.on("join-room", (userId) => {
        socket.join(userId);

        console.log(`socket ${socket.id} Joined room ${userId}`);
      });

		socket.on("disconnect", ()=>{
			console.log("Disconnected: ", socket.id)
		})
	})
}

export default registerSocketHandler