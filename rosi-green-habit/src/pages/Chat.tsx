import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useChat, Conversation } from "@/hooks/useChat";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";

const quickReplies = [
  "Ini masih ada?",
  "Bisa info lebih detail?",
  "Cara transaksinya bagaimana?",
  "Bisa COD?",
];

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    setMessages
  } = useChat();
  
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle selecting a conversation from URL params
  useEffect(() => {
    const conversationId = searchParams.get("id");
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedChat(conversation);
      }
    }
  }, [searchParams, conversations]);

  // Fetch messages when selecting a chat
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat, fetchMessages, setMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return;
    
    await sendMessage(selectedChat.id, inputMessage);
    setInputMessage("");
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: id 
      });
    } catch {
      return "";
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  // If not logged in
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Masuk untuk Chat</h2>
          <p className="text-muted-foreground mb-4">
            Anda perlu login untuk menggunakan fitur chat
          </p>
          <Button asChild>
            <Link to="/auth">Masuk / Daftar</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-12rem)]">
        {!selectedChat ? (
          // Contact List
          <div className="animate-in fade-in">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Chat
            </h1>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Memuat percakapan...</p>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedChat(conversation)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-xl bg-accent">
                          {conversation.product_image || getInitials(conversation.other_user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            {conversation.other_user_name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </div>
                        {conversation.product_name && (
                          <p className="text-xs text-primary truncate">
                            {conversation.product_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message || "Belum ada pesan"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Belum ada percakapan</p>
                <p className="text-sm text-muted-foreground">
                  Mulai chat dengan penjual di Market
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/market">Kunjungi Market</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Chat View
          <div className="flex flex-col h-full animate-in fade-in">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 border-b py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xl bg-accent">
                    {selectedChat.product_image || getInitials(selectedChat.other_user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {selectedChat.other_user_name}
                  </CardTitle>
                  {selectedChat.product_name && (
                    <p className="text-xs text-primary">{selectedChat.product_name}</p>
                  )}
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        Belum ada pesan. Mulai percakapan!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender_id === user.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2",
                            message.sender_id === user.id
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-accent text-foreground rounded-bl-sm"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.sender_id === user.id 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground"
                          )}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t space-y-3">
                {/* Quick Replies */}
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Chat;
