import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { getConversations, getConversation, sendMessage } from '../api/supabaseApi'
import type { Message, Conversation } from '../lib/supabase'

const ROLE_EMOJI: Record<string,string> = { homeowner:'🏠', architect:'📐', contractor:'🔨', interior_designer:'🎨', vendor:'🏪' }

export default function Chat() {
  const { userId: paramUserId } = useParams<{ userId?: string }>()
  const { user } = useAuth()
  const { toast } = useToast()

  const [convs, setConvs] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(paramUserId || null)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(activeId)

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          const currentActiveId = activeIdRef.current
          if (newMsg.sender_id === currentActiveId || newMsg.receiver_id === currentActiveId) {
            setMsgs(prev => [...prev, newMsg])
          }
          loadConvs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const loadConvs = useCallback(() => {
    if (!user) return
    getConversations(user.id)
      .then(data => setConvs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (user) loadConvs()
  }, [user, loadConvs])

  useEffect(() => {
    if (!activeId || !user) return
    setMsgs([])
    getConversation(user.id, activeId)
      .then(data => setMsgs(data))
      .catch(() => toast('Failed to load messages', 'error'))
  }, [activeId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (paramUserId && paramUserId !== activeId) {
      setActiveId(paramUserId)
      setConvs(prev => {
        if (prev.find(c => c.partner_id === paramUserId)) return prev
        return [{ partner_id: paramUserId, partner_name: 'User', partner_role: '', unread_count: 0 }, ...prev]
      })
    }
  }, [paramUserId])

  const handleSend = async () => {
    if (!text.trim() || !activeId || !user) return
    setSending(true)
    const msgText = text.trim()
    setText('')
    try {
      const newMsg = await sendMessage({ receiver_id: activeId, message: msgText })
      setMsgs(prev => [...prev, newMsg])
      loadConvs()
    } catch {
      toast('Failed to send', 'error')
      setText(msgText)
    } finally {
      setSending(false)
    }
  }

  const activeConv = convs.find(c => c.partner_id === activeId)

  return (
    <div className="chat-layout">
      {/* Conversations sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">Messages</div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : convs.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 13 }}>No conversations yet.<br />Chat with professionals from their profiles.</div>
          </div>
        ) : (
          convs.map(conv => (
            <div
              key={conv.partner_id}
              className={`conv-item ${activeId === conv.partner_id ? 'active' : ''}`}
              onClick={() => setActiveId(conv.partner_id)}
            >
              <div className="conv-avatar">
                {ROLE_EMOJI[conv.partner_role] || conv.partner_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="conv-name">{conv.partner_name}</div>
                <div className="conv-preview">{conv.last_message?.message || '—'}</div>
              </div>
              <div className="conv-meta">
                {conv.last_message && (
                  <div className="conv-time">
                    {new Date(conv.last_message.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {conv.unread_count > 0 && (
                  <div className="conv-unread">{conv.unread_count}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {activeId ? (
          <>
            <div className="chat-header">
              <div className="conv-avatar" style={{ width: 36, height: 36, fontSize: 18 }}>
                {ROLE_EMOJI[activeConv?.partner_role || ''] || (activeConv?.partner_name || 'U').charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{activeConv?.partner_name || 'User'}</div>
                {activeConv?.partner_role && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {activeConv.partner_role.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-faint)', paddingTop: 40 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
                  <div style={{ fontSize: 13 }}>Start the conversation</div>
                </div>
              )}
              {msgs.map(msg => {
                const isOut = msg.sender_id === user?.id
                const time = new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={msg.id} className={`msg ${isOut ? 'msg-out' : 'msg-in'}`}>
                    <div className="msg-bubble">{msg.message}</div>
                    <div className="msg-time">{time}</div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-bar">
              <input
                className="chat-input"
                placeholder="Type a message..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button className="chat-send" onClick={handleSend} disabled={!text.trim() || sending}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your Messages</div>
            <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
              Select a conversation or start chatting with a professional from their profile page.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
