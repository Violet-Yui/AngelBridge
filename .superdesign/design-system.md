# AngelBridge Mobile UX Design System

## Product and platform

AngelBridge is a mobile H5 community app that helps people discover useful people, work, objects, experience and content, then start a lightweight connection. The prototype must feel like a real phone app and follow the current Tencent Ardot screen set.

## Source of truth

- Primary visual reference: current Ardot canvas screenshot supplied as a Superdesign reference node.
- Character imagery: the existing twelve zodiac character assets from the source GitHub repository.
- Do not use the discarded UX summary HTML as a design source.

## Visual language

- Quiet warm-white background with pale green section tinting.
- Primary action green around `#54B948`; deeper green for emphasis and readable text.
- Near-black `#243128` primary text, muted gray-green secondary text.
- Rounded cards with 12-18px radii, subtle hairline borders and restrained shadows.
- Dense but calm mobile information hierarchy; avoid oversized marketing typography.
- Two-column content cards for browse-heavy channels, vertical rows for jobs and ranked content.
- Rounded filter chips with green selected state.
- Bottom navigation has five destinations, with a visually dominant circular green create button.

## Typography and spacing

- Use a system sans stack suitable for Simplified Chinese: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `PingFang SC`, `Microsoft YaHei`, sans-serif.
- Base mobile text 14px; captions 11-12px; page titles 18-22px.
- Use a 4px spacing foundation with common gaps of 8, 12, 16, 20 and 24px.
- Touch targets are at least 44px.

## App structure

- Mobile status/header area.
- Top `关注 / 此刻` switch and horizontally scrollable channel tabs.
- Primary scrollable content surface.
- Sticky five-item bottom navigation: 天使桥, 消息, 创建, 灵宠, 我.
- Detail views and confirmation flows use full-height page transitions or bottom sheets.

## Key screens

- Home/channel feed: 热门, 视频, 经验, 闲置, 找工作, 找物, 找人.
- Match detail with evidence and a clear `发起连接` action.
- Messages with explicit pending connection state.
- Life tree dashboard with greeting, growth score, stats, matches and pending items.
- Zodiac pet selector using all twelve existing character assets.
- Create sheet and compact profile page.

## Motion and feedback

- Use short 160-240ms transitions for page changes, chips, sheets and toasts.
- Respect `prefers-reduced-motion`.
- Do not use decorative parallax, auto-playing media or long entrance animations.

## Accessibility

- Visible keyboard focus.
- Do not communicate state with color alone.
- Semantic buttons and labels for icon-only controls.
- Maintain readable contrast on pale green surfaces.

