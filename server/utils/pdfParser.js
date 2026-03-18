const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

/**
 * Extracts pages from a PDF file using LangChain's PDFLoader.
 * @param {string} filePath - The local path to the uploaded PDF file.
 * @returns {Promise<Array>} - Array of Langchain Document objects with pageContent and metadata.
 */
const extractTextFromPDF = async (filePath) => {
    try {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        return docs;
    } catch (error) {
        console.error(`Error extracting text from PDF (${filePath}):`, error);
        throw new Error('Failed to parse PDF file');
    }
};

module.exports = {
    extractTextFromPDF
};
