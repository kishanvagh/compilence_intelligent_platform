import dotenv from "dotenv";
dotenv.config();

import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

try {

  const result =
    await client.createPayloadIndex(
      "document_chunks",
      {
        field_name: "documentId",
        field_schema: "keyword",
      }
    );

  console.log(result);

} catch (error) {

  console.error(
    JSON.stringify(
      error,
      null,
      2
    )
  );

}