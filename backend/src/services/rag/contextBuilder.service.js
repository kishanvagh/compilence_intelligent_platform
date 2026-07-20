export const buildContext = (
  retrievedChunks
) => {

  if (
    !retrievedChunks.length
  ) {
    return "";
  }

  return retrievedChunks
    .map(
      (chunk) => `
[Chunk ${chunk.chunkIndex} (Page ${chunk.pageNumber || 1})]

${chunk.text}
`
    )
    .join("\n\n");

};
