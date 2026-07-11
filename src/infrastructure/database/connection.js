import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("trying to connect.....");
    const connectDB = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connectDB.connection.host}`);
  } catch (error) {
    console.error("DB connection error:,", error.message);
    process.exit(1);
  }
};

export default connectDB;
