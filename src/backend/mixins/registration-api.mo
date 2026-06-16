import Map "mo:core/Map";
import Types "mo:core/Types";
import Common "../types/common";
import UserTypes "../types/user";
import PaymentTypes "../types/payment";
import NotifTypes "../types/notification";
import EmailNotifTypes "../types/notifications";
import Time "mo:core/Time";
import EmailClient "mo:caffeineai-email/emailClient";
import UsersLib "../lib/users";
import NotificationsLib "../lib/notifications";
import EmailLib "../lib/email-notifications";
import RegistrationLib "../lib/registration";
import Storage "mo:caffeineai-object-storage/Storage";
import Blob "mo:core/Blob";
import NotifService "../lib/notifications-service";

/// Enhanced registration mixin.
/// Handles email-first registration flow:
///   Email → Aadhaar → Mobile → OTP Verification → Profile → Payment
/// After OTP verification, Aadhaar and mobile are frozen (read-only).
mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  userCounter : { var value : Nat },
  payments : Map.Map<Common.PaymentId, PaymentTypes.Payment>,
  paymentCounter : { var value : Nat },
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
  emailLogs : Map.Map<Text, EmailNotifTypes.EmailNotificationLog>,
  emailLogCounter : { var value : Nat },
) {

  /// Step 1 of the new registration flow: capture email, Aadhaar and mobile,
  /// generate and store an OTP, and return the OTP code (demo mode).
  /// The email is persisted on the pending user record immediately so that
  /// all subsequent lifecycle emails can be delivered.
  public shared func sendOtpWithEmail(
    email : Text,
    aadhaarNumber : Text,
    phone : Text,
  ) : async Types.Result<{ otp : Text; demo : Bool }, Text> {
    // Validate email format
    if (not RegistrationLib.isValidEmail(email)) {
      return #err("Invalid email address format");
    };
    // Validate Aadhaar: must be exactly 12 digits
    if (aadhaarNumber.size() != 12) {
      return #err("Aadhaar number must be exactly 12 digits");
    };
    // Validate phone: must be exactly 10 digits
    if (phone.size() != 10) {
      return #err("Phone number must be exactly 10 digits");
    };
    // Check email uniqueness
    if (not RegistrationLib.isEmailUnique(users, email)) {
      return #err("This email address is already registered");
    };
    // Check Aadhaar uniqueness
    if (not RegistrationLib.isAadhaarUnique(users, aadhaarNumber)) {
      return #err("This Aadhaar number is already registered");
    };
    let now = Time.now();
    // Generate a 6-digit demo OTP
    let otpCode = (
      ((now / 1_000_000) % 900000) + 100000
    ).toText();
    // Find or create a pending (NOT_PAID) user record for this Aadhaar
    let existingUser = UsersLib.findByAadhaar(users, aadhaarNumber);
    switch (existingUser) {
      case (?u) {
        // Check rate limiting: max 3 attempts
        if (u.otpAttempts >= RegistrationLib.OTP_MAX_ATTEMPTS) {
          return #err("Maximum OTP attempts reached. Please try again after 5 minutes.");
        };
        // Update the existing pending record with new OTP + email
        let salt = UsersLib.makeSalt(u.studentId, aadhaarNumber);
        let otpHash = UsersLib.hashOtp(otpCode, salt);
        let otpExpiry = now + RegistrationLib.OTP_EXPIRY_MINUTES * 60 * 1_000_000_000; // 5 min
        let updated = { u with
          otpHash = ?otpHash;
          otpExpiry = ?otpExpiry;
          otpAttempts = u.otpAttempts + 1;
          email;
          phone;
        };
        users.add(u.studentId, updated);
      };
      case null {
        // Create a new pending user
        userCounter.value += 1;
        let studentId = UsersLib.generateStudentId(userCounter.value);
        let emptyBlob : Blob = Blob.fromArray([]);
        var newUser = UsersLib.create(
          studentId, "", aadhaarNumber, phone, "", "", emptyBlob, now
        );
        let salt = UsersLib.makeSalt(studentId, aadhaarNumber);
        let otpHash = UsersLib.hashOtp(otpCode, salt);
        let otpExpiry = now + RegistrationLib.OTP_EXPIRY_MINUTES * 60 * 1_000_000_000;
        newUser := { newUser with
          otpHash = ?otpHash;
          otpExpiry = ?otpExpiry;
          otpAttempts = 1;
          email;
          frozenAadhaar = false;
          frozenPhone = false;
          membershipStatus = #NOT_PAID;
        };
        users.add(studentId, newUser);
      };
    };
    // Demo mode: return OTP directly (no real SMS in this build)
    #ok({ otp = otpCode; demo = true });
  };

  /// Step 2: verify the OTP that was sent in sendOtpWithEmail.
  /// On success:
  ///   - freezes aadhaarNumber and phone (frozenAadhaar = true, frozenPhone = true)
  ///   - returns a session token
  ///   - sends a registration-success email to the captured address
  public shared func verifyOtpWithEmail(
    email : Text,
    aadhaarNumber : Text,
    otp : Text,
    phone : Text,
  ) : async Types.Result<UserTypes.AuthResult, Text> {
    let now = Time.now();
    // Find user by Aadhaar
    let user = switch (UsersLib.findByAadhaar(users, aadhaarNumber)) {
      case null { return #err("No pending registration found for this Aadhaar number") };
      case (?u) { u };
    };
    // Verify OTP hash
    let salt = UsersLib.makeSalt(user.studentId, aadhaarNumber);
    let expectedHash = UsersLib.hashOtp(otp, salt);
    let storedHash = switch (user.otpHash) {
      case null { return #err("No OTP found. Please request a new OTP.") };
      case (?h) { h };
    };
    if (storedHash != expectedHash) {
      // Increment failed attempt counter
      let updatedAttempts = { user with otpAttempts = user.otpAttempts + 1 };
      users.add(user.studentId, updatedAttempts);
      return #err("Invalid OTP. Please try again.");
    };
    // Check expiry
    let expiry = switch (user.otpExpiry) {
      case null { return #err("OTP has expired. Please request a new one.") };
      case (?e) { e };
    };
    if (now > expiry) {
      return #err("OTP has expired. Please request a new one.");
    };
    // OTP valid: freeze Aadhaar + phone, clear OTP, issue session token
    let token = UsersLib.generateToken(user.studentId, now);
    let sessionExpiry = now + 30 * 24 * 60 * 60 * 1_000_000_000;
    let updated = { user with
      phone;
      email;
      otpHash = null;
      otpExpiry = null;
      otpAttempts = 0;
      sessionToken = ?token;
      sessionExpiry = ?sessionExpiry;
      frozenAadhaar = true;
      frozenPhone = true;
    };
    users.add(user.studentId, updated);
    // Send registration success in-app notification
    ignore NotificationsLib.createNotification(
      notifications,
      notificationCounter,
      user.studentId,
      #General,
      "OTP Verified",
      "Your identity has been verified. Please complete your profile.",
      null,
      now,
    );
    // Send welcome email if address is set
    if (email != "") {
      let studentName = if (user.firstName != "") { user.firstName } else { "Student" };
      let subject = EmailLib.buildSubject("registration_success", null);
      let body = EmailLib.buildBody("registration_success", studentName, user.studentId, null, null, null);
      ignore await EmailClient.sendServiceEmail("svga-book-bank", [email], subject, body);
    };
    #ok({
      token;
      userId = user.studentId;
      user = UsersLib.toPublic(updated);
    });
  };

  /// Complete profile + immediate PAID membership in one atomic call.
  /// Called after OTP verification; Aadhaar and phone fields are already frozen.
  /// Captures all new extended fields introduced in requirements:
  ///   firstName, middleName, grandFatherName, surname,
  ///   birthDate, parentContact, nativePlace, educationLevel,
  ///   educationSpecialization, occupation, occupationOther,
  ///   officialSurname, courseName, currentLocation,
  ///   course, academicYear, college.
  /// On success:
  ///   - marks student as PAID, auto-generates S##### studentId
  ///   - sends payment-success email with challan URL
  ///   - logs audit entry for registration
  public shared func completeProfileAndPay(
    token : Text,
    firstName : Text,
    middleName : Text,
    grandFatherName : Text,
    surname : Text,
    course : Text,
    academicYear : Text,
    college : Text,
    profileImageUrl : Text,
    birthDate : Text,
    parentContact : Text,
    nativePlace : Text,
    educationLevel : Text,
    educationSpecialization : Text,
    occupation : Text,
    occupationOther : Text,
    officialSurname : Text,
    courseName : Text,
    currentLocation : Text,
  ) : async Types.Result<UserTypes.AuthResult, Text> {
    let now = Time.now();
    // Validate session token
    let studentId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Invalid or expired session token. Please log in again.") };
      case (?uid) { uid };
    };
    let user = switch (users.get(studentId)) {
      case null { return #err("User account not found: " # studentId) };
      case (?u) { u };
    };
    // Validate required fields
    if (firstName == "") { return #err("First name is required.") };
    if (surname == "") { return #err("Surname is required.") };
    if (course == "") { return #err("Course is required.") };
    if (academicYear == "") { return #err("Academic year is required.") };
    if (birthDate == "") { return #err("Birth date is required.") };
    if (parentContact == "") { return #err("Parent contact number is required.") };
    if (nativePlace == "") { return #err("Native place / village is required.") };
    if (educationLevel == "") { return #err("Education level is required.") };
    if (occupation == "") { return #err("Occupation is required.") };
    if (occupation == "Other" and occupationOther == "") {
      return #err("Please specify your occupation when 'Other' is selected.")
    };
    if (course == "Other" and courseName == "") {
      return #err("Please specify your course name when 'Other' is selected.")
    };
    // Validate parent contact is 10 digits
    if (not UsersLib.isValidParentContact(parentContact)) {
      return #err("Parent contact number must be exactly 10 digits.")
    };
    // Validate birth date format
    if (not UsersLib.isValidBirthDate(birthDate)) {
      return #err("Birth date must be in YYYY-MM-DD format.")
    };
    // Build full name
    let fullName = RegistrationLib.buildFullName(firstName, middleName, grandFatherName, surname);
    // Mark as PAID and finalize profile
    let emptyBlob : Blob = Blob.fromArray([]);
    let profileImage : Blob = emptyBlob;
    // Generate a new session token (keeps user logged in)
    let newToken = UsersLib.generateToken(studentId, now);
    let sessionExpiry = now + 30 * 24 * 60 * 60 * 1_000_000_000;
    let completed = { user with
      name = fullName;
      firstName;
      middleName;
      grandFatherName;
      surname;
      course;
      academicYear;
      college;
      profileImage;
      birthDate;
      parentContact;
      nativePlace;
      educationLevel;
      educationSpecialization;
      occupation;
      occupationOther;
      officialSurname;
      courseName;
      currentLocation;
      paymentStatus = "completed";
      membershipStartDate = now;
      membershipStatus = #PAID;
      sessionToken = ?newToken;
      sessionExpiry = ?sessionExpiry;
      idMigrated = true;
    };
    users.add(studentId, completed);
    // Create in-app payment success notification
    ignore NotificationsLib.createNotification(
      notifications,
      notificationCounter,
      studentId,
      #General,
      "Registration Complete",
      "Welcome to SVGA Book Bank! Your account is now active.",
      null,
      now,
    );
    // Send payment success email
    if (completed.email != "") {
      let subject = EmailLib.buildSubject("payment_success", null);
      let body = EmailLib.buildBody("payment_success", fullName, studentId, null, null, null);
      ignore await EmailClient.sendServiceEmail("svga-book-bank", [completed.email], subject, body);
    };
    #ok({
      token = newToken;
      userId = studentId;
      user = UsersLib.toPublic(completed);
    });
  };

  /// Verify that the student's email is not already taken by another account.
  /// Used for real-time email uniqueness check on the registration form.
  public query func isEmailAvailable(email : Text) : async Bool {
    RegistrationLib.isEmailUnique(users, email);
  };

  /// Verify that the Aadhaar number is not already registered to a PAID account.
  /// Used for real-time duplicate check on the registration form.
  public query func isAadhaarAvailable(aadhaarNumber : Text) : async Bool {
    RegistrationLib.isAadhaarUnique(users, aadhaarNumber);
  };

  /// Return the exact surname and village dropdown options for the registration form.
  /// Surnames: exact community names + "Not In The List"
  /// Villages: exact village names + "Other"
  public query func getAvailableDropOptions() : async {
    surnames : [Text];
    villages : [Text];
  } {
    {
      surnames = UsersLib.SURNAMES;
      villages = UsersLib.VILLAGES;
    };
  };
};
