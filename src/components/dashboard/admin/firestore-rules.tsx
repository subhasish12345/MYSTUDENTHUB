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
    function getUserRole(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role;
    }
    
    // =====================================================================
    //  User & Profile Collections
    // =====================================================================

    match /users/{userId} {
      allow get: if isSignedIn() && (request.auth.uid == userId || getUserRole(request.auth.uid) == 'admin');
      allow list: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == userId || getUserRole(request.auth.uid) == 'admin');
      allow delete: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }

    match /teachers/{teacherId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }

    match /students/{studentId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || request.auth.uid == studentId);
      allow update: if isSignedIn() && (getUserRole(request.auth.uid) == 'admin' || request.auth.uid == studentId);
      allow delete: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';

      // --- Student Sub-collections ---
      match /semesters/{semesterId} {
        allow read, write: if isSignedIn() && (request.auth.uid == studentId || getUserRole(request.auth.uid) == 'admin');
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
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    match /streams/{streamId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    match /batches/{batchId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    
    match /semesterGroups/{groupId} {
      allow get: if isSignedIn();
      allow list: if getUserRole(request.auth.uid) in ['admin', 'teacher'];
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
      
      match /attendance/{date} {
        allow read: if isSignedIn() && (request.auth.uid in get(/databases/$(database)/documents/semesterGroups/$(groupId)).data.students || getUserRole(request.auth.uid) in ['admin', 'teacher']);
        allow write: if isSignedIn() && getUserRole(request.auth.uid) in ['admin', 'teacher'];
      }
    }
    
    // --- ASSIGNMENTS ---
    match /assignments/{assignmentId} {
        allow get, list: if isSignedIn();
        allow create, update, delete: if isSignedIn() && getUserRole(request.auth.uid) in ['teacher', 'admin'];
    }

    // --- STUDY MATERIALS ---
    match /studyMaterials/{materialId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isSignedIn() && getUserRole(request.auth.uid) in ['admin', 'teacher'];
    }

    // --- SYLLABUS & TIMETABLE ---
    match /syllabi/{syllabusId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    match /timetables/{timetableId} {
      allow get, list: if isSignedIn();
      allow write: if isSignedIn() && getUserRole(request.auth.uid) == 'admin';
    }
    
    // --- STUDENT CIRCLES ---
    match /circles/{groupId}/posts/{postId} {
        function isGroupMember() {
            let groupDoc = get(/databases/$(database)/documents/semesterGroups/$(groupId));
            return isSignedIn() && request.auth.uid in groupDoc.data.students;
        }

        function isTeacherOfGroup() {
            let teacherData = get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data;
            return isSignedIn() && 
                   'assignedGroups' in teacherData &&
                   groupId in teacherData.assignedGroups;
        }

        allow read, create: if isGroupMember() || isTeacherOfGroup() || getUserRole(request.auth.uid) == 'admin';
        allow update: if isGroupMember() || isTeacherOfGroup() || getUserRole(request.auth.uid) == 'admin';
        allow delete: if getUserRole(request.auth.uid) == 'admin' || (isSignedIn() && request.auth.uid == resource.data.author.uid);
    }

    // --- MENTOR CONNECT ---
    match /directMessages/{chatId} {
        function isParticipant() {
          return request.auth.uid in resource.data.participants;
        }
        function isValidChat() {
          let participantRoles = request.resource.data.participantRoles;
          let studentRole = 'student';
          let teacherRole = 'teacher';
          let roles = participantRoles.values();
          // A chat is valid if it's between a student and a teacher.
          return (roles.hasAll([studentRole, teacherRole]));
        }

        allow get: if isSignedIn() && isParticipant();
        allow create: if isSignedIn() && isValidChat();

        match /messages/{messageId} {
           allow read, write: if isSignedIn() && isParticipant();
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
