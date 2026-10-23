const registerSocketHandler= (io)=>{
	io.on("connection", (socket)=>{

		socket.emit("welcome", {
      message: "Welcome to GeekCart 🚀",
    });

	    socket.on("join-room", (userId) => {
        socket.join(userId);

       
      });

		socket.on("disconnect", ()=>{
			
		})
	})
}

export default registerSocketHandler