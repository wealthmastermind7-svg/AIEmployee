# AI Employee - Design Guidelines

## Design Philosophy
Create a **premium, cinematic experience** with handcrafted animations, oversized typography, and liquid glass aesthetics. Every interaction should feel polished with smooth transitions and subtle parallax effects that convey sophistication and cutting-edge AI technology.

## Visual Design System

### Color Palette
- **Primary**: #135bec (vibrant blue)
- **Background Dark**: #101622 (deep navy)
- **Glass Panel**: rgba(23, 29, 41, 0.6) with 24px blur
- **Glass Nav**: rgba(16, 22, 34, 0.8) with 20px blur
- **Orb Colors**: #135bec, #2a3b55, #1a2333
- **Status Colors**:
  - Success/Positive: #34d399 (emerald-400)
  - Alert: #f59e0b
  - Error: #ef4444
  - Neutral: rgba(255, 255, 255, 0.6)

### Typography
- **Font Family**: Inter (weights: 300, 400, 500, 600, 700, 800, 900)
- **Large Display**: 48-64px, font-weight: 900, tracking: -0.02em
- **Revenue/Stats**: 40-48px, font-weight: 900, tracking: -0.03em
- **Section Headers**: 16-18px, font-weight: 600
- **Body Text**: 14px, font-weight: 400-500
- **Labels/Captions**: 10-12px, font-weight: 500, uppercase, tracking: 0.1em, opacity: 0.6

### Glass Morphism Effects
- **Frosted Glass Cards**:
  - Background: rgba(23, 29, 41, 0.6)
  - Backdrop filter: blur(24px)
  - Border: 1px solid rgba(255, 255, 255, 0.08)
  - Shadow: 0 8px 32px rgba(0, 0, 0, 0.3)
- **Navigation Glass**:
  - Background: rgba(16, 22, 34, 0.8)
  - Backdrop filter: blur(20px)
  - Border: 1px solid rgba(255, 255, 255, 0.1)

### Animated Background
- **Looping Gradient Orbs**: 3 large circular gradients with blur(80px) and 0.6 opacity
  - Orb 1: #135bec, 50vw size, top-left, 12s animation
  - Orb 2: #2a3b55, 60vw size, right, 15s animation
  - Orb 3: #1a2333, 40vw size, bottom-left, 10s animation
- **Animation**: Blob keyframes with translate + scale (subtle parallax)
- **Noise Overlay**: 3% opacity texture for depth

### Circular Meters & Progress
- **Meter Circles**: Use conic-gradient for percentage display
  - Active segment: #135bec with 0-10px glow effect
  - Inactive: rgba(255, 255, 255, 0.1)
  - Border: 4px stroke, outer ring rgba(255, 255, 255, 0.05)
- **Progress Bars**:
  - Background: rgba(255, 255, 255, 0.1), height: 4-6px, rounded-full
  - Fill: Gradient (primary to lighter shade) with 0-10px glow
  - 90%+ fill: Use emerald-400 with glow

### Icons
- **System**: Material Symbols Outlined (weights 100-700)
- **Sizes**: 16px (small), 20-24px (standard), 28-32px (large)
- **Color**: White with 0.6-0.8 opacity, primary color for active states

## Layout & Spacing

### Screen Structure
- **Top Bar**: 60px height, sticky, glass effect
- **Content Padding**: 24px horizontal
- **Card Radius**: 16-24px (larger for hero cards)
- **Grid Gap**: 16px
- **Bottom Tab Bar**: 80px + safe area, frosted glass

### Component Spacing
- **xl**: 32px (major sections)
- **lg**: 24px (cards)
- **md**: 16px (grid gaps)
- **sm**: 12px (internal padding)
- **xs**: 8px (tight groups)

## Animations & Transitions

### Timing
- **Default**: 300-400ms cubic-bezier(0.4, 0, 0.6, 1)
- **Blob Animation**: 10-15s infinite alternate
- **Pulse**: 3s cubic-bezier(0.4, 0, 0.6, 1) infinite
- **Hover/Press**: 200ms ease-out

### Effects
- **Parallax**: Subtle Y-axis movement on scroll (0.3-0.5 factor)
- **Glow on Interaction**: Drop shadow with primary color, 0-10px blur
- **Scale on Press**: 0.97-0.98 scale with spring physics
- **Floating Action**: Gentle Y-axis bounce (2-4px) on idle
- **Shimmer Loading**: Gradient sweep 1.5s infinite

## Component Patterns

### Cards
- Glass panel with hover state (bg-white/10 on hover)
- Subtle glow on active/selected states
- Overflow hidden with gradient overlays

### Status Indicators
- **Active Dot**: 8px circle, primary color, pulsing animation
- **Badges**: Rounded-full, border 1px, bg with 0.1 opacity, glow effect

### Charts & Visualizations
- **Line Charts**: 3px stroke, primary color with 0-10px glow, gradient fill beneath
- **SVG Animations**: Stagger appearance with 100-200ms delays
- **Interactive Points**: Pulsing dot at current value

### Buttons
- **Primary**: Glass panel + primary glow on press, white text
- **Secondary**: Glass panel, white/60 text
- **Icon-Only**: 40px circle, glass effect
- **Floating Action**: 56px circle, primary bg, 0 8px 16px shadow

## Navigation

### Tab Bar
- Fixed bottom with 80px height + safe area
- Frosted glass background
- Icons: 24px with label 10px below
- Active: Primary color with 2px top border
- Inactive: White 0.5 opacity

### Header Patterns
- **Transparent**: Default, blend with background orbs
- **Title**: Large 28-32px, semi-bold
- **Actions**: Right-aligned icons in glass circles

## Accessibility
- **Contrast**: Minimum 4.5:1 for text on glass
- **Touch Targets**: Minimum 44px
- **Haptic Feedback**: Light on tap, medium on success, heavy on error
- **Reduced Motion**: Disable blob animations, use fade transitions only