import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTIES } from "@/data/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

interface ChatMessage {
  id: string;
  conversation_key: string;
  sender_id: string;
  receiver_id: string;
  property_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId") || "";
  const sellerId = searchParams.get("sellerId") || "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<{ full_name: string | null } | null>(null);
  const [dbPropertyTitle, setDbPropertyTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Try static lookup first
  const staticProperty = PROPERTIES.find((p) => p.id === Number(propertyId));

  // Fetch DB property title if not static
  useEffect(() => {
    if (staticProperty || !propertyId) return;
    supabase
      .from("properties")
      .select("title")
      .eq("id", propertyId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDbPropertyTitle(data.title);
      });
  }, [propertyId, staticProperty]);

  const propertyTitle = staticProperty?.title || dbPropertyTitle;

  // Build a stable conversation key (sorted user IDs + property)
  const conversationKey = user
    ? [user.id, sellerId].sort().join("_") + `_${propertyId}`
    : "";

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  // Fetch seller profile
  useEffect(() => {
    if (!sellerId) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", sellerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSellerProfile(data);
      });
  }, [sellerId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationKey) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_key", conversationKey)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, [conversationKey]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationKey) return;
    const channel = supabase
      .channel(`chat_${conversationKey}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_key=eq.${conversationKey}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationKey]);

  // Mark unread as read
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unread = messages.filter((m) => m.receiver_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase
        .from("chat_messages")
        .update({ is_read: true })
        .in("id", unread.map((m) => m.id))
        .then();
    }
  }, [messages, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !conversationKey) return;
    setSending(true);
    const otherUserId = sellerId === user.id ? messages.find(m => m.sender_id !== user.id)?.sender_id || sellerId : sellerId;
    const { error } = await supabase.from("chat_messages").insert({
      conversation_key: conversationKey,
      sender_id: user.id,
      receiver_id: otherUserId,
      property_id: propertyId,
      content: newMessage.trim(),
    });
    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading || !user) return null;

  const otherName = sellerProfile?.full_name || staticProperty?.seller?.name || "User";
  const otherInitials = otherName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col pt-16 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="sticky top-16 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {otherInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{otherName}</p>
            {propertyTitle && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {propertyTitle}
              </p>
            )}
          </div>
          {propertyId && (
            <Link to={`/property/${propertyId}`}>
              <Button variant="outline" size="sm" className="text-xs">View Property</Button>
            </Link>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
              {propertyTitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  Regarding: {propertyTitle}
                </p>
              )}
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i < 20 ? i * 0.02 : 0 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="gradient-cta text-primary-foreground shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
