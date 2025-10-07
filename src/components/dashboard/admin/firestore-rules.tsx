
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

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    function isTeacher() {
      return getUserRole() == 'teacher';
    }

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      // Any signed-in user can read any other user's profile to check roles.
      allow get: if isSignedIn();
      allow list: if isAdmin();
      // Any signed-in user can create their own user document during profile setup.
      allow create: if isOwner(userId);
      // Admins can update/delete any user's main role document. Students/teachers can update their own.
      allow update: if isAdmin() || isOwner(userId);
      allow delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow get: if isSignedIn();
      allow list: if isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /students/{studentId} {
      allow get: if isSignedIn();
      allow list: if isAdmin() || isTeacher();
      allow create: if isAdmin() || isOwner(studentId);
      allow update: if isAdmin() || isOwner(studentId);
      allow delete: if isAdmin();

      match /semesters/{semesterId} {
        allow read: if isOwner(studentId) || isAdmin() || isTeacher();
        allow write: if isAdmin();
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

    // SEMESTER GROUPS for Attendance/Assignments
    match /semesterGroups/{groupId} {
        allow read: if isAdmin() || isTeacher();
        allow write: if isAdmin();

        match /attendance/{date} {
          allow read: if isSignedIn();
          allow write: if isAdmin() || isTeacher();
        }
    }

    // NOTICE BOARD
    match /notices/{noticeId} {
      // Explicitly allow both single-document gets and collection-wide lists
      allow get, list: if isSignedIn();
      // Only admins or teachers can create notices. Check the role from the incoming data.
      allow create: if request.resource.data.authorRole == 'admin' || request.resource.data.authorRole == 'teacher';
      // An admin can update any notice. A teacher can only update their own.
      allow update: if isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid);
      allow delete: if isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid);
    }
    
    // EVENTS
    match /events/{eventId} {
      // Allow any logged-in user to view the list of events or a single event
      allow get, list: if isSignedIn();
      // Only allow event creation if the incoming data marks the author as an admin
      allow create: if request.resource.data.authorRole == 'admin';
      // Only allow updates if the user is an admin
      allow update: if isAdmin();
      // Only allow deletion if the user is an admin
      allow delete: if isAdmin();
    }

    // ASSIGNMENTS & SUBMISSIONS
    match /assignments/{assignmentId} {
      // Allow any logged-in user to query the assignments collection
      allow get, list: if isSignedIn();
      // Only teachers or admins can create, update, or delete assignments
      allow create, update, delete: if isTeacher() || isAdmin();
    }

    // CIRCLES (Community Groups)
    match /circles/{circleId} {
      // Allow any logged-in user to read circle info and create a circle
      allow read, create: if isSignedIn();
      // Only the circle creator or an admin can update the circle details
      allow update: if isAdmin() || resource.data.createdBy == request.auth.uid;

      match /posts/{postId} {
        // Allow any logged-in user to read posts and create new ones
        allow get, list, create: if isSignedIn();
        // Only the post author or an admin can update or delete a post
        allow update, delete: if isAdmin() || resource.data.author.uid == request.auth.uid;
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
