const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { OpenAIEmbeddings } = require("@langchain/openai");
const path = require("path");
const fs = require("fs");

const VECTOR_STORE_PATH = path.join(__dirname, "../../server/vectorstore");

/**
 * Generates embeddings from text chunks and saves them locally using FAISS.
 * 
 * @param {string[]} textChunks - Array of string text chunks
 * @returns {Promise<boolean>} Success status
 */
const generateAndStoreEmbeddings = async (textChunks) => {
    try {
        if (!textChunks || textChunks.length === 0) {
            throw new Error("No text chunks provided for embedding");
        }

        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is missing from environment variables");
        }

        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        // Separate texts and metadata
        const texts = textChunks.map(c => c.text);
        const metadata = textChunks.map(c => ({ page: c.page }));

        // Create the vector database using the document chunks and metadata
        const vectorStore = await FaissStore.fromTexts(
            texts,
            metadata,
            embeddings
        );

        // Ensure the vectorstore directory exists
        if (!fs.existsSync(VECTOR_STORE_PATH)) {
            fs.mkdirSync(VECTOR_STORE_PATH, { recursive: true });
        }

        // Save FAISS vectors to file
        await vectorStore.save(VECTOR_STORE_PATH);
        console.log(`Successfully saved FAISS index to ${VECTOR_STORE_PATH}`);

        return true;
    } catch (error) {
        console.error("Error generating and storing embeddings:", error);
        throw new Error(`Failed to process embeddings: ${error.message}`);
    }
};

/**
 * Retrieves the top relevant chunks from the local FAISS vector store
 * based on a user query.
 * 
 * @param {string} query - The user's query string
 * @param {number} topK - The number of relevant chunks to retrieve (default 4)
 * @returns {Promise<string[]>} An array of relevant text chunks
 */
const retrieveRelevantChunks = async (query, topK = 4) => {
    try {
        if (!query) return [];

        if (!fs.existsSync(VECTOR_STORE_PATH)) {
            console.warn("Vector store not found. Please process a document first.");
            return [];
        }

        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is missing from environment variables");
        }

        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        // Load the existing FAISS database from disk
        const vectorStore = await FaissStore.load(VECTOR_STORE_PATH, embeddings);

        // Perform a similarity search against the stored vectors
        const results = await vectorStore.similaritySearch(query, topK);

        // Results are Document objects, so we map them to include text and source page
        return results.map(doc => ({
            text: doc.pageContent,
            page: doc.metadata.page || "Unknown"
        }));
    } catch (error) {
        console.error("Error retrieving relevant chunks:", error);
        throw new Error(`Failed to retrieve context: ${error.message}`);
    }
};

module.exports = {
    generateAndStoreEmbeddings,
    retrieveRelevantChunks
};
