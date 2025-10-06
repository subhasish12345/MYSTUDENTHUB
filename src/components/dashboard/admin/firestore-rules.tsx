
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
      // Any signed-in user can create their own user document during profile setup.
      allow create: if isSignedIn() && request.auth.uid == userId;
      // Users can read their own data. Admins can read anyone's data.
      allow get: if isOwner(userId) || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Only Admins can list all users.
      allow list: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Only Admins can update or delete user roles.
      allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
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
      allow create: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
      allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' && resource.data.postedBy == request.auth.uid);
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
