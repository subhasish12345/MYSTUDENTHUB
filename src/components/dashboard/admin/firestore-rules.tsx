"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Function to check if a user is signed in.
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper Function to get a user's role from the /users collection.
    // This is the single source of truth for a user's role.
    function getUserRole() {
      // Use exists() to prevent errors if the user document is not yet created during signup.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : null;
    }

    function isAdmin() {
      return isSignedIn() && getUserRole() == 'admin';
    }

    function isTeacher() {
      return isSignedIn() && getUserRole() == 'teacher';
    }
    
    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    match /users/{userId} {
      // Any signed-in user can read their own user doc. Admins can read any.
      allow get: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow list: if isAdmin();
      allow create: if isSignedIn();
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow write: if isAdmin();
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isAdmin() || request.auth.uid == studentId;
      allow update: if isAdmin() || request.auth.uid == studentId;
      allow delete: if isAdmin();

      match /semesters/{semesterId} {
        allow read, write: if isAdmin() || request.auth.uid == studentId;
      }
      match /focusSessions/{sessionId} {
        allow read, write: if request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if request.auth.uid == studentId;
      }
    }

    // =====================================================================
    //  Academic Structure
    // =====================================================================

    match /degrees/{degreeId} {
      allow get, list: if isSignedIn();
      allow write: if isAdmin();
    }
    match /streams/{streamId} {
      allow get, list: if isSignedIn();
      allow write: if isAdmin();
    }
    match /batches/{batchId} {
      allow get, list: if isSignedIn();
      allow write: if isAdmin();
    }

    // =====================================================================
    //  App Features
    // =====================================================================

    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || isTeacher();
      
      match /attendance/{date} {
        allow read: if isSignedIn() && (request.auth.uid in get(/databases/$(database)/documents/semesterGroups/$(groupId)).data.students || getUserRole() in ['admin', 'teacher']);
        allow write: if isAdmin() || isTeacher();
      }
    }

    match /notices/{noticeId} {
      allow get, list: if isSignedIn();
      allow create, update: if isTeacher() || isAdmin();
      allow delete: if isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid);
    }

    match /events/{eventId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }

    match /assignments/{assignmentId} {
      allow get: if isSignedIn();
      // Allow teachers/admins to list all assignments. Students can't list the whole collection.
      allow list: if isTeacher() || isAdmin();
      allow create, update, delete: if isTeacher() || isAdmin();
    }

    match /circles/{circleId} {
      allow read: if isSignedIn();
      match /posts/{postId} {
        allow read, create: if isSignedIn();
        allow update, delete: if isAdmin() || resource.data.author.uid == request.auth.uid;
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
