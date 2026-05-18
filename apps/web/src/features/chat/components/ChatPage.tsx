import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../services/types';
import { chatService } from '../services/chatService';
import { useAuth } from '../../../shared/context/AuthContext';
import { Search, Send, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const ChatPage: React.FC = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatService.fetchConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3011', {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (activeConversation && message.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, message]);
      }
      
      setConversations((prev) => 
        prev.map((conv) => 
          conv.id === message.conversationId 
            ? { ...conv, messages: [message], updatedAt: message.createdAt }
            : conv
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      setMessages([]); // Clear messages while loading new ones
      const fetchMessages = async () => {
        try {
          const data = await chatService.fetchMessages(activeConversation.id);
          setMessages(data);
          socket?.emit('join_conversation', activeConversation.id);
        } catch (error) {
          console.error('Failed to fetch messages', error);
        }
      };
      fetchMessages();
    }
  }, [activeConversation, socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user || !socket) return;

    const messageData = {
      conversationId: activeConversation.id,
      senderId: user.id,
      text: newMessage.trim(),
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Carregando suas conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex overflow-hidden bg-white shadow-2xl rounded-2xl my-6 border border-gray-100">
      {/* Sidebar */}
      <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900">Mensagens</h2>
          <div className="mt-4 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="opacity-20" />
              </div>
              <p className="text-sm">Nenhuma conversa iniciada ainda.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.participants.find(p => p.id !== user?.id);
              const isActive = activeConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-blue-50/50 transition-all border-b border-gray-50 ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0">
                    {otherUser?.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`font-bold truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                        {otherUser?.name}
                      </h4>
                      <span className="text-[10px] font-medium text-gray-400 uppercase">
                        {new Date(conv.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {conv.messages[0]?.text || 'Clique para conversar...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50/30 ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {activeConversation.participants.find(p => p.id !== user?.id)?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-none mb-1">
                    {activeConversation.participants.find(p => p.id !== user?.id)?.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === user?.id;
                const prevMsg = messages[index - 1];
                const showDate = !prevMsg || new Date(msg.createdAt).getDate() !== new Date(prevMsg.createdAt).getDate();

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 bg-gray-200/50 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                          {new Date(msg.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <span className={`text-[9px] mt-2 block font-medium opacity-70 ${isMine ? 'text-right' : ''}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3 bg-gray-100 p-1.5 rounded-2xl">
                <input
                  type="text"
                  placeholder="Escreva sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-transparent border-none text-sm focus:ring-0 outline-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8 rotate-3">
              <MessageSquare size={48} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Sua Caixa de Entrada</h3>
            <p className="text-center max-w-xs text-sm leading-relaxed">
              Selecione uma conversa ao lado para negociar itens ou tirar dúvidas acadêmicas com seus colegas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
