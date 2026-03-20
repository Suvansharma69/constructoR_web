import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { getConversations, getConversation, sendMessage, BACKEND_URL } from '../api/api'

interface Message { _id:string; sender_id:string; receiver_id:string; message:string; created_at:string; read:boolean }
interface Conversation { partner_id:string; partner_name:string; partner_role:string; last_message?:any; unread_count:number }

const ROLE_EMOJI: Record<string,string> = { homeowner:'🏠', architect:'📐', contractor:'🔨', interior_designer:'🎨', vendor:'🏪' }

export default function Chat() {
  const { userId: paramUserId } = useParams<{ userId?: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [convs, setConvs] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(paramUserId || null)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Connect socket
  useEffect(() => {
    if (!user) return
    const socket = io(BACKEND_URL, { transports: ['websocket','polling'] })
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('join_room', { user_id: user._id })
    })
    socket.on('new_message', (msg: Message) => {
      if (msg.sender_id === activeId || msg.receiver_id === activeId) {
        setMsgs(prev => [...prev, msg])
      }
      loadConvs()
    })
    return () => { socket.emit('leave_room', { user_id: user._id }); socket.disconnect() }
  }, [user, activeId])

  const loadConvs = () => {
    getConversations(user!._id).then(r => setConvs(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { if (user) loadConvs() }, [user])

  useEffect(() => {
    if (!activeId || !user) return
    getConversation(user._id, activeId).then(r => setMsgs(r.data)).catch(() => toast('Failed to load messages','error'))
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (paramUserId && paramUserId !== activeId) {
      setActiveId(paramUserId)
      // Create a temp conversation entry if not already present
      if (!convs.find(c => c.partner_id === paramUserId)) {
        setConvs(prev => [{
          partner_id: paramUserId, partner_name: 'User', partner_role: '', unread_count: 0
        }, ...prev])
      }
    }
  }, [paramUserId])

  const handleSend = async () => {
    if (!text.trim() || !activeId) return
    setSending(true)
    const msgText = text.trim()
    setText('')
    try {
      const res = await sendMessage(user!._id, { receiver_id: activeId, message: msgText })
      setMsgs(prev => [...prev, res.data])
      loadConvs()
    } catch { toast('Failed to send','error'); setText(msgText) } finally { setSending(false) }
  }

  const activeConv = convs.find(c => c.partner_id === activeId)

  return (
    <div className="chat-layout" style={{margin:'-28px', height:'calc(100vh - 64px)'}}>
      {/* Conversations sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">💬 Messages</div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : convs.length === 0 ? (
          <div style={{padding:20,textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:40,marginBottom:12}}>💬</div>
            <div style={{fontSize:13}}>No conversations yet.<br/>Chat with professionals from their profiles.</div>
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
              <div style={{flex:1,minWidth:0}}>
                <div className="conv-name">{conv.partner_name}</div>
                <div className="conv-preview">
                  {conv.last_message?.message || '—'}
                </div>
              </div>
              <div className="conv-meta">
                {conv.last_message && (
                  <div className="conv-time">
                    {new Date(conv.last_message.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
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
              <div className="conv-avatar" style={{width:36,height:36,fontSize:18}}>
                {ROLE_EMOJI[activeConv?.partner_role||''] || (activeConv?.partner_name||'U').charAt(0)}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>{activeConv?.partner_name || 'User'}</div>
                {activeConv?.partner_role && (
                  <div style={{fontSize:12,color:'var(--text-muted)',textTransform:'capitalize'}}>{activeConv.partner_role.replace('_',' ')}</div>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {msgs.length === 0 && (
                <div style={{textAlign:'center',color:'var(--text-faint)',paddingTop:40}}>
                  <div style={{fontSize:36,marginBottom:8}}>👋</div>
                  <div style={{fontSize:13}}>Start the conversation</div>
                </div>
              )}
              {msgs.map(msg => {
                const isOut = msg.sender_id === user?._id
                const time = new Date(msg.created_at).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})
                return (
                  <div key={msg._id} className={`msg ${isOut ? 'msg-out' : 'msg-in'}`}>
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
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:72,marginBottom:16}}>💬</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Your Messages</div>
            <div style={{fontSize:14,textAlign:'center',maxWidth:280}}>
              Select a conversation or start chatting with a professional from their profile page.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
