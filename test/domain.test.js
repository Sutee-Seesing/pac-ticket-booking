const test = require('node:test'); const assert = require('node:assert/strict'); const D=require('../src/Domain.js');
const p={performance_id:'P1',capacity:50}; const w=(q,s=D.STATES.WAITING)=>({performance_id:'P1',ticket_quantity:q,status:s});
test('1 availability calculation',()=>assert.equal(D.availability(p,[w(10),w(5,D.STATES.CONFIRMED),w(8,D.STATES.REJECTED)]),35));
test('2 booking within capacity succeeds',()=>assert.equal(D.assertQuantity(2),2));
test('3 over capacity fails',()=>assert.equal(D.availability(p,[w(51)]),0));
test('4 final available tickets can be booked',()=>assert.equal(D.availability(p,[w(49)]),1));
test('5 sold-out rejects inventory',()=>assert.equal(D.availability(p,[w(50)]),0));
test('6 waiting count protects concurrent submissions',()=>assert.equal(D.availability(p,[w(50,D.STATES.WAITING)]),0));
test('7 quantity positive integer only',()=>[0,-1,1.2,'x',''].forEach(x=>assert.throws(()=>D.assertQuantity(x))));
test('8 server price input requires validated quantity',()=>assert.equal(D.assertQuantity('3'),3));
test('9 waiting reserves inventory',()=>assert.equal(D.availability(p,[w(2)]),48));
test('10 confirmed does not change inventory reservation',()=>assert.equal(D.releaseRequired(D.STATES.WAITING,D.STATES.CONFIRMED),false));
test('11 rejected returns inventory',()=>assert.equal(D.releaseRequired(D.STATES.WAITING,D.STATES.REJECTED),true));
test('12 rejecting twice cannot return twice',()=>assert.equal(D.releaseRequired(D.STATES.REJECTED,D.STATES.REJECTED),false));
test('13 cancelled returns inventory once',()=>assert.equal(D.releaseRequired(D.STATES.CONFIRMED,D.STATES.CANCELLED),true));
test('14 status transition rules',()=>{assert.equal(D.canTransition(D.STATES.WAITING,D.STATES.CONFIRMED),true);assert.equal(D.canTransition(D.STATES.WAITING,D.STATES.REJECTED),true);assert.equal(D.canTransition(D.STATES.REJECTED,D.STATES.REJECTED),false)});
test('15 completed booking cannot retry transition',()=>assert.equal(D.canTransition(D.STATES.CONFIRMED,D.STATES.CANCELLED),false));
test('16 booking IDs are readable and unique by sequence',()=>{assert.equal(D.bookingCode('2026-08-21','17:00',1),'PAC-0821-1700-001');assert.notEqual(D.bookingCode('2026-08-21','17:00',1),D.bookingCode('2026-08-21','17:00',2))});
test('17 invalid booking sequence rejected',()=>assert.throws(()=>D.bookingCode('2026-08-21','17:00',0)));
test('18 Thai mobile numbers normalize to ten digits',()=>{assert.equal(D.normalizeThaiMobile('095-763-5336'),'0957635336');assert.equal(D.normalizeThaiMobile('+66 95 763 5336'),'0957635336');assert.equal(D.normalizeThaiMobile('957635336'),'0957635336');assert.equal(D.normalizeThaiMobile('1234567890'),null)});
test('18 formula injection neutralized',()=>assert.equal(D.escapeCell('=2+2'),"'=2+2"));
test('19 plain text preserved',()=>assert.equal(D.escapeCell('Ada'),'Ada'));
test('20 Thai-facing status mapper never exposes internal status',()=>assert.equal(D.statusLabel(D.STATES.WAITING),'รอตรวจสอบสลิป'));
test('21 Thai date/time uses Buddhist year',()=>assert.match(D.thaiDateTime('2026-08-21','17:00'),/2569.*17:00/));
const rows=[
 {booking_code:'PAC-001',customer_name:'สมหญิง ใจดี',customer_phone:'0812344432',performance_id:'P1',ticket_quantity:2,status:D.STATES.WAITING},
 {booking_code:'PAC-002',customer_name:'Anan',customer_phone:'0890004432',performance_id:'P1',ticket_quantity:3,status:D.STATES.CONFIRMED},
 {booking_code:'PAC-003',customer_name:'B',customer_phone:'0800000000',performance_id:'P2',ticket_quantity:1,status:D.STATES.REJECTED},
 {booking_code:'PAC-004',customer_name:'C',customer_phone:'0801111111',performance_id:'P2',ticket_quantity:4,status:D.STATES.CANCELLED}
];
test('22 M2 metrics distinguish booking, ticket, and confirmed revenue',()=>{const m=D.bookingMetrics(rows,120);assert.deepEqual(m.waiting,{bookings:1,tickets:2});assert.deepEqual(m.confirmed,{bookings:1,tickets:3});assert.equal(m.confirmedRevenue,360);assert.equal(m.rejected.bookings,1);assert.equal(m.cancelled.tickets,4)});
test('23 search supports booking code, name, and partial phone',()=>{assert.ok(D.matchBooking(rows[0],'PAC-001'));assert.ok(D.matchBooking(rows[0],'ใจดี'));assert.ok(D.matchBooking(rows[0],'4432'));assert.ok(!D.matchBooking(rows[0],'9999'))});
test('24 performance and active-phone duplicate warning detected',()=>assert.equal(D.hasDuplicateActive(rows[0],[...rows,{booking_code:'PAC-005',customer_phone:'0812344432',performance_id:'P1',status:D.STATES.CONFIRMED,ticket_quantity:1}]),true));
test('25 CSV output escapes Thai text, commas and quotes',()=>assert.equal(D.csvEscape('สมหญิง, "PAC"'),'"สมหญิง, ""PAC"""'));
const pricing={BASE_TICKET_PRICE:120,PROMO_ENABLED:'true',PROMO_START_AT:'2026-08-14T00:00:00+07:00',PROMO_END_AT:'2026-08-16T23:59:59+07:00',PROMO_BUNDLE_SIZE:2,PROMO_BUNDLE_PRICE:200};
test('26 promo is inactive before 14 Aug',()=>assert.equal(D.calculateBookingPrice(2,'2026-08-13T23:59:59+07:00',pricing).total,240));
test('27 promo boundary start and end are included',()=>{assert.equal(D.calculateBookingPrice(2,'2026-08-14T00:00:00+07:00',pricing).total,200);assert.equal(D.calculateBookingPrice(2,'2026-08-16T23:59:59+07:00',pricing).total,200)});
test('28 promo ends after exact cutoff',()=>assert.equal(D.calculateBookingPrice(2,'2026-08-17T00:00:00+07:00',pricing).total,240));
test('29 promo pricing handles odd quantities',()=>assert.deepEqual([1,2,3,4,5].map(q=>D.calculateBookingPrice(q,'2026-08-15T12:00:00+07:00',pricing).total),[120,200,320,400,520]));
const show21={date:'2026-08-21',capacity:50,performance_id:'P1'};
test('30 online sales close on prior calendar day Bangkok',()=>{assert.equal(D.onlineSalesOpen(show21,'2026-08-20T23:59:59+07:00'),true);assert.equal(D.onlineSalesOpen(show21,'2026-08-21T00:00:00+07:00'),false)});
test('31 sales-closed differs from sold-out and door count derives safely',()=>{assert.equal(D.salesState(show21,[w(35,D.STATES.CONFIRMED),w(5)],'2026-08-21T00:00:00+07:00'),'ONLINE_CLOSED');assert.equal(D.availability(show21,[w(35,D.STATES.CONFIRMED),w(5)]),10);assert.equal(D.salesState(show21,[w(50)],'2026-08-20T12:00:00+07:00'),'SOLD_OUT')});
