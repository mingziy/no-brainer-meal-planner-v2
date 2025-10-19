# AI Recipe Extraction Guide

## 🤖 What is Simulated AI Extraction?

This feature demonstrates how AI recipe extraction would work in a production app. Instead of using expensive AI APIs, it uses a smart text parser to extract recipe information from pasted text.

---

## 🚀 How to Use It

### Step 1: Navigate to Recipes
1. Open your app at `http://localhost:3000/`
2. Click the **"Recipes"** tab (chef hat icon) in the bottom navigation

### Step 2: Start Adding a Recipe
1. Click the **"Add"** button (top-right corner)
2. The "Add a New Recipe" modal will appear

### Step 3: Choose AI Extraction
1. Click **"Paste Recipe Text"** button
2. A text area will appear

### Step 4: Paste Recipe Text
You have two options:

**Option A: Use Sample Recipes**
- Open the file `SAMPLE_RECIPE.txt` in your project folder
- Copy any of the 5 sample recipes
- Paste into the text area

**Option B: Paste Your Own Recipe**
- Find any recipe online or from a cookbook
- Copy the text (name, ingredients, instructions)
- Paste into the text area

### Step 5: Process with AI
1. Click **"Process with AI"** button
2. You'll see a loading spinner and "Processing with AI..." message
3. Wait 1.5 seconds (simulating API call)
4. The edit form will open with extracted data! ✨

### Step 6: Review and Save
1. The form will be pre-filled with:
   - Recipe name
   - Ingredients (parsed into separate fields)
   - Instructions (step by step)
   - Cuisine type (detected automatically)
   - Categories (detected from keywords)
   - Estimated prep/cook times
   - Nutrition estimates
2. Review the extracted data
3. Make any adjustments needed
4. Click **"Save Recipe"**
5. Your recipe appears in the grid!

---

## 📋 Supported Recipe Formats

The parser can handle various text formats:

### Format 1: Simple List
```
Recipe Name
Prep: 10 minutes
Cook: 20 minutes

Ingredients:
- 1 cup flour
- 2 eggs
- 1/4 cup milk

Instructions:
1. Mix ingredients
2. Cook in pan
3. Serve hot
```

### Format 2: Without Headers
```
Garlic Chicken
Italian cuisine

2 lbs chicken
4 cloves garlic
1/4 cup soy sauce

Cut chicken into pieces
Cook in pan with garlic
Add soy sauce and simmer
```

### Format 3: Detailed Format
```
Title: Spaghetti Carbonara
Cuisine: Italian
Prep Time: 15 min
Cook Time: 20 min

Ingredients
1 lb pasta
4 eggs
1 cup parmesan
8 oz bacon

Directions
Cook pasta until al dente
Fry bacon until crispy
Mix eggs with parmesan
Toss hot pasta with egg mixture
```

---

## 🧠 What the Parser Detects

### Automatically Extracted:
- ✅ **Recipe Name** - First line or after "Title:"
- ✅ **Ingredients** - Lines between "Ingredients:" and next section
- ✅ **Instructions** - Lines after "Instructions:" or "Directions:"
- ✅ **Prep/Cook Times** - Looks for "Prep: 10 min" patterns
- ✅ **Cuisine** - Detects keywords (Italian, Korean, Chinese, etc.)
- ✅ **Categories** - Finds "breakfast", "kid-friendly", "batch-cook", etc.
- ✅ **Nutrition Estimates** - Basic estimates based on ingredients

### Smart Parsing:
- Handles bullet points (-, •, *)
- Handles numbered lists (1., 2., 3.)
- Separates amount, unit, and ingredient name
- Ignores empty lines
- Cleans up formatting

---

## 🎯 Tips for Best Results

1. **Include Section Headers**
   - Use "Ingredients:" or "Ingredients"
   - Use "Instructions:", "Directions:", or "Steps:"

2. **Format Times Clearly**
   - Write "Prep: 15 minutes" or "Prep Time: 15 min"
   - Write "Cook: 30 minutes" or "Cook Time: 30 min"

3. **Use Bullet Points or Numbers**
   - Ingredients: `- 2 cups flour` or `• 2 cups flour`
   - Instructions: `1. Mix ingredients` or `- Mix ingredients`

4. **Include Keywords for Detection**
   - Mention cuisine: "Italian", "Korean", "Mexican"
   - Mention meal type: "breakfast", "lunch", "dinner"
   - Mention if "kid-friendly" or "batch-cook"

---

## 🔧 How It Works (Technical Details)

The parser (`src/utils/recipeParser.ts`) works in these steps:

1. **Split Text into Lines** - Breaks text by newlines
2. **Find Recipe Name** - Looks for patterns like "Title:", "Recipe:", or uses first line
3. **Extract Ingredients**
   - Finds lines between "Ingredients:" and next section
   - Parses each line into amount, unit, and name
   - Example: "2 cups flour" → amount: "2", unit: "cups", name: "flour"
4. **Extract Instructions**
   - Finds lines after "Instructions:" or "Directions:"
   - Removes numbering and bullet points
   - Each line becomes a step
5. **Detect Times**
   - Regex pattern matches "prep: 10 min" or "cook: 20 minutes"
6. **Detect Cuisine & Categories**
   - Searches for keywords in text (case-insensitive)
   - "pasta" or "italian" → Italian cuisine
   - "kid" or "child" → Kid-Friendly category
7. **Estimate Nutrition**
   - Checks ingredients for protein sources (chicken, beef, eggs)
   - Checks for vegetables (broccoli, spinach, carrots)
   - Checks for carbs (rice, pasta, bread)
   - Provides rough estimates

---

## 🚀 Upgrading to Real AI

To use real AI extraction (like OpenAI GPT-4 Vision):

### What You Need:
1. **API Key** from OpenAI (~$0.01-0.03 per request)
2. **Backend Server** (Node.js/Express)
3. **Environment Variables** for API keys

### Cost Estimate:
- **OpenAI GPT-4**: ~$0.01-0.03 per recipe
- **Claude API**: ~$0.005-0.02 per recipe
- **100 recipes/month**: ~$1-3/month

### Implementation Steps:
1. Create backend API endpoint
2. Install OpenAI SDK: `npm install openai`
3. Send recipe text/image to OpenAI API
4. Parse JSON response
5. Return structured recipe data

### Example Code (Backend):
```javascript
// server.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/extract-recipe', async (req, res) => {
  const { text } = req.body;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Extract recipe data from this text and return JSON: ${text}`
    }]
  });
  
  const recipeData = JSON.parse(response.choices[0].message.content);
  res.json(recipeData);
});
```

---

## 📝 Current Limitations

This simulated version:
- ✅ Works completely offline
- ✅ No API costs
- ✅ Fast (1.5 second delay is artificial)
- ❌ Less flexible with text formats than real AI
- ❌ Nutrition estimates are rough
- ❌ Can't process images (only text)
- ❌ Requires structured text format

Real AI would handle:
- Any text format (even messy)
- Images of recipes
- Handwritten notes (with OCR)
- Multiple languages
- More accurate nutrition
- Portion size detection

---

## 🎓 Learning More

- **Recipe Parsing**: Check `src/utils/recipeParser.ts` for implementation
- **Modal Logic**: Check `src/components/recipe/AddRecipeModal.tsx`
- **Form Integration**: Check `src/components/recipe/RecipeEditForm.tsx`

---

Happy cooking! 🍳👨‍🍳

