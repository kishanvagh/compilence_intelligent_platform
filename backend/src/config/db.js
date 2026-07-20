import mongoose from "mongoose";

const connectDB = () => {
  const options = {
    serverSelectionTimeoutMS: 5000,
  };

  const connectWithRetry = () => {
    console.log("Attempting MongoDB connection...");
    mongoose.connect(process.env.MONGO_URI, options)
      .then(() => {
        console.log("MongoDB Connected successfully");
      })
      .catch((error) => {
        console.error("Database Connection Error:", error.message);
        console.log("Retrying database connection in 5 seconds...");
        setTimeout(connectWithRetry, 5000);
      });
  };

  connectWithRetry();
};

export default connectDB;