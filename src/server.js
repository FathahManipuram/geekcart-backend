import 'dotenv/config'


import app from "../src/app.js"
import connectDB from './infrastructure/database/connection.js'


const PORT= process.env.PORT 
const StartServer= async()=>{
	try{
		app.listen(PORT, ()=>{
	console.log(`Server is running on port ${PORT}`)
})
	}catch(error){
		console.log("Server failed to start: ", error)
		process.exit(1)
	}
}
StartServer()
connectDB()
