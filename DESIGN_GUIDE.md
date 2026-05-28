# 🎨 UI Design Guide & Component Showcase

## Color System

### Primary Colors
```
Blue-600     #2563EB    - Primary actions, links, focused states
Blue-700     #1D4ED8    - Hover state, active links
Blue-50      #EFF6FF    - Lightweight backgrounds
```

### Semantic Colors
```
Success: Green-600    #16A34A    - Approved, positive actions
Danger:  Red-600      #DC2626    - Delete, negative actions
Warning: Amber-600    #D97706    - Warnings, attention needed
Info:    Cyan-600     #0891B2    - Informational messages
```

### Neutral Colors
```
Gray-50      #F9FAFB    - Backgrounds
Gray-100     #F3F4F6    - Borders, dividers
Gray-500     #6B7280    - Secondary text
Gray-700     #374151    - Primary text
Gray-900     #111827    - Dark text, headings
```

---

## Typography Scale

### Heading Sizes
```
H1: 2rem (32px)    Bold font-weight: 600
H2: 1.5rem (24px)  Bold font-weight: 600
H3: 1.25rem (20px) Bold font-weight: 600
H4: 1rem (16px)    Bold font-weight: 600
```

### Text Sizes
```
Large:  1.125rem (18px)  - Primary headings
Base:   1rem (16px)      - Body text
Small:  0.875rem (14px)  - Secondary text
XSmall: 0.75rem (12px)   - Labels, captions
```

---

## Component Variants

### Button Variants

#### Primary Button
```
Background: Blue-600
Text: White
Hover: Blue-700
Active: Blue-800
```

#### Secondary Button
```
Background: Gray-200
Text: Gray-800
Hover: Gray-300
```

#### Danger Button
```
Background: Red-600
Text: White
Hover: Red-700
```

#### Outline Button
```
Border: Blue-600 (2px)
Text: Blue-600
Background: Transparent
Hover: Blue-50
```

### Button Sizes
```
SM (Small):   px-3 py-1.5  text-sm
MD (Medium):  px-4 py-2    text-base
LG (Large):   px-6 py-3    text-lg
```

---

## Card Styles

### Shadow Levels
```
None:    No shadow
SM:      0 1px 2px
MD:      0 4px 6px
LG:      0 10px 15px
```

### Padding Options
```
SM: 1rem (16px)
MD: 1.5rem (24px)
LG: 2rem (32px)
```

---

## Badge & Status Indicators

### Status Colors
```
Pending:  Amber-100 bg, Amber-700 text
Approved: Green-100 bg, Green-700 text
Rejected: Red-100 bg, Red-700 text
Active:   Green-100 bg, Green-700 text
Inactive: Gray-100 bg, Gray-700 text
```

### Badge Sizes
```
SM: px-2 py-1 text-xs
MD: px-3 py-1 text-sm
LG: px-4 py-2 text-base
```

---

## Layout Grid System

### Responsive Breakpoints
```
Mobile:   < 640px       - 1 column
Tablet:   640px-1024px  - 2 columns
Desktop:  > 1024px      - 3-4 columns
```

### Common Grids
```
Grid 2: grid-cols-1 md:grid-cols-2
Grid 3: grid-cols-1 md:grid-cols-3
Grid 4: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
```

### Spacing
```
Gap SM:  0.75rem (12px)
Gap MD:  1rem (16px)
Gap LG:  1.5rem (24px)
Gap XL:  2rem (32px)
```

---

## Form Components

### Input States
```
Default:  Border-gray-300, Focus: Ring-blue-500
Error:    Border-red-500, Ring-red-500
Disabled: bg-gray-100, cursor-not-allowed
```

### Form Validation
```
Required fields: Label shows *
Error state:     Red border + error message
Helper text:     Gray secondary text below input
Success state:   Green border/checkmark (optional)
```

---

## Table Design

### Header Row
```
Background: Gray-50
Text: Gray-700
Font-weight: 600
Padding: 0.75rem 1.5rem
Border-bottom: Gray-200
```

### Data Rows
```
Padding: 0.75rem 1.5rem
Border-bottom: Gray-200
Striped: Alternating Gray-50 and White
Hover: Blue-50 background
```

### Actions Column
```
Display: Flex gap-2
Buttons: Small, grouped
Hover: Show/highlight actions
```

---

## Modal Design

### Sizes
```
Small:  max-w-sm  (24rem / 384px)
Medium: max-w-md  (28rem / 448px)
Large:  max-w-lg  (32rem / 512px)
XLarge: max-w-2xl (42rem / 672px)
```

### Structure
```
Header:  p-6, border-bottom, close button
Content: p-6, max-height 384px, overflow-y-auto
Footer:  p-6, border-top, button group
```

---

## Sidebar Navigation

### Menu Item States
```
Default:  Text-gray-300, hover: bg-gray-700
Active:   bg-blue-600, text-white, rounded
Group:    Collapsible with arrow icon
```

### Sidebar Appearance
```
Width: 16rem (256px)
Background: Gradient gray-900 to gray-800
Text: Light gray (#f3f4f6)
Sticky: Position fixed/sticky
Scrollable: overflow-y-auto
```

---

## Alert Styles

### Success Alert
```
Background: Green-50
Border-left: Green-500 (4px)
Text: Green-800
Icon: ✓
```

### Error Alert
```
Background: Red-50
Border-left: Red-500 (4px)
Text: Red-800
Icon: ✗
```

### Warning Alert
```
Background: Amber-50
Border-left: Amber-500 (4px)
Text: Amber-800
Icon: ⚠
```

### Info Alert
```
Background: Blue-50
Border-left: Blue-500 (4px)
Text: Blue-800
Icon: ℹ
```

---

## Dashboard Stats Card

### Layout
```
Flex layout with icon on right
Title: Small, gray-600
Value: Large (text-3xl), color-coded
Description: Small gray-500, optional
Icon: Large (text-5xl), right-aligned
```

### Color Coding
```
Blue:   Primary metrics
Green:  Success, approvals
Orange: Classes, education
Purple: Teachers, staff
Red:    Overdue, issues
Cyan:   Pending, review
```

---

## Animations & Transitions

### Standard Transitions
```
Duration: 200ms
Timing: ease-out
Properties: background, color, shadow
```

### Hover Effects
```
Buttons:     Scale-up, shadow increase
Cards:       Shadow increase, slight lift
Links:       Underline appear, color change
Tables:      Row highlight (bg-blue-50)
```

### Loading State
```
Spinner: Rotating border animation
Duration: 0.6s rotation
Color: Blue-600
```

### Slide-in Animation
```
Duration: 300ms
From: translateY(10px), opacity 0
To: translateY(0), opacity 1
```

---

## Accessibility Highlights

### Focus States
```
Outline: Blue-500 (2px)
Visible on all interactive elements
Can be navigated with Tab key
```

### Semantic HTML
```
<button> for clickable elements
<input> for form inputs
<label> for form labels
<nav> for navigation
<main> for main content
<article> for cards
```

### Contrast Ratios
```
Text: 4.5:1 (WCAG AA)
Large text: 3:1 (WCAG AA)
UI components: 3:1 (WCAG AA)
```

---

## Responsive Design Examples

### Mobile Layout (< 768px)
```
- Single column
- Full-width cards
- Stacked forms
- Bottom navigation
- Larger touch targets (44px)
```

### Tablet Layout (768px-1024px)
```
- Two columns
- Sidebar visible
- Side-by-side forms
- Optimized spacing
- Medium touch targets (40px)
```

### Desktop Layout (> 1024px)
```
- Multi-column grids
- Full sidebar
- Inline forms
- Comfortable spacing
- Standard touch targets (32px)
```

---

## Common UI Patterns

### Loading Pattern
```
[Spinner] Loading... (center of screen)
Or skeleton screens for data loading
```

### Empty State
```
[Icon] No data available
[Text] Description
[Button] Action (optional)
```

### Confirmation Dialog
```
[Icon] Question/Warning
[Title] Confirm action
[Description] What will happen
[Buttons] Cancel | Confirm
```

### Error Handling
```
[Alert] Error message
[Details] What went wrong
[Button] Retry or Dismiss
```

### Success Confirmation
```
[Alert] Green success message
[Icon] Checkmark
[Auto-dismiss] After 3 seconds
```

---

## Spacing Guidelines

### Vertical Spacing
```
Between sections: 2rem (32px)
Between subsections: 1.5rem (24px)
Between elements: 1rem (16px)
```

### Horizontal Spacing
```
Page padding: 1.5rem (24px) mobile, 2rem (32px) desktop
Element padding: 1rem (16px) average
Gutter between columns: 1.5rem (24px)
```

---

## Icon System

### Icon Sizes
```
Small (SM):   1rem (16px)
Medium (MD):  1.5rem (24px)
Large (LG):   2rem (32px)
XLarge (XL):  2.5rem (40px)
```

### Icon Colors
```
Primary:   Blue-600
Secondary: Gray-500
Success:   Green-600
Danger:    Red-600
Warning:   Amber-600
```

---

## Browser Compatibility

### Supported Browsers
```
Chrome/Edge:  Latest version
Firefox:      Latest version
Safari:       Latest version
Mobile:       Safari 12+, Chrome Mobile
```

---

## Performance Guidelines

### Load Times
```
First Contentful Paint: < 1.5s
Largest Contentful Paint: < 2.5s
Cumulative Layout Shift: < 0.1
```

### Optimization
```
Images: Use Next.js Image component
CSS: Purged unused styles
JS: Lazy loaded components
Fonts: System fonts (no web fonts)
```

---

## Customization Points

### Colors
Edit `app/globals.css` for color variables

### Typography
Edit font-family in body styles

### Spacing
Modify Tailwind spacing scale in theme

### Animations
Adjust timing in Tailwind config

### Breakpoints
Customize responsive breakpoints

---

**Design System Version**: 1.0  
**Last Updated**: December 2025  
**Status**: ✅ Ready for Use
