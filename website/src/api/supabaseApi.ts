import { supabase, type User, type Project, type Material, type Order, type Message, type Bid } from '../lib/supabase'

// ============ Auth ============
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

// ============ Users/Profile ============
export const createUserProfile = async (userId: string, profile: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, ...profile })
    .select()
    .single()
  if (error) throw error
  return data as User
}

export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as User
}

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, profile_completed: true })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as User
}

export const getProfessionals = async (role: string, city?: string) => {
  let query = supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .eq('profile_completed', true)

  if (city) {
    query = query.ilike('city', `%${city}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as User[]
}

// ============ Projects ============
export const createProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export const getUserProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Project[]
}

export const getAvailableProjects = async (role: string, location?: string) => {
  const projectTypeMap: Record<string, string[]> = {
    architect: ['new_construction', 'renovation', 'commercial'],
    contractor: ['new_construction', 'renovation', 'commercial'],
    interior_designer: ['interior_design', 'renovation'],
  }

  const types = projectTypeMap[role] || []

  let query = supabase
    .from('projects')
    .select('*, users!projects_user_id_fkey(name, city)')
    .eq('status', 'pending')
    .in('project_type', types)

  if (location) {
    query = query.ilike('location', `%${location}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const bidOnProject = async (bid: Omit<Bid, 'id' | 'created_at' | 'status'>) => {
  const { data, error } = await supabase
    .from('bids')
    .insert(bid)
    .select()
    .single()
  if (error) throw error
  return data as Bid
}

// ============ Materials ============
export const getMaterials = async (category?: string) => {
  let query = supabase
    .from('materials')
    .select('*')
    .eq('in_stock', true)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as Material[]
}

export const getVendorMaterials = async (vendorId: string) => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Material[]
}

export const createMaterial = async (material: Omit<Material, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('materials')
    .insert(material)
    .select()
    .single()
  if (error) throw error
  return data as Material
}

export const updateMaterial = async (materialId: string, updates: Partial<Material>) => {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', materialId)
    .select()
    .single()
  if (error) throw error
  return data as Material
}

export const deleteMaterial = async (materialId: string) => {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
  if (error) throw error
}

// ============ Orders ============
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'status'>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single()
  if (error) throw error
  return data as Order
}

export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Order[]
}

export const getVendorOrders = async (vendorId: string) => {
  // Get orders that contain materials from this vendor
  const { data: materials } = await supabase
    .from('materials')
    .select('id')
    .eq('vendor_id', vendorId)

  if (!materials || materials.length === 0) return []

  const materialIds = materials.map(m => m.id)

  const { data, error } = await supabase
    .from('orders')
    .select('*, users!orders_user_id_fkey(name, city, contact)')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Filter orders that contain vendor's materials
  const vendorOrders = (data as Order[]).filter(order =>
    order.items.some(item => materialIds.includes(item.material_id))
  )

  return vendorOrders
}

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()
  if (error) throw error
  return data as Order
}

// ============ Messages ============
export const sendMessage = async (message: Omit<Message, 'id' | 'created_at' | 'read'>) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single()
  if (error) throw error
  return data as Message
}

export const getConversation = async (userId: string, otherId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', otherId)
    .eq('read', false)

  return data as Message[]
}

export const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(id, name, role), receiver:users!messages_receiver_id_fkey(id, name, role)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Group by conversation partner
  const conversations: Map<string, { partner_id: string; partner_name: string; partner_role: string; last_message: Message; unread_count: number }> = new Map()

  for (const msg of data as any[]) {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    const partner = msg.sender_id === userId ? msg.receiver : msg.sender

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partner_id: partnerId,
        partner_name: partner?.name || 'User',
        partner_role: partner?.role || '',
        last_message: msg,
        unread_count: 0,
      })
    }

    // Count unread messages from partner
    if (msg.receiver_id === userId && !msg.read) {
      const conv = conversations.get(partnerId)!
      conv.unread_count++
    }
  }

  return Array.from(conversations.values())
}

export const getUnreadCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false)
  if (error) throw error
  return { count: count || 0 }
}

// ============ File Uploads ============
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const uploadAvatar = async (userId: string, file: File) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (error) throw error

  const publicUrl = getPublicUrl('avatars', path)

  // Update user avatar
  await updateUserProfile(userId, { avatar: publicUrl })

  return { avatar: publicUrl }
}

export const uploadMaterialImages = async (materialId: string, files: File[]) => {
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = file.name.split('.').pop()
    const path = `${materialId}/${i}.${ext}`
    await supabase.storage.from('materials').upload(path, file, { upsert: true })
    urls.push(getPublicUrl('materials', path))
  }
  return { images: urls }
}

export { supabase }
