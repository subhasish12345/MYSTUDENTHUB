
// In production, this logic should be moved to a secure backend (e.g., a Cloud Function)
// to avoid exposing user creation logic and credentials on the client-side.
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Roles } from "./roles";

interface CreateUserParams {
  email: string;
  password?: string; // Optional, can be generated if not provided
  role: Roles;
  initialProfile: any;
  adminUid: string;
}

export async function createUserAndProfile({ email, password, role, initialProfile, adminUid }: CreateUserParams) {
  // 1. Create Auth user
  if (!password) {
    throw new Error("Password is required for user creation.");
  }
  // This part of the logic assumes that you are handling authentication creation
  // outside this function or you have a temporary admin auth instance.
  // For this project, we'll assume auth creation is handled by the calling function if needed.
  // The primary job here is to create the Firestore documents correctly.

  // The following is a placeholder for getting the user's UID.
  // In a real app, you would get this from the Firebase Auth creation result.
  // For the purpose of fixing the Firestore structure, we'll simulate this.
  // const uid = "some-newly-created-uid"; // This would come from `cred.user.uid`
  
  // NOTE: This function as-is cannot create the auth user. It is only for creating the DB records.
  // The `teacher-management.tsx` and `student-management.tsx` will handle the actual `createUserWithEmailAndPassword` call.
  // This function will be called with the resulting UID.

  // This function is intended to be called AFTER the user is created in Firebase Auth.
  // Let's rename and repurpose it slightly for clarity.
  // The caller will now be responsible for creating the auth user and passing the UID.

  throw new Error("This function `createUserAndProfile` is deprecated. Logic moved to management components.");
}


export async function createFirestoreUserDocuments(uid: string, { email, role, name, initialProfile, adminUid }: { email: string, role: Roles, name: string, initialProfile: any, adminUid: string }) {
    const batch = writeBatch(db);

    // 2. ALWAYS create a document in /users (source of truth for role)
    const userDocRef = doc(db, "users", uid);
    batch.set(userDocRef, {
      uid,
      email,
      role,
      name: name,
      status: "Active",
      createdAt: serverTimestamp(),
      createdBy: adminUid
    });

    // 3. Create role-specific profile document in /teachers or /students
    const profileCollection = role === 'teacher' ? 'teachers' : (role === 'student' ? 'students' : null);
    
    if (profileCollection) {
        const profileDocRef = doc(db, profileCollection, uid);
        batch.set(profileDocRef, {
            uid,
            email,
            role,
            ...initialProfile,
            createdAt: serverTimestamp(),
            createdBy: adminUid,
        }, { merge: true });
    } else if (role !== 'admin') {
        throw new Error(`Invalid role specified: ${role}. Profile document not created.`);
    }
    
    // 4. Commit all writes at once
    await batch.commit();

    console.log(`Firestore documents created successfully for UID: ${uid}`);
}
