
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

    // Helper Function — Get role of current user
    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    // ✅ USERS COLLECTION
    match /users/{userId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn(); // first-time user signup allowed
      allow update: if request.auth.uid == userId || userRole() == 'admin';
      allow delete: if userRole() == 'admin';
    }

    // ✅ TEACHERS COLLECTION
    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if userRole() == 'admin';
    }

    // ✅ STUDENTS COLLECTION
    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if userRole() == 'admin' || request.auth.uid == studentId;
      allow update: if userRole() == 'admin' || request.auth.uid == studentId;
      allow delete: if userRole() == 'admin';

      // Sub-collections
      match /semesters/{semesterId} {
        allow read, write: if request.auth.uid == studentId || userRole() == 'admin';
      }

      match /focusSessions/{sessionId} {
        allow read, write: if request.auth.uid == studentId;
      }

      match /submissions/{submissionId} {
        allow read, write: if request.auth.uid == studentId;
      }
    }

    // ✅ DEGREE / STREAM / BATCH STRUCTURE (Admin-only write)
    match /degrees/{degreeId} {
      allow read: if isSignedIn();
      allow write: if userRole() == 'admin';
    }

    match /streams/{streamId} {
      allow read: if isSignedIn();
      allow write: if userRole() == 'admin';
    }

    match /batches/{batchId} {
      allow read: if isSignedIn();
      allow write: if userRole() == 'admin';
    }

    // ✅ SEMESTER GROUPS (For Attendance & Assignments)
    match /semesterGroups/{groupId} {
      allow read: if isSignedIn();
      allow write: if userRole() in ['admin', 'teacher'];

      match /attendance/{date} {
        allow read, write: if userRole() in ['admin', 'teacher'];
      }
    }

    // ✅ NOTICE BOARD
    match /notices/{noticeId} {
      allow get, list: if isSignedIn();

      // Admins & teachers can create or update notices
      allow create, update: if
        isSignedIn() &&
        userRole() in ['admin', 'teacher'];

      // Allow delete if user is admin or is the original poster
      allow delete: if
        isSignedIn() &&
        (
          userRole() == 'admin' ||
          resource.data.postedBy == request.auth.uid
        );
    }

    // ✅ EVENTS SECTION
    match /events/{eventId} {
      allow get, list: if isSignedIn();

      // Only admins can create or update events
      allow create, update: if
        isSignedIn() &&
        userRole() == 'admin';

      // Only admins can delete events
      allow delete: if
        isSignedIn() &&
        userRole() == 'admin';
    }

    // ✅ ASSIGNMENTS & SUBMISSIONS
    match /assignments/{assignmentId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if userRole() in ['teacher', 'admin'];
    }

    // ✅ CIRCLES (Community groups)
    match /circles/{circleId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if resource.data.createdBy == request.auth.uid || userRole() == 'admin';

      match /posts/{postId} {
        allow get, list, create: if isSignedIn();
        allow update, delete: if
          resource.data.author.uid == request.auth.uid ||
          userRole() == 'admin';
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
