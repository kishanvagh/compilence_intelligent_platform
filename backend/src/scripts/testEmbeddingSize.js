import dotenv from "dotenv";
dotenv.config();
import ai from "../services/core/gemini.service.js";

async function testModel(modelName) {
  try {
    const response = await ai.models.embedContent({
      model: modelName,
      contents: "Hello World",
    });
    const dims = response.embeddings[0].values.length;
    console.log(`Model ${modelName} returned ${dims} dimensions.`);
  } catch (error) {
    console.error(`Model ${modelName} failed:`, error.message);
  }
}

async function testModelWithDims(modelName, dims) {
  try {
    const response = await ai.models.embedContent({
      model: modelName,
      contents: "Hello World",
      config: {
        outputDimensionality: dims
      }
    });
    const actualDims = response.embeddings[0].values.length;
    console.log(`Model ${modelName} with outputDimensionality ${dims} returned ${actualDims} dimensions.`);
  } catch (error) {
    console.error(`Model ${modelName} with outputDimensionality ${dims} failed:`, error.message);
  }
}

async function main() {
  await testModel("gemini-embedding-001");
  await testModel("text-embedding-004");
  await testModelWithDims("text-embedding-004", 768);
  await testModelWithDims("gemini-embedding-001", 768);
}

main();
