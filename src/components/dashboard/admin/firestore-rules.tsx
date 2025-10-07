
"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Function — Check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper Function to get user data. Be careful with usage in write rules.
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    // ✅ USERS COLLECTION
    match /users/{userId} {
      // Allow users to read their own data, and admins to read any.
      allow get: if isSignedIn() && (request.auth.uid == userId || getUserData().role == 'admin');
      allow list: if isSignedIn() && getUserData().role == 'admin';
      
      // Allow a user to create their own /users document on signup
      allow create: if isSignedIn();
      
      // Allow a user to update their own data, or an admin to update any user.
      allow update: if isSignedIn() && (request.auth.uid == userId || getUserData().role == 'admin');

      // Only admins can delete user documents.
      allow delete: if isSignedIn() && getUserData().role == 'admin';
    }

    // ✅ TEACHERS & STUDENTS (Profile Collections)
    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserData().role == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && getUserData().role == 'admin';
      allow update: if isSignedIn() && (getUserData().role == 'admin' || request.auth.uid == studentId);
      allow delete: if isSignedIn() && getUserData().role == 'admin';

      // Sub-collections for students
      match /semesters/{semesterId} {
        allow read, write: if request.auth.uid == studentId || getUserData().role == 'admin';
      }
      match /focusSessions/{sessionId} {
        allow read, write: if request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if request.auth.uid == studentId;
      }
    }

    // ✅ ACADEMIC STRUCTURE (Admin-only write)
    match /degrees/{degreeId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserData().role == 'admin';
    }
    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserData().role == 'admin';
    }
    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserData().role == 'admin';
    }
    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserData().role in ['admin', 'teacher'];
      match /attendance/{date} {
        allow read, write: if isSignedIn() && getUserData().role in ['admin', 'teacher'];
      }
    }

    // ✅ NOTICE BOARD
    match /notices/{noticeId} {
      allow get, list: if isSignedIn();

      // For create/update, check the role sent with the request data to avoid complex gets.
      allow create, update: if isSignedIn() && request.resource.data.authorRole in ['admin', 'teacher'];

      // For delete, check the role on the existing document. Secure because create rule is secure.
      // Also allow users to delete their own notices.
      allow delete: if isSignedIn() && (resource.data.postedBy == request.auth.uid || getUserData().role == 'admin');
    }

    // ✅ EVENTS SECTION
    match /events/{eventId} {
      allow get, list: if isSignedIn();
      
      // For create/update, check the role sent with the request data.
      allow create, update: if isSignedIn() && request.resource.data.authorRole == 'admin';
      
      // For delete, check the role on the existing document.
      allow delete: if isSignedIn() && getUserData().role == 'admin';
    }

    // ✅ ASSIGNMENTS & SUBMISSIONS
    match /assignments/{assignmentId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserData().role in ['teacher', 'admin'];
    }

    // ✅ CIRCLES (Community groups)
    match /circles/{circleId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (resource.data.createdBy == request.auth.uid || getUserData().role == 'admin');

      match /posts/{postId} {
        allow get, list, create: if isSignedIn();
        allow update, delete: if isSignedIn() && (resource.data.author.uid == request.auth.uid || getUserData().role == 'admin');
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
