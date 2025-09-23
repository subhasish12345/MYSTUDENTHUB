
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
      return isSignedIn() && (
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    // USER-RELATED COLLECTIONS
    match /users/{userId} {
      // Admins can create users, and users can create their own doc during profile setup.
      allow create: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
      allow read:   if isSignedIn() && (request.auth.uid == userId || isAdmin());
      // Only admins can update role/status or delete the core user record.
      allow update, delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow read: if isSignedIn();
      allow list: if isAdmin();
      allow create: if isAdmin(); // Only admins can create new teachers
      allow update: if isAdmin() || request.auth.uid == teacherId; // Admin or the teacher themselves
      allow delete: if isAdmin();
    }

    match /students/{studentId} {
      allow read: if isSignedIn() && (request.auth.uid == studentId || isAdmin());
      allow list: if isAdmin();
      // Allow creation by admin OR by a user creating their own profile
      allow create: if isAdmin() || (isSignedIn() && request.auth.uid == studentId);
      allow update: if isAdmin() || request.auth.uid == studentId; // Admin or the student themselves
      allow delete: if isAdmin();
    }

    match /students/{studentId}/semesters/{semesterId} {
      allow read: if isSignedIn() && (request.auth.uid == studentId || isAdmin());
      allow write: if isAdmin(); // Only admins can add/edit/delete semesters
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
