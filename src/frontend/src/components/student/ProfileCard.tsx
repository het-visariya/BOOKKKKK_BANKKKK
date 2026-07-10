import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/types";
import {
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";

interface ProfileCardProps {
  user: User;
  isPaid: boolean;
  issuedCount: number;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="p-1.5 rounded-md bg-primary/8 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export function ProfileCard({ user, isPaid, issuedCount }: ProfileCardProps) {
  const fullName =
    [user.firstName, user.middleName, user.grandFatherName, user.surname]
      .filter(Boolean)
      .join(" ") ||
    user.name ||
    "Student";

  const maskedAadhaar = user.aadhaarNumber
    ? `XXXX-XXXX-${user.aadhaarNumber.slice(-4)}`
    : null;

  const extendedUser = user as User & {
    email?: string;
    birthDate?: string;
    parentsContactNumber?: string;
    nativePlace?: string;
    currentLocation?: string;
    educationLevel?: string;
    educationSpecialization?: string;
    occupation?: string;
    occupationOther?: string;
    officialSurname?: string;
  };

  return (
    <Card
      className="border border-[#B8E0E8] bg-gradient-to-br from-[#f0f9ff] to-[#e7f5fb]"
      data-ocid="profile_card.panel"
    >
      <CardContent className="p-5">
        {/* Header: Large Avatar + Name + ID */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-5">
          {/* Photo — large and clear */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <Avatar
              className="h-28 w-28 border-4 border-white shadow-elevated"
              data-ocid="profile_card.avatar"
            >
              {user.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={fullName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                {(user.firstName || user.name)?.charAt(0)?.toUpperCase() ?? "S"}
              </AvatarFallback>
            </Avatar>
            {/* Membership status under photo */}
            {isPaid ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3" /> Active Member
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 text-[11px]">
                <Clock className="h-3 w-3" /> Pending Payment
              </Badge>
            )}
          </div>

          {/* Name + ID + quick badges */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl font-display font-bold text-foreground leading-tight"
              data-ocid="profile_card.name"
            >
              {fullName}
            </h2>
            {user.studentId && (
              <p
                className="font-mono text-primary text-base font-bold tracking-widest mt-1"
                data-ocid="profile_card.student_id"
              >
                {user.studentId}
              </p>
            )}
            {issuedCount > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs font-mono mt-2"
              >
                <BookOpen className="h-3 w-3" /> {issuedCount} book
                {issuedCount !== 1 ? "s" : ""} issued
              </Badge>
            )}
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Core Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <InfoRow
            icon={UserIcon}
            label="Aadhaar Number"
            value={maskedAadhaar}
          />
          <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
          {extendedUser.email && (
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={extendedUser.email}
            />
          )}
          <InfoRow icon={GraduationCap} label="Course" value={user.course} />
          <InfoRow
            icon={GraduationCap}
            label="Academic Year"
            value={user.academicYear}
          />
          {extendedUser.birthDate && (
            <InfoRow
              icon={Calendar}
              label="Birth Date"
              value={new Date(extendedUser.birthDate).toLocaleDateString(
                "en-IN",
                { day: "2-digit", month: "long", year: "numeric" },
              )}
            />
          )}
          {extendedUser.parentsContactNumber && (
            <InfoRow
              icon={Phone}
              label="Parents Contact"
              value={extendedUser.parentsContactNumber}
            />
          )}
          {extendedUser.nativePlace && (
            <InfoRow
              icon={MapPin}
              label="Native Place / Village"
              value={extendedUser.nativePlace}
            />
          )}
          {extendedUser.currentLocation && (
            <InfoRow
              icon={Home}
              label="Current Location"
              value={extendedUser.currentLocation}
            />
          )}
          {extendedUser.educationLevel && (
            <InfoRow
              icon={GraduationCap}
              label="Education Level"
              value={extendedUser.educationLevel}
            />
          )}
          {extendedUser.educationSpecialization && (
            <InfoRow
              icon={BookOpen}
              label="Specialization"
              value={extendedUser.educationSpecialization}
            />
          )}
          {extendedUser.occupation && (
            <InfoRow
              icon={Briefcase}
              label="Occupation"
              value={
                extendedUser.occupation === "Other" &&
                extendedUser.occupationOther
                  ? extendedUser.occupationOther
                  : extendedUser.occupation
              }
            />
          )}
          {extendedUser.officialSurname && (
            <InfoRow
              icon={UserIcon}
              label="Official Surname"
              value={extendedUser.officialSurname}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
