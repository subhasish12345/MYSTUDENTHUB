"use client";

import { createContext, useContext, useEffect, ReactNode, useCallback } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "@/lib/firebase";
import { useAuth } from "./use-auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "./use-toast";

type NotificationContextType = {};

const NotificationContext = createContext<NotificationContextType>({});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const requestPermission = useCallback(async () => {
    if (!user || !userRole) return;
    
    // Ensure this only runs in the browser
    if (typeof window === "undefined" || !("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return;
    }

    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("Notification permission granted.");
        const currentToken = await getToken(messaging, {
          vapidKey: "YOUR_VAPID_KEY_HERE", // Replace with your VAPID key from Firebase Console
        });
        
        if (currentToken) {
          console.log("FCM Token:", currentToken);
          // Save the token to the user's profile
          const userDocRef = doc(db, userRole === 'student' ? 'students' : 'teachers', user.uid);
          await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });

        } else {
          console.log("No registration token available. Request permission to generate one.");
        }
      } else {
        console.log("Unable to get permission to notify.");
      }
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
    }
  }, [user, userRole]);


  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });

        return () => {
            unsubscribe();
        };
    }
  }, [toast]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
