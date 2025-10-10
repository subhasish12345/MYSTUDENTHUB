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

    // Helper Function to safely get a user's role from the /users collection.
    function getUserRole() {
      // Use exists() to check if the document exists before trying to access its data.
      // This prevents errors on new user signup before the user doc is created.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : null;
    }
    
    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    // The /users collection is the single source of truth for roles.
    match /users/{userId} {
      // A user must be able to read their own user document for the getUserRole() function to work everywhere.
      // Admins can read any user document.
      allow get: if isSignedIn() && (request.auth.uid == userId || getUserRole() == 'admin');
      
      allow list: if isSignedIn() && getUserRole() == 'admin';
      allow create: if isSignedIn(); // Allows new users to be created.
      allow update: if isSignedIn() && (request.auth.uid == userId || getUserRole() == 'admin');
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }

    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole() == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == studentId);
      allow update: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == studentId);
      allow delete: if isSignedIn() && getUserRole() == 'admin';

      // --- Student Sub-collections ---
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
    //  Academic Structure & App Features
    // =====================================================================

    match /degrees/{degreeId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /streams/{streamId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /batches/{batchId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    
    match /semesterGroups/{groupId} {
      allow get, list: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      allow write: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      
      match /attendance/{date} {
        // Students can read attendance for groups they are in.
        allow read: if isSignedIn() && (request.auth.uid in get(/databases/$(database)/documents/semesterGroups/$(groupId)).data.students || getUserRole() in ['admin', 'teacher']);
        allow write: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      }
    }

    // --- NOTICE BOARD ---
    match /notices/{noticeId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (getUserRole() == 'admin' || getUserRole() == 'teacher');
    }

    // --- EVENTS ---
    match /events/{eventId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    
    // --- ASSIGNMENTS ---
    match /assignments/{assignmentId} {
        allow get, list: if isSignedIn();
        allow create, update, delete: if isSignedIn() && getUserRole() in ['teacher', 'admin'];
    }
    
    // --- STUDENT CIRCLES ---
    match /circles/{groupId}/posts/{postId} {
      function isMember() {
        return request.auth.uid in get(/databases/$(database)/documents/semesterGroups/$(groupId)).data.students;
      }
      
      // Admins, teachers assigned to the group, and student members can read/write.
      allow read, write: if isSignedIn() && (getUserRole() == 'admin' || isMember() || getUserRole() == 'teacher');
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
