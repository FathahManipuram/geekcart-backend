import 'dotenv/config'
import express from 'express'
import cors from 'cors'


import app from "../src/app.js"

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
