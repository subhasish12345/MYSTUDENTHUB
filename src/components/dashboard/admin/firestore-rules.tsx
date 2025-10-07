
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
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      allow list: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Any signed-in user can read any user's profile. This is required for other rules to work.
      allow get: if isSignedIn();
      // Any signed-in user can create their own user document during profile setup.
      allow create: if isOwner(userId);
      // Admins can update/delete any user's main role document. Students/teachers can update their own.
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || isOwner(userId);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /teachers/{teacherId} {
      allow get: if isSignedIn();
      allow list: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || isOwner(teacherId);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /students/{studentId} {
      allow get: if isSignedIn();
      allow list: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
      allow create: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || isOwner(studentId);
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || isOwner(studentId);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      match /semesters/{semesterId} {
        allow read: if isOwner(studentId) || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
        allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }

      // Students can manage their own focus sessions and submissions
      match /focusSessions/{sessionId} {
      	allow read, write: if isOwner(studentId);
      }
      match /submissions/{submissionId} {
      	allow read, write: if isOwner(studentId);
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
      allow list, read: if isSignedIn();
      allow create: if request.resource.data.authorRole == 'admin' || request.resource.data.authorRole == 'teacher';
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' && resource.data.postedBy == request.auth.uid);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' && resource.data.postedBy == request.auth.uid);
    }
    
    // EVENTS
    match /events/{eventId} {
      allow list, read: if isSignedIn();
      allow create: if request.resource.data.authorRole == 'admin';
      allow update: if request.resource.data.authorRole == 'admin';
      allow delete: if resource.data.authorRole == 'admin';
    }

    // ASSIGNMENTS
    match /assignments/{assignmentId} {
      allow read: if isSignedIn(); // Students/teachers can read assignments
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    // CIRCLES (Community Groups)
    match /circles/{circleId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn(); // Any user can create a circle
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.createdBy == request.auth.uid;

      match /posts/{postId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn(); // Circle members can post
        allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.authorId == request.auth.uid;
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
