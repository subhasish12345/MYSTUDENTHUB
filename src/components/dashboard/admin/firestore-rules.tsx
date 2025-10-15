

"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===============================================================
    //  🔐 Helper Functions
    // ===============================================================

    // Check if a user is signed in
    function isSignedIn() {
      return request.auth != null;
    }

    // Safely get a user's role from the /users collection
    function getUserRole(uid) {
      let userDoc = get(/databases/$(database)/documents/users/$(uid));
      return userDoc != null && userDoc.data.role != null ? userDoc.data.role : null;
    }

    // Convenience checks
    function isAdmin() {
      return getUserRole(request.auth.uid) == 'admin';
    }

    function isTeacher() {
      return getUserRole(request.auth.uid) == 'teacher';
    }

    function isAdminOrTeacher() {
      let role = getUserRole(request.auth.uid);
      return role == 'admin' || role == 'teacher';
    }

    // ===============================================================
    //  👤 Users Collection
    // ===============================================================
    match /users/{userId} {
      allow get: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      // Teachers also need to list users to send notifications
      allow list: if isAdminOrTeacher();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow delete: if isSignedIn() && isAdmin();
      
      // --- User Notifications Subcollection ---
      match /notifications/{notificationId} {
        allow read, write, update, delete: if isSignedIn() && request.auth.uid == userId;
        allow create: if isSignedIn(); // Allow backend functions/admins to create notifications
      }
    }

    // ===============================================================
    //  👨‍🏫 Teachers
    // ===============================================================
    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdmin();
    }

    // ===============================================================
    //  🧑‍🎓 Students
    // ===============================================================
    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      allow update: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      allow delete: if isSignedIn() && isAdmin();

      // --- Student Subcollections ---
      match /semesters/{semesterId} {
        allow read, write: if isSignedIn() && (isAdmin() || request.auth.uid == studentId);
      }
      match /focusSessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
      match /submissions/{submissionId} {
        allow read, write: if isSignedIn() && request.auth.uid == studentId;
      }
    }

    // ===============================================================
    //  🎓 Academic Data
    // ===============================================================
    match /degrees/{degreeId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }

    match /streams/{streamId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }

    match /batches/{batchId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }

    match /semesterGroups/{groupId} {
      allow get: if isSignedIn();
      allow list: if isAdminOrTeacher();
      allow write: if isSignedIn() && isAdmin();

      match /attendance/{date} {
        allow read: if isSignedIn() && (
          (exists(/databases/$(database)/documents/semesterGroups/$(groupId)) && get(/databases/$(database)/documents/semesterGroups/$(groupId)).data.students.hasAny([request.auth.uid]))
          || isAdminOrTeacher()
        );
        allow write: if isSignedIn() && isAdminOrTeacher();
      }
    }

    // ===============================================================
    //  📚 Assignments & Materials
    // ===============================================================
    match /assignments/{assignmentId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdminOrTeacher();
    }

    match /studyMaterials/{materialId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdminOrTeacher();
    }

    match /syllabi/{syllabusId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }

    match /timetables/{timetableId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && isAdmin();
    }

    // ===============================================================
    //  🧩 Circles / Posts
    // ===============================================================
    match /circles/{groupId}/posts/{postId} {
        function isGroupMember() {
          let groupDoc = get(/databases/$(database)/documents/semesterGroups/$(groupId));
          return groupDoc != null && isSignedIn() && (request.auth.uid in groupDoc.data.students);
        }

        function isTeacherOfGroup() {
          // This is a simplified check. A robust implementation would check an array on the teacher doc.
          // For now, we assume any teacher can interact, which is permissive but functional for the demo.
          return isTeacher();
        }

      allow read, create: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == resource.data.author.uid || isAdminOrTeacher());
      allow delete: if isAdmin() || (isSignedIn() && request.auth.uid == resource.data.author.uid);
    }

    // ===============================================================
    //  📅 Events, Feedback, Notices
    // ===============================================================
    match /events/{eventId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdmin();
    }

    match /feedback/{feedbackId} {
      allow create: if isSignedIn();
      allow read, list, update, delete: if isSignedIn() && isAdmin();
    }

    match /notices/{noticeId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && isAdminOrTeacher();
    }
    
    // ===============================================================
    //  🌐 Important Portals
    // ===============================================================
    match /portals/{portalId} {
        allow get, list: if isSignedIn();
        allow create, update, delete: if isSignedIn() && isAdmin();
    }

    // ===============================================================
    //  📦 Lost & Found
    // ===============================================================
    match /lostAndFoundItems/{itemId} {
        allow read, list, create: if isSignedIn();
        allow update, delete: if isSignedIn() && (resource.data.authorId == request.auth.uid || isAdmin());
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