"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { 
      return request.auth != null; 
    }
    
    function isAdmin() {
      // The user must have permission to read their own /users document for this to work.
      return isSignedIn() && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    function isTeacher() {
      // Check if a user is a teacher by looking for their UID in the /teachers collection
      return isSignedIn() && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher');
    }

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      allow create: if isSignedIn();
      allow read:   if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow update, delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow read: if isSignedIn();
      allow list: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin() || request.auth.uid == teacherId;
      allow delete: if isAdmin();
    }

    match /students/{studentId} {
      allow read: if isSignedIn() && (request.auth.uid == studentId || isAdmin() || isTeacher());
      allow list: if isAdmin(); // Admin can query the list of all students
      allow create: if isAdmin() || (isSignedIn() && request.auth.uid == studentId);
      allow update: if isAdmin() || request.auth.uid == studentId;
      allow delete: if isAdmin();

      match /semesters/{semesterId} {
        allow read: if isSignedIn() && (request.auth.uid == studentId || isAdmin() || isTeacher());
        allow write: if isAdmin(); // Admin can add/edit semesters for students
      }
      match /focusSessions/{sessionId} {
        allow read, write: if request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if request.auth.uid == studentId;
      }
    }
    
    // ACADEMIC STRUCTURE COLLECTIONS (Admin-only write access)
    match /degrees/{degreeId} {
      allow read: if isSignedIn();
      allow list, write: if isAdmin();
    }

    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow list, write: if isAdmin();
    }

    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow list, write: if isAdmin();
    }

    // SEMESTER GROUPS for Attendance/Assignments
    match /semesterGroups/{groupId} {
        allow read: if isAdmin() || isTeacher();
        allow list: if isAdmin() || isTeacher();
        allow write: if isAdmin(); // Allow admin to create/update/delete groups

        // Attendance subcollection
        match /attendance/{date} {
          allow read: if isSignedIn();
          allow write: if isTeacher() || isAdmin();
        }
    }

    // NOTICE BOARD
    match /notices/{noticeId} {
      allow read: if isSignedIn();
      allow create, update: if isAdmin() || isTeacher();
      allow delete: if isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid);
    }

    // EVENTS
    match /events/{eventId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }

    // ASSIGNMENTS
    match /assignments/{assignmentId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || isTeacher();
    }

    // CIRCLES
    match /circles/{circleId} {
      allow read: if isSignedIn();
      match /posts/{postId} {
        allow read, create: if isSignedIn();
        allow update, delete: if isAdmin() || resource.data.author.uid == request.auth.uid;
      }
    }
  }
}
`;

export function FirestoreRules() {
    const [hasCopied, setHasCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(rules.trim());
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
                    {rules.trim()}
                </code>
            </pre>
        </div>
    );
}
