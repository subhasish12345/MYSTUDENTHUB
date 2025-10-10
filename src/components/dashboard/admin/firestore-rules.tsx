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

    // Helper Function to safely get a user's role from the /users collection.
    function getUserRole() {
      // Use exists() to check if the document exists before trying to access its data.
      // This prevents errors on new user signup before the user doc is created.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : null;
    }
    
    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    // The /users collection is the single source of truth for roles.
    match /users/{userId} {
      // A user must be able to read their own user document for the getUserRole() function to work everywhere.
      // Admins can read any user document.
      allow get: if isSignedIn() && (request.auth.uid == userId || getUserRole() == 'admin');
      
      allow list: if isSignedIn() && getUserRole() == 'admin';
      allow create: if isSignedIn(); // Allows new users to be created.
      allow update: if isSignedIn() && (request.auth.uid == userId || getUserRole() == 'admin');
      allow delete: if isSignedIn() && getUserRole() == 'admin';
    }

    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole() == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == studentId);
      allow update: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == studentId);
      allow delete: if isSignedIn() && getUserRole() == 'admin';

      // --- Student Sub-collections ---
      match /semesters/{semesterId} {
        allow read, write: if isSignedIn() && (request.auth.uid == studentId || getUserRole() == 'admin');
      }
      match /focusSessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
    }

    // =====================================================================
    //  Academic Structure & App Features
    // =====================================================================

    match /degrees/{degreeId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /streams/{streamId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    match /batches/{batchId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() == 'admin';
    }
    
    match /semesterGroups/{groupId} {
      // Admins/Teachers can query all groups. Students can only query for groups they are in.
      allow list: if isSignedIn() && (getUserRole() in ['admin', 'teacher'] || (request.query.where.field == 'students' && request.query.where.op == 'array-contains' && request.query.where.value == request.auth.uid));
      // Any authorized user can read a specific group document (needed for other rules to work).
      allow get: if isSignedIn();
      allow write: if isSignedIn() && getUserRole() in ['admin'];
      
      match /attendance/{date} {
        // Students can read attendance for groups they are in.
        allow read: if isSignedIn() && (request.auth.uid in get(/databases/$(database)/documents/semesterGroups/$(groupId)).data.students || getUserRole() in ['admin', 'teacher']);
        allow write: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
      }
    }

    // --- NOTICE BOARD ---
    match /notices/{noticeId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole() in ['admin', 'teacher'];
    }

    // --- EVENTS ---
    match /events/{eventId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole() == 'admin';
    }
    
    // --- ASSIGNMENTS ---
    match /assignments/{assignmentId} {
        allow get, list: if isSignedIn();
        allow create, update, delete: if isSignedIn() && getUserRole() in ['teacher', 'admin'];
    }
    
    // --- STUDENT CIRCLES ---
    match /circles/{groupId}/posts/{postId} {
        function isGroupMember() {
            let groupData = get(/databases/$(database)/documents/semesterGroups/$(groupId)).data;
            return 'students' in groupData && request.auth.uid in groupData.students;
        }

        function isTeacherOfGroup() {
            let teacherData = get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data;
            return 'assignedGroups' in teacherData && groupId in teacherData.assignedGroups;
        }

        function isAuthorizedReader() {
            let role = getUserRole();
            return role == 'admin' || (role == 'teacher' && isTeacherOfGroup()) || isGroupMember();
        }
        
        function isAuthorizedWriter() {
            // Check if the user is an admin or is a member/teacher of the group.
            let role = getUserRole();
            return role == 'admin' || isGroupMember() || (role == 'teacher' && isTeacherOfGroup());
        }

        allow read, create: if isSignedIn() && isAuthorizedReader();
        // Allow updates (like adding a reply) if the user is authorized to write in the group.
        allow update: if isSignedIn() && isAuthorizedWriter();
        allow delete: if isSignedIn() && (getUserRole() == 'admin' || request.auth.uid == resource.data.author.uid);
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
