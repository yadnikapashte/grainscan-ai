import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Flag to avoid async issues during cleanup
    let isSubscribed = true

    const initAuth = async () => {
      try {
        // 1. Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (isSubscribed) {
          if (session?.user) {
            setUser(session.user)
            await fetchProfile(session.user.id)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }

    if (isInitialMount.current) {
      initAuth()
      isInitialMount.current = false
      
      // 1.5. Failsafe timeout
      // Forces loading to false if Supabase hangs (e.g. network/blocked)
      const failsafe = setTimeout(() => {
        if (loading) {
          console.warn('Auth initialization took too long. Forcing layout release.')
          setLoading(false)
        }
      }, 2000)
      
      return () => clearTimeout(failsafe)
    }

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event triggered:', event)
      
      if (!isSubscribed) return

      if (session?.user) {
        // Only update if user ID changed to prevent infinite loops
        setUser(prevUser => {
          if (prevUser?.id !== session.user.id) {
            return session.user
          }
          return prevUser
        })
        
        // RELEASE LOADING IMMEDIATELY - Don't block for profile
        setLoading(false)
        
        // Fetch profile in the background
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) setProfile(data)
    } catch (err) {
      if (err.code !== 'PGRST116') { // PGRST116 is 'no rows returned' for .single()
        console.error('Error fetching profile:', err)
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
