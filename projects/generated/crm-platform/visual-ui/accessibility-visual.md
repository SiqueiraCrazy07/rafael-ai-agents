# undefined Visual Accessibility

## Contrast

- AA target
- status not color-only
- visible disabled states

## Reading

- short labels
- high line height
- clear hierarchy
- plain language

## Focus

- 2px visible focus
- keyboard order mirrors visual order
- skip repetitive nav

## Child Accessibility

- large hit areas
- reduced distraction
- gentle feedback

## Cognitive Accessibility

- one action at a time
- consistent placement
- predictable feedback

## Color Psychology

```json
{
  "colorPsychologyId": "color_psychology_crm-platform",
  "retention": "use stable cool neutrals for reading and review",
  "motivation": "use bright accent sparingly for missions and next actions",
  "focus": "use muted backgrounds and strong content contrast",
  "calm": "avoid aggressive full-screen red/orange states",
  "reward": "use warm highlight only for earned moments",
  "paletteGuidance": [
    "avoid one-note palettes",
    "limit purple dominance",
    "keep semantic colors consistent"
  ],
  "readonly": true,
  "safetyMode": "readonly-safe-color-psychology-engine"
}
```

## Visual Feedback

```json
{
  "visualFeedbackUiId": "visual_feedback_ui_crm-platform",
  "successStates": [
    "green check with text",
    "progress increment",
    "next action visible"
  ],
  "errorStates": [
    "soft correction panel",
    "hint button",
    "retry path",
    "no punitive copy"
  ],
  "neutralStates": [
    "loading skeleton",
    "empty state",
    "paused review"
  ],
  "encouragementStates": [
    "comeback card",
    "streak saved",
    "small win highlight"
  ],
  "readonly": true,
  "safetyMode": "readonly-safe-visual-feedback-ui-engine"
}
```
