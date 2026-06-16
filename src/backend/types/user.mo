import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";
import RequestTypes "../types/request";

module {
  /// Whether the student has paid the ₹200 membership deposit.
  public type MembershipStatus = { #PAID; #NOT_PAID };

  /// Role of the account: student or admin.
  public type UserRole = { #student; #admin };

  /// A single issued book entry embedded in the User record.
  public type IssuedBook = {
    bookId : Common.BookId;
    studentId : Common.UserId;
    issueDate : Common.Timestamp;
    expectedReturnDate : Common.Timestamp;
    actualReturnDate : ?Common.Timestamp;
    status : IssuedBookStatus;
  };

  public type IssuedBookStatus = { #Issued; #Returned; #Overdue };

  public type User = {
    studentId : Common.UserId;
    name : Text;
    /// Split name fields (new format)
    firstName : Text;
    middleName : Text;
    grandFatherName : Text;
    surname : Text;
    /// Aadhaar card number (12 digits).
    aadhaarNumber : Text;
    phone : Text;
    course : Text;
    college : Text;
    /// Academic year e.g. "FY", "SY", "TY", "2024-25"
    academicYear : Text;
    profileImage : Storage.ExternalBlob;
    paymentStatus : Text;
    paymentId : Text;
    membershipStartDate : Common.Timestamp;
    createdAt : Common.Timestamp;
    membershipStatus : MembershipStatus;
    role : UserRole;
    /// Hashed OTP for Aadhaar+OTP auth (nulled after verification).
    otpHash : ?Text;
    otpExpiry : ?Common.Timestamp;
    /// Number of failed OTP attempts (reset on successful verification or new OTP request).
    otpAttempts : Nat;
    /// Current session token after successful OTP verification.
    sessionToken : ?Text;
    sessionExpiry : ?Common.Timestamp;
    /// Books currently or previously issued to this student.
    issuedBooks : [IssuedBook];
    /// Whether Aadhaar/phone are frozen after OTP verification.
    frozenAadhaar : Bool;
    frozenPhone : Bool;
    /// Audit trail embedded on the user record (last 50 entries).
    auditTrail : [Text]; // serialized AuditEntry IDs
    /// Whether this student's ID has been migrated to S##### format.
    idMigrated : Bool;
    /// Contact email address (used for notifications and account recovery).
    email : Text;
    /// Date of birth in ISO 8601 format (e.g. "1999-05-15").
    birthDate : Text;
    /// 10-digit parent/guardian mobile number.
    parentContact : Text;
    /// Native place or village of origin.
    nativePlace : Text;
    /// Highest education level attained.
    educationLevel : Text;
    /// Specialization under education level (e.g. "Science", "Commerce").
    educationSpecialization : Text;
    /// Student's occupation (e.g. "Student", "Self-Employed", "Other").
    occupation : Text;
    /// Free-text occupation when occupation = "Other".
    occupationOther : Text;
    /// Official surname if different from surname used in registration.
    officialSurname : Text;
    /// Course name when course = "Other".
    courseName : Text;
    /// Current residential location.
    currentLocation : Text;
  };

  /// Shared-safe version for the API boundary (no ExternalBlob).
  public type UserPublic = {
    studentId : Common.UserId;
    name : Text;
    firstName : Text;
    middleName : Text;
    grandFatherName : Text;
    surname : Text;
    aadhaarNumber : Text;
    phone : Text;
    course : Text;
    college : Text;
    academicYear : Text;
    profileImageUrl : Text;
    paymentStatus : Text;
    paymentId : Text;
    membershipStartDate : Common.Timestamp;
    createdAt : Common.Timestamp;
    membershipStatus : MembershipStatus;
    role : UserRole;
    issuedBooksInfo : [RequestTypes.IssuedBookInfo];
    frozenAadhaar : Bool;
    frozenPhone : Bool;
    email : Text;
    birthDate : Text;
    parentContact : Text;
    nativePlace : Text;
    educationLevel : Text;
    educationSpecialization : Text;
    occupation : Text;
    occupationOther : Text;
    officialSurname : Text;
    courseName : Text;
    currentLocation : Text;
  };

  /// Input record for updating extended student profile fields.
  public type StudentProfileUpdate = {
    email : Text;
    birthDate : Text;
    parentContact : Text;
    nativePlace : Text;
    educationLevel : Text;
    educationSpecialization : Text;
    occupation : Text;
    occupationOther : Text;
    officialSurname : Text;
    courseName : Text;
    currentLocation : Text;
    /// Optional: update name parts
    firstName : Text;
    middleName : Text;
    grandFatherName : Text;
    surname : Text;
    course : Text;
    academicYear : Text;
    college : Text;
  };

  /// Returned on successful OTP verification / login.
  public type AuthResult = {
    token : Text;
    userId : Text;
    user : UserPublic;
  };

  /// Pending OTP record used during Aadhaar auth.
  public type OtpRecord = {
    aadhaarNumber : Text;
    otpCode : Text;
    expiresAt : Common.Timestamp;
  };
};
