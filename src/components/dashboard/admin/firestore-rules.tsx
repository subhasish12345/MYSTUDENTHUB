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
      // Use exists() to prevent errors if the user document is not yet created.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : 'student'; // Default to least privileged role if doc doesn't exist.
    }

    function isTeacher() {
      return getUserRole() == 'teacher';
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    // The /users collection stores the role, which is the source of truth for permissions.
    match /users/{userId} {
      // Admins can read any user document; users can only read their own.
      allow get: if isSignedIn() && (isAdmin() || request.auth.uid == userId);
      allow list: if isSignedIn() && isAdmin();
      
      // Any authenticated user can create their own user document upon signup.
      // An admin can also create one for other users.
      allow create: if isSignedIn();
      
      // A user can update their own document, or an admin can update any user document.
      allow update: if isSignedIn() && (isAdmin() || request.auth.uid == userId);

      // Only an admin can delete a user document.
      allow delete: if isSignedIn() && isAdmin();
    }

    // Teacher-specific profiles. Write access is admin-only.
    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }

    // Student-specific profiles.
    match /students/{studentId} {
      allow get, list: if isSignedIn();
      // An admin can create a student profile. A student can create their own during setup.
      allow create: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      // An admin can update any profile. A student can only update their own.
      allow update: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      // Only admins can delete student profiles.
      allow delete: if isSignedIn() && isAdmin();

      // --- Student Sub-collections ---
      match /semesters/{semesterId} {
        // Admins can manage semesters, students can read their own.
        allow read, write: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      }
      match /focusSessions/{sessionId} {
        // A student has full control over their own focus sessions.
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
         // A student has full control over their own submissions.
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
    }

    // =====================================================================
    //  Academic Structure Collections (Admin Write-Only)
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
      // Admins and teachers can manage semester groups (e.g., for assigning students).
      allow write: if isSignedIn() && (isAdmin() || isTeacher());
      
      // Attendance sub-collection for a specific group.
      match /attendance/{date} {
        allow read, write: if isSignedIn() && (isAdmin() || isTeacher());
      }
    }

    // =====================================================================
    //  Content & Feature Collections
    // =====================================================================

    // Notice Board: Admins and teachers can manage notices.
    match /notices/{noticeId} {
      allow read: if isSignedIn();
      
      // Admins & teachers can create notices.
      allow create: if isSignedIn() && (isAdmin() || isTeacher());

      // An admin can update any notice. A teacher can only update their own.
      allow update: if isSignedIn() && (isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid));

      // An admin can delete any notice. A teacher can only delete their own.
      allow delete: if isSignedIn() && (isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid));
    }

    // Events: Only admins can create, update, or delete events.
    match /events/{eventId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdmin();
    }

    // Assignments: Managed by teachers and admins.
    match /assignments/{assignmentId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn() && (isAdmin() || isTeacher());
    }

    // Student Circles: Community feature.
    match /circles/{circleId} {
      allow read: if isSignedIn();
      
      // --- Circle Sub-collection for Posts ---
      match /posts/{postId} {
        // Any signed-in user can read and create posts.
        allow read, create: if isSignedIn();
        // A user can update/delete their own post. An admin can update/delete any post.
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
