"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface Tenant {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tenantLoading: boolean;
  userRole: 'admin' | 'user' | null;
  memberId: string | null;
  memberRole: string | null;
  is_release_manager: boolean;
  availableTenants: Tenant[];
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [is_release_manager, setIsReleaseManager] = useState<boolean>(false);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Use refs to prevent race conditions and duplicate fetches
  const roleFetchPromise = useRef<Promise<'admin' | 'user'> | null>(null);
  const lastFetchedUserId = useRef<string | null>(null);
  const isInitializing = useRef<boolean>(false);

  const supabase = createClient();

  const fetchUserTenants = async (userId: string): Promise<Tenant[]> => {
    try {
      const { data, error } = await supabase
        .from('tenant_user_map')
        .select(`
          tenant_id,
          tenants (
            id,
            name
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user tenants:', error);
        return [];
      }

      return data?.map((item: any) => ({
        id: item.tenants.id,
        name: item.tenants.name
      })) || [];
    } catch (error) {
      console.error('Error fetching user tenants:', error);
      return [];
    }
  };

  const fetchUserRole = async (userId: string, retryCount = 0): Promise<'admin' | 'user'> => {
    // console.log('🔍 FETCHING USER ROLE - User ID:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
    
    // If we're already fetching for this user, return the existing promise
    if (roleFetchPromise.current && lastFetchedUserId.current === userId) {
      // console.log('🔄 RETURNING EXISTING ROLE FETCH PROMISE');
      return roleFetchPromise.current;
    }

    // If we're fetching for a different user, wait for the current fetch to complete
    if (roleFetchPromise.current && lastFetchedUserId.current !== userId) {
      // console.log('🔄 WAITING FOR PREVIOUS ROLE FETCH TO COMPLETE');
      try {
        await roleFetchPromise.current;
      } catch (error) {
        // console.log('🔄 PREVIOUS ROLE FETCH FAILED, PROCEEDING WITH NEW FETCH');
        // Clear the failed promise and continue
        roleFetchPromise.current = null;
        lastFetchedUserId.current = null;
      }
    }

    // Create a timeout promise with longer timeout (increases with retries)
    const timeoutMs = Math.min(10000 + (retryCount * 2000), 30000); // Max 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Role fetch timeout after ${timeoutMs/1000} seconds`)), timeoutMs);
    });

    // Create the fetch promise
    const fetchPromise = supabase
      .from('sys_roles')
      .select('sys_role')
      .eq('user_id', userId)
      .single();

    // Store the promise and user ID BEFORE creating the promise
    lastFetchedUserId.current = userId;
    
    // Store the promise and user ID
    roleFetchPromise.current = Promise.race([fetchPromise, timeoutPromise]).then(({ data, error }) => {
      if (error) {
        console.error('❌ ROLE FETCH ERROR:', error);
        throw new Error(`Role fetch failed: ${error.message}`);
      }

      if (!data || !data.sys_role) {
        console.error('❌ NO ROLE DATA FOUND for user:', userId);
        throw new Error(`No role data found in sys_roles table for user ${userId}`);
      }

      // console.log('✅ ROLE FETCHED SUCCESSFULLY:', data.sys_role, 'for user:', userId);
      return data.sys_role as 'admin' | 'user';
    }).catch((error) => {
      console.error('❌ ROLE FETCH EXCEPTION:', error);
      // Clear the promise reference so we can retry
      roleFetchPromise.current = null;
      lastFetchedUserId.current = null;
      
      // Retry up to 2 times with exponential backoff
      if (retryCount < 2 && error.message.includes('timeout')) {
        // console.log(`🔄 RETRYING ROLE FETCH (attempt ${retryCount + 1})`);
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        return new Promise(resolve => setTimeout(resolve, delay))
          .then(() => fetchUserRole(userId, retryCount + 1));
      }
      
      throw error; // Re-throw the error if max retries reached
    });

    return roleFetchPromise.current;
  };

  const fetchMemberInfo = async (userId: string, tenantId: string | null) => {
    if (!tenantId) {
      setMemberId(null);
      setMemberRole(null);
      setIsReleaseManager(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, member_role')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single();

      if (!error && data) {
        setMemberId(data.id);
        setMemberRole(data.member_role);
        setIsReleaseManager(data.member_role === 'release_manager');
        // console.log('AuthContext: memberId set to', data.id, 'memberRole:', data.member_role);
      } else {
        setMemberId(null);
        setMemberRole(null);
        setIsReleaseManager(false);
        // console.log('AuthContext: memberId set to null');
      }
    } catch (error) {
      console.error('Error fetching member info:', error);
      setMemberId(null);
      setMemberRole(null);
      setIsReleaseManager(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      setMemberId(null);
      setMemberRole(null);
      setIsReleaseManager(false);
      setAvailableTenants([]);
      setSelectedTenant(null);
      // Clear the fetch promise and user ID
      roleFetchPromise.current = null;
      lastFetchedUserId.current = null;
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshUser = async () => {
    try {
      // console.log('🔄 REFRESHING USER...');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setUser(currentUser);
      setSession(currentSession);

      // Only fetch role if user exists and we haven't fetched it yet
      if (currentUser && lastFetchedUserId.current !== currentUser.id) {
        // console.log('🔄 FETCHING ROLE DURING REFRESH...');
        try {
          const role = await fetchUserRole(currentUser.id);
          setUserRole(role);
        } catch (error) {
          console.error('❌ ROLE FETCH ERROR DURING REFRESH:', error);
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error("❌ REFRESH ERROR:", error);
      setLoading(false);
    }
  };

  // Handle tenant selection
  const handleTenantSelection = (tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    if (user && tenant) {
      fetchMemberInfo(user.id, tenant.id);
    } else {
      setMemberId(null);
      setMemberRole(null);
    }
  };

  useEffect(() => {
    // console.log('🚀 AUTH CONTEXT INITIALIZING...');
    isInitializing.current = true;
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        // console.log('📋 GETTING INITIAL SESSION...');
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch role if user exists and we haven't fetched it yet
        if (session?.user && lastFetchedUserId.current !== session.user.id) {
          // console.log('👤 SESSION USER FOUND, FETCHING ROLE ONCE...');
          try {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
            // console.log('✅ INITIAL ROLE SET:', role);
          } catch (error) {
            console.error('❌ INITIAL ROLE FETCH ERROR:', error);
            setUserRole(null);
          }
        } else if (!session?.user) {
          // console.log('👤 NO SESSION USER');
          setUserRole(null);
        }

        // console.log('✅ AUTH INITIALIZATION COMPLETE');
        setLoading(false);
        isInitializing.current = false;
      } catch (error) {
        console.error('❌ AUTH INITIALIZATION ERROR:', error);
        setLoading(false);
        isInitializing.current = false;
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔄 AUTH STATE CHANGE:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        // Skip role fetching during initial auth state changes to avoid race conditions
        if (isInitializing.current && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          // console.log('🔄 SKIPPING ROLE FETCH DURING INITIALIZATION for event:', event);
          setLoading(false);
          return;
        }

        // Only fetch role if user exists and we haven't fetched it yet for this user
        if (session?.user && lastFetchedUserId.current !== session.user.id) {
          // console.log('🔄 FETCHING ROLE ON AUTH CHANGE...');
          try {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
            // console.log('✅ ROLE SET ON AUTH CHANGE:', role);
          } catch (error) {
            console.error('❌ ROLE FETCH ERROR ON AUTH CHANGE:', error);
            setUserRole(null);
          }
        } else if (!session?.user) {
          // console.log('🔄 CLEARING ROLE - no user');
          setUserRole(null);
          setMemberId(null);
          setMemberRole(null);
          setIsReleaseManager(false);
          setAvailableTenants([]);
          setSelectedTenant(null);
          // Clear the fetch promise and user ID
          roleFetchPromise.current = null;
          lastFetchedUserId.current = null;
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      isInitializing.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch available tenants for the user
      const fetchTenants = async () => {
        setTenantLoading(true);
        const tenants = await fetchUserTenants(user.id);
        setAvailableTenants(tenants);
        
        // Auto-select tenant if user has only one
        if (tenants.length === 1) {
          handleTenantSelection(tenants[0]);
        } else if (tenants.length === 0) {
          // No tenants available
          setSelectedTenant(null);
          setMemberId(null);
          setMemberRole(null);
          setIsReleaseManager(false);
        }
        // If user has multiple tenants, don't auto-select - let them choose
        setTenantLoading(false);
      };
      
      fetchTenants();
    } else {
      setAvailableTenants([]);
      setSelectedTenant(null);
      setMemberId(null);
      setMemberRole(null);
      setIsReleaseManager(false);
      setTenantLoading(false);
    }
  }, [user]);

  const value = {
    user,
    session,
    loading,
    tenantLoading,
    userRole,
    memberId,
    memberRole,
    is_release_manager,
    availableTenants,
    selectedTenant,
    setSelectedTenant: handleTenantSelection,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}