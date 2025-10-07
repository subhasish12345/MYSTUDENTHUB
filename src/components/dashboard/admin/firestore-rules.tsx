
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

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      // Any signed-in user can read any other user's profile.
      // This is necessary for rules that need to check another user's role.
      allow get, list: if isSignedIn();
      // Any signed-in user can create their own user document during profile setup.
      allow create: if request.auth.uid == userId;
      // Admins can update/delete any user's main role document. Students/teachers can update their own.
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || request.auth.uid == userId;
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || request.auth.uid == studentId;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || request.auth.uid == studentId;
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      match /semesters/{semesterId} {
        allow read: if request.auth.uid == studentId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
        allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
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
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // SEMESTER GROUPS for Attendance/Assignments
    match /semesterGroups/{groupId} {
        allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
        allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

        match /attendance/{date} {
          allow read: if isSignedIn();
          allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
        }
    }

    // NOTICE BOARD
    match /notices/{noticeId} {
      allow get, list: if isSignedIn();
      allow create: if request.resource.data.authorRole == 'admin' || request.resource.data.authorRole == 'teacher';
      // An admin can update/delete any notice. A teacher can only modify their own.
      allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.postedBy == request.auth.uid;
    }
    
    // EVENTS
    match /events/{eventId} {
      allow get, list: if isSignedIn();
      // Admin can create any event.
      allow create: if request.resource.data.authorRole == 'admin';
      // Admin can update or delete any event.
      allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ASSIGNMENTS & SUBMISSIONS
    match /assignments/{assignmentId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // CIRCLES (Community Groups)
    match /circles/{circleId} {
      allow read, create: if isSignedIn();
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.createdBy == request.auth.uid;

      match /posts/{postId} {
        allow get, list, create: if isSignedIn();
        allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.author.uid == request.auth.uid;
      }
    }
  }
}
`
.trim();

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

