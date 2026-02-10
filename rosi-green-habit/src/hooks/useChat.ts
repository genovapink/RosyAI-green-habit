import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  product_name: string | null;
  product_image: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user_name?: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all conversations for current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get other user's display name from profiles
      const conversationsWithNames = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", otherUserId)
            .single();
          
          return {
            ...conv,
            other_user_name: profile?.display_name || "Pengguna"
          };
        })
      );

      setConversations(conversationsWithNames);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id);

    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Gagal mengirim pesan");
    }
  }, [user]);

  // Create or get existing conversation
  const getOrCreateConversation = useCallback(async (
    otherUserId: string, 
    productName?: string,
    productImage?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation exists (in either direction)
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
          product_name: productName,
          product_image: productImage
        })
        .select("id")
        .single();

      if (error) throw error;
      return newConv?.id || null;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error("Gagal membuat percakapan");
      return null;
    }
  }, [user]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Update conversations list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Subscribe to realtime conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations"
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    getOrCreateConversation,
    setMessages
  };
};
