import React, { useState, useRef, useEffect } from 'react';
import { FileText, Send, Loader2, Download, RefreshCw } from 'lucide-react';

export default function ResumeAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m your AI Resume Assistant. I\'m here to help you create a professional resume. Let\'s start by getting to know you better. What\'s your name?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => 'conv_' + Date.now());
  const [generatedResume, setGeneratedResume] = useState(null);
  const [showDownloadButtons, setShowDownloadButtons] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('https://ai-resume-builder-two-phi.vercel.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);

      // Check if the response looks like a complete resume
      if (data.response.includes('Professional Summary') || 
          data.response.includes('Work Experience') ||
          data.response.includes('Education') ||
          data.response.includes('Skills') ||
          data.response.includes('Contact Information') ||
          (data.response.includes('**') && data.response.length > 300)) {
        setGeneratedResume(data.response);
        setShowDownloadButtons(true);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please make sure the backend server is running.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift+Enter allows new line (default textarea behavior)
  };

  const startNewConversation = async () => {
    try {
      await fetch('http://localhost:5001/api/clear-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }

    setMessages([
      {
        role: 'assistant',
        content: '👋 Hello! I\'m your AI Resume Assistant. I\'m here to help you create a professional resume. Let\'s start by getting to know you better. What\'s your name?'
      }
    ]);
    setGeneratedResume(null);
    setShowDownloadButtons(false);
  };

  const enableDownload = () => {
    // Get the last AI message and treat it as the resume
    const lastAIMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAIMessage) {
      setGeneratedResume(lastAIMessage.content);
      setShowDownloadButtons(true);
    }
  };

  const downloadAsPDF = async () => {
    if (!generatedResume) return;

    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font
      doc.setFont('helvetica');
      doc.setFontSize(10);

      // Split text to fit page width (190mm with margins)
      const lines = doc.splitTextToSize(generatedResume, 180);
      
      // Add text with proper pagination
      let y = 20; // Start position
      const lineHeight = 5;
      const pageHeight = 280; // A4 height in mm minus margins

      lines.forEach((line) => {
        if (y > pageHeight) {
          doc.addPage();
          y = 20; // Reset to top of new page
        }
        doc.text(line, 15, y);
        y += lineHeight;
      });

      // Save the PDF
      doc.save('resume.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Please install jsPDF: npm install jspdf');
    }
  };

  const downloadAsTXT = () => {
    if (!generatedResume) return;
    
    const element = document.createElement('a');
    const file = new Blob([generatedResume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'resume.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">AI Resume Assistant</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Chat with me to build your perfect resume
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-lg mb-4 flex flex-col" style={{ height: '600px' }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {msg.content}
                  </pre>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={isLoading}
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          {showDownloadButtons ? (
            <>
              <button
                onClick={downloadAsPDF}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download as PDF
              </button>
              
              <button
                onClick={downloadAsTXT}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download as TXT
              </button>
            </>
          ) : messages.length > 2 && (
            <button
              onClick={enableDownload}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Enable Download
            </button>
          )}
          
          <button
            onClick={startNewConversation}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Start New
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">💡 How to Use</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">1.</span>
              <span>Chat naturally with the AI assistant about your professional background</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">2.</span>
              <span>Share your work experience, education, skills, and achievements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">3.</span>
              <span>When ready, say "generate my resume" or "create resume"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">4.</span>
              <span>Download your professionally formatted resume as PDF</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
