"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SemesterGroup } from "@/app/dashboard/circles/page";
import { Roles } from "@/lib/roles";

interface GroupSelectorProps {
    groups: SemesterGroup[];
    selectedGroup: SemesterGroup | null;
    onSelectGroup: (group: SemesterGroup | null) => void;
    userRole: Roles | null;
}

export function GroupSelector({ groups, selectedGroup, onSelectGroup, userRole }: GroupSelectorProps) {

    const handleSelect = (groupId: string) => {
        const group = groups.find(g => g.id === groupId) || null;
        onSelectGroup(group);
    }
    
    // A student only belongs to one group, so we don't need a selector.
    if (userRole === 'student') {
        return null;
    }

    return (
        <div>
            <Select onValueChange={handleSelect} value={selectedGroup?.id || ''}>
                <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                    <SelectValue placeholder="Select a group to view..." />
                </SelectTrigger>
                <SelectContent>
                    {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                            {group.groupId.replace(/_/g, ' ')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
