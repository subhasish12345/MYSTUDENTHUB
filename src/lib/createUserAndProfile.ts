// In production, this logic should be moved to a secure backend (e.g., a Cloud Function)
// to avoid exposing user creation logic and credentials on the client-side.
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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

  // 2. Create /users doc (source of truth for role)
  const userDocRef = doc(db, "users", uid);
  await setDoc(userDocRef, {
    uid,
    email,
    role,
    status: "Active",
    createdAt: serverTimestamp(),
    createdBy: adminUid
  });

  // 3. Create role-specific doc in /teachers or /students
  // This is the corrected logic.
  const profileCollection = role === 'teacher' ? 'teachers' : 'students';
  const profileDocRef = doc(db, profileCollection, uid);
  
  await setDoc(profileDocRef, {
    uid,
    email,
    role,
    ...initialProfile,
    createdAt: serverTimestamp(),
    createdBy: adminUid,
  }, { merge: true });

  // 4. Return uid & password so admin can share it (for prototyping).
  console.log(`User created successfully. UID: ${uid}, Email: ${email}, Password: ${password}`);
  return { uid, password };
}
