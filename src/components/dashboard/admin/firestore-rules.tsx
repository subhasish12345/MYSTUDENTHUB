"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if a user is signed in.
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper function to safely get a user's role from the /users collection.
    // This is the single source of truth for a user's role.
    function getUserRole() {
      // Check if the user document exists before trying to access its data.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : 'student'; // Default to least privileged role if doc doesn't exist.
    }

    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    match /users/{userId} {
      // Admins can read any user document; users can only read their own.
      allow get: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == userId);
      allow list: if isSignedIn() && getUserRole() == 'admin';
      
      // Any authenticated user can create their own user document.
      allow create: if isSignedIn();
      
      // A user can update their own document, or an admin can update any user document.
      allow update: if isSignedIn() && (request.auth.uid == userId || getUserRole() == 'admin');

      // Only an admin can delete a user document.
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }

    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == studentId);
      allow update: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == studentId);
      allow delete: if isSignedIn() && getUserRole() == 'admin';

      match /semesters/{semesterId} {
        allow read, write: if isSignedIn() && (request.auth.uid == studentId || getUserRole() == 'admin');
      }
      match /focusSessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
    }

    // =====================================================================
    //  Academic Structure Collections (Admin Write-Only)
    // =====================================================================

    match /degrees/{degreeId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      
      match /attendance/{date} {
        allow read, write: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      }
    }

    // =====================================================================
    //  Content & Feature Collections
    // =====================================================================

    match /notices/{noticeId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      allow delete: if isSignedIn() && (getUserRole() == 'admin' || resource.data.postedBy == request.auth.uid);
    }

    match /events/{eventId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole() == 'admin';
    }

    match /assignments/{assignmentId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() in ['teacher', 'admin'];
    }

    match /circles/{circleId} {
      allow read: if isSignedIn();
      
      match /posts/{postId} {
        allow read, create: if isSignedIn();
        allow update, delete: if isSignedIn() && (resource.data.author.uid == request.auth.uid || getUserRole() == 'admin');
      }
    }
  }
}
`.trim();

export function FirestoreRules() {
    const [hasCopied, setHasCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(rules);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="relative p-4 bg-muted rounded-lg">
            <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
            >
                {hasCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                <span className="sr-only">Copy</span>
            </Button>
            <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>
                    {rules}
                </code>
            </pre>
        </div>
    );
}
