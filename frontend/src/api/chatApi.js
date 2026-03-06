const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null;
  let id = sessionStorage.getItem('creamingo_chat_session_id');
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    sessionStorage.setItem('creamingo_chat_session_id', id);
  }
  return id;
}

const chatApi = {
  async sendMessage(message, sessionId = null) {
    const sid = sessionId || getOrCreateSessionId();
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim(), session_id: sid })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get reply');
    }
    return data;
  }
};

export default chatApi;
