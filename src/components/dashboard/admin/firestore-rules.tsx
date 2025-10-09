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

    // Helper function to get a user's role from their document in the /users collection.
    // This is the single source of truth for a user's role.
    function getUserRole() {
      // Use exists() to prevent errors if the user document is not yet created during signup.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : 'student'; // Default to least privileged role if doc doesn't exist.
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    function isTeacher() {
      return getUserRole() == 'teacher';
    }

    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    // The /users collection stores the role, which is the source of truth for permissions.
    match /users/{userId} {
      // An admin can read any user document. Users can only read their own.
      // This is crucial for the helper functions to work correctly.
      allow get: if isSignedIn() && (isAdmin() || request.auth.uid == userId);
      
      // Only admins can list all users.
      allow list: if isSignedIn() && isAdmin();
      
      // Anyone can create their own user document (e.g., on profile setup). Admins can create for others.
      allow create: if isSignedIn();
      
      // A user can update their own document. An admin can update any document.
      allow update: if isSignedIn() && (isAdmin() || request.auth.uid == userId);

      // Only an admin can delete a user document.
      allow delete: if isSignedIn() && isAdmin();
    }

    // Teacher-specific profiles. Admins have full control.
    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdmin();
    }

    // Student-specific profiles.
    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      allow update: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      allow delete: if isSignedIn() && isAdmin();

      // --- Student Sub-collections ---
      match /semesters/{semesterId} {
        allow read, write: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      }
      match /focusSessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
    }

    // =====================================================================
    //  Academic Structure Collections
    // =====================================================================

    match /degrees/{degreeId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }
    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }
    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }
    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (isAdmin() || isTeacher());
      
      match /attendance/{date} {
        allow read, write: if isSignedIn() && (isAdmin() || isTeacher());
      }
    }

    // =====================================================================
    //  Content & Feature Collections
    // =====================================================================

    match /notices/{noticeId} {
      allow read, list: if isSignedIn();
      allow create: if isSignedIn() && (isAdmin() || isTeacher());
      allow update: if isSignedIn() && (isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid));
      allow delete: if isSignedIn() && (isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid));
    }

    match /events/{eventId} {
      allow read, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdmin();
    }

    match /assignments/{assignmentId} {
      allow read, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && (isAdmin() || isTeacher());
    }

    match /circles/{circleId} {
      allow read: if isSignedIn();
      
      match /posts/{postId} {
        allow read, list, create: if isSignedIn();
        allow update, delete: if isSignedIn() && (isAdmin() || resource.data.author.uid == request.auth.uid);
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
