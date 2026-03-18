const { retrieveRelevantChunks } = require('../services/embedding.service');
const { generateAnswer } = require('../services/chat.service');

/**
 * Handle incoming chat questions
 */
const handleMessage = async (req, res, next) => {
    try {
        const { question, message } = req.body;
        const query = question || message;

        if (!query) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // 1. Retrieve context from vectorstore
        const contextChunks = await retrieveRelevantChunks(query);

        // 2. Generate response using OpenAI
        const answer = await generateAnswer(query, contextChunks);

        // Return both the answer and the context used for transparency
        res.json({ answer, context: contextChunks });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleMessage
};
