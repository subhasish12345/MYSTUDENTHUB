"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Roles } from "@/lib/roles";

type AuthContextType = {
  user: User | null;
  userRole: Roles | null;
  userData: DocumentData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Roles | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const baseUserData = userDoc.data();
            const role = baseUserData.role as Roles;
            setUserRole(role);

            // If the user is an admin, their data comes solely from the /users collection.
            if (role === 'admin') {
              setUserData(baseUserData);
            } else {
              // For other roles, fetch the detailed profile from the role-specific collection
              const profileCollection = role === 'student' ? 'students' : (role === 'teacher' ? 'teachers' : null);
              
              if (profileCollection) {
                const profileDocRef = doc(db, profileCollection, user.uid);
                const profileDoc = await getDoc(profileDocRef);

                if (profileDoc.exists()) {
                    // Combine base user data (for role) with specific profile data
                    setUserData({ ...baseUserData, ...profileDoc.data() });
                } else {
                    console.warn(`No profile document found for UID: ${user.uid} in collection: ${profileCollection}. User may need to complete profile setup.`);
                    // This case is important for profile setup flow.
                    // Set userData to the base data so the app knows the role but can redirect to setup.
                    setUserData(baseUserData); 
                }
              } else {
                 // This case should ideally not be hit for defined roles other than admin
                 console.warn(`No specific profile collection for role: ${role}. Only base user data will be available.`);
                 setUserData(baseUserData);
              }
            }
          } else {
             console.log(`No user document found for UID: ${user.uid}. User might need to complete profile setup.`);
            setUserRole(null);
            setUserData(null);
          }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUser(null);
            setUserRole(null);
            setUserData(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
