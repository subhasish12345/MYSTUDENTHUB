"use client";

import { cn } from "@/lib/utils";
import { DocumentData } from "firebase/firestore";
import { Mail, Phone, MapPin, Building, GraduationCap, Briefcase } from "lucide-react";
import QRCode from "qrcode.react";

interface IdCardProps {
    profileData: DocumentData;
    color: 'blue' | 'red' | 'purple';
}

export function IdCard({ profileData, color }: IdCardProps) {
    const isStudent = profileData.role === 'student';

    const qrValue = JSON.stringify({
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        uid: profileData.uid
    });

    const cardColorClass = {
        blue: 'id-card-blue',
        red: 'id-card-red',
        purple: 'id-card-purple',
    }[color];

    return (
        <div className={cn("id-card profile-card w-[320px] rounded-md shadow-xl overflow-hidden z-[100] relative cursor-pointer snap-start shrink-0 bg-white flex flex-col items-center justify-start gap-3 transition-all duration-300 group", cardColorClass)}>
            <div className="avatar w-full pt-5 flex items-center justify-center flex-col gap-1">
                <div className="top-bar w-full flex items-center justify-center relative z-40 after:absolute after:h-[6px] after:w-full after:top-4 after:group-hover:w-[1%] after:delay-300 after:group-hover:delay-0 after:group-hover:transition-all after:group-hover:duration-300 after:transition-all after:duration-300 before:absolute before:h-[6px] before:w-full before:bottom-4 before:group-hover:w-[1%] before:delay-300 before:group-hover:delay-0 before:group-hover:transition-all before:group-hover:duration-300 before:transition-all before:duration-300">
                    <div className="relative size-36 z-40 rounded-full group-hover:border-8 border-4 border-white group-hover:transition-all group-hover:duration-300 transition-all duration-300 flex items-center justify-center overflow-hidden">
                        {profileData.photoURL ? (
                           <img src={profileData.photoURL} alt={profileData.name} className="object-cover w-full h-full"/>
                        ) : (
                             <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-4xl font-bold text-muted-foreground">{profileData.name?.charAt(0)}</span>
                            </div>
                        )}
                    </div>
                    <div className="center-bar absolute z-10 h-[60%] w-full group-hover:h-[1%] group-hover:transition-all group-hover:duration-300 transition-all duration-300 delay-700 group-hover:delay-0" />
                </div>
            </div>

            <div className="headings text-center leading-5 py-2">
                <p className="text-xl font-serif font-semibold text-[#434955]">{profileData.name || 'N/A'}</p>
                <p className="text-sm font-semibold text-[#434955]/80">{isStudent ? profileData.stream_name : profileData.designation}</p>
            </div>
            
            <div className="w-full px-4 flex items-center justify-center">
                 <ul className="w-full flex flex-col items-start gap-2 text-xs font-semibold text-[#434955] pb-3">
                    <li className="inline-flex gap-2 items-center justify-start border-b-[1.5px] border-b-stone-700 border-dotted w-full pb-1">
                        <Phone className="icon-fill transition-colors" height={15} width={15}/>
                        <p>{profileData.phone || 'N/A'}</p>
                    </li>
                     <li className="inline-flex gap-2 items-center justify-start border-b-[1.5px] border-b-stone-700 border-dotted w-full pb-1">
                        <Mail className="icon-fill transition-colors" height={15} width={15}/>
                        <p>{profileData.email || 'N/A'}</p>
                    </li>
                     <li className="inline-flex gap-2 items-center justify-start border-b-[1.5px] border-b-stone-700 border-dotted w-full pb-1">
                        <Building className="icon-fill transition-colors" height={15} width={15}/>
                        <p>Gandhi Engineering College</p>
                    </li>
                     <li className="inline-flex gap-2 items-center justify-start w-full pb-1">
                         {isStudent ? <GraduationCap className="icon-fill transition-colors" height={15} width={15}/> : <Briefcase className="icon-fill transition-colors" height={15} width={15} />}
                        <p>{isStudent ? profileData.batch_name : profileData.department}</p>
                    </li>
                </ul>
            </div>

            <div className="w-full flex items-center justify-center py-4">
                <QRCode value={qrValue} size={80} bgColor="#ffffff" fgColor="#000000" level="L" />
            </div>

            <hr className="bottom-bar w-full group-hover:h-5 h-3 group-hover:transition-all group-hover:duration-300 transition-all duration-300" />
        </div>
    );
}
