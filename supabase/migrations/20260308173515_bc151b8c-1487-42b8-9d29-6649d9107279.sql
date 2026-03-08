
DROP POLICY "Users can read their own messages" ON public.chat_messages;
DROP POLICY "Users can send messages" ON public.chat_messages;
DROP POLICY "Users can mark messages as read" ON public.chat_messages;

ALTER TABLE public.chat_messages ALTER COLUMN sender_id TYPE text USING sender_id::text;
ALTER TABLE public.chat_messages ALTER COLUMN receiver_id TYPE text USING receiver_id::text;

CREATE POLICY "Users can read their own messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);

CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = sender_id);

CREATE POLICY "Users can mark messages as read"
ON public.chat_messages FOR UPDATE TO authenticated
USING (auth.uid()::text = receiver_id)
WITH CHECK (auth.uid()::text = receiver_id);
