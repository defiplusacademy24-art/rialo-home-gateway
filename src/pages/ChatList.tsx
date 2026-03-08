import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Building2 } from "lucide-react";
import { PROPERTIES } from "@/data/properties";
import { motion } from "framer-motion";

interface ConversationSummary {
  conversation_key: string;
  property_id: string;
  other_user_id: string;
  other_name: string;
  last_message: string;
  last_time: string;
  unread_count: number;
  property_title?: string;
}

const ChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Get all messages involving this user
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!msgs || msgs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group by conversation_key
      const convMap = new Map<string, any[]>();
      msgs.forEach((m: any) => {
        if (!convMap.has(m.conversation_key)) convMap.set(m.conversation_key, []);
        convMap.get(m.conversation_key)!.push(m);
      });

      // Get unique other user IDs and property IDs
      const otherIds = new Set<string>();
      const dbPropertyIds = new Set<string>();
      convMap.forEach((msgs) => {
        msgs.forEach((m: any) => {
          if (m.sender_id !== user.id) otherIds.add(m.sender_id);
          if (m.receiver_id !== user.id) otherIds.add(m.receiver_id);
          // If property_id is a UUID (not a number), it's a DB property
          if (m.property_id && isNaN(Number(m.property_id))) {
            dbPropertyIds.add(m.property_id);
          }
        });
      });

      // Fetch profiles
      const profileMap = new Map<string, string>();
      if (otherIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(otherIds));
        profiles?.forEach((p: any) => profileMap.set(p.user_id, p.full_name || "User"));
      }

      // Fetch DB property titles
      const propTitleMap = new Map<string, string>();
      if (dbPropertyIds.size > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("id, title")
          .in("id", Array.from(dbPropertyIds));
        props?.forEach((p: any) => propTitleMap.set(p.id, p.title));
      }

      const summaries: ConversationSummary[] = [];
      convMap.forEach((msgs, key) => {
        const latest = msgs[0];
        const otherId = latest.sender_id === user.id ? latest.receiver_id : latest.sender_id;
        const unread = msgs.filter((m: any) => m.receiver_id === user.id && !m.is_read).length;
        
        // Try static property first, then DB
        const staticProp = PROPERTIES.find((p) => p.id === Number(latest.property_id));
        const propTitle = staticProp?.title || propTitleMap.get(latest.property_id) || undefined;

        summaries.push({
          conversation_key: key,
          property_id: latest.property_id,
          other_user_id: otherId,
          other_name: profileMap.get(otherId) || "User",
          last_message: latest.content,
          last_time: latest.created_at,
          unread_count: unread,
          property_title: propTitle,
        });
      });

      summaries.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
      setConversations(summaries);
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, i) => {
              const initials = conv.other_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <motion.div
                  key={conv.conversation_key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() =>
                    navigate(`/chat?propertyId=${conv.property_id}&sellerId=${conv.other_user_id}`)
                  }
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{conv.other_name}</span>
                      {conv.unread_count > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conv.property_title && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {conv.property_title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(conv.last_time).toLocaleDateString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatList;
