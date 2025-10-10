'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { NoticeFormValues } from "./notice-form";
import { Roles } from "@/lib/roles";

interface CreateNoticeParams extends NoticeFormValues {
    postedBy: string;
    postedByName: string;
    authorRole: Roles;
}

export async function createNotice(data: CreateNoticeParams) {
    const { title, description, imageUrl, targetType, degree, stream, batch } = data;

    const target: any = { type: targetType };
    if (targetType === 'degree' || targetType === 'stream' || targetType === 'batch') {
        target.degree = degree;
    }
    if (targetType === 'stream' || targetType === 'batch') {
        target.stream = stream;
    }
    if (targetType === 'batch') {
        target.batch = batch;
    }

    const noticeData: DocumentData = {
        title,
        description,
        imageUrl,
        target,
        postedBy: data.postedBy,
        postedByName: data.postedByName,
        authorRole: data.authorRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "notices"), noticeData);
}

export async function updateNotice(noticeId: string, data: NoticeFormValues) {
    const noticeRef = doc(db, "notices", noticeId);
    
    const { title, description, imageUrl, targetType, degree, stream, batch } = data;

    const target: any = { type: targetType };
    if (targetType === 'degree' || targetType === 'stream' || targetType === 'batch') {
        target.degree = degree;
    }
    if (targetType === 'stream' || targetType === 'batch') {
        target.stream = stream;
    }
    if (targetType === 'batch') {
        target.batch = batch;
    }
    
    const updateData: DocumentData = {
        title,
        description,
        imageUrl,
        target,
        updatedAt: serverTimestamp(),
    };

    await updateDoc(noticeRef, updateData);
}

export async function deleteNotice(noticeId: string) {
    await deleteDoc(doc(db, "notices", noticeId));
}
