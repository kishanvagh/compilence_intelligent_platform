import dotenv from "dotenv";
dotenv.config();
import { QdrantClient } from "@qdrant/js-client-rest";

async function testConnection(configName, configOptions) {
  console.log(`\n--- Testing Config: ${configName} ---`);
  console.log("Config Options:", JSON.stringify({ ...configOptions, apiKey: configOptions.apiKey ? "PRESENT" : "MISSING" }));
  
  const client = new QdrantClient(configOptions);
  
  try {
    const collections = await client.getCollections();
    console.log(`Success! Collections:`, collections);
  } catch (err) {
    console.error(`Failed with error:`, {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
      url: err.url,
      data: err.data
    });
  }
}

async function main() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  // Extract hostname from URL
  const host = url.replace("https://", "").replace("http://", "");

  // Test 1: Default config (from env)
  await testConnection("Default (url)", {
    url,
    apiKey
  });

  // Test 2: URL with port 443 explicitly
  await testConnection("URL with port 443", {
    url: `${url}:443`,
    apiKey
  });

  // Test 3: URL with port 6333 explicitly
  await testConnection("URL with port 6333", {
    url: `${url}:6333`,
    apiKey
  });

  // Test 4: Host and Port 443
  await testConnection("Host and Port 443", {
    host,
    port: 443,
    apiKey,
    https: true
  });

  // Test 5: Host and Port 6333
  await testConnection("Host and Port 6333", {
    host,
    port: 6333,
    apiKey,
    https: true
  });
}

main();
