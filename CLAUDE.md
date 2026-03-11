# Current Task: UI/UX Brand Alignment & Color Theming

I want to update the visual design of my application to perfectly align with my new brand logo. I am attaching my logo image to this prompt. Please analyze it and "catch the vibe."

### 1. Pre-Flight Safety (CRITICAL)
Before changing a single line of code, please use the git CLI to commit the current state of the app so I can easily revert if I don't like the new design.
- Run: `git add .`
- Run: `git commit -m "Save point: Pre-logo UI redesign"`

### 2. Analyze the Logo & Extract Palette
- Look at the attached logo image. 
- Extract the primary colors: specifically the exact hex codes for the dark green text/outlines, the bright green leaf, and the gold/yellow of the coins.
- Identify the "vibe": It is organic, fresh, friendly, and wealth-building.

### 3. Update the App's Theming (`src/index.css` or Tailwind/Inline styles)
- Inject this new color palette into the app. 
- **Primary Buttons / Accents:** Replace the current default primary colors with the logo's Green or Gold.
- **Backgrounds / Cards:** Keep the premium Toss-style soft shadows and large border-radiuses, but ensure the background colors complement the new green/gold palette. 
- **Dark Mode Compatibility:** Ensure that the new colors still look good if the user switches to Dark Mode. If necessary, slightly desaturate the green/gold for the dark theme.

### 4. Implementation Rules
- Do NOT change the layout, flexbox structures, or the underlying Firebase logic. This is strictly a CSS/Color/Theming overhaul.
- Do NOT remove any features (like Confetti or Auth).
- When you are done, explain exactly what colors you changed and how they map to the logo.
- Provide me with the exact `git` command to revert the changes if I decide I want the old design back.