# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Thai theatre audiences booking performance tickets on a phone, and PAC staff reviewing payment slips and operating bookings.

## Product Purpose

Book performance tickets, reserve capacity while payment evidence is reviewed, and let staff manage the complete daily ticket workflow without leaving the web app.

## Positioning

A small, staff-operated theatre ticket desk whose capacity and booking history remain auditable in one Google Sheet.

## Operating Context

Customers select one of four performances, provide contact details, transfer payment and upload a slip. Staff use the protected Admin screen to review, confirm, reject or cancel bookings.

## Capabilities and Constraints

Google Sheets is the source of truth. Four performances, 50 tickets each, THB 120 per ticket, no assigned seats. Existing inventory rules, status transitions, Drive slip storage, LockService and server-side Admin authorization must remain unchanged. Public event content comes from Settings, including name, synopsis/description, poster and logo URLs.

## Brand Commitments

The current event is The Burlared (ผู้หญิงอย่างว่า). Its confirmed visual reference is a deep-red theatre curtain and gloved hand; the redesign should use this dramatic theatre world rather than a generic corporate interface.

## Evidence on Hand

The supplied event poster reference, configured event name and synopsis in Settings, and real performance/booking data in Google Sheets.

## Product Principles

- Make booking feel ceremonial but effortless on a phone.
- Make payment-review decisions fast, legible and safe for staff.
- Keep the event’s theatrical identity visible without hiding essential information.
- Never compromise inventory integrity for interface effects.
