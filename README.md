# NeetCode Visualizer

A step-through visualizer for classic NeetCode/LeetCode problems. Pick a problem, read a plain-English explanation of the pattern, then watch the actual Python solution run line by line with the data structures animated on screen. It's built for people who are still learning Python and algorithms, not just people brushing up before an interview.


## Features

- **Step through visualizer.** Each problem's solution runs as a real trace: you move forward and backward one line at a time, and the app shows you exactly which line is executing and what the variables look like at that moment.
- **Pyodide running in the browser.** The Python interpreter (Pyodide, which is CPython compiled to WebAssembly) loads in a web worker and actually executes the solution code. Nothing is faked or pre-recorded; the trace comes from running the real code.
- **No backend.** There is no server. The Python runs on your machine inside the browser tab, so the whole app can be hosted as static files and still run full Python.
- **Animated renderers.** Arrays, hash maps, stacks, bars (for problems like histograms), and linked lists each have their own small animated view, so you can see values move, get pushed/popped, or get compared, instead of just reading numbers in a table.
- **Line-by-line teaching notes.** Every line of code comes with an explanation written for beginners: what the syntax means, why it's written that way, what would break if you removed it, and common mistakes.
- **Pattern explanations.** Every problem includes a plain description of the underlying pattern (two pointers, sliding window, etc.), when to recognize it, and when it does *not* apply.

## Run it locally

You need Node.js installed.

```bash
npm install
npm run dev
```

Then open the local URL that Vite prints in your terminal (usually `http://localhost:5173`).

`npm install` also downloads and copies the Pyodide runtime into the project, which is what lets the app run Python in the browser.

Other useful commands:

```bash
npm run build      # type-check and build for production
npm run validate   # check that problem JSON files are complete and consistent
```

## How to add a problem

1. Look at an existing file in `src/problems/` (for example `src/problems/two-sum.json`) and copy its shape. Each problem is one JSON file with the problem statement, examples, the pattern explanation, the Python code, a line-by-line breakdown of that code, and a glossary of any technical terms it uses.
2. Save your new file in `src/problems/` named after the problem's slug, like `my-new-problem.json`.
3. Add an entry for it in `src/problems/index.json` with its slug, title, difficulty, and category.
4. Run the validator to catch mistakes before you open the app:

```bash
npm run validate
```

This checks that every section is filled in, that every line of code has a matching explanation, and that every technical term you use is defined somewhere in the glossary.

5. Run `npm run dev` and open the problem in the sidebar to make sure it runs and the visualization looks right.

## Solved problems

### Arrays & Hashing
- Two Sum
- Valid Anagram

### Two Pointers
- Valid Palindrome
- Two Sum II
- 3Sum
- Container With Most Water
- Trapping Rain Water

### Stack
- Valid Parentheses
- Min Stack
- Evaluate Reverse Polish Notation
- Generate Parentheses
- Daily Temperatures
- Car Fleet
- Largest Rectangle in Histogram

### Binary Search
- Binary Search

### Linked List
- Reverse Linked List
