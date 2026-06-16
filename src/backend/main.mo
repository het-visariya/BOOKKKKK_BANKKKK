import Migration "migration";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import UserTypes "types/user";
import BookTypes "types/book";
import RequestTypes "types/request";
import PaymentTypes "types/payment";
import ReservationTypes "types/reservation";
import ProcurementTypes "types/procurement";
import TransferTypes "types/transfer";
import ChallanTypes "types/challan";
import NotifTypes "types/notification";
import Common "types/common";
import UsersMixin "mixins/users-api";
import BooksMixin "mixins/books-api";
import RequestsMixin "mixins/requests-api";
import PaymentsMixin "mixins/payments-api";
import AnalyticsMixin "mixins/analytics-api";
import ReservationsMixin "mixins/reservations-api";
import ProcurementMixin "mixins/procurement-api";
import TransfersMixin "mixins/transfers-api";
import NotificationsMixin "mixins/notifications-api";
import BooksSeed "lib/books-seed";
import Time "mo:core/Time";
import BooksLib "lib/books";
import AdminMixin "mixins/admin-api";
import AuditMixin "mixins/audit-api";
import AuditTypes "types/audit";
import UsersLib "lib/users";
import EmailNotifTypes "types/notifications";
import NotificationsEmailMixin "mixins/notifications-email-api";
import RegistrationMixin "mixins/registration-api";
import BookRequestWorkflowMixin "mixins/book-request-workflow-api";
import CollectionOrderTypes "types/collection-order";
import ChallanAutoMixin "mixins/challan-auto-api";



(with migration = Migration.run)
 actor {
  // --- Authorization ---
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // --- Object Storage ---
  include MixinObjectStorage();

  // --- Domain State ---
  let users = Map.empty<Common.UserId, UserTypes.User>();
  let books = Map.empty<Common.BookId, BookTypes.Book>();
  let requests = Map.empty<Common.RequestId, RequestTypes.BookRequest>();
  let payments = Map.empty<Common.PaymentId, PaymentTypes.Payment>();
  let reservations = Map.empty<Common.ReservationId, ReservationTypes.Reservation>();
  let procurements = Map.empty<Common.ProcurementId, ProcurementTypes.ProcurementRequest>();
  let transfers = Map.empty<Common.TransferId, TransferTypes.Transfer>();
  let challans = Map.empty<Common.ChallanId, ChallanTypes.Challan>();
  let notifications = Map.empty<NotifTypes.NotificationId, NotifTypes.Notification>();

  // Mutable counters for ID generation
  let userCounterValue : Nat = 0;
  let bookCounterValue : Nat = 0;
  let requestCounterValue : Nat = 0;
  let paymentCounterValue : Nat = 0;
  let reservationCounterValue : Nat = 0;
  let procurementCounterValue : Nat = 0;
  let transferCounterValue : Nat = 0;
  let challanCounterValue : Nat = 0;

  let userCounter = { var value = userCounterValue };
  let bookCounter = { var value = bookCounterValue };
  let requestCounter = { var value = requestCounterValue };
  let paymentCounter = { var value = paymentCounterValue };
  let reservationCounter = { var value = reservationCounterValue };
  let procurementCounter = { var value = procurementCounterValue };
  let transferCounter = { var value = transferCounterValue };
  let challanCounter = { var value = challanCounterValue };
  let notificationCounterValue : Nat = 0;
  let notificationCounter = { var value = notificationCounterValue };
  // --- Collection Order State ---
  let collectionOrders = Map.empty<Common.CollectionOrderId, CollectionOrderTypes.CollectionOrder>();
  let collectionOrderCounterValue : Nat = 0;
  let collectionOrderCounter = { var value = collectionOrderCounterValue };

  // --- Email notification log state ---
  let emailLogs = Map.empty<Text, EmailNotifTypes.EmailNotificationLog>();
  let emailLogCounterValue : Nat = 0;
  let emailLogCounter = { var value = emailLogCounterValue };

  // --- Audit Log State ---
  let auditLog = Map.empty<Text, AuditTypes.AuditEntry>();
  let auditCounterValue : Nat = 0;
  let auditCounter = { var value = auditCounterValue };

  // --- ID Migration State ---
  let idMigrationState = { var done = false };

  // --- Admin credential state ---
  let adminUsername = { var value : Text = "" };
  let adminPasswordHash = { var value : Text = "" };

  // --- Domain Mixins ---
  include UsersMixin(users, userCounter, requests, payments, paymentCounter);
  include BooksMixin(books, bookCounter, reservations);
  include RequestsMixin(users, requests, requestCounter, books, reservations, reservationCounter, procurements, procurementCounter, notifications, notificationCounter, transfers, transferCounter);
  include PaymentsMixin(users, payments, paymentCounter);

  // --- Analytics, CSV Import, QR, Search ---
  include AnalyticsMixin(users, books, requests, reservations, procurements, bookCounter);

  // --- Admin Login, Return Timeline, Student Profile, Inventory Lifecycle ---
  include AdminMixin(adminUsername, adminPasswordHash, users, requests, books, reservations, procurements, notifications, notificationCounter, auditLog, auditCounter);

  // --- Audit Log API ---
  include AuditMixin(auditLog, auditCounter);

  // --- Reservation, Procurement, Transfer APIs ---
  include ReservationsMixin(users, books, requests, reservations, reservationCounter, notifications, notificationCounter);
  include ProcurementMixin(users, procurements, procurementCounter, notifications, notificationCounter);
  include TransfersMixin(users, books, requests, reservations, challans, transfers, transferCounter, challanCounter);

  // --- In-App Notifications ---
  include NotificationsMixin(users, notifications, notificationCounter);
  // --- Email Notifications & Extended Challan/Notification API ---
  include NotificationsEmailMixin(users, notifications, notificationCounter, challans, challanCounter, emailLogs, emailLogCounter);

  // --- Enhanced Email-First Registration Flow ---
  include RegistrationMixin(users, userCounter, payments, paymentCounter, notifications, notificationCounter, emailLogs, emailLogCounter);

  // --- Book Request Workflow (Steps 1-16) ---
  include BookRequestWorkflowMixin(users, books, requests, challans, challanCounter, reservations, reservationCounter, procurements, procurementCounter, collectionOrders, collectionOrderCounter, notifications, notificationCounter, emailLogs, emailLogCounter, auditLog, auditCounter);

  // --- Automatic Challan Generation on every approval/rejection ---
  include ChallanAutoMixin(users, books, requests, challans, challanCounter, reservations, reservationCounter, procurements, notifications, notificationCounter, emailLogs, emailLogCounter, auditLog, auditCounter);

  // --- Migrate old SVGA#### student IDs to S##### format (run once) ---
  if (not idMigrationState.done) {
    UsersLib.migrateStudentIds(users);
    idMigrationState.done := true;
  };

  // --- Seed default admin credentials on first boot ---
  // This ensures svga_admin / admin123 works immediately without any setup step.
  // The hash function here must match the one in admin-api.mo (DJB2 mod 0xFFFFFFFF).
  if (adminUsername.value == "") {
    adminUsername.value := "svga_admin";
    var h : Nat = 5381;
    for (c in "admin123".toIter()) {
      h := (h * 33 + c.toNat32().toNat()) % 0xFFFFFFFF;
    };
    adminPasswordHash.value := h.toText();
  };

  // --- Auto-seed books on first boot ---
  if (books.size() == 0) {
    let now = Time.now();
    let seedData = BooksSeed.getSeedData();
    for (input in seedData.values()) {
      bookCounter.value += 1;
      let bookId = BooksLib.generateBookId(bookCounter.value);
      let book = BooksLib.create(bookId, input.title, input.author, input.edition, input.publisher, input.category, input.quantity, now);
      books.add(bookId, book);
    };
  };

  // --- Stripe Payment ---
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(
    config : Stripe.StripeConfiguration,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfiguration := ?config;
  };

  func requireStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe is not configured") };
      case (?config) { config };
    };
  };

  public shared ({ caller }) func createCheckoutSession(
    items : [Stripe.ShoppingItem],
    successUrl : Text,
    cancelUrl : Text,
  ) : async Text {
    await Stripe.createCheckoutSession(
      requireStripeConfig(),
      caller,
      items,
      successUrl,
      cancelUrl,
      transform,
    );
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(requireStripeConfig(), sessionId, transform);
  };

  public query func transform(
    input : OutCall.TransformationInput,
  ) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
