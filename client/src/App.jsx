import { useState, useRef, useEffect } from 'react';
import { Upload, Send, Bot, User, FileText, Loader2 } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am Nexus RAG. Upload a PDF document and ask me anything about it. 📄🤖' }
  ]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat after new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Handle the PDF upload to the backend endpoint
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setUploadedFile(file.name);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Document "${file.name}" uploaded successfully. ${data.chunksProcessed} chunks indexed. You can now ask questions!` }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'error', content: 'Failed to process document. Make sure the backend server and OpenAI are running properly.' }]);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file could be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Send the user question to the backend and append the RAG response
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'bot', content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'error', content: 'Failed to connect to the backend answering service.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="app-container">
      <div className="chat-window">
        {/* App Header */}
        <header className="chat-header">
          <div className="header-title">
            <div className="logo-container">
              <Bot size={24} />
            </div>
            <div>
              <h1>Nexus RAG</h1>
              <p>Intelligent PDF Analysis</p>
            </div>
          </div>

          <div className="upload-container">
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              className={`upload-btn ${uploadedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
              <span>{isUploading ? 'Processing...' : uploadedFile ? 'Replace PDF' : 'Upload PDF'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Status Bar - Appears only when a file is loaded */}
        {uploadedFile && (
          <div className="status-bar">
            <FileText size={14} className="file-icon" />
            <span className="file-name">{uploadedFile}</span>
            <span className="status-badge">Ready to Chat</span>
          </div>
        )}

        {/* Messaging Area */}
        <main className="chat-area">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              {msg.role !== 'system' && msg.role !== 'error' && (
                <div className="avatar">
                  {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
                </div>
              )}
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {isTyping && (
            <div className="message-wrapper bot">
              <div className="avatar"><Bot size={18} /></div>
              <div className="message-content typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Footer */}
        <footer className="chat-input-area">
          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              placeholder={uploadedFile ? "Ask something about the document..." : "Please upload a document first..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!uploadedFile || isTyping || isUploading}
            />
            <button type="submit" disabled={!input.trim() || !uploadedFile || isTyping}>
              <Send size={18} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default App;
