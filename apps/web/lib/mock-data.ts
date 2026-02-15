export const categories = [
    {
        id: "getting-started",
        title: "1. Getting Started",
        description: "Your journey begins here. Master the basics of Python syntax and setup.",
        color: "from-green-400 to-emerald-600",
        chapters: 5,
        chaptersList: [
            { id: "intro-to-python", title: "Introduction to Python", completed: false },
            { id: "installation", title: "Installation & Setup", completed: false },
            { id: "first-program", title: "Your First Program", completed: false },
            { id: "syntax-basics", title: "Python Syntax & Comments", completed: false },
            { id: "variables-intro", title: "Variables & Data Types", completed: false },
        ]
    },
    {
        id: "core-fundamentals",
        title: "2. Core Fundamentals",
        description: "Deep dive into numbers, strings, and operators.",
        color: "from-teal-400 to-cyan-600",
        chapters: 6,
        chaptersList: [
            { id: "numbers-math", title: "Numbers & Math", completed: false },
            { id: "casting", title: "Casting & Type Conversion", completed: false },
            { id: "strings-methods", title: "Strings & Methods", completed: false },
            { id: "booleans", title: "Booleans & Logic", completed: false },
            { id: "operators", title: "Operators", completed: false },
            { id: "user-input", title: "User Input", completed: false },
        ]
    },
    {
        id: "control-flow",
        title: "3. Control Flow",
        description: "Control the logic of your programs with conditions and loops.",
        color: "from-blue-400 to-indigo-600",
        chapters: 4,
        chaptersList: [
            { id: "if-else", title: "If...Else Conditions", completed: false },
            { id: "while-loops", title: "While Loops", completed: false },
            { id: "for-loops", title: "For Loops", completed: false },
            { id: "control-statements", title: "Break, Continue, Pass", completed: false },
        ]
    },
    {
        id: "data-structures",
        title: "4. Data Structures",
        description: "Organize data efficiently with lists, tuples, sets, and dictionaries.",
        color: "from-violet-400 to-purple-600",
        chapters: 5,
        chaptersList: [
            { id: "lists", title: "Lists & Operations", completed: false },
            { id: "tuples", title: "Tuples", completed: false },
            { id: "sets", title: "Sets", completed: false },
            { id: "dictionaries", title: "Dictionaries", completed: false },
            { id: "nested-structures", title: "Nested Data Structures", completed: false },
        ]
    },
    {
        id: "functions-modules",
        title: "5. Functions & Modules",
        description: "Write reusable code and organize projects.",
        color: "from-fuchsia-400 to-pink-600",
        chapters: 5,
        chaptersList: [
            { id: "functions", title: "Defining Functions", completed: false },
            { id: "lambda", title: "Lambda Functions", completed: false },
            { id: "scope", title: "Scope (Local vs Global)", completed: false },
            { id: "modules", title: "Modules & Imports", completed: false },
            { id: "packages", title: "Packages & PIP", completed: false },
        ]
    },
    {
        id: "oop",
        title: "6. Object Oriented Programming",
        description: "Master classes, objects, inheritance, and polymorphism.",
        color: "from-rose-400 to-red-600",
        chapters: 4,
        chaptersList: [
            { id: "classes-objects", title: "Classes & Objects", completed: false },
            { id: "inheritance", title: "Inheritance", completed: false },
            { id: "polymorphism", title: "Polymorphism", completed: false },
            { id: "iterators", title: "Iterators", completed: false },
        ]
    },
    {
        id: "file-handling",
        title: "7. File Handling",
        description: "Read and write files, handle JSON and CSV.",
        color: "from-orange-400 to-amber-600",
        chapters: 3,
        chaptersList: [
            { id: "file-io", title: "File Read/Write", completed: false },
            { id: "csv-json", title: "Working with CSV & JSON", completed: false },
            { id: "os-module", title: "OS Module & Paths", completed: false },
        ]
    },
    {
        id: "advanced-topics",
        title: "8. Advanced Topics",
        description: "Level up with decorators, generators, and RegEx.",
        color: "from-yellow-400 to-lime-600",
        chapters: 5,
        chaptersList: [
            { id: "dates", title: "Dates & Time", completed: false },
            { id: "math-module", title: "Math Module", completed: false },
            { id: "regex", title: "RegEx (Regular Expressions)", completed: false },
            { id: "try-except", title: "Exception Handling", completed: false },
            { id: "list-comprehensions", title: "List Comprehensions", completed: false },
        ]
    }
];

const chapterContentData = {
    // --- 1. Introduction to Python (10+ pages) ---
    "intro-to-python": {
        title: "Introduction to Python",
        pages: [
            {
                type: "text",
                content: "# Welcome to Python 🐍\n\nPython is a popular, high-level programming language known for its simplicity and readability. It was created by **Guido van Rossum** and released in **1991**.\n\nSince then, it has become one of the most widely used languages in the world, powering everything from web applications to artificial intelligence."
            },
            {
                type: "text",
                content: "## Why Python?\n\nPython is versatile. Here is why developers love it:\n\n*   **Easy to Learn:** simple syntax that mimics plain English.\n*   **Interpretation:** Code is executed line-by-line.\n*   **Standard Library:** A huge collection of modules for every task.\n*   **Community:** Millions of developers contributing packages."
            },
            {
                type: "text",
                content: "## Applications of Python\n\nWhat can you build with Python?\n\n1.  **Web Development** (Django, Flask)\n2.  **Data Science** (Pandas, NumPy)\n3.  **Machine Learning** (TensorFlow, PyTorch)\n4.  **Automation** (Scripting)\n5.  **Game Development** (PyGame)"
            },
            {
                type: "code",
                language: "python",
                content: "# Python is simple.\n# This is a comment.\n\nprint('Hello, World!')"
            },
            {
                type: "text",
                content: "## How Python Works\n\nPython is an **interpreted** language. This means you don't need to compile your code into machine language before running it.\n\nThe Python Interpreter reads your code line by line and executes it instantly. This makes debugging and testing very fast!"
            },
            {
                type: "diagram",
                content: "Source Code (.py) -> Interpreter -> Bytecode -> Virtual Machine (PVM) -> Execution"
            },
            {
                type: "text",
                content: "## Python Versions\n\nThere are two major versions of Python:\n\n*   **Python 2:** Legacy, no longer supported (died in 2020).\n*   **Python 3:** The present and future of the language.\n\nWe will be using **Python 3** content continuously throughout this course."
            },
            {
                type: "text",
                content: "## The Global Interpreter Lock (GIL)\n\nOne technical detail about CPython (the standard implementation) is the GIL.\n\nIt is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once. This impacts multi-threaded performance but simplifies memory management."
            },
            {
                type: "text",
                content: "## Setup check\n\nTo check if Python is installed on your machine, open your terminal or command prompt and type:\n\n`python --version`\n\nIf you see a version number (like 3.10.x), you are ready to go!"
            },
            {
                type: "code",
                language: "bash",
                content: "python --version\n# Python 3.11.4"
            },
            {
                type: "text",
                content: "## Summary\n\nIn this chapter, we learned:\n\n*   Python was created by Guido van Rossum.\n*   It is interpreted, high-level, and general-purpose.\n*   It is used in Web Dev, AI, Data Science, and more.\n\nNext, we will write our first program!"
            }
        ]
    },

    // --- 2. Variables & Data Types (Deep Dive) ---
    "variables-intro": {
        title: "Variables & Data Types",
        pages: [
            {
                type: "text",
                content: "# Variables in Python\n\nA **variable** is a container for storing data values.\n\nUnlike other languages (like Java or C++), Python has no command for declaring a variable. A variable is created the moment you first assign a value to it."
            },
            {
                type: "code",
                language: "python",
                content: "x = 5\ny = 'John'\n\nprint(x)\nprint(y)"
            },
            {
                type: "text",
                content: "## Naming Rules\n\n*   A variable name must start with a **letter** or the **underscore** character.\n*   A variable name cannot start with a **number**.\n*   Variable names are **case-sensitive** (`age`, `Age` and `AGE` are three different variables)."
            },
            {
                type: "code",
                language: "python",
                content: "# Legal variable names:\nmyvar = 'John'\nmy_var = 'John'\n_my_var = 'John'\nmyVar = 'John'\nMYVAR = 'John'\nmyvar2 = 'John'\n\n# Illegal variable names:\n# 2myvar = 'John'\n# my-var = 'John'\n# my var = 'John'"
            },
            {
                type: "text",
                content: "## Data Types\n\nVariables can store data of different types, and different types can do different things.\n\nPython has the following data types built-in by default:\n\n*   **Text Type:** `str`\n*   **Numeric Types:** `int`, `float`, `complex`\n*   **Sequence Types:** `list`, `tuple`, `range`\n*   **Mapping Type:** `dict`\n*   **Set Types:** `set`, `frozenset`\n*   **Boolean Type:** `bool`\n*   **Binary Types:** `bytes`, `bytearray`, `memoryview`"
            },
            {
                type: "text",
                content: "## Getting the Data Type\n\nYou can get the data type of any object by using the `type()` function."
            },
            {
                type: "code",
                language: "python",
                content: "x = 5\nprint(type(x))\n# <class 'int'>\n\ny = 'Hello World'\nprint(type(y))\n# <class 'str'>\n\nz = 20.5\nprint(type(z))\n# <class 'float'>"
            },
            {
                type: "text",
                content: "## Dynamic Typing\n\nPython is **dynamically typed**. This means you can reassign variables to different types without error."
            },
            {
                type: "code",
                language: "python",
                content: "x = 4       # x is of type int\nx = 'Sally' # x is now of type str\nprint(x)"
            },
            {
                type: "text",
                content: "## Casting\n\nIf you want to specify the data type of a variable, this can be done with casting."
            },
            {
                type: "code",
                language: "python",
                content: "x = str(3)    # x will be '3'\ny = int(3)    # y will be 3\nz = float(3)  # z will be 3.0"
            },
            {
                type: "text",
                content: "## Variable Scope\n\nVariables created outside of a function are known as **global** variables. Global variables can be used by everyone, both inside of functions and outside."
            },
            {
                type: "code",
                language: "python",
                content: "x = 'awesome'\n\ndef myfunc():\n  print('Python is ' + x)\n\nmyfunc()"
            },
            {
                type: "text",
                content: "## Summary\n\n*   Variables are containers for data.\n*   Python variables are dynamic and case-sensitive.\n*   Use `type()` to check the data type.\n*   Casting allows you to convert between types."
            }
        ]
    },

    // --- 3. Control Flow (If/Else) ---
    "if-else": {
        title: "If...Else Conditions",
        pages: [
            {
                type: "text",
                content: "# Python Conditions\n\nPython supports the usual logical conditions from mathematics:\n\n*   Equals: `a == b`\n*   Not Equals: `a != b`\n*   Less than: `a < b`\n*   Less than or equal to: `a <= b`\n*   Greater than: `a > b`\n*   Greater than or equal to: `a >= b`"
            },
            {
                type: "code",
                language: "python",
                content: "a = 33\nb = 200\nif b > a:\n  print('b is greater than a')"
            },
            {
                type: "text",
                content: "## Indentation\n\nPython relies on **indentation** (whitespace at the beginning of a line) to define scope in the code. Other programming languages often use curly-brackets for this purpose.\n\n**If you skip indentation, Python will give you an error.**"
            },
            {
                type: "code",
                language: "python",
                content: "# This will raise an error:\n# if 5 > 2:\n# print('Five is greater than two!')"
            },
            {
                type: "text",
                content: "## Elif\n\nThe `elif` keyword is Python's way of saying \"if the previous conditions were not true, then try this condition\"."
            },
            {
                type: "code",
                language: "python",
                content: "a = 33\nb = 33\nif b > a:\n  print('b is greater than a')\nelif a == b:\n  print('a and b are equal')"
            },
            {
                type: "text",
                content: "## Else\n\nThe `else` keyword catches anything which isn't caught by the preceding conditions."
            },
            {
                type: "code",
                language: "python",
                content: "a = 200\nb = 33\nif b > a:\n  print('b is greater than a')\nelif a == b:\n  print('a and b are equal')\nelse:\n  print('a is greater than b')"
            },
            {
                type: "text",
                content: "## Short Hand If\n\nIf you have only one statement to execute, you can put it on the same line as the if statement."
            },
            {
                type: "code",
                language: "python",
                content: "if a > b: print('a is greater than b')"
            },
            {
                type: "text",
                content: "## Short Hand If...Else (Ternary Operator)\n\nThis technique is known as **Ternary Operators**, or **Conditional Expressions**."
            },
            {
                type: "code",
                language: "python",
                content: "a = 2\nb = 330\nprint('A') if a > b else print('B')"
            }
        ]
    },

    // --- 4. Loops (For/While) ---
    "loops": {
        title: "Loops: For & While",
        pages: [
            {
                type: "text",
                content: "# Python Loops\n\nPython has two primitive loop commands:\n\n*   `while` loops\n*   `for` loops"
            },
            {
                type: "text",
                content: "## The While Loop\n\nWith the `while` loop we can execute a set of statements as long as a condition is true."
            },
            {
                type: "code",
                language: "python",
                content: "i = 1\nwhile i < 6:\n  print(i)\n  i += 1"
            },
            {
                type: "text",
                content: "## The Break Statement\n\nWith the `break` statement we can stop the loop even if the while condition is true."
            },
            {
                type: "code",
                language: "python",
                content: "i = 1\nwhile i < 6:\n  print(i)\n  if i == 3:\n    break\n  i += 1"
            },
            {
                type: "text",
                content: "## The Continue Statement\n\nWith the `continue` statement we can stop the current iteration, and continue with the next."
            },
            {
                type: "code",
                language: "python",
                content: "i = 0\nwhile i < 6:\n  i += 1\n  if i == 3:\n    continue\n  print(i)"
            },
            {
                type: "text",
                content: "## The For Loop\n\nA `for` loop is used for iterating over a sequence (that is either a list, a tuple, a dictionary, a set, or a string)."
            },
            {
                type: "code",
                language: "python",
                content: "fruits = ['apple', 'banana', 'cherry']\nfor x in fruits:\n  print(x)"
            },
            {
                type: "text",
                content: "## Looping Through a String\n\nStrings are also iterable objects, they contain a sequence of characters."
            },
            {
                type: "code",
                language: "python",
                content: "for x in 'banana':\n  print(x)"
            },
            {
                type: "text",
                content: "## The range() Function\n\nTo loop through a set of code a specified number of times, we can use the `range()` function. The `range()` function returns a sequence of numbers, starting from 0 by default, and increments by 1 (by default), and ends at a specified number."
            },
            {
                type: "code",
                language: "python",
                content: "for x in range(6):\n  print(x) # 0 to 5"
            },
            {
                type: "text",
                content: "## Elsevier in For Loop\n\nThe `else` keyword in a `for` loop specifies a block of code to be executed when the loop is finished."
            },
            {
                type: "code",
                language: "python",
                content: "for x in range(6):\n  print(x)\nelse:\n  print('Finally finished!')"
            }
        ]
    },

    // --- 5. List Comprehensions (Existing Enhanced) ---
    "list-comprehensions": {
        title: "List Comprehensions",
        pages: [
            {
                type: "text",
                content: "# Introduction\n\nList comprehensions provide a concise way to create lists.\n\nCommon applications are to make new lists where each element is the result of some operations applied to each member of another sequence or iterable, or to create a subsequence of those elements that satisfy a certain condition.",
            },
            {
                type: "code",
                language: "python",
                content: "squares = []\nfor x in range(10):\n    squares.append(x**2)\n\n# vs\n\nsquares = [x**2 for x in range(10)]",
            },
            {
                type: "text",
                content: "## Syntax\n\nA list comprehension consists of brackets containing an expression followed by a `for` clause, then zero or more `for` or `if` clauses. The result will be a new list resulting from evaluating the expression in the context of the `for` and `if` clauses which follow it.",
            },
            {
                type: "diagram",
                content: "[Expression] for [Item] in [Iterable] if [Condition]",
            },
            {
                type: "text",
                content: "## Conditionals\n\nThe condition is like a filter that only accepts the items that valuate to True."
            },
            {
                type: "code",
                language: "python",
                content: "newlist = [x for x in fruits if x != 'apple']\n\n# Only numbers lower than 5\nnewlist = [x for x in range(10) if x < 5]"
            }
        ]
    },

    // --- Placeholders for all other chapters to avoid 404s ---
    // (This part ensures robust navigation for testing purposes)
    "default": {
        title: "Content Coming Soon",
        pages: [
            { type: "text", content: "# Coming Soon 🚀\n\nWe are currently crafting high-quality content for this chapter.\n\nStay tuned for updates!" },
            { type: "code", language: "python", content: "def stay_tuned():\n    return 'Awesome content loaded!'" }
        ]
    }
};

// Proxy for robust content delivery

export const chapterContent = new Proxy(chapterContentData, {
    get: (target, name) => {
        return name in target ? target[name as keyof typeof target] : {
            title: "Content Coming Soon",
            pages: [
                { type: "text", content: "# Coming Soon 🚀\n\nWe are currently crafting high-quality content for this chapter.\n\nStay tuned for updates!" },
                { type: "code", language: "python", content: "def stay_tuned():\n    return 'Awesome content loaded!'" }
            ]
        };
    }
});

