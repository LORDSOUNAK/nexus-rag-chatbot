const { extractTextFromPDF } = require('../utils/pdfParser');
const { splitTextIntoChunks } = require('../utils/textSplitter');
const { generateAndStoreEmbeddings } = require('../services/embedding.service');

/**
 * Handle file upload request, process PDF, and store embeddings
 */
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded or file is not a valid PDF' });
        }

        // Replace backslashes with forward slashes for cross-platform compatibility
        const normalizedPath = req.file.path.replace(/\\/g, '/');

        // 1. Extract pages from the PDF using Langchain PDFLoader
        const docs = await extractTextFromPDF(normalizedPath);

        // 2. Split document pages into chunks and track page numbers
        const chunks = splitTextIntoChunks(docs);

        // 3. Generate and store embeddings in FAISS
        await generateAndStoreEmbeddings(chunks);

        res.status(200).json({
            message: 'File uploaded and processed successfully',
            filePath: normalizedPath,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            chunksProcessed: chunks.length
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadFile
};
