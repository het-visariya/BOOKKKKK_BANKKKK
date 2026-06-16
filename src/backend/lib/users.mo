import Debug "mo:core/Debug";
import Map "mo:core/Map";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/user";
import Common "../types/common";

module {
  // ── ID generation ─────────────────────────────────────────────────────────
  public func generateStudentId(counter : Nat) : Common.UserId {
    let padded = if (counter < 10) { "0000" # counter.toText() }
      else if (counter < 100) { "000" # counter.toText() }
      else if (counter < 1000) { "00" # counter.toText() }
      else if (counter < 10000) { "0" # counter.toText() }
      else { counter.toText() };
    "S" # padded;
  };

  // ── Migrate old SVGA#### IDs to S##### format ─────────────────────────────
  public func migrateStudentIds(
    users : Map.Map<Common.UserId, Types.User>,
  ) {
    let entries = users.entries().toArray();
    for ((oldId, user) in entries.values()) {
      // Only migrate SVGA#### format IDs
      switch (oldId.stripStart(#text "SVGA")) {
        case null {};
        case (?numStr) {
          switch (numStr.toNat()) {
            case null {};
            case (?n) {
              let padded = if (n < 10) { "0000" # n.toText() }
                else if (n < 100) { "000" # n.toText() }
                else if (n < 1000) { "00" # n.toText() }
                else if (n < 10000) { "0" # n.toText() }
                else { n.toText() };
              let newId = "S" # padded;
              if (newId != oldId) {
                let migrated = { user with studentId = newId; idMigrated = true };
                users.remove(oldId);
                users.add(newId, migrated);
              };
            };
          };
        };
      };
    };
  };

  // ── Surname list (exact community names) ─────────────────────────────────
  public let SURNAMES : [Text] = [
    "Bauva", "Buricha", "Charla", "Chhadwa", "Chheda",
    "Dagha", "Dedhia", "Furiya", "Gada", "Gala",
    "Gindra", "Gogri", "Karia", "Khirani-Gala", "Khuthia",
    "Mamania", "Mota", "Nandu", "Nisar", "Rambhia",
    "Rita", "Satra", "Savla", "Shah", "Vadhan",
    "Visaria", "Vora"
  ];

  // ── Village list (exact village names) ────────────────────────────────────
  public let VILLAGES : [Text] = [
    "Adhoi", "Bhachau", "Bharudia", "Gagodar", "Ghanithar",
    "Halra", "Kakrava", "Kharoi", "Lakadiya", "Manafra",
    "Nandasar", "N. Trambo", "Rav", "Samkhiyari", "Shivlakha",
    "Suvai", "Thoriyari", "Trambo", "Vanoi"
  ];

  // ── Full name helper
  public func getFullName(user : Types.User) : Text {
    let parts = [user.firstName, user.middleName, user.grandFatherName, user.surname];
    var result = "";
    for (part in parts.values()) {
      if (part != "") {
        if (result != "") { result #= " " };
        result #= part;
      };
    };
    if (result == "") { user.name } else { result };
  };

  // ── OTP helpers ───────────────────────────────────────────────────────────
  // Demo-level hash: DJB2 fold over value characters → decimal text
  public func hashOtp(otp : Text, salt : Text) : Text {
    let combined = otp # salt;
    var h : Nat = 5381;
    for (c in combined.toIter()) {
      h := (h * 33 + c.toNat32().toNat()) % 0xFFFFFFFFFF;
    };
    "ph_" # h.toText();
  };

  public func makeSalt(userId : Text, aadhaar : Text) : Text {
    userId # "::" # aadhaar;
  };

  // ── Session token helpers ──────────────────────────────────────────────────
  // Token format: userId ++ "::" ++ expiryNanoseconds
  // 30-day validity in nanoseconds
  let TOKEN_TTL : Int = 2592000000000000; // 30 days in nanoseconds

  public func generateToken(userId : Text, now : Int) : Text {
    let expiry = now + TOKEN_TTL;
    "tok_" # userId # "::" # expiry.toText();
  };

  // Returns ?userId if token is valid and not expired
  public func verifyToken(token : Text, now : Int) : ?Text {
    let stripped = switch (token.stripStart(#text "tok_")) {
      case (?s) { s };
      case null { return null };
    };
    let parts = stripped.split(#text "::").toArray();
    if (parts.size() != 2) { return null };
    let userId = parts[0];
    let expiryText = parts[1];
    let expiry = switch (expiryText.toInt()) {
      case (?e) { e };
      case null { return null };
    };
    if (now > expiry) { return null };
    ?userId;
  };

  // ── Finders ───────────────────────────────────────────────────────────────
  public func findByAadhaar(
    users : Map.Map<Common.UserId, Types.User>,
    aadhaarNumber : Text,
  ) : ?Types.User {
    users.values().find(func(u) { u.aadhaarNumber == aadhaarNumber });
  };

  public func findByToken(
    users : Map.Map<Common.UserId, Types.User>,
    token : Text,
  ) : ?Types.User {
    users.values().find(func(u) {
      switch (u.sessionToken) {
        case (?t) { t == token };
        case null { false };
      };
    });
  };

  // Find user by student ID
  public func findById(
    users : Map.Map<Common.UserId, Types.User>,
    studentId : Common.UserId,
  ) : ?Types.User {
    users.get(studentId);
  };

  // ── Converters ────────────────────────────────────────────────────────────
  public func toPublic(user : Types.User) : Types.UserPublic {
    {
      studentId = user.studentId;
      name = getFullName(user);
      firstName = user.firstName;
      middleName = user.middleName;
      grandFatherName = user.grandFatherName;
      surname = user.surname;
      aadhaarNumber = user.aadhaarNumber;
      phone = user.phone;
      course = user.course;
      college = user.college;
      academicYear = user.academicYear;
      profileImageUrl = "";
      paymentStatus = user.paymentStatus;
      paymentId = user.paymentId;
      membershipStartDate = user.membershipStartDate;
      createdAt = user.createdAt;
      membershipStatus = user.membershipStatus;
      role = user.role;
      issuedBooksInfo = [];
      frozenAadhaar = user.frozenAadhaar;
      frozenPhone = user.frozenPhone;
      email = user.email;
      birthDate = user.birthDate;
      parentContact = user.parentContact;
      nativePlace = user.nativePlace;
      educationLevel = user.educationLevel;
      educationSpecialization = user.educationSpecialization;
      occupation = user.occupation;
      occupationOther = user.occupationOther;
      officialSurname = user.officialSurname;
      courseName = user.courseName;
      currentLocation = user.currentLocation;
    };
  };

  // ── Validation helpers ────────────────────────────────────────────────────

  /// Returns true if the email has a basic valid format (contains @ and .).
  public func isValidEmail(email : Text) : Bool {
    // Must contain exactly one '@' and at least one '.' after it
    let atParts = email.split(#char '@').toArray();
    if (atParts.size() != 2) { return false };
    let local = atParts[0];
    let domain = atParts[1];
    if (local.size() == 0) { return false };
    // domain must contain at least one '.' with characters before and after
    let domainParts = domain.split(#char '.').toArray();
    if (domainParts.size() < 2) { return false };
    for (part in domainParts.values()) {
      if (part.size() == 0) { return false };
    };
    true;
  };

  /// Returns true if the contact number is exactly 10 digits.
  public func isValidParentContact(contact : Text) : Bool {
    if (contact.size() != 10) { return false };
    for (c in contact.toIter()) {
      let n = c.toNat32();
      if (n < 48 or n > 57) { return false }; // '0'..'9'
    };
    true;
  };

  /// Returns true if the birthDate is a non-empty ISO 8601 date string (YYYY-MM-DD).
  public func isValidBirthDate(date : Text) : Bool {
    // Must be non-empty and match YYYY-MM-DD
    if (date.size() != 10) { return false };
    let parts = date.split(#char '-').toArray();
    if (parts.size() != 3) { return false };
    if (parts[0].size() != 4 or parts[1].size() != 2 or parts[2].size() != 2) { return false };
    let year = switch (parts[0].toNat()) { case (?y) y; case null { return false } };
    let month = switch (parts[1].toNat()) { case (?m) m; case null { return false } };
    let day = switch (parts[2].toNat()) { case (?d) d; case null { return false } };
    if (month < 1 or month > 12) { return false };
    if (day < 1 or day > 31) { return false };
    if (year < 1900 or year > 2100) { return false };
    true;
  };

  // ── Profile update helper ─────────────────────────────────────────────────

  /// Apply a StudentProfileUpdate to a User record, returning the updated User.
  public func applyProfileUpdate(
    user : Types.User,
    update : Types.StudentProfileUpdate,
  ) : Types.User {
    let newFirstName = if (update.firstName != "") { update.firstName } else { user.firstName };
    let newMiddleName = if (update.middleName != "") { update.middleName } else { user.middleName };
    let newGrandFatherName = if (update.grandFatherName != "") { update.grandFatherName } else { user.grandFatherName };
    let newSurname = if (update.surname != "") { update.surname } else { user.surname };
    let newCourse = if (update.course != "") { update.course } else { user.course };
    let newAcademicYear = if (update.academicYear != "") { update.academicYear } else { user.academicYear };
    let newCollege = if (update.college != "") { update.college } else { user.college };
    let newEmail = if (update.email != "") { update.email } else { user.email };
    let newBirthDate = if (update.birthDate != "") { update.birthDate } else { user.birthDate };
    let newParentContact = if (update.parentContact != "") { update.parentContact } else { user.parentContact };
    let newNativePlace = if (update.nativePlace != "") { update.nativePlace } else { user.nativePlace };
    let newEducationLevel = if (update.educationLevel != "") { update.educationLevel } else { user.educationLevel };
    let newEducationSpecialization = if (update.educationSpecialization != "") { update.educationSpecialization } else { user.educationSpecialization };
    let newOccupation = if (update.occupation != "") { update.occupation } else { user.occupation };
    let newOccupationOther = if (update.occupationOther != "") { update.occupationOther } else { user.occupationOther };
    let newOfficialSurname = if (update.officialSurname != "") { update.officialSurname } else { user.officialSurname };
    let newCourseName = if (update.courseName != "") { update.courseName } else { user.courseName };
    let newCurrentLocation = if (update.currentLocation != "") { update.currentLocation } else { user.currentLocation };
    // Rebuild the full name from the (possibly updated) parts
    let parts = [newFirstName, newMiddleName, newGrandFatherName, newSurname];
    var fullName = "";
    for (part in parts.values()) {
      if (part != "") {
        if (fullName != "") { fullName #= " " };
        fullName #= part;
      };
    };
    {
      user with
      firstName = newFirstName;
      middleName = newMiddleName;
      grandFatherName = newGrandFatherName;
      surname = newSurname;
      name = if (fullName != "") { fullName } else { user.name };
      course = newCourse;
      academicYear = newAcademicYear;
      college = newCollege;
      email = newEmail;
      birthDate = newBirthDate;
      parentContact = newParentContact;
      nativePlace = newNativePlace;
      educationLevel = newEducationLevel;
      educationSpecialization = newEducationSpecialization;
      occupation = newOccupation;
      occupationOther = newOccupationOther;
      officialSurname = newOfficialSurname;
      courseName = newCourseName;
      currentLocation = newCurrentLocation;
    };
  };

  /// Create a new student account via Aadhaar+OTP registration.
  public func create(
    studentId : Common.UserId,
    name : Text,
    aadhaarNumber : Text,
    phone : Text,
    course : Text,
    college : Text,
    profileImage : Storage.ExternalBlob,
    now : Common.Timestamp,
  ) : Types.User {
    let words = name.split(#char ' ').toArray();
    let n = words.size();
    let firstName = if (n > 0) { words[0] } else { name };
    let middleName = if (n >= 3) { words[1] } else { "" };
    let grandFatherName = if (n >= 4) { words[2] } else { "" };
    let surname = if (n >= 2) { words[n - 1] } else { "" };
    {
      studentId;
      name;
      firstName;
      middleName;
      grandFatherName;
      surname;
      aadhaarNumber;
      phone;
      course;
      college;
      academicYear = "";
      profileImage;
      paymentStatus = "pending";
      paymentId = "";
      membershipStartDate = 0;
      createdAt = now;
      membershipStatus = #NOT_PAID;
      role = #student;
      otpHash = null;
      otpExpiry = null;
      otpAttempts = 0;
      sessionToken = null;
      sessionExpiry = null;
      issuedBooks = [];
      frozenAadhaar = true;
      frozenPhone = true;
      auditTrail = [];
      idMigrated = false;
      email = "";
      birthDate = "";
      parentContact = "";
      nativePlace = "";
      educationLevel = "";
      educationSpecialization = "";
      occupation = "";
      occupationOther = "";
      officialSurname = "";
      courseName = "";
      currentLocation = "";
    };
  };

  // Update payment status and set membership to PAID
  public func withPayment(
    user : Types.User,
    _paymentId : Text,
    stripePaymentId : Text,
    now : Common.Timestamp,
  ) : Types.User {
    { user with paymentStatus = "completed"; paymentId = stripePaymentId; membershipStartDate = now; membershipStatus = #PAID };
  };

  // Update profile image
  public func withProfileImage(
    user : Types.User,
    profileImage : Storage.ExternalBlob,
  ) : Types.User {
    { user with profileImage };
  };
};
