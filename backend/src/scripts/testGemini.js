import dotenv from "dotenv";
dotenv.config();
import ai from "../services/core/gemini.service.js";

async function main() {
  try {
    console.log("Testing Gemini API connection...");
    console.log("Using API Key:", process.env.GEMINI_API_KEY ? "PRESENT" : "MISSING");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Test primary model
      contents: "Hello, this is a test. Reply with 'Gemini is working!' if you receive this message.",
    });

    console.log("Response from Gemini:");
    console.log(response.text);
    console.log("\nSuccess!");
  } catch (error) {
    console.error("Gemini API Error:", error);
  }
}

main();
