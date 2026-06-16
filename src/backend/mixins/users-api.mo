import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import UserTypes "../types/user";
import Common "../types/common";
import Types "mo:core/Types";
import UsersLib "../lib/users";
import RequestTypes "../types/request";
import AdminLib "../lib/admin";
import PaymentsLib "../lib/payments";
import PaymentTypes "../types/payment";
import Debug "mo:core/Debug";
import Blob "mo:core/Blob";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  userCounter : { var value : Nat },
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  payments : Map.Map<Common.PaymentId, PaymentTypes.Payment>,
  paymentCounter : { var value : Nat },
) {
  // ─────────────────────────────────────────────────────────────────────────
  // Aadhaar + OTP authentication (student-facing)
  // ─────────────────────────────────────────────────────────────────────────

  /// Send OTP to student's phone (demo mode returns OTP directly).
  /// Returns { otp; demo } so the frontend can show it without SMS.
  public shared func sendOtp(
    aadhaarNumber : Text,
    phone : Text,
  ) : async Types.Result<{ otp : Text; demo : Bool }, Text> {
    if (aadhaarNumber.size() != 12) {
      return #err("Aadhaar number must be 12 digits");
    };
    // Generate a 6-digit numeric OTP (demo: derive from hash)
    var h : Nat = 5381;
    let combined = aadhaarNumber # phone # Time.now().toText();
    for (c in combined.toIter()) {
      h := (h * 33 + c.toNat32().toNat()) % 999999;
    };
    let otp = if (h < 100000) { (h + 100000).toText() } else { h.toText() };
    // Store OTP hash on an existing user or in a pending record keyed by aadhaar.
    // If the user already exists, update their OTP fields.
    // If not, store in a "pending" user slot so verifyOtp can create the real account.
    switch (UsersLib.findByAadhaar(users, aadhaarNumber)) {
      case (?user) {
        let now = Time.now();
        let otpHash = UsersLib.hashOtp(otp, aadhaarNumber);
        let otpExpiry = now + 600_000_000_000; // 10 minutes
        let updated = { user with otpHash = ?otpHash; otpExpiry = ?otpExpiry };
        users.add(user.studentId, updated);
      };
      case null {
        // Pre-create a placeholder user with just aadhaar + phone to hold the OTP.
        let now = Time.now();
        userCounter.value += 1;
        let studentId = UsersLib.generateStudentId(userCounter.value);
        let otpHash = UsersLib.hashOtp(otp, aadhaarNumber);
        let otpExpiry = now + 600_000_000_000;
        let placeholder = UsersLib.create(studentId, "", aadhaarNumber, phone, "", "", "" .encodeUtf8(), now);
        let withOtp = { placeholder with otpHash = ?otpHash; otpExpiry = ?otpExpiry };
        users.add(studentId, withOtp);
      };
    };
    #ok({ otp; demo = true });
  };

  /// Verify OTP and complete registration / login.
  /// On success returns an AuthResult with a session token.
  public shared func verifyOtpAndLogin(
    aadhaarNumber : Text,
    otp : Text,
    name : Text,
    phone : Text,
    course : Text,
    college : Text,
  ) : async Types.Result<UserTypes.AuthResult, Text> {
    switch (UsersLib.findByAadhaar(users, aadhaarNumber)) {
      case null { return #err("No OTP found for this Aadhaar. Please request an OTP first.") };
      case (?user) {
        let now = Time.now();
        // Check OTP expiry
        switch (user.otpExpiry) {
          case null { return #err("OTP not found. Please request a new one.") };
          case (?exp) {
            if (now > exp) { return #err("OTP has expired. Please request a new one.") };
          };
        };
        // Verify OTP hash
        let expectedHash = UsersLib.hashOtp(otp, aadhaarNumber);
        switch (user.otpHash) {
          case null { return #err("OTP not found. Please request a new one.") };
          case (?h) {
            if (h != expectedHash) { return #err("Invalid OTP. Please try again.") };
          };
        };
        // Update profile fields if this is first login (name was blank in placeholder)
        let updatedName = if (user.name == "") { name } else { user.name };
        let updatedPhone = if (user.phone == "") { phone } else { user.phone };
        let updatedCourse = if (user.course == "") { course } else { user.course };
        let updatedCollege = if (user.college == "") { college } else { user.college };
        let token = UsersLib.generateToken(user.studentId, now);
        let sessionExpiry = now + 2592000000000000;
        let loggedIn = {
          user with
          name = updatedName;
          phone = updatedPhone;
          course = updatedCourse;
          college = updatedCollege;
          otpHash = null;
          otpExpiry = null;
          sessionToken = ?token;
          sessionExpiry = ?sessionExpiry;
        };
        users.add(user.studentId, loggedIn);
        #ok({
          token;
          userId = user.studentId;
          user = UsersLib.toPublic(loggedIn);
        });
      };
    };
  };

  /// Register a new student AND immediately mark them as PAID in one atomic call.
  /// Aadhaar+OTP version: OTP must have been sent first via sendOtp.
  public shared func studentSignupAndPay(
    aadhaarNumber : Text,
    otp : Text,
    name : Text,
    phone : Text,
    course : Text,
    college : Text,
    profileImageUrl : Text,
  ) : async Types.Result<UserTypes.AuthResult, Text> {
    switch (UsersLib.findByAadhaar(users, aadhaarNumber)) {
      case (?existing) {
        // Already exists — if PAID, issue a fresh session token
        if (existing.membershipStatus == #PAID) {
          let now = Time.now();
          let token = UsersLib.generateToken(existing.studentId, now);
          let sessionExpiry = now + 2592000000000000;
          let updated = { existing with sessionToken = ?token; sessionExpiry = ?sessionExpiry };
          users.add(existing.studentId, updated);
          return #ok({ token; userId = existing.studentId; user = UsersLib.toPublic(updated) });
        };
        // Verify OTP for existing unpaid user
        let now = Time.now();
        switch (existing.otpExpiry) {
          case (?exp) { if (now > exp) { return #err("OTP expired. Please request a new one.") } };
          case null {};
        };
        let expectedHash = UsersLib.hashOtp(otp, aadhaarNumber);
        switch (existing.otpHash) {
          case (?h) { if (h != expectedHash) { return #err("Invalid OTP") } };
          case null {};
        };
        paymentCounter.value += 1;
        let paymentId = PaymentsLib.generatePaymentId(paymentCounter.value);
        let payment = PaymentsLib.create(paymentId, existing.studentId, "demo_payment", 200, now);
        payments.add(paymentId, payment);
        var paid = UsersLib.withPayment(existing, paymentId, "demo_payment", now);
        let token = UsersLib.generateToken(existing.studentId, now);
        let sessionExpiry = now + 2592000000000000;
        paid := { paid with sessionToken = ?token; sessionExpiry = ?sessionExpiry; otpHash = null; otpExpiry = null };
        users.add(existing.studentId, paid);
        return #ok({ token; userId = existing.studentId; user = UsersLib.toPublic(paid) });
      };
      case null {
        // New student: create account + pay
        let now = Time.now();
        userCounter.value += 1;
        let studentId = UsersLib.generateStudentId(userCounter.value);
        let profileImageBlob : Blob = Blob.fromArray([]);
        var user = UsersLib.create(studentId, name, aadhaarNumber, phone, course, college, profileImageBlob, now);
        paymentCounter.value += 1;
        let paymentId = PaymentsLib.generatePaymentId(paymentCounter.value);
        let payment = PaymentsLib.create(paymentId, studentId, "demo_payment", 200, now);
        payments.add(paymentId, payment);
        user := UsersLib.withPayment(user, paymentId, "demo_payment", now);
        let token = UsersLib.generateToken(studentId, now);
        let sessionExpiry = now + 2592000000000000;
        let withSession = { user with sessionToken = ?token; sessionExpiry = ?sessionExpiry };
        users.add(studentId, withSession);
        #ok({
          token;
          userId = studentId;
          user = UsersLib.toPublic(withSession);
        });
      };
    };
  };

  /// Log out: clear the session token.
  public shared func studentLogout(token : Text) : async () {
    switch (UsersLib.findByToken(users, token)) {
      case null {};
      case (?user) {
        let updated = { user with sessionToken = null; sessionExpiry = null };
        users.add(user.studentId, updated);
      };
    };
  };

  /// Verify a token and return the user's public profile if valid.
  public query func verifyStudentToken(token : Text) : async ?UserTypes.UserPublic {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { null };
      case (?userId) {
        switch (users.get(userId)) {
          case null { null };
          case (?user) {
            switch (user.sessionToken) {
              case (?t) { if (t == token) { ?UsersLib.toPublic(user) } else null };
              case null { null };
            };
          };
        };
      };
    };
  };

  /// Auth middleware helper: decode token, verify, return user.
  public query func getStudentByToken(token : Text) : async ?UserTypes.UserPublic {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { null };
      case (?userId) {
        switch (users.get(userId)) {
          case null { null };
          case (?user) {
            switch (user.sessionToken) {
              case (?t) { if (t == token) { ?UsersLib.toPublic(user) } else null };
              case null { null };
            };
          };
        };
      };
    };
  };

  /// Search and filter students. Requires valid adminToken.
  public query func searchStudents(
    adminToken : Text,
    searchQuery : Text,
    course : ?Text,
    membershipStatus : ?Text,
  ) : async [UserTypes.UserPublic] {
    if (not AdminLib.isAdminToken(adminToken)) {
      Runtime.trap("Unauthorized: Invalid admin token");
    };
    let lower = searchQuery.toLower();
    users.values()
      .filter(func(u) {
        let matchesQuery = lower == "" or
          u.name.toLower().contains(#text lower) or
          u.aadhaarNumber.toLower().contains(#text lower) or
          u.studentId.toLower().contains(#text lower);
        let matchesCourse = switch (course) {
          case (?c) { u.course == c };
          case null { true };
        };
        let matchesStatus = switch (membershipStatus) {
          case (?s) { u.paymentStatus == s };
          case null { true };
        };
        matchesQuery and matchesCourse and matchesStatus;
      })
      .map(func(u) {
        let issuedBooksInfo : [RequestTypes.IssuedBookInfo] = requests.values()
          .filter(func(r) {
            r.userId == u.studentId and
              (r.status == "Approved" or r.status == "Procured" or r.status == "Returned")
          })
          .map(func(r) {
            {
              requestId = r.requestId;
              userId = r.userId;
              studentName = u.name;
              bookId = if (r.selectedBookIds.size() > 0) { r.selectedBookIds[0] } else { "" };
              bookTitle = if (r.selectedBookIds.size() > 0) { r.selectedBookIds[0] } else {
                if (r.requestedBooks.size() > 0) { r.requestedBooks[0].title } else { "" }
              };
              issueDate = switch (r.issueDate) {
                case (?d) { d };
                case null { r.createdAt };
              };
              expectedReturnDate = switch (r.returnDate) {
                case (?d) { d };
                case null { r.createdAt + 1_209_600_000_000_000 };
              };
              returnDate = r.returnDate;
              returned = r.returned;
              status = if (r.returned) { "Returned" } else { r.status };
              bookIds = r.selectedBookIds;
            }
          })
          .toArray();
        let pub = UsersLib.toPublic(u);
        { pub with issuedBooksInfo }
      })
      .toArray();
  };

  /// Get all registered users with their issued books info. Requires valid adminToken.
  public query func getAllUsers(adminToken : Text) : async [UserTypes.UserPublic] {
    if (not AdminLib.isAdminToken(adminToken)) {
      Runtime.trap("Unauthorized: Invalid admin token");
    };
    users.values().map(func(u) {
      let issuedBooksInfo : [RequestTypes.IssuedBookInfo] = requests.values()
        .filter(func(r) {
          r.userId == u.studentId and
            (r.status == "Approved" or r.status == "Procured" or r.status == "Returned")
        })
        .map(func(r) {
          {
            requestId = r.requestId;
            userId = r.userId;
            studentName = u.name;
            bookId = if (r.selectedBookIds.size() > 0) { r.selectedBookIds[0] } else { "" };
            bookTitle = if (r.selectedBookIds.size() > 0) { r.selectedBookIds[0] } else {
              if (r.requestedBooks.size() > 0) { r.requestedBooks[0].title } else { "" }
            };
            issueDate = switch (r.issueDate) {
              case (?d) { d };
              case null { r.createdAt };
            };
            expectedReturnDate = switch (r.returnDate) {
              case (?d) { d };
              case null { r.createdAt + 1_209_600_000_000_000 };
            };
            returnDate = r.returnDate;
            returned = r.returned;
            status = if (r.returned) { "Returned" } else { r.status };
            bookIds = r.selectedBookIds;
          }
        })
        .toArray();
      let pub = UsersLib.toPublic(u);
      { pub with issuedBooksInfo }
    }).toArray();
  };
  /// Update extended student profile fields after OTP verification.
  /// Token must belong to the student being updated.
  /// Returns updated UserPublic on success, error text on failure.
  public shared func updateStudentProfile(
    token : Text,
    update : UserTypes.StudentProfileUpdate,
  ) : async Types.Result<UserTypes.UserPublic, Text> {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Invalid or expired session. Please log in again.") };
      case (?userId) {
        switch (users.get(userId)) {
          case null { return #err("Student account not found.") };
          case (?user) {
            switch (user.sessionToken) {
              case (?t) { if (t != token) { return #err("Session mismatch.") } };
              case null { return #err("No active session.") };
            };
            if (update.email != "" and not UsersLib.isValidEmail(update.email)) {
              return #err("Invalid email address format.");
            };
            if (update.parentContact != "" and not UsersLib.isValidParentContact(update.parentContact)) {
              return #err("Parent contact must be exactly 10 digits.");
            };
            if (update.birthDate != "" and not UsersLib.isValidBirthDate(update.birthDate)) {
              return #err("Birth date must be a valid date in YYYY-MM-DD format.");
            };
            let updated = UsersLib.applyProfileUpdate(user, update);
            users.add(userId, updated);
            #ok(UsersLib.toPublic(updated));
          };
        };
      };
    };
  };

  /// Admin: update any student profile fields by studentId.
  /// Requires a valid adminToken.
  public shared func adminUpdateStudentProfile(
    adminToken : Text,
    studentId : Common.UserId,
    update : UserTypes.StudentProfileUpdate,
  ) : async Types.Result<UserTypes.UserPublic, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (users.get(studentId)) {
      case null { return #err("Student not found: " # studentId) };
      case (?user) {
        if (update.email != "" and not UsersLib.isValidEmail(update.email)) {
          return #err("Invalid email address format.");
        };
        if (update.parentContact != "" and not UsersLib.isValidParentContact(update.parentContact)) {
          return #err("Parent contact must be exactly 10 digits.");
        };
        if (update.birthDate != "" and not UsersLib.isValidBirthDate(update.birthDate)) {
          return #err("Birth date must be a valid date in YYYY-MM-DD format.");
        };
        let updated = UsersLib.applyProfileUpdate(user, update);
        users.add(studentId, updated);
        #ok(UsersLib.toPublic(updated));
      };
    };
  };
};
