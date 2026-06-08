# undefined Responsive Layouts

## Layouts

- dashboard shell
- lesson/practice workspace
- review flow
- reward screen
- settings

## Grids

```json
{
  "desktop": "12-column content grid with stable sidebar",
  "tablet": "8-column adaptive grid",
  "mobile": "single-column flow with sticky primary action"
}
```

## Responsiveness

- container constraints
- stable HUD dimensions
- no overlapping text
- touch-friendly controls

## Responsive UI

```json
{
  "responsiveUiId": "responsive_ui_crm-platform",
  "desktop": [
    "persistent nav",
    "wide dashboard",
    "side feedback panel"
  ],
  "tablet": [
    "collapsible nav",
    "two-column practice",
    "bottom feedback"
  ],
  "mobile": [
    "single-column",
    "bottom action bar",
    "compact HUD",
    "large tap targets"
  ],
  "breakpoints": {
    "mobile": 360,
    "tablet": 768,
    "desktop": 1024,
    "wide": 1280
  },
  "rules": [
    "no text overlap",
    "fixed-format controls have stable dimensions",
    "cards do not nest"
  ],
  "readonly": true,
  "safetyMode": "readonly-safe-responsive-ui-engine"
}
```

## Visual Flow

- goal
- task
- feedback
- progress
- next action

## Cognitive Organization

- one primary action
- visible state
- grouped feedback
- progress always scannable
