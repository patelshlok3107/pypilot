export type WorkedExample = {
  title: string;
  code: string;
  explanation: string;
};

export type TextbookSection = {
  title: string;
  explanation: string;
  bullets: string[];
};

export type TextbookPack = {
  chapterTitle: string;
  whyItMatters: string;
  learningGoals: string[];
  sections: TextbookSection[];
  workedExamples: WorkedExample[];
  commonMistakes: string[];
  reviewQuestions: string[];
};

const textbookMap: Record<string, TextbookPack> = {
  "Variables and Data Types": {
    chapterTitle: "Chapter 1: Variables and Data Types",
    whyItMatters:
      "Every Python program is built on values and variables. If you can model data correctly, the rest of the program becomes simpler.",
    learningGoals: [
      "Store and update values in named variables",
      "Choose between int, float, str, and bool",
      "Convert types safely with int(), float(), str()",
      "Inspect values using type() and print()",
    ],
    sections: [
      {
        title: "1.1 Variables as labels",
        explanation:
          "A variable is a readable label attached to a value. Python is dynamically typed, so the same variable can point to different value types over time.",
        bullets: [
          "Use clear names like total_marks, user_name, is_active",
          "Avoid one-letter names unless in small loops",
          "Use snake_case for consistency",
        ],
      },
      {
        title: "1.2 Core primitive types",
        explanation:
          "Use int for whole numbers, float for decimals, str for text, and bool for true/false logic decisions.",
        bullets: [
          "int: 0, 15, -40",
          "float: 3.14, -0.25",
          "str: 'hello'",
          "bool: True, False",
        ],
      },
      {
        title: "1.3 Type conversion",
        explanation:
          "Real apps read strings from input or files. Convert only when the text is valid, otherwise handle errors.",
        bullets: [
          "int('42') -> 42",
          "float('3.5') -> 3.5",
          "str(120) -> '120'",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Student percentage",
        code: "math = 88\nscience = 91\nenglish = 84\ntotal = math + science + english\npercentage = total / 3\nprint(total, percentage)",
        explanation:
          "All marks are int values. Division with / gives a float result for percentage.",
      },
      {
        title: "Example B: Input normalization",
        code: "raw_age = '16'\nage = int(raw_age)\nnext_year = age + 1\nprint(next_year)",
        explanation:
          "Input is often a string. Convert first, then perform arithmetic.",
      },
      {
        title: "Example C: Boolean condition",
        code: "attendance = 82\nis_eligible = attendance >= 75\nprint(is_eligible)",
        explanation:
          "A comparison expression returns a bool, useful for decision making.",
      },
    ],
    commonMistakes: [
      "Using = instead of == when comparing values",
      "Trying to add number and string without conversion",
      "Using vague names like x or data1 for important values",
    ],
    reviewQuestions: [
      "When should you use float instead of int?",
      "Why might int('abc') fail?",
      "How does bool support program decisions?",
    ],
  },
  "Control Flow and Loops": {
    chapterTitle: "Chapter 2: Control Flow and Loops",
    whyItMatters:
      "Control flow decides what code runs and how many times. This is the core of automation and logic building.",
    learningGoals: [
      "Write if / elif / else blocks",
      "Use for and while loops correctly",
      "Control loops with break and continue",
      "Trace loop state step-by-step",
    ],
    sections: [
      {
        title: "2.1 Decision making",
        explanation:
          "Conditional blocks allow your program to branch based on real data.",
        bullets: [
          "if checks first condition",
          "elif checks additional conditions",
          "else handles fallback",
        ],
      },
      {
        title: "2.2 Iteration patterns",
        explanation:
          "Use for when iterating a known collection and while when looping until a condition changes.",
        bullets: [
          "for item in list",
          "for i in range(n)",
          "while condition:",
        ],
      },
      {
        title: "2.3 Loop control",
        explanation:
          "break exits the loop early; continue skips to next iteration.",
        bullets: [
          "break is useful once target is found",
          "continue is useful when filtering inputs",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Grade band",
        code: "score = 78\nif score >= 90:\n    grade = 'A'\nelif score >= 75:\n    grade = 'B'\nelse:\n    grade = 'C'\nprint(grade)",
        explanation:
          "Conditions are evaluated top to bottom. First true block executes.",
      },
      {
        title: "Example B: Sum of first n numbers",
        code: "n = 5\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)",
        explanation:
          "for with range is a standard counting pattern.",
      },
      {
        title: "Example C: Input validation loop",
        code: "value = -1\nwhile value < 0:\n    value = 3\nprint('valid:', value)",
        explanation:
          "while loops are ideal for repeated checks until valid state is reached.",
      },
    ],
    commonMistakes: [
      "Infinite loops from missing updates in while",
      "Incorrect range end assumptions",
      "Nested condition logic without clear ordering",
    ],
    reviewQuestions: [
      "When should you use while instead of for?",
      "What does break change in loop behavior?",
      "How can you debug infinite loops quickly?",
    ],
  },
  "Classes and Objects": {
    chapterTitle: "Chapter 3: Classes and Objects",
    whyItMatters:
      "Classes help organize related data and behavior. This is essential for building larger software systems.",
    learningGoals: [
      "Define a class with __init__",
      "Create object instances",
      "Write instance methods",
      "Model real-world entities in code",
    ],
    sections: [
      {
        title: "3.1 Class blueprint",
        explanation:
          "A class is a blueprint, and objects are real instances created from that blueprint.",
        bullets: [
          "class Name:",
          "__init__ initializes instance state",
          "self refers to current instance",
        ],
      },
      {
        title: "3.2 Methods",
        explanation:
          "Methods are class functions that use and update object state.",
        bullets: [
          "Define behavior in methods",
          "Use self.attribute to access instance data",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Basic class",
        code: "class Book:\n    def __init__(self, title, pages):\n        self.title = title\n        self.pages = pages\n\nb1 = Book('Python 101', 220)\nprint(b1.title)",
        explanation: "Object b1 stores its own title and pages values.",
      },
      {
        title: "Example B: Method usage",
        code: "class BankAccount:\n    def __init__(self, balance):\n        self.balance = balance\n\n    def deposit(self, amount):\n        self.balance += amount\n\nacc = BankAccount(100)\nacc.deposit(50)\nprint(acc.balance)",
        explanation: "Methods mutate instance state in a controlled way.",
      },
      {
        title: "Example C: Domain modeling",
        code: "class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\n    def is_distinction(self):\n        return self.marks >= 85",
        explanation: "Model business rules directly as class methods.",
      },
    ],
    commonMistakes: [
      "Forgetting self in method parameters",
      "Using class variables when instance variables are needed",
      "Placing unrelated logic inside a single class",
    ],
    reviewQuestions: [
      "Why is __init__ useful?",
      "What is the difference between class and object?",
      "When should behavior be in a method?",
    ],
  },
  "Inheritance and Polymorphism": {
    chapterTitle: "Chapter 4: Inheritance and Polymorphism",
    whyItMatters:
      "Inheritance improves reuse, and polymorphism makes code flexible across related object types.",
    learningGoals: [
      "Create child classes from parent class",
      "Override parent methods",
      "Use polymorphism via shared interfaces",
      "Apply super() correctly",
    ],
    sections: [
      {
        title: "4.1 Inheritance basics",
        explanation:
          "A child class inherits attributes and methods from its parent class.",
        bullets: [
          "class Child(Parent)",
          "Reuse common behavior in parent",
          "Extend only what changes",
        ],
      },
      {
        title: "4.2 Polymorphism",
        explanation:
          "Different subclasses implement the same method name differently.",
        bullets: [
          "Shared method name: area()",
          "Different behavior per class",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Parent and child",
        code: "class Animal:\n    def speak(self):\n        return 'sound'\n\nclass Dog(Animal):\n    def speak(self):\n        return 'bark'",
        explanation: "Dog overrides speak while still being an Animal.",
      },
      {
        title: "Example B: Using super()",
        code: "class Person:\n    def __init__(self, name):\n        self.name = name\n\nclass Teacher(Person):\n    def __init__(self, name, subject):\n        super().__init__(name)\n        self.subject = subject",
        explanation: "super() calls parent constructor to avoid duplication.",
      },
      {
        title: "Example C: Polymorphic area",
        code: "class Shape:\n    def area(self):\n        raise NotImplementedError\n\nclass Rectangle(Shape):\n    def __init__(self, w, h):\n        self.w, self.h = w, h\n    def area(self):\n        return self.w * self.h",
        explanation: "Any Shape can be used where area() is required.",
      },
    ],
    commonMistakes: [
      "Overusing inheritance when composition is simpler",
      "Forgetting to call super().__init__",
      "Breaking interface consistency across subclasses",
    ],
    reviewQuestions: [
      "How does inheritance reduce duplication?",
      "What is method overriding?",
      "Where is polymorphism useful in real apps?",
    ],
  },
  "Lists, Tuples, Sets, Dicts": {
    chapterTitle: "Chapter 5: Core Data Structures",
    whyItMatters:
      "Choosing the right data structure improves readability and performance significantly.",
    learningGoals: [
      "Use list for ordered mutable data",
      "Use tuple for fixed records",
      "Use set for uniqueness",
      "Use dict for key-value lookups",
    ],
    sections: [
      {
        title: "5.1 When to use each",
        explanation:
          "Each structure solves a different problem. Correct choice prevents complexity later.",
        bullets: [
          "list: sequence operations",
          "tuple: immutable grouped values",
          "set: remove duplicates quickly",
          "dict: fast lookups by key",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: List operations",
        code: "scores = [70, 88, 91]\nscores.append(95)\nprint(scores[1])",
        explanation: "Lists support indexing and mutation.",
      },
      {
        title: "Example B: Set uniqueness",
        code: "cities = ['delhi', 'mumbai', 'delhi']\nunique_cities = set(cities)\nprint(unique_cities)",
        explanation: "Sets remove duplicate values automatically.",
      },
      {
        title: "Example C: Dictionary frequency",
        code: "text = ['py', 'ai', 'py']\nfreq = {}\nfor word in text:\n    freq[word] = freq.get(word, 0) + 1\nprint(freq)",
        explanation: "dict.get avoids key errors in counters.",
      },
    ],
    commonMistakes: [
      "Using list membership checks for very large lookup workloads",
      "Expecting tuple values to be mutable",
      "Assuming set preserves order",
    ],
    reviewQuestions: [
      "Why is dict useful for counting?",
      "When is tuple better than list?",
      "How does set help data cleaning?",
    ],
  },
  "Algorithmic Thinking": {
    chapterTitle: "Chapter 6: Algorithmic Thinking",
    whyItMatters:
      "Algorithms determine scalability. A small logic improvement can save huge runtime on large data.",
    learningGoals: [
      "Estimate time complexity with Big-O",
      "Break problems into steps",
      "Choose efficient lookup strategies",
      "Write and test edge cases",
    ],
    sections: [
      {
        title: "6.1 Big-O intuition",
        explanation:
          "Big-O compares growth rate as input size increases.",
        bullets: [
          "O(1): constant time",
          "O(n): linear",
          "O(n^2): nested loops",
        ],
      },
      {
        title: "6.2 Problem decomposition",
        explanation:
          "Convert problem statements into data, operations, and expected output checks.",
        bullets: [
          "Identify input constraints",
          "Decide data structure first",
          "Handle edge cases before optimization",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Two Sum brute force",
        code: "def two_sum_bruteforce(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]",
        explanation: "Works but O(n^2).",
      },
      {
        title: "Example B: Two Sum optimized",
        code: "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        need = target - num\n        if need in seen:\n            return [seen[need], i]\n        seen[num] = i",
        explanation: "Hash map reduces average runtime to O(n).",
      },
      {
        title: "Example C: Early exit pattern",
        code: "def has_negative(nums):\n    for n in nums:\n        if n < 0:\n            return True\n    return False",
        explanation: "Return early avoids unnecessary work.",
      },
    ],
    commonMistakes: [
      "Optimizing too early before correctness",
      "Ignoring edge cases like empty list",
      "Confusing average and worst-case complexity",
    ],
    reviewQuestions: [
      "Why is O(n) preferred over O(n^2)?",
      "When should you use a hash map?",
      "How do edge cases break naive algorithms?",
    ],
  },
  "NumPy and Arrays": {
    chapterTitle: "Chapter 7: NumPy Foundations",
    whyItMatters:
      "NumPy powers scientific Python. It makes numerical operations concise and much faster than manual loops.",
    learningGoals: [
      "Create and inspect numpy arrays",
      "Use vectorized operations",
      "Compute mean and standard deviation",
      "Understand axis-based operations",
    ],
    sections: [
      {
        title: "7.1 Array creation",
        explanation: "NumPy arrays store homogeneous numeric data efficiently.",
        bullets: [
          "np.array(list)",
          "np.zeros((rows, cols))",
          "np.arange(start, end, step)",
        ],
      },
      {
        title: "7.2 Vectorization",
        explanation:
          "Perform operations on full arrays at once. This is cleaner and faster.",
        bullets: [
          "arr + 10",
          "arr * 2",
          "arr.mean()",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Basic vector math",
        code: "import numpy as np\na = np.array([1, 2, 3])\nprint(a * 2)",
        explanation: "Every element is multiplied by 2 in one operation.",
      },
      {
        title: "Example B: Aggregate stats",
        code: "import numpy as np\nscores = np.array([70, 80, 90])\nprint(scores.mean(), scores.std())",
        explanation: "NumPy has built-in statistical methods.",
      },
      {
        title: "Example C: 2D array axis",
        code: "import numpy as np\nm = np.array([[1, 2], [3, 4]])\nprint(m.sum(axis=0))",
        explanation: "axis=0 sums column-wise.",
      },
    ],
    commonMistakes: [
      "Mixing incompatible shapes",
      "Using Python loops unnecessarily",
      "Forgetting dtype conversion from raw input",
    ],
    reviewQuestions: [
      "Why is vectorization faster?",
      "How does axis impact calculations?",
      "When should you use NumPy over list?",
    ],
  },
  "Pandas + Matplotlib": {
    chapterTitle: "Chapter 8: Data Analysis and Visualization",
    whyItMatters:
      "Data work in industry depends on cleaning, transforming, and visualizing tables effectively.",
    learningGoals: [
      "Load data into DataFrame",
      "Filter and aggregate data",
      "Plot trends with matplotlib",
      "Communicate insight with charts",
    ],
    sections: [
      {
        title: "8.1 DataFrame basics",
        explanation: "DataFrame is a labeled table with rows and columns.",
        bullets: [
          "pd.read_csv('file.csv')",
          "df.head()",
          "df.describe()",
        ],
      },
      {
        title: "8.2 Plotting",
        explanation: "Use matplotlib for line, bar, and scatter plots.",
        bullets: [
          "plt.plot(x, y)",
          "plt.bar(labels, values)",
          "Always label axes and title",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Build DataFrame",
        code: "import pandas as pd\ndf = pd.DataFrame({'month': ['Jan', 'Feb'], 'sales': [120, 150]})\nprint(df)",
        explanation: "Create a table directly from a dictionary.",
      },
      {
        title: "Example B: Filter records",
        code: "high_sales = df[df['sales'] > 130]\nprint(high_sales)",
        explanation: "Boolean indexing selects relevant rows.",
      },
      {
        title: "Example C: Visualize trend",
        code: "import matplotlib.pyplot as plt\nplt.plot(df['month'], df['sales'])\nplt.title('Monthly Sales')\nplt.show()",
        explanation: "Line chart shows trend over time.",
      },
    ],
    commonMistakes: [
      "Not checking null values before analysis",
      "Plotting without labels or units",
      "Changing data in place without copy awareness",
    ],
    reviewQuestions: [
      "How do you inspect dataset quality?",
      "When should you use line chart vs bar chart?",
      "What does boolean filtering solve?",
    ],
  },
  "ML Workflow Basics": {
    chapterTitle: "Chapter 9: Machine Learning Workflow",
    whyItMatters:
      "A disciplined ML pipeline avoids overfitting and creates models that generalize to unseen data.",
    learningGoals: [
      "Separate features and labels",
      "Split train/test datasets",
      "Train and evaluate baseline models",
      "Interpret accuracy critically",
    ],
    sections: [
      {
        title: "9.1 Dataset split",
        explanation: "Training data teaches the model; test data checks real-world behavior.",
        bullets: [
          "Never train on test set",
          "Use train_test_split",
          "Track random_state for repeatability",
        ],
      },
      {
        title: "9.2 Evaluation",
        explanation: "Accuracy alone can be misleading depending on class balance.",
        bullets: [
          "Check confusion matrix",
          "Consider precision/recall",
          "Start with simple baseline",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Train/test split",
        code: "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)",
        explanation: "Keeps evaluation honest by holding out unseen data.",
      },
      {
        title: "Example B: Fit model",
        code: "from sklearn.linear_model import LogisticRegression\nmodel = LogisticRegression(max_iter=200)\nmodel.fit(X_train, y_train)",
        explanation: "Train a baseline classifier quickly.",
      },
      {
        title: "Example C: Evaluate",
        code: "accuracy = model.score(X_test, y_test)\nprint(accuracy)",
        explanation: "Use test set to estimate generalization performance.",
      },
    ],
    commonMistakes: [
      "Data leakage between train and test",
      "Tuning only for accuracy on imbalanced sets",
      "Skipping baseline comparison",
    ],
    reviewQuestions: [
      "Why is data split essential?",
      "When is accuracy not enough?",
      "What is overfitting in simple terms?",
    ],
  },
  "Prompting and LLM Apps": {
    chapterTitle: "Chapter 10: Prompting and LLM Apps",
    whyItMatters:
      "Prompt design determines quality, consistency, and safety of AI-powered applications.",
    learningGoals: [
      "Write clear task-oriented prompts",
      "Set constraints and output format",
      "Add context for better responses",
      "Validate generated output",
    ],
    sections: [
      {
        title: "10.1 Prompt anatomy",
        explanation:
          "A strong prompt has role/context, task, constraints, and expected output format.",
        bullets: [
          "Role: You are a Python tutor",
          "Task: Explain recursion for beginners",
          "Constraint: max 120 words",
          "Format: bullet list",
        ],
      },
      {
        title: "10.2 Reliability",
        explanation: "Add checks and fallback logic when using model outputs in product features.",
        bullets: [
          "Validate JSON before use",
          "Retry on malformed response",
          "Add moderation for unsafe content",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Weak vs strong prompt",
        code: "weak = 'teach loops'\nstrong = 'Explain Python for-loops to a class 8 student with 2 examples and 1 quiz question.'",
        explanation: "Specific prompts produce more usable responses.",
      },
      {
        title: "Example B: Format constraint",
        code: "prompt = 'Return answer as JSON with keys: title, summary, example_code'",
        explanation: "Format constraints reduce parsing failures.",
      },
      {
        title: "Example C: Context injection",
        code: "prompt = f'Student level: beginner. Topic: {topic}. Prior mistake: off-by-one errors.'",
        explanation: "Context personalizes and sharpens output.",
      },
    ],
    commonMistakes: [
      "Vague prompts without constraints",
      "Trusting model output without validation",
      "Missing safety checks in user-facing apps",
    ],
    reviewQuestions: [
      "What are the 4 key parts of a good prompt?",
      "Why enforce structured output?",
      "How do you make prompts student-level appropriate?",
    ],
  },
  "CLI Productivity Tool": {
    chapterTitle: "Chapter 11: CLI Project Architecture",
    whyItMatters:
      "Project work trains engineering habits: structure, persistence, and reliable command behavior.",
    learningGoals: [
      "Design command interfaces",
      "Persist task data in JSON",
      "Implement CRUD operations",
      "Handle invalid user input",
    ],
    sections: [
      {
        title: "11.1 Command design",
        explanation: "Define command verbs first: add, list, complete, remove.",
        bullets: [
          "Keep commands predictable",
          "Print clear success/error messages",
          "Validate input before write",
        ],
      },
      {
        title: "11.2 Persistence strategy",
        explanation: "Use JSON file for lightweight local storage in MVP stage.",
        bullets: [
          "Read file on startup",
          "Write file after mutation",
          "Handle missing/corrupt file safely",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Load JSON",
        code: "import json\nfrom pathlib import Path\n\npath = Path('tasks.json')\ntasks = json.loads(path.read_text()) if path.exists() else []",
        explanation: "Initialize state from file if present.",
      },
      {
        title: "Example B: Add task",
        code: "tasks.append({'title': 'Revise loops', 'done': False})",
        explanation: "Each task record uses a consistent schema.",
      },
      {
        title: "Example C: Save changes",
        code: "path.write_text(json.dumps(tasks, indent=2))",
        explanation: "Persist after every change to avoid data loss.",
      },
    ],
    commonMistakes: [
      "Not validating command arguments",
      "Overwriting file accidentally",
      "No error handling for malformed JSON",
    ],
    reviewQuestions: [
      "Why choose JSON for early CLI persistence?",
      "Which operations should be atomic?",
      "How do you recover from corrupt data file?",
    ],
  },
  "Capstone: AI Study Assistant": {
    chapterTitle: "Chapter 12: Capstone System Design",
    whyItMatters:
      "Capstones combine all skills: architecture, coding, AI integration, and product thinking.",
    learningGoals: [
      "Plan modules and data flow",
      "Integrate AI API with safe prompts",
      "Track user learning signals",
      "Ship with testing and monitoring",
    ],
    sections: [
      {
        title: "12.1 Product decomposition",
        explanation: "Break project into features: notes, quiz generator, progress tracker, AI help.",
        bullets: [
          "Define MVP scope first",
          "Prioritize high-value user flows",
          "Avoid feature bloat in first release",
        ],
      },
      {
        title: "12.2 Quality gates",
        explanation: "A capstone should include tests, logging, and fallback behavior.",
        bullets: [
          "Unit tests for core logic",
          "Graceful API failure handling",
          "Basic analytics events",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Example A: Feature map",
        code: "features = ['summarize_notes', 'generate_quiz', 'track_progress', 'ai_feedback']",
        explanation: "Feature map keeps implementation focused.",
      },
      {
        title: "Example B: Prompt with constraints",
        code: "prompt = 'Generate 5 quiz questions from chapter text. Include answer key and difficulty tags.'",
        explanation: "Constraint-driven prompts are easier to validate.",
      },
      {
        title: "Example C: Fallback logic",
        code: "try:\n    questions = call_ai(prompt)\nexcept Exception:\n    questions = default_question_bank",
        explanation: "Always keep app usable even if AI call fails.",
      },
    ],
    commonMistakes: [
      "Building too many features before validation",
      "No fallback when AI API is unavailable",
      "Missing test coverage for core user flow",
    ],
    reviewQuestions: [
      "What belongs in MVP vs later versions?",
      "How do you keep AI features reliable?",
      "Which user metrics matter for learning outcomes?",
    ],
  },
};

export function getTextbookPack(topic: string, objective: string): TextbookPack {
  const existing = textbookMap[topic];
  if (existing) {
    return existing;
  }

  return {
    chapterTitle: `Textbook Notes: ${topic}`,
    whyItMatters: "This topic is foundational for writing clean, practical Python programs.",
    learningGoals: [
      objective,
      "Understand concept definitions and rules",
      "Solve textbook-style examples step by step",
      "Apply concept in coding challenges",
    ],
    sections: [
      {
        title: "Concept Overview",
        explanation:
          "Start with the idea in plain language, then connect it to syntax and behavior in code.",
        bullets: [
          "Definition",
          "Where this appears in real programs",
          "Important syntax pattern",
        ],
      },
      {
        title: "Reasoning Process",
        explanation: "Practice how to think before coding: inputs, operations, output, edge cases.",
        bullets: [
          "Identify what data enters the program",
          "Choose the best structure or control pattern",
          "Validate result with small test cases",
        ],
      },
    ],
    workedExamples: [
      {
        title: "Worked Example 1: Basic",
        code: "def solve_basic(data):\n    # apply core concept\n    return data",
        explanation: "Demonstrates the minimum valid solution for the topic.",
      },
      {
        title: "Worked Example 2: Intermediate",
        code: "def solve_intermediate(data):\n    result = []\n    for item in data:\n        result.append(item)\n    return result",
        explanation: "Adds structure and reusable logic.",
      },
      {
        title: "Worked Example 3: Exam style",
        code: "def solve_exam_style(data):\n    # handle edge case first\n    if not data:\n        return []\n    return data",
        explanation: "Shows how to include edge-case handling expected in exams and interviews.",
      },
    ],
    commonMistakes: [
      "Skipping step-by-step reasoning before coding",
      "Ignoring edge-case inputs",
      "Using unclear variable names",
    ],
    reviewQuestions: [
      "Can you explain this topic in your own words?",
      "Which pattern should you use and why?",
      "How would you test your solution quickly?",
    ],
  };
}