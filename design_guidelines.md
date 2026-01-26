# WorkMate AI Agent - Design Guidelines

## Brand Identity
WorkMate is a **premium AI assistant** that exudes sophistication through **cinematic liquid glass aesthetics**. The memorable element is the **animated gradient orbs** that create a living, breathing background—conveying AI intelligence in constant motion. The personality is polished, confident, and cutting-edge.

## Navigation Architecture

**Root Navigation**: Stack-Only (Onboarding) → Tab Navigation (Main App)

**Flow**:
1. Onboarding Stack (first launch only):
   - Welcome Screen → Pain Points Screen → Solution Showcase → Get Started
2. Main App (tab navigation after onboarding):
   - Home, Agents, Analytics, Profile

Each onboarding screen is a full-screen modal with swipe-to-advance gestures.

## Screen-by-Screen Specifications

### 1. Welcome Screen
**Purpose**: First impression, set premium tone

**Layout**:
- Header: None (full-screen canvas)
- Main content (scrollable: NO):
  - Top 40%: Animated gradient orbs background with app icon (120px) centered
  - Middle: "WorkMate" wordmark (64px, weight 900) + tagline "Your AI-Powered Productivity Partner" (18px, weight 500, opacity 0.7)
  - Bottom 30%: Large "Continue" button (glass panel with primary glow) + "Skip" text link below
- Safe area insets: top = insets.top + 60px, bottom = insets.bottom + 40px

**Components**: Animated orb background, centered content stack, primary button, text link

### 2. Pain Points Screen
**Purpose**: Empathize with user struggles (3 rotating cards)

**Layout**:
- Header: Progress dots (1/3, 2/3, 3/3) centered at top, "Skip" button top-right
- Main content (scrollable: NO):
  - Large icon (48px) in glass circle (80px diameter)
  - Problem headline (32px, weight 800) with gradient text effect
  - Description (16px, weight 400, opacity 0.8, max-width 300px)
  - Rotating pain points:
    1. "Drowning in Messages" - overwhelmed icon
    2. "Slow to Respond" - clock/timer icon
    3. "Never Off Duty" - moon/night icon
- Bottom: Swipe indicator dots + "Next" button
- Safe area insets: top = insets.top + 24px, bottom = insets.bottom + 40px

**Components**: Glass circle icon container, gradient text, pagination dots, swipe gesture handler

### 3. Solution Showcase Screen
**Purpose**: Demonstrate WorkMate's core benefits

**Layout**:
- Header: Transparent, back button (top-left)
- Main content (scrollable: YES):
  - Hero: "Meet Your AI Assistant" (48px, weight 900)
  - 3 feature cards (glass panels, 24px radius):
    1. "Unified Inbox" - merge icon, "All channels in one place"
    2. "Instant Responses" - lightning icon, "AI-powered 24/7 replies"
    3. "Smart Prioritization" - star icon, "Focus on what matters"
  - Each card: icon (28px), title (20px, weight 700), description (14px)
- Bottom floating button: "Get Started" (primary, 56px circle width full minus 48px padding)
- Safe area insets: top = insets.top + 120px, bottom = 80px + 40px (for floating button)

**Components**: Scrollable list, glass feature cards, floating action button with glow

### 4. Get Started Screen
**Purpose**: Quick setup (name + notification permission)

**Layout**:
- Header: "Almost There" (28px, weight 700), back button (top-left)
- Main content (scrollable form: YES):
  - "What should we call you?" label (16px, weight 600)
  - Text input (glass panel, 52px height, white text)
  - "Enable Notifications" section with toggle switch (glass container)
  - Helper text (12px, opacity 0.6)
- Bottom: "Continue" button (glass panel, full width minus 48px padding)
- Safe area insets: top = insets.top + 80px, bottom = insets.bottom + 40px

**Components**: Form with text input, toggle switch, submit button in footer area

## Design System

### Color Palette
- **Primary**: #135bec (vibrant blue, used for CTAs, active states, glows)
- **Background**: #101622 (deep navy)
- **Surface Glass**: rgba(23, 29, 41, 0.6) + blur(24px)
- **Border**: rgba(255, 255, 255, 0.08)
- **Text Primary**: #ffffff
- **Text Secondary**: rgba(255, 255, 255, 0.7)
- **Text Muted**: rgba(255, 255, 255, 0.5)
- **Success**: #34d399
- **Orb Gradients**: #135bec, #2a3b55, #1a2333

### Typography
- **Font**: Inter (system fallback: -apple-system, SF Pro)
- **Type Scale**:
  - Display: 48-64px, weight 900, tracking -0.02em
  - Hero: 32-40px, weight 800, tracking -0.01em
  - Headline: 20-28px, weight 700
  - Body: 14-16px, weight 400-500
  - Caption: 12px, weight 500, uppercase, tracking 0.1em, opacity 0.6

### Visual Design
- **Touchable Feedback**: Scale to 0.98 + subtle glow (primary color, shadowRadius: 10, shadowOpacity: 0.4) on press
- **Glass Panels**: Use Surface Glass color + blur, 1px border (Border color), 24px radius for large cards, 16px for small
- **Floating Buttons**: 
  - shadowOffset: {width: 0, height: 4}
  - shadowOpacity: 0.3
  - shadowRadius: 12
  - shadowColor: #000000
- **Icons**: Use Feather icons from @expo/vector-icons, 24px standard size, white with 0.6-0.8 opacity
- **Animated Orbs**: 3 circular gradients (blur 80px, opacity 0.6, sizes 50vw/60vw/40vw) with slow infinite alternating animation (12-15s duration). Position: top-left, right, bottom-left

### Component Patterns
- **Primary Button**: Glass panel background, white text (weight 600), primary glow on press, 52px height, 24px horizontal padding
- **Text Link**: Primary color, 14px, weight 500, no underline, scale 0.95 on press
- **Progress Dots**: 8px circles, active = primary color, inactive = rgba(255, 255, 255, 0.3), 8px gap
- **Input Field**: Glass panel, 52px height, 16px padding, white text, placeholder opacity 0.4
- **Toggle Switch**: 51px width, 31px height, glass background when off, primary background when on

## Assets to Generate

1. **icon.png** - App icon with "W" lettermark on gradient blue background, rounded square
   - WHERE USED: Device home screen

2. **splash-icon.png** - Same "W" lettermark on transparent background
   - WHERE USED: Launch screen center

3. **onboarding-overwhelmed.png** - Abstract illustration of overlapping message bubbles in primary blue tones
   - WHERE USED: Pain Points Screen (card 1 background)

4. **onboarding-clock.png** - Minimalist clock/timer icon in glass style
   - WHERE USED: Pain Points Screen (card 2 icon)

5. **onboarding-moon.png** - Crescent moon with subtle glow
   - WHERE USED: Pain Points Screen (card 3 icon)

6. **feature-inbox.png** - Unified inbox icon (merged channels concept), line art style
   - WHERE USED: Solution Showcase Screen (feature card 1)

7. **feature-lightning.png** - Lightning bolt with AI sparkle, glass effect
   - WHERE USED: Solution Showcase Screen (feature card 2)

8. **feature-star.png** - Star with priority badge
   - WHERE USED: Solution Showcase Screen (feature card 3)