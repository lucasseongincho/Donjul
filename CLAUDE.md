# Current Task: Build the "Garden" Tab & Goal Harvesting Logic

We are building a gamified "Trophy Room" for completed goals to increase user retention. When a goal hits 100%, users can "Harvest" it, which moves the goal to a new "Garden" tab and rewards them with a fruit badge.

### 1. Update Firebase Data Structure
- Ensure the user document in Firestore can accept a new array called `harvested_goals` (default to `[]` for new or existing users if undefined).

### 2. Create the Custom SVG Component (`src/components/MoneyTreeSVG.jsx`)
- Create a new component that purely renders a minimalist, geometric SVG of a tree.
- **Design:** Keep it extremely clean and modern (Toss-style vector art). Use a simple trunk and overlapping circular leaves.
- **Colors:** Use the brand's Forest Green for the leaves and Coin Gold (or a soft brown/gold) for the trunk.
- Make it responsive (e.g., `width="100%"` `max-width="200px"`).

### 3. Create the Garden Tab (`src/components/Garden.jsx`)
- Build a new main tab component.
- **Top Section:** Render the `<MoneyTreeSVG />` centered. Below it, display a massive, premium stat card showing the sum of all `harvested_goals` targets. 
  - Text: "Lifetime Wealth Grown" / "총 수확한 금액".
- **Bottom Section:** Map through `harvested_goals` and render them in a clean grid.
  - Each item should display a random fruit emoji (🍎, 🍊, 🍑, 🍇) as its "badge", the goal name, and the total amount saved.
- Ensure the new tab is added to the main App navigation/routing.

### 4. Update Goal Logic & The "Harvest" Button (`src/components/Goals.jsx`)
- In the Goal card, check if `saved >= target`.
- **If true:** Hide the standard "Edit" button and replace it with a glowing, Coin Gold button that says "Harvest" (수확하기) with a 🧺 icon.
- **The `handleHarvest` function:** 1. Trigger the existing Confetti effect.
  2. Assign a random fruit emoji to the goal object.
  3. Move the goal object out of the active `goals` array and push it into the `harvested_goals` array in Firebase.
  4. Show a success toast/banner: "Goal harvested! Check your Garden." / "수확 완료! 정원을 확인해보세요."

### 5. STRICT PRESERVATION
- Wire all new text into the `t()` translation engine for English and Korean.
- Maintain the premium Toss-style CSS (rounded corners, soft shadows, no harsh borders).
- Do NOT break the existing Firebase read/write logic for active accounts and goals.