
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
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isTeacher() {
      // Check if a user is a teacher by looking for their UID in the /teachers collection
      return isSignedIn() && exists(/databases/$(database)/documents/teachers/$(request.auth.uid));
    }

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      allow read:   if isSignedIn() && request.auth.uid == userId;
      allow write: if isAdmin() || (request.resource.data.uid == request.auth.uid);
      allow list: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow read: if isSignedIn();
      allow list: if isAdmin() || isTeacher();
      allow create: if isAdmin();
      allow update: if isAdmin() || request.auth.uid == teacherId;
      allow delete: if isAdmin();
    }

    match /students/{studentId} {
      allow read: if isSignedIn() && (request.auth.uid == studentId || isAdmin() || isTeacher());
      allow list: if isAdmin() || isTeacher();
      allow create: if isAdmin() || (isSignedIn() && request.auth.uid == studentId);
      allow update: if isAdmin() || request.auth.uid == studentId;
      allow delete: if isAdmin();

      match /semesters/{semesterId} {
        allow read: if isSignedIn() && (request.auth.uid == studentId || isAdmin() || isTeacher());
        allow write: if isAdmin();
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

    // SEMESTER GROUPS for Attendance/Assignments (Admin write, Teacher/Admin read)
    match /semesterGroups/{groupId} {
        allow read: if isAdmin() || isTeacher();
        allow list: if isAdmin() || isTeacher();
        allow create, update, delete: if isAdmin();

        // Attendance subcollection
        match /attendance/{date} {
          allow read: if isSignedIn();
          allow write: if isTeacher() || isAdmin();
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
