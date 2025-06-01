const chatbotContainer = document.getElementById("chatbot-container");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotForm = document.getElementById("chatbot-form");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotCloseBtn = document.getElementById("chatbot-close-btn");
const chatbotMinimized = document.getElementById("chatbot-minimized");

// Get current user
const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));

// Chat state management
const getChatHistoryKey = (userId) => `gemini_chat_history_${userId}`;
let chatHistory = [];

// UI state management
let isProcessing = false;

// Load chat history for current user
function loadChatHistory() {
  if (!currentUser) return;
  
  const historyKey = getChatHistoryKey(currentUser.id);
  chatHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
  
  chatbotMessages.innerHTML = ''; // Clear existing messages
  chatHistory.forEach(msg => {
    addMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'bot');
  });
}

// Function to add messages to chatbox with typing animation
function addMessage(text, sender = "bot") {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender === "user" ? "user" : "bot");
  
  if (sender === 'bot') {
    msgDiv.classList.add('typing');
    msgDiv.textContent = '...';
    chatbotMessages.appendChild(msgDiv);
    
    // Simulate typing animation
    setTimeout(() => {
      msgDiv.classList.remove('typing');
      msgDiv.textContent = text;
    }, 500);
  } else {
    msgDiv.textContent = text;
    chatbotMessages.appendChild(msgDiv);
  }
  
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Save chat history to localStorage
function saveChatHistory() {
  if (!currentUser) return;
  
  const historyKey = getChatHistoryKey(currentUser.id);
  localStorage.setItem(historyKey, JSON.stringify(chatHistory));
}

// Clear chat history for current user
function clearChatHistory() {
  if (!currentUser) return;
  
  const historyKey = getChatHistoryKey(currentUser.id);
  localStorage.removeItem(historyKey);
  chatHistory = [];
  chatbotMessages.innerHTML = '';
  addMessage("Hello! I'm Gemini. Ask me anything.");
}

// UI Controls
chatbotCloseBtn.addEventListener("click", () => {
  chatbotContainer.classList.add("minimized");
  chatbotMinimized.hidden = false;
});

chatbotMinimized.addEventListener("click", () => {
  chatbotContainer.classList.remove("minimized");
  chatbotMinimized.hidden = true;
});

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyBzZowSwMec5zEFgWTSox1qTQ36gjwu_nw";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Function to send user message and fetch bot response
async function generateResponse(userMessage) {
  if (isProcessing || !currentUser) return;
  
  isProcessing = true;
  const userMsg = {
    role: "user",
    parts: [{ text: userMessage }],
  };
  
  chatHistory.push(userMsg);
  addMessage(userMessage, 'user');
  saveChatHistory();
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";
    
    const botMsg = {
      role: "model",
      parts: [{ text: geminiReply }],
    };
    
    chatHistory.push(botMsg);
    addMessage(geminiReply, 'bot');
    saveChatHistory();
    
  } catch (error) {
    console.error("Chat error:", error);
    addMessage("Sorry, I encountered an error. Please try again.", 'bot');
  } finally {
    isProcessing = false;
  }
}

// Form submission handler
chatbotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = chatbotInput.value.trim();
  if (msg === "" || isProcessing || !currentUser) return;
  
  chatbotInput.value = "";
  chatbotInput.focus();
  await generateResponse(msg);
});

// Listen for user changes
window.addEventListener('storage', (e) => {
  if (e.key === 'loggedInUser') {
    // User has changed, reload chat history
    loadChatHistory();
  }
});

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
  if (currentUser) {
    loadChatHistory();
  }
});
