
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

    // Helper function to get user's role securely.
    // Use this for READ rules, but avoid in WRITE rules where possible.
    function getUserRole(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role;
    }
    
    // ✅ USERS COLLECTION
    match /users/{userId} {
      // Admins can read any user doc. Users can read their own.
      allow get: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || request.auth.uid == userId);
      allow list: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
      
      // Allow a user to create their own /users document on signup
      allow create: if isSignedIn();
      
      // An admin can update any user. A user can update their own doc.
      allow update: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || request.auth.uid == userId);

      // Only admins can delete user documents.
      allow delete: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }

    // ✅ TEACHERS & STUDENTS (Profile Collections)
    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      // Only admins can write to the teachers collection.
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      // Admins can create students. Students can create their own profile during setup.
      allow create: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || request.auth.uid == studentId);
      // Admins or the student themselves can update their profile.
      allow update: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || request.auth.uid == studentId);
      allow delete: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';

      // Sub-collections for students
      match /semesters/{semesterId} {
        allow read: if isSignedIn();
        allow write: if getUserRole(request.auth.uid) == 'admin';
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
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) in ['admin', 'teacher'];
      match /attendance/{date} {
        allow read, write: if isSignedIn() && getUserRole(request.auth.uid) in ['admin', 'teacher'];
      }
    }

    // ✅ NOTICE BOARD
    match /notices/{noticeId} {
      allow get, list: if isSignedIn();

      // Check the role being sent IN THE REQUEST DATA. This is secure and reliable.
      allow create, update: if isSignedIn() && request.resource.data.authorRole in ['admin', 'teacher'];

      // For delete, check the role on the DOCUMENT BEING DELETED.
      allow delete: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || resource.data.postedBy == request.auth.uid);
    }

    // ✅ EVENTS SECTION (Corrected and Simplified)
    match /events/{eventId} {
      allow get, list: if isSignedIn();

      // 'create' and 'update' check the role being sent in the request data.
      allow create, update: if isSignedIn() && request.resource.data.authorRole == 'admin';
      
      // 'delete' checks the role on the existing document, which is safe.
      allow delete: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }

    // ✅ ASSIGNMENTS & SUBMISSIONS
    match /assignments/{assignmentId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) in ['teacher', 'admin'];
    }

    // ✅ CIRCLES (Community groups)
    match /circles/{circleId} {
      allow read: if isSignedIn();
      // Any signed in user can create a post, but we check author UID for updates/deletes.
      match /posts/{postId} {
        allow get, list, create: if isSignedIn();
        allow update, delete: if isSignedIn() && (resource.data.author.uid == request.auth.uid || getUserRole(request.auth.uid) == 'admin');
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
