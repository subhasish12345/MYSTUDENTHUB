
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
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isSignedIn() && getUserData().role == 'admin';
    }

    function isTeacher() {
      return isSignedIn() && getUserData().role == 'teacher';
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      allow create: if isSignedIn();
      allow get:    if isOwner(userId);
      allow list:   if isAdmin();
      allow update, delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow get: if isSignedIn();
      allow list: if isAdmin() || isTeacher();
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(teacherId);
      allow delete: if isAdmin();
    }

    match /students/{studentId} {
      allow get: if isSignedIn();
      allow list: if isAdmin() || isTeacher(); 
      allow create: if isAdmin() || isOwner(studentId);
      allow update: if isAdmin() || isOwner(studentId);
      allow delete: if isAdmin();

      match /semesters/{semesterId} {
        allow read: if isSignedIn() && (isOwner(studentId) || isAdmin() || isTeacher());
        allow write: if isAdmin();
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
          allow write: if isTeacher() || isAdmin();
        }
    }

    // NOTICE BOARD
    match /notices/{noticeId} {
      allow read: if isSignedIn();
      allow create: if isAdmin() || isTeacher();
      allow update, delete: if isAdmin() || (isTeacher() && resource.data.postedBy == request.auth.uid);
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
