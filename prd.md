# Technical Product Requirements Document (PRD)

# Third Element Production CRM

**Version:** 1.0

**Application Type:** Web Application (Progressive Web App Ready)

**Target Users:**

* Business Owner
* Sales Team
* Operations Team
* Accounts Team

**Primary Platform**

* Mobile First
* Desktop Responsive

---

# 1. Project Overview

## Purpose

Third Element Production CRM is a production-ready event management and business operations platform built specifically for wedding and event decoration companies.

Unlike a traditional CRM that only manages customers, this application will manage the complete lifecycle of an event—from the first enquiry through budgeting, vendor coordination, execution, payments, profitability analysis, and financial reporting.

The application should eliminate Excel-based workflows by providing a single, centralized system where all business information is maintained and automatically reflected across reports.

---

# 2. Objectives

The application should enable users to:

* Manage all events from one place.
* Track customer enquiries and bookings.
* Prepare event budgets and quotations.
* Assign vendors to events.
* Record expenses and payments.
* Monitor outstanding receivables and payables.
* Calculate profitability automatically.
* Generate financial reports.
* Export data in JSON and Excel formats.
* Operate efficiently on mobile devices.

---

# 3. Technology Stack

## Frontend

* React (JavaScript using `.jsx`)
* Tailwind CSS
* React Router
* TanStack Table
* FullCalendar
* React Hook Form
* SheetJS (Excel Export)
* React Icons

## Backend

* Supabase
* PostgreSQL
* Supabase Authentication
* Supabase Storage (future)
* Row Level Security (RLS)

## Deployment

* Vercel

---

# 4. Product Philosophy

The application should follow these principles:

### Simple

The interface should never overwhelm users.

Only show information that is relevant to the current task.

---

### Fast

Common actions should take less than three taps.

Adding a payment, expense or meeting should never require navigating through multiple pages.

---

### Mobile First

The application should be designed for mobile usage first and desktop second.

Every screen should be comfortable to operate using one hand.

---

### Business Focused

Every feature must solve a real operational problem.

Avoid decorative features that do not improve productivity.

---

### Single Source of Truth

Users should enter information only once.

Every report should automatically update from that information.

Duplicate data entry should never be required.

---

# 5. Target Users

## Owner

Needs complete visibility of the business.

Interested in:

* Revenue
* Profit
* Expenses
* Outstanding payments
* Upcoming events

---

## Sales Team

Needs to:

* Create events
* Record meetings
* Track follow-ups
* Manage client communication

---

## Operations Team

Needs to:

* Manage vendors
* Assign materials
* Record expenses
* Track execution

---

## Accounts Team

Needs to:

* Record payments
* Monitor outstanding balances
* Review ledgers
* Generate reports

---

# 6. Navigation Structure

The application should have ten primary modules.

1. Dashboard
2. Event Master
3. Budget Report
4. Master Day Book
5. Vendor Ledger
6. Client Ledger
7. Budget vs Actual
8. Profitability Report
9. Outstanding Payments
10. Master Lists

The navigation should remain consistent throughout the application.

Desktop should use a left sidebar.

Mobile should use a bottom navigation bar with a "More" menu for additional modules.

---

# 7. Global Features

The following features should be available throughout the application.

## Global Search

Users should be able to search by:

* Event Name
* Client Name
* Vendor Name
* Phone Number
* Venue

Search results should open the relevant record directly.

---

## Universal Filters

Each module should support contextual filters.

Examples:

* Date Range
* Event Status
* Payment Status
* Vendor
* Client
* Event Type

Filters should be persistent until cleared.

---

## Export

Every report should support:

* Excel Export
* JSON Export

The Dashboard should also include a complete application backup option.

---

## Refresh

Users should be able to refresh the current module without reloading the application.

---

## Notifications

Display lightweight notifications for:

* Successful save
* Update completed
* Record deleted
* Export completed
* Login success
* Errors

Notifications should disappear automatically.

---

# 8. Authentication

The application should use secure authentication provided by Supabase.

Features include:

* Email and Password Login
* Forgot Password
* Secure Logout
* Session Persistence
* Protected Routes

Unauthenticated users should only have access to the Login screen.

---

# 9. Design Principles

## Minimal UI

Avoid unnecessary visual elements.

Every component should have a purpose.

---

## Consistency

Buttons, forms, typography, spacing and colors should remain consistent across every screen.

---

## Accessibility

Use readable font sizes.

Provide sufficient color contrast.

Ensure buttons are large enough for touch interaction.

Support keyboard navigation where applicable.

---

## Visual Hierarchy

Important information should be immediately visible.

Secondary information should be progressively disclosed.

---

## Information Density

Avoid large empty spaces.

Avoid overcrowded layouts.

Use cards, tables and sections appropriately.

---

# 10. Mobile Design Principles

This application is expected to be used extensively on mobile devices.

Therefore:

* Use large touch targets.
* Avoid horizontal scrolling.
* Convert tables into stacked cards on smaller screens.
* Open record details in a full-screen drawer or page.
* Use bottom sheets for filters and quick actions.
* Keep primary actions fixed at the bottom where appropriate.

Users should be able to perform the most common tasks comfortably with one hand.

---

# 11. Shared User Experience Standards

Every module should provide a consistent experience.

### Listing Screen

* Search bar at the top
* Filter button
* Sort button
* Add button
* Responsive list/table
* Pagination or lazy loading

---

### Detail Screen

Every detail page should contain:

* Header
* Summary
* Tabs (where applicable)
* Edit button
* Delete button
* Activity history

---

### Forms

Forms should:

* Validate inputs immediately
* Highlight required fields
* Display meaningful error messages
* Prevent accidental duplicate submissions
* Preserve entered data if interrupted

---

### Tables

All tables should support:

* Search
* Sort
* Filters
* Column visibility
* Responsive layout
* Export
* Inline actions

---

### Dialogs

Confirmation dialogs should be used before:

* Delete
* Cancel unsaved changes
* Reset forms
* Archive records

---

# 12. Performance Expectations

The application should feel responsive even on mid-range Android devices.

Guidelines:

* Fast initial loading
* Smooth navigation
* Lazy loading where appropriate
* Optimized queries
* Efficient rendering
* Minimal unnecessary network requests

---

# 13. Backup Strategy

The application will provide manual backups.

Users can export:

* Entire application as JSON
* Reports as Excel

The backup feature should be available from both the Dashboard and Settings.

Export operations should include timestamps in the generated filenames for easy identification.

---

# 15. Dashboard

## Purpose

The Dashboard serves as the operational command center of the application. It should provide business owners and staff with an immediate overview of business performance, upcoming work, pending actions, and financial health without requiring navigation into individual modules.

The Dashboard should answer three key questions:

* What needs attention today?
* How is the business performing?
* What action should I take next?

---

# Dashboard Layout

The dashboard should be divided into six logical sections.

1. Header
2. KPI Cards
3. Business Analytics
4. Upcoming Activities
5. Financial Summary
6. Quick Actions

The layout should adapt seamlessly across mobile and desktop devices.

---

# Dashboard Header

The header should display:

* Greeting with logged-in user's name.
* Current date.
* Global search bar.
* Notification icon.
* User profile menu.

On mobile devices, the search bar should collapse into a search icon to maximize screen space.

---

# KPI Cards

Display key business metrics as compact cards.

Metrics include:

* Active Events
* Upcoming Events
* Completed Events
* Monthly Revenue
* Monthly Expenses
* Monthly Profit
* Outstanding Client Payments
* Outstanding Vendor Payments

Each KPI card should:

* Display a title.
* Display the current value.
* Show an icon.
* Be tappable to navigate to the related module.

---

# Business Analytics

Display visual summaries that help users understand business performance.

Charts may include:

* Monthly Revenue
* Monthly Expenses
* Revenue vs Expenses
* Event Status Distribution
* Profit Trend
* Event Types Distribution

Charts should remain simple and easy to understand.

Avoid unnecessary animations.

---

# Upcoming Activities

Display:

* Today's Meetings
* Upcoming Events
* Payment Due Today
* Vendor Payments Due
* Client Follow-ups

Each activity should provide a quick navigation shortcut to its related record.

---

# Financial Summary

Display summary cards for:

* Total Client Receivables
* Total Vendor Payables
* Total Cash Received
* Total Cash Paid
* Net Profit
* Current Month Balance

These values should update automatically as data changes.

---

# Recent Activity

Display a chronological timeline showing recent user actions.

Examples:

* New Event Created
* Vendor Added
* Client Payment Received
* Expense Recorded
* Budget Updated

This helps users quickly review recent operations.

---

# Quick Actions

Provide one-touch shortcuts for common operations.

Buttons include:

* Create Event
* Record Client Payment
* Record Vendor Payment
* Add Expense
* Add Vendor
* Export Backup

On mobile, display these as floating action buttons or a bottom action sheet.

---

# Dashboard Mobile Experience

The dashboard should prioritize readability.

Order:

* Greeting
* Search
* KPI Cards (horizontal scroll)
* Today's Activities
* Charts
* Financial Summary
* Quick Actions

Charts should resize automatically for smaller screens.

---

# 16. Event Master

## Purpose

The Event Master is the heart of the application.

Every business process starts here.

Users should only need to create an event once. Every other module—including budgets, vendor ledgers, client ledgers, profitability reports, and outstanding payments—should derive information from the event.

---

# Event List Screen

The Event Master landing page displays all events.

Each row (or mobile card) represents one event.

The list should support:

* Search
* Advanced Filters
* Sorting
* Pagination
* Export

---

# Event Card / Row

Each event should display:

* Event ID
* Event Name
* Client Name
* Mobile Number
* Event Date
* Venue
* Event Type
* Event Status
* Budget
* Outstanding Amount

Status should be visually represented using colored badges.

---

# Search

Search should support:

* Client Name
* Phone Number
* Event Name
* Venue

Search should return results instantly.

---

# Filters

Allow filtering by:

* Event Date
* Event Type
* Status
* Sales Executive
* Lead Source
* Venue

Filters should remain active until reset.

---

# Add Event

The "Add Event" button opens a guided form.

The form should be divided into logical sections rather than one long form.

Suggested sections:

* Client Information
* Event Details
* Budget Information
* Notes

Users should be able to save partially completed forms.

---

# Event Detail Screen

Selecting an event opens a detailed workspace.

Desktop:

Split layout.

Mobile:

Full-screen detail page.

---

# Event Summary

Display at the top:

* Event Name
* Client Name
* Event Date
* Venue
* Event Status
* Budget
* Total Received
* Outstanding Balance

This section should remain visible while scrolling.

---

# Event Tabs

The Event Detail page should contain the following tabs.

1. Overview
2. Meetings
3. Budget
4. Vendors
5. Expenses
6. Client Payments
7. Documents
8. Notes

---

# Overview Tab

Displays all general information.

Editable fields include:

* Client Information
* Contact Details
* Event Type
* Venue
* Event Date
* Lead Source
* Sales Executive
* Budget
* Status

All fields should support inline editing.

---

# Meetings Tab

Purpose:

Track every client interaction.

Each meeting should include:

* Meeting Date
* Meeting Time
* Meeting Type
* Attended By
* Discussion Notes
* Next Follow-up Date

Meetings should be displayed as a timeline.

Users should be able to:

* Add
* Edit
* Delete

---

# Budget Tab

Displays the planned budget.

Users should be able to:

* Add Categories
* Add Estimated Cost
* Assign Vendors
* Add Notes
* View Total Budget

Budget should update automatically.

---

# Vendors Tab

Displays vendors assigned to the event.

Each vendor should show:

* Vendor Name
* Category
* Contact Number
* Assigned Work
* Estimated Cost
* Actual Cost
* Outstanding Balance

Users should be able to:

* Assign Vendor
* Replace Vendor
* Update Vendor Details

---

# Expenses Tab

Purpose:

Track actual spending.

Each expense should contain:

* Date
* Expense Category
* Vendor
* Amount
* Payment Method
* Account
* Remarks

Users should be able to attach bills or invoices in future versions.

---

# Client Payments Tab

Track client payment schedules and receipts.

Display:

* Payment Schedule
* Amount Due
* Amount Received
* Payment Method
* Account
* Reference Number
* Outstanding Balance

Quick actions:

* Record Payment
* Edit Payment
* Print Receipt (future)

---

# Documents Tab

Manage all event-related files.

Examples:

* Quotations
* Contracts
* Reference Images
* Event Designs
* Invoices

Files should display:

* File Name
* Upload Date
* Uploaded By

---

# Notes Tab

Simple free-form notes.

Users can:

* Add Notes
* Edit Notes
* Delete Notes

Each note should display:

* Date
* Author
* Content

Notes should appear in reverse chronological order.

---

# Event Actions

Every event should support:

* Edit
* Archive
* Duplicate Event
* Export Event
* Print Summary

Deletion should require confirmation.

Archiving is preferred over permanent deletion.

---

# Mobile Experience

The Event Master should be optimized for one-handed use.

Instead of wide tables:

* Display compact cards.
* Tap card to open full-screen details.
* Use sticky action buttons.
* Present filters as bottom sheets.
* Keep Save and Cancel buttons fixed at the bottom during editing.

Users should never need to zoom or scroll horizontally.

---

# User Experience Goals

The Event Master should enable users to:

* Create a new event in under three minutes.
* Record a payment in under thirty seconds.
* Add a meeting note in under twenty seconds.
* Locate any event in under ten seconds using search or filters.
* Navigate between event tabs without losing unsaved changes.

---

# 17. Budget Report

## Purpose

The Budget Report is the pre-event planning module where users estimate the complete cost of an event before execution. It should help prepare quotations, compare vendor costs, and establish the financial baseline that will later be compared against actual expenses.

The Budget Report should function as a modern replacement for the current Excel costing sheet while maintaining the flexibility users are accustomed to.

---

# Budget Report Layout

The screen should consist of:

* Budget Summary Header
* Event Information
* Budget Categories
* Cost Breakdown Table
* Vendor Assignment
* Totals Summary
* Notes Section
* Action Buttons

---

# Budget Summary Header

Display:

* Event Name
* Client Name
* Event Date
* Venue
* Budget Status
* Total Estimated Cost
* Last Modified Date

This information should remain visible while scrolling.

---

# Budget Categories

Allow users to organize the budget into logical categories.

Examples:

* Stage Decoration
* Floral Decoration
* Lighting
* Fabric & Draping
* Furniture
* Sound & AV
* Labour
* Transportation
* Accommodation
* Printing
* Miscellaneous

Users should be able to create custom categories if required.

---

# Budget Items

Each category should support multiple budget items.

Each item should contain:

* Description
* Vendor
* Quantity
* Unit
* Estimated Cost
* Notes

Users should be able to:

* Add Items
* Edit Items
* Delete Items
* Duplicate Items

---

# Budget Summary

Display automatic calculations:

* Category Total
* Overall Budget
* Taxes (if applicable)
* Discount
* Final Quotation Amount

Values should update instantly as users modify budget items.

---

# Budget Templates

Users should be able to:

* Save Budget as Template
* Load Existing Template
* Duplicate Previous Event Budget

This significantly reduces repetitive data entry.

---

# Budget Actions

Provide actions for:

* Save
* Save Draft
* Duplicate Budget
* Export
* Print
* Generate Quotation (Future)

---

# Mobile Experience

On mobile:

* Categories appear as expandable sections.
* Budget items appear as cards.
* Totals remain sticky at the bottom.
* Add Item button remains easily accessible.

---

# 18. Master Day Book

## Purpose

The Master Day Book is the central financial journal of the application.

Every payment received, expense recorded, vendor payment, or adjustment should automatically appear here.

Users should never manually create entries in this module.

---

# Layout

Display:

* Date
* Event
* Particular
* Debit
* Credit
* Account
* Payment Mode
* Reference
* Remarks

---

# Features

Users should be able to:

* Search transactions
* Filter by date
* Filter by account
* Filter by event
* Filter by payment method
* Export reports

---

# Transaction Types

Automatically include:

* Client Payments
* Vendor Payments
* Expenses
* Refunds
* Adjustments

---

# Summary

Display totals for:

* Total Debit
* Total Credit
* Net Balance

---

# Mobile Experience

Transactions should display as stacked cards showing:

* Date
* Event
* Amount
* Debit/Credit Indicator

Tapping a transaction opens the related event or payment record.

---

# 19. Vendor Ledger

## Purpose

The Vendor Ledger automatically tracks all financial transactions related to vendors.

It provides a complete financial history for every vendor, eliminating the need for separate vendor accounting sheets.

---

# Vendor List

Display:

* Vendor Name
* Category
* Contact Number
* Outstanding Balance
* Last Transaction Date

Search and filters should be available.

---

# Vendor Detail

Selecting a vendor opens:

* Vendor Information
* Running Balance
* Transaction History
* Pending Payments
* Assigned Events

---

# Transaction History

Display:

* Date
* Event
* Description
* Credit
* Debit
* Balance

Running balance should update automatically.

---

# Outstanding Summary

Display:

* Total Payable
* Total Paid
* Remaining Balance

---

# Vendor Actions

Allow users to:

* Record Payment
* Edit Vendor Information
* View Assigned Events
* Export Ledger

---

# Mobile Experience

Vendor list should display as cards.

Each card should show:

* Vendor Name
* Category
* Outstanding Balance

Selecting the card opens a detailed ledger.

---

# 20. Client Ledger

## Purpose

The Client Ledger maintains a complete financial record of every client.

It should automatically calculate outstanding amounts based on invoices, payment schedules, and payments received.

---

# Client List

Display:

* Client Name
* Event Name
* Total Invoice
* Total Received
* Outstanding Balance

Provide search and filters.

---

# Client Detail

Display:

* Client Information
* Event Details
* Invoice Summary
* Payment History
* Outstanding Amount
* Due Dates

---

# Payment History

Display every payment including:

* Date
* Amount
* Payment Method
* Account
* Reference Number

Allow users to edit payment information if required.

---

# Outstanding Summary

Display:

* Invoice Amount
* Total Received
* Balance Due

Highlight overdue payments.

---

# Client Actions

Allow users to:

* Record Payment
* Edit Payment
* View Event
* Export Ledger

---

# Mobile Experience

Display client summary cards.

Each card includes:

* Client Name
* Event
* Outstanding Amount

Selecting a card opens the detailed ledger.

---

# Financial UX Principles

All financial modules should follow the same interaction pattern.

Every screen should provide:

* Search
* Filters
* Export
* Summary Cards
* Detailed Transaction List
* Quick Actions

---

# Financial Data Rules

The following principles should be maintained throughout the application:

* Financial reports should update automatically.
* Users should never duplicate entries across modules.
* All balances should be calculated in real time.
* Historical transactions should remain immutable unless explicitly edited.
* Every financial change should immediately reflect across Dashboard, Ledgers, Outstanding Payments, and Profitability reports.

---

# 21. Budget vs Actual

## Purpose

The Budget vs Actual module helps management understand how accurately each event was executed financially. It compares the planned budget against actual spending and highlights overspending or savings in every category.

This report should update automatically whenever expenses or budgets are modified.

---

# Screen Layout

The page should contain:

* Event Selector
* Budget Summary Cards
* Category Comparison Table
* Variance Summary
* Cost Analysis
* Export Options

---

# Summary Cards

Display:

* Estimated Budget
* Actual Cost
* Total Variance
* Variance Percentage
* Budget Utilization

These values should update in real time.

---

# Category Comparison

Compare each category individually.

Display:

* Category
* Budgeted Amount
* Actual Amount
* Difference
* Variance %
* Status

Status examples:

* Under Budget
* On Budget
* Over Budget

Rows should be color-coded for quick identification.

---

# Insights

Provide simple business insights such as:

* Highest overspending category.
* Highest savings category.
* Largest vendor cost.
* Total additional expenses.

These should help management make informed decisions.

---

# Filters

Support filtering by:

* Event
* Event Type
* Date Range
* Sales Executive

---

# Export

Allow users to export:

* Excel
* PDF (future)

---

# Mobile Experience

Display comparison as expandable category cards instead of wide tables.

Each card should show:

* Budget
* Actual
* Difference
* Status

---

# 22. Profitability Report

## Purpose

The Profitability Report measures the financial success of every event by comparing revenue against all associated expenses.

This report should require no manual calculations.

---

# Screen Layout

Display:

* Profit Summary
* Revenue Breakdown
* Expense Breakdown
* Event Ranking
* Trend Analysis

---

# Profit Summary

Display:

* Total Revenue
* Total Expenses
* Net Profit
* Profit Margin
* Profit Percentage

These should be the first metrics visible.

---

# Event Profitability Table

Each row should display:

* Event Name
* Client
* Revenue
* Expenses
* Profit
* Profit Margin
* Status

Users should be able to sort by profitability.

---

# Trend Analysis

Provide monthly summaries showing:

* Revenue Trend
* Expense Trend
* Profit Trend

This helps identify seasonal business performance.

---

# Filters

Allow filtering by:

* Month
* Year
* Event Type
* Sales Executive
* Venue

---

# Export

Support:

* Excel
* PDF (future)

---

# Mobile Experience

Instead of tables, display profitability cards.

Each card should include:

* Event Name
* Revenue
* Expenses
* Profit
* Margin

---

# 23. Outstanding Payments

## Purpose

This module helps users manage pending receivables from clients and pending payments to vendors.

It should become the primary daily screen for the accounts team.

---

# Screen Layout

Divide the page into two sections.

## Client Outstanding

Displays pending client payments.

---

## Vendor Outstanding

Displays pending vendor payments.

---

# Client Outstanding

Display:

* Client
* Event
* Due Date
* Amount Due
* Days Overdue
* Status

Actions:

* Record Payment
* View Client Ledger
* View Event

---

# Vendor Outstanding

Display:

* Vendor
* Event
* Amount
* Due Date
* Outstanding Balance

Actions:

* Record Vendor Payment
* View Vendor Ledger

---

# Summary Cards

Display:

* Total Client Receivables
* Total Vendor Payables
* Payments Due Today
* Overdue Payments

---

# Filters

Allow filtering by:

* Due Date
* Event
* Vendor
* Client
* Payment Status

---

# Mobile Experience

Display outstanding records as simple cards.

Highlight overdue payments prominently.

Primary action should always be:

"Record Payment"

---

# 24. Calendar

## Purpose

The Calendar provides a visual overview of all important business activities.

It should help teams quickly understand workloads and upcoming commitments.

---

# Calendar Views

Support:

* Month
* Week
* Day

Users should be able to switch views easily.

---

# Calendar Events

Display:

* Event Dates
* Meetings
* Follow-ups
* Client Payment Due Dates
* Vendor Payment Due Dates

Each event type should have a unique color.

---

# Event Details

Clicking an item should open the related record.

Users should not need to search separately.

---

# Quick Actions

Allow users to:

* Add Meeting
* Record Follow-up
* Open Event

Directly from the calendar.

---

# Mobile Experience

Month view should remain compact.

Selecting a day should display all scheduled activities underneath.

---

# 25. Notifications & Reminders

## Purpose

Provide timely reminders so users do not miss important business activities.

Notifications should assist users without becoming distracting.

---

# Notification Types

Notify users for:

* Upcoming Events
* Meetings
* Follow-ups
* Client Payment Due
* Vendor Payment Due
* Successful Data Save
* Export Completion

---

# Reminder Center

A notification center should display:

* Unread Notifications
* Today's Tasks
* Upcoming Deadlines

Users should be able to mark notifications as read.

---

# 26. Reports Experience

All reporting modules should provide a consistent user experience.

Every report should include:

* Search
* Filters
* Export
* Summary Cards
* Responsive Tables
* Mobile Card View

---

# Reporting Principles

Reports should always be:

* Read-only
* Automatically generated
* Fast to load
* Accurate
* Easy to export

Users should never manually edit report data.

All changes must originate from operational modules such as Event Master, Budget, Expenses, or Payments.

---

# Business Intelligence Goals

The reporting modules should help answer questions such as:

* Which events are most profitable?
* Which vendors cost the most?
* Which clients have overdue payments?
* Where are budgets being exceeded?
* How much revenue is expected this month?
* Which events require immediate attention?

---

# 27. Master Lists

## Purpose

The Master Lists module acts as the central configuration area of the application. It stores reusable business data that is referenced throughout the CRM, ensuring consistency and eliminating repetitive manual entry.

Users should manage master data from one place, and all modules should automatically reflect changes.

---

# Available Master Lists

The following configurable lists should be available:

### Vendors

Maintain all vendor information, categories, contact details, payment preferences, and active status.

### Event Types

Examples:

* Wedding
* Reception
* Engagement
* Birthday
* Corporate Event
* Baby Shower

---

### Lead Sources

Examples:

* Instagram
* Facebook
* Google
* Website
* Referral
* Walk-In
* Existing Client

---

### Expense Categories

Examples:

* Flowers
* Lighting
* Fabric
* Furniture
* Labour
* Printing
* Transport
* Accommodation
* Food
* Miscellaneous

---

### Payment Methods

* Cash
* UPI
* Bank Transfer
* Cheque
* Credit Card

---

### Accounts

Examples:

* Cash
* HDFC Current Account
* ICICI Current Account
* Petty Cash

---

### Staff

Maintain employees who may appear in:

* Meetings
* Sales
* Operations
* Accounts

---

### Event Status

Examples:

* New Lead
* Follow Up
* Quotation Sent
* Negotiation
* Confirmed
* In Progress
* Completed
* Cancelled

---

# Master List Features

Every master list should support:

* Add
* Edit
* Archive
* Search
* Filter
* Export

Deleting master records should be avoided if they are already used by existing events.

---

# 28. Global Search

## Purpose

Provide a single search experience across the entire application.

The user should never wonder where information is stored.

---

# Search Scope

Search should include:

* Event Name
* Client Name
* Vendor Name
* Phone Number
* Venue
* Event ID

---

# Search Experience

Results should appear instantly while typing.

Each result should indicate:

* Record Type
* Record Name
* Event
* Status

Clicking a result opens the related screen.

---

# Mobile Behaviour

Search opens as a full-screen overlay with recent searches and suggestions.

---

# 29. Global Filters

Every module should support contextual filtering.

Common filters include:

* Date Range
* Event Type
* Event Status
* Client
* Vendor
* Lead Source
* Payment Status
* Sales Executive

Filters should remain active until the user clears them.

On mobile, filters should open in a bottom sheet.

---

# 30. Export & Backup

## Purpose

Allow users to securely export business data for backup and reporting.

---

# Export Options

Available in every report:

* Export Excel
* Export CSV (optional)
* Export JSON

Dashboard should include a complete application backup.

---

# Export Principles

Exports should:

* Preserve applied filters where appropriate.
* Include timestamps in filenames.
* Be downloadable with one click.
* Never block application usage while generating.

---

# 31. User Profile

Users should be able to manage:

* Name
* Email
* Phone Number
* Password
* Profile Picture (future)

---

# Account Actions

* Logout
* Change Password
* View Last Login
* Session Information

---

# 32. Settings

Provide application-level configuration.

Examples:

* Company Name
* Company Logo
* Default Currency
* Default Tax Percentage
* Financial Year
* Date Format
* Time Format

Future additions:

* Invoice Number Format
* Quotation Prefix
* Event Number Prefix

---

# 33. Design System

## Purpose

Maintain a consistent user interface across every module.

Every component should follow the same visual language and interaction patterns.

---

# Color Palette

Primary

Indigo

Secondary

Slate

Success

Green

Warning

Orange

Error

Red

Background

White

Surface

Light Grey

---

# Typography

Hierarchy

Heading 1

Heading 2

Heading 3

Body

Caption

Avoid excessive font sizes.

---

# Cards

Cards should be used for:

* KPI summaries
* Event summaries
* Vendor summaries
* Payment summaries

Each card should have:

* Rounded corners
* Light shadow
* Consistent spacing

Avoid heavy borders.

---

# Buttons

Types:

* Primary
* Secondary
* Outline
* Text
* Danger

Buttons should remain consistent throughout the application.

---

# Icons

Icons should enhance usability.

Never rely solely on icons.

Every icon should have a label or tooltip.

---

# Forms

All forms should:

* Group related fields
* Use consistent spacing
* Validate immediately
* Display inline errors
* Preserve entered values
* Support keyboard navigation

---

# Tables

Desktop

Responsive tables.

Mobile

Card-based layout.

Every table should support:

* Search
* Sort
* Filters
* Pagination
* Export

---

# Drawers

Use drawers instead of popups for large forms.

Examples:

* Event Details
* Vendor Details
* Client Details

On mobile, drawers should become full-screen pages.

---

# Dialogs

Confirmation dialogs should appear before:

* Delete
* Archive
* Reset
* Cancel Unsaved Changes

---

# Empty States

Every module should display meaningful empty states.

Example:

"No events found. Create your first event to get started."

Provide a clear call-to-action.

---

# Loading States

Avoid blank screens.

Use:

* Skeleton loaders
* Progress indicators
* Loading placeholders

---

# Success Messages

Display concise confirmation messages.

Examples:

* Event Created Successfully
* Payment Recorded
* Vendor Updated
* Export Completed

Messages should disappear automatically.

---

# Error Messages

Display user-friendly language.

Avoid technical terminology.

Example:

Instead of

"500 Internal Server Error"

Display

"Unable to save your changes. Please try again."

---

# 34. Mobile UX Standards

The application should be designed primarily for smartphones.

---

# Navigation

Bottom Navigation

Five primary items

Additional modules under "More".

---

# Forms

Single-column layout.

Large touch targets.

Sticky Save button.

---

# Tables

Never require horizontal scrolling.

Convert rows into cards.

---

# Actions

Primary actions should remain visible.

Floating Action Button may be used where appropriate.

---

# Filters

Open as bottom sheets.

Users should apply or reset filters without leaving the screen.

---

# 35. Accessibility

Ensure:

* High color contrast
* Large tap targets
* Readable typography
* Clear labels
* Keyboard accessibility where applicable

The interface should remain usable for users with varying levels of technical experience.

---

# 36. User Experience Principles

The application should feel:

* Fast
* Predictable
* Consistent
* Professional
* Easy to learn

Common tasks should require minimal effort.

Users should never feel lost while navigating the application.

---

# 37. Core User Workflows

The application should guide users through a natural operational workflow rather than isolated screens. Every major business process should be simple, consistent, and require minimal navigation.

---

## Workflow 1 – Create a New Event

### Objective

Capture a new enquiry or confirmed booking.

### User Flow

1. Click **New Event**
2. Enter client details.
3. Enter event information.
4. Select event type.
5. Assign sales executive.
6. Save the event.
7. Redirect to Event Detail page.

### Expected Result

The event is immediately available across:

* Dashboard
* Calendar
* Reports
* Search

---

## Workflow 2 – Record Client Meeting

### Objective

Track all discussions with the client.

### User Flow

1. Open Event.
2. Go to Meetings tab.
3. Add meeting.
4. Enter discussion notes.
5. Set follow-up date.
6. Save.

### Expected Result

The meeting appears:

* Inside Event Timeline
* Calendar
* Dashboard (Upcoming Follow-ups)

---

## Workflow 3 – Prepare Budget

### Objective

Estimate project cost.

### User Flow

1. Open Budget.
2. Add categories.
3. Add line items.
4. Assign vendors.
5. Save budget.

### Expected Result

Budget automatically updates:

* Budget Report
* Dashboard
* Budget vs Actual

---

## Workflow 4 – Assign Vendors

### Objective

Allocate vendors to event activities.

### User Flow

1. Open Vendor Tab.
2. Select vendor.
3. Assign work.
4. Enter estimated amount.
5. Save.

### Expected Result

Vendor Ledger updates automatically.

---

## Workflow 5 – Record Expense

### Objective

Capture actual event expenses.

### User Flow

1. Open Expense tab.
2. Add expense.
3. Select vendor.
4. Enter payment details.
5. Save.

### Expected Result

Automatically updates:

* Budget vs Actual
* Vendor Ledger
* Master Day Book
* Profitability Report

---

## Workflow 6 – Receive Client Payment

### Objective

Record incoming payments.

### User Flow

1. Open Client Payments.
2. Record payment.
3. Select payment method.
4. Select account.
5. Save.

### Expected Result

Automatically updates:

* Client Ledger
* Outstanding Payments
* Dashboard
* Day Book

---

## Workflow 7 – Pay Vendor

### Objective

Record payments made to vendors.

### User Flow

1. Open Vendor Ledger.
2. Record payment.
3. Enter payment details.
4. Save.

### Expected Result

Automatically updates:

* Vendor Ledger
* Outstanding Payments
* Day Book

---

## Workflow 8 – Complete Event

### Objective

Close an event after execution.

### User Flow

1. Verify all expenses.
2. Verify all client payments.
3. Verify vendor payments.
4. Change status to Completed.

Completed events remain searchable and reportable.

---

# 38. Business Rules

The following business rules govern application behavior.

---

## Event Rules

* Every event must have a client.
* Event IDs are automatically generated.
* Completed events cannot be deleted.
* Archived events remain searchable.
* Event dates cannot be in an invalid format.

---

## Budget Rules

* Budget cannot contain negative values.
* Budget totals calculate automatically.
* Changes should immediately update reports.
* Budget templates are reusable.

---

## Payment Rules

* Payment amounts must be greater than zero.
* Payment dates cannot be empty.
* Outstanding amounts calculate automatically.
* Multiple payments are allowed.

---

## Vendor Rules

* Vendors can be assigned to multiple events.
* Vendor balance is automatically calculated.
* Historical transactions remain available.

---

## Ledger Rules

* Ledgers are generated automatically.
* Manual ledger editing is not permitted.
* Every financial transaction should be traceable back to its originating event.

---

## Reporting Rules

Reports are read-only.

Users modify operational data through Event Master, Budgets, Expenses, Vendors, and Payments—not through reports.

---

# 39. Validation Standards

All forms should validate before saving.

Validation should occur:

* While typing
* On field exit
* Before submission

Common validations include:

* Required fields
* Valid phone numbers
* Valid email addresses
* Positive monetary values
* Future follow-up dates where applicable

Errors should appear directly below the relevant field with clear guidance.

---

# 40. Notification Behaviour

The application should provide lightweight feedback without interrupting the user's workflow.

### Success

Examples:

* Event created successfully.
* Budget updated.
* Payment recorded.
* Vendor assigned.

### Warning

Examples:

* Unsaved changes.
* Budget exceeded.
* Upcoming payment due.

### Error

Examples:

* Save failed.
* Network unavailable.
* Authentication expired.

Notifications should disappear automatically after a few seconds but remain accessible in a notification center if desired in future versions.

---

# 41. Search & Navigation Behaviour

Search should:

* Return results instantly.
* Prioritize exact matches.
* Display recent searches.
* Support keyboard navigation on desktop.

Navigation should:

* Preserve filters when returning to a previous screen.
* Remember the last active tab within an event.
* Minimize page reloads.

---

# 42. Audit & History

Although detailed audit logs are not required for the initial release, every record should maintain basic metadata.

The application should display:

* Created date
* Last updated date
* Current status

This prepares the system for future multi-user audit capabilities.

---

# 43. Data Export Behaviour

Exports should be simple and reliable.

Requirements:

* Export current filtered report.
* Export complete report.
* Export application backup as JSON.
* Export business reports as Excel.

The export process should not block users from continuing to use the application.

---

# 44. Error Handling

The application should fail gracefully.

Scenarios include:

* Internet disconnected
* Supabase unavailable
* Authentication expired
* Validation failures
* Export failures

The UI should always explain the issue in plain language and, where possible, suggest the next step.

---

# 45. Empty States

Every module should provide meaningful empty states.

Examples:

* No Events Found
* No Vendors Assigned
* No Payments Recorded
* No Outstanding Balances
* No Budget Created Yet

Each empty state should encourage the user to perform the relevant action.

---

# 46. Performance Expectations

The application should remain responsive with thousands of records.

Performance goals:

* Fast initial load
* Smooth scrolling
* Efficient searching
* Responsive filtering
* Optimized report generation

Users should not experience unnecessary delays while performing common tasks.

---

# 47. Security Considerations

The application should:

* Require authentication for all protected routes.
* Restrict database access using Supabase Row Level Security.
* Store no sensitive credentials in the frontend.
* Validate user input before submission.
* Prevent accidental duplicate submissions.

---

# 48. Future Enhancements

The architecture should support future modules without requiring major redesign.

Potential enhancements include:

## Business

* Inventory Management
* Purchase Orders
* Warehouse Tracking
* Material Returns
* Vendor Quotations
* Multi-branch Support

---

## Finance

* GST Reports
* Invoice Generation
* Credit Notes
* Debit Notes
* Profit Forecasting
* Cash Flow Reports

---

## Customer Experience

* Client Portal
* Online Quotation Approval
* Event Timeline Sharing
* Photo Gallery
* Digital Contracts

---

## AI Features

* AI Budget Suggestions
* AI Vendor Recommendation
* AI Cost Optimization
* AI Business Dashboard Insights
* AI Expense Categorization
* AI Revenue Forecasting

---

## Communication

* WhatsApp Integration
* Email Notifications
* SMS Reminders
* Calendar Sync

---

# 49. Definition of Done

A feature is considered complete when:

* UI matches the design principles.
* Responsive behavior works on mobile and desktop.
* All validations are implemented.
* Search and filters function correctly.
* Add, edit, and view workflows are complete.
* Reports update automatically.
* Export functionality works.
* Authentication is enforced.
* Error and empty states are handled.
* User feedback is provided for all actions.
* The feature has been manually tested.

---

# 50. Success Criteria

The application will be considered successful if it enables Third Element Production to:

* Replace existing Excel-based operational workflows.
* Manage the complete lifecycle of an event from enquiry to completion.
* Reduce duplicate data entry through a single source of truth.
* Track budgets, expenses, client payments, vendor payments, and profitability automatically.
* Provide actionable business insights through dashboards and reports.
* Deliver a consistent, intuitive, and mobile-friendly user experience across all modules.

---

# Conclusion

Third Element Production CRM is intended to be a modern, production-grade business operations platform rather than a traditional customer relationship management system. By making **Event Master** the central source of operational data and generating all financial reports, ledgers, dashboards, and analytics automatically from that data, the application minimizes manual effort, improves accuracy, and provides management with real-time visibility into business performance.

Every screen should prioritize simplicity, speed, and usability. Users should be able to perform common tasks with minimal clicks, while the system handles calculations, reporting, and data consistency behind the scenes. The architecture should remain modular and scalable, enabling future additions such as inventory management, AI-powered insights, customer portals, and advanced financial reporting without requiring significant redesign.

---

# End of Technical PRD v1.0

