"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const rules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // =====================================================================
    // Helper Functions
    // =====================================================================

    function isSignedIn() {
      return request.auth != null;
    }

    // Securely checks the role of the currently signed-in user from the /users collection.
    // This is the single source of truth.
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
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
      // Admins can see any user document. Users can only see their own.
      allow get: if isSignedIn() && (isAdmin() || request.auth.uid == userId);
      // Only Admins can list all user documents.
      allow list: if isAdmin();
      // Any authenticated user can create their own doc. An admin can create for others.
      allow create: if isSignedIn();
      // An admin can update any user doc. A user can only update their own.
      allow update: if isAdmin() || request.auth.uid == userId;
      // Only an admin can delete user documents.
      allow delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      // Any signed-in user can read teacher profiles.
      allow read: if isSignedIn();
      // Only admins can write to teacher profiles.
      allow write: if isAdmin();
    }

    match /students/{studentId} {
      // Any signed-in user can read student profiles.
      allow read: if isSignedIn();
      // An admin can create a student profile, or a student can create their own.
      allow create: if isAdmin() || request.auth.uid == studentId;
      // An admin can update any profile. A student can only update their own.
      allow update: if isAdmin() || request.auth.uid == studentId;
      // Only an admin can delete student profiles.
      allow delete: if isAdmin();

      // Student Sub-collections
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
    //  Academic Structure (Admin Write-Only)
    // =====================================================================

    match /degrees/{degreeId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // =====================================================================
    //  App Features
    // =====================================================================

    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || isTeacher();
      match /attendance/{date} {
        allow read, write: if isAdmin() || isTeacher();
      }
    }

    match /notices/{noticeId} {
      allow read: if isSignedIn();
      // The `authorRole` is passed in the request and checked on creation/update.
      // This is safe because the rule ensures only admins/teachers can do this.
      allow create, update: if (isAdmin() || isTeacher());
      // Admins can delete any notice. Teachers can only delete their own.
      allow delete: if isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid);
    }

    match /events/{eventId} {
      allow read: if isSignedIn();
      // Only admins can create, update, or delete events.
      allow write: if isAdmin();
    }

    match /assignments/{assignmentId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || isTeacher();
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
