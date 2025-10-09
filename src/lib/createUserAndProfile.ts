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
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const batch = writeBatch(db);

  // 2. ALWAYS create a document in /users (source of truth for role)
  const userDocRef = doc(db, "users", uid);
  batch.set(userDocRef, {
    uid,
    email,
    role,
    name: initialProfile.name, // Also store name here for easy access
    status: "Active",
    createdAt: serverTimestamp(),
    createdBy: adminUid
  });

  // 3. Create role-specific profile document in /teachers or /students
  if (role === 'teacher' || role === 'student') {
    const profileCollection = role === 'teacher' ? 'teachers' : 'students';
    const profileDocRef = doc(db, profileCollection, uid);
    
    batch.set(profileDocRef, {
      uid,
      email,
      role,
      ...initialProfile,
      createdAt: serverTimestamp(),
      createdBy: adminUid,
    }, { merge: true });
  }
  
  // 4. Commit all writes at once
  await batch.commit();

  // 5. Return uid & password so admin can share it (for prototyping).
  console.log(`User created successfully. UID: ${uid}, Email: ${email}, Password: ${password}`);
  return { uid, password };
}
