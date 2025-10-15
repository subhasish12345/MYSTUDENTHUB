"use client";

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: Error) => {
      console.error("Caught a permission error:", error);

      if (error instanceof FirestorePermissionError) {
         const contextualError = new Error(
          `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(error.context, null, 2)}`
        );
        console.error(contextualError);

        // This will now be caught by the Next.js development overlay
        // We throw it in a timeout to break out of the current React render cycle
        setTimeout(() => {
          throw contextualError;
        }, 0);
        
      } else {
         toast({
          variant: "destructive",
          title: "Firebase Error",
          description: error.message || "An unknown Firebase error occurred.",
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
