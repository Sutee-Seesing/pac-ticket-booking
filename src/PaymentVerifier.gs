/** Service boundary for future automatic slip checking. M1 intentionally uses manual review. */
var PaymentVerifier = {
  manual: function () { return { provider: 'ManualPaymentVerifier', decision: 'PENDING' }; },
  // Future provider must return { provider, decision: 'CONFIRMED'|'REJECTED', note }.
  verify: function (booking) { return this.manual(booking); }
};
