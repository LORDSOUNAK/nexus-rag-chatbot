/**
 * Splits Langchain Document objects into smaller chunks with overlap,
 * while preserving the original page number metadata.
 * 
 * @param {Array} docs - Array of Document objects
 * @param {number} chunkSize - The maximum size of each chunk (default 1000 characters)
 * @param {number} chunkOverlap - The number of overlapping characters (default 200)
 * @returns {Array} An array of objects containing { text, page }
 */
const splitTextIntoChunks = (docs, chunkSize = 1000, chunkOverlap = 200) => {
    if (!docs || !Array.isArray(docs)) return [];

    const chunks = [];

    for (const doc of docs) {
        const text = doc.pageContent || '';
        const pageNum = doc.metadata?.loc?.pageNumber || 1;

        // Normalize excessive whitespace/newlines to clean up the chunks
        const normalizedText = text.replace(/\s+/g, ' ').trim();

        if (normalizedText.length <= chunkSize) {
            if (normalizedText.length > 0) chunks.push({ text: normalizedText, page: pageNum });
            continue;
        }

        let startIndex = 0;

        while (startIndex < normalizedText.length) {
            let endIndex = startIndex + chunkSize;

            // If the chunk doesn't reach the end of the text, find a natural break point
            if (endIndex < normalizedText.length) {
                const lastSpace = normalizedText.lastIndexOf(' ', endIndex);
                const lastPeriod = normalizedText.lastIndexOf('.', endIndex);

                const breakPoint = Math.max(lastSpace, lastPeriod);

                if (breakPoint > startIndex && breakPoint > endIndex - (chunkSize * 0.5)) {
                    endIndex = breakPoint + (normalizedText[breakPoint] === '.' ? 1 : 0);
                }
            }

            chunks.push({
                text: normalizedText.slice(startIndex, endIndex).trim(),
                page: pageNum
            });

            const actualChunkSize = endIndex - startIndex;
            startIndex += (actualChunkSize - chunkOverlap);

            // Safety check to prevent infinite loop
            if (actualChunkSize <= chunkOverlap) {
                startIndex += chunkOverlap;
            }
        }
    }

    // Filter out any unexpected empty chunks
    return chunks.filter(chunk => chunk.text.length > 0);
};

module.exports = {
    splitTextIntoChunks
};
