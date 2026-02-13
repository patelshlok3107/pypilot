from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Achievement,
    CodingChallenge,
    Course,
    DailyMission,
    Lesson,
    LearningTrack,
    Module,
    PromoCode,
    QuizQuestion,
    TrackLesson,
    TrackMilestone,
)


CURRICULUM = {
    "slug": "python-mastery-path",
    "title": "Python Mastery Path",
    "description": "Beginner to advanced Python with real coding practice, libraries, and AI/ML foundations.",
    "difficulty": "beginner-to-advanced",
    "modules": [
        {
            "title": "Python Basics",
            "description": "Syntax, variables, control flow, functions, and clean coding habits.",
            "xp_reward": 120,
            "lessons": [
                {
                    "title": "Variables and Data Types",
                    "objective": "Use variables and core Python data types confidently.",
                    "content_md": "## Variables\nPython variables are labels for data.\n\n## Data types\n- int\n- float\n- str\n- bool\n\nUse `type()` to inspect values.",
                    "quiz": [
                        {
                            "prompt": "Which type stores decimal values?",
                            "options": ["int", "str", "float", "bool"],
                            "correct_option": 2,
                            "explanation": "`float` stores decimal numbers.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Temperature Converter",
                            "prompt": "Write a function `c_to_f(c)` that converts Celsius to Fahrenheit.",
                            "starter_code": "def c_to_f(c):\n    # TODO\n    pass\n\nprint(c_to_f(0))\n",
                            "tests_json": [
                                {"input": "c_to_f(0)", "expected": 32},
                                {"input": "c_to_f(10)", "expected": 50},
                            ],
                            "difficulty": "easy",
                            "xp_reward": 80,
                        }
                    ],
                },
                {
                    "title": "Control Flow and Loops",
                    "objective": "Use if statements and loops to solve iterative tasks.",
                    "content_md": "## Conditionals\nUse `if`, `elif`, `else`.\n\n## Loops\n`for` loops iterate over sequences; `while` loops repeat until condition changes.",
                    "quiz": [
                        {
                            "prompt": "Which loop is best for iterating a list?",
                            "options": ["while", "for", "switch", "goto"],
                            "correct_option": 1,
                            "explanation": "`for` is idiomatic for sequence iteration.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Even Numbers",
                            "prompt": "Print even numbers from 1 to n inclusive.",
                            "starter_code": "def print_evens(n):\n    # TODO\n    pass\n\nprint_evens(10)\n",
                            "tests_json": [{"note": "Verify output formatting manually for MVP"}],
                            "difficulty": "easy",
                            "xp_reward": 80,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Object-Oriented Programming",
            "description": "Classes, objects, inheritance, and encapsulation in Python.",
            "xp_reward": 150,
            "lessons": [
                {
                    "title": "Classes and Objects",
                    "objective": "Create classes and instantiate objects.",
                    "content_md": "## OOP\nA class defines behavior and data. An object is an instance of a class.",
                    "quiz": [
                        {
                            "prompt": "What does `__init__` do?",
                            "options": [
                                "Destroys object",
                                "Initializes instance state",
                                "Imports modules",
                                "Runs tests",
                            ],
                            "correct_option": 1,
                            "explanation": "`__init__` sets initial object attributes.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Student Class",
                            "prompt": "Create a `Student` class with `name` and `grade` and a method `is_passing()`.",
                            "starter_code": "class Student:\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Use class behavior checks"}],
                            "difficulty": "medium",
                            "xp_reward": 110,
                        }
                    ],
                },
                {
                    "title": "Inheritance and Polymorphism",
                    "objective": "Build class hierarchies and override methods.",
                    "content_md": "## Inheritance\nChild classes can extend parent behavior.\n\n## Polymorphism\nDifferent objects can implement same interface differently.",
                    "quiz": [
                        {
                            "prompt": "Inheritance helps primarily with?",
                            "options": ["Code reuse", "Database joins", "HTML layout", "API auth"],
                            "correct_option": 0,
                            "explanation": "Inheritance supports code reuse and extension.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Shape Area",
                            "prompt": "Implement base class `Shape` and subclasses `Circle`, `Rectangle` with `area()`.",
                            "starter_code": "class Shape:\n    def area(self):\n        raise NotImplementedError\n",
                            "tests_json": [{"note": "Area should be computed correctly"}],
                            "difficulty": "medium",
                            "xp_reward": 120,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Data Structures and Algorithms",
            "description": "Lists, dictionaries, sets, tuples, complexity basics, and problem-solving.",
            "xp_reward": 170,
            "lessons": [
                {
                    "title": "Lists, Tuples, Sets, Dicts",
                    "objective": "Pick the right data structure for each task.",
                    "content_md": "## Data structures\nUse list for ordered mutable data, tuple for immutable records, set for uniqueness, dict for key-value mapping.",
                    "quiz": [
                        {
                            "prompt": "Which structure enforces unique values?",
                            "options": ["list", "tuple", "set", "dict"],
                            "correct_option": 2,
                            "explanation": "`set` stores unique items.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Word Frequency",
                            "prompt": "Return a dictionary of word counts from a sentence.",
                            "starter_code": "def word_freq(sentence):\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Case-insensitive counting recommended"}],
                            "difficulty": "medium",
                            "xp_reward": 130,
                        }
                    ],
                },
                {
                    "title": "Algorithmic Thinking",
                    "objective": "Use decomposition and Big-O intuition for faster code.",
                    "content_md": "## Big-O\nEstimate runtime growth to compare approaches.\n\nUse hashing for O(1) average lookups.",
                    "quiz": [
                        {
                            "prompt": "Average lookup in Python dict is usually?",
                            "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                            "correct_option": 0,
                            "explanation": "Hash tables provide O(1) average lookup.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Two Sum",
                            "prompt": "Return indices of two numbers adding to target.",
                            "starter_code": "def two_sum(nums, target):\n    # TODO\n    pass\n",
                            "tests_json": [{"input": "two_sum([2,7,11,15], 9)", "expected": [0, 1]}],
                            "difficulty": "medium",
                            "xp_reward": 140,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Libraries: NumPy, Pandas, Matplotlib",
            "description": "Data analysis and visualization essentials used in industry.",
            "xp_reward": 180,
            "lessons": [
                {
                    "title": "NumPy and Arrays",
                    "objective": "Perform vectorized operations with NumPy arrays.",
                    "content_md": "## NumPy\nUse arrays for fast numerical operations.\n\nVectorization is faster than Python loops for large data.",
                    "quiz": [
                        {
                            "prompt": "NumPy arrays are optimized for?",
                            "options": ["Web styling", "Numerical computing", "Database auth", "Email sending"],
                            "correct_option": 1,
                            "explanation": "NumPy is built for numerical computations.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Array Stats",
                            "prompt": "Given a list, return mean and standard deviation using NumPy.",
                            "starter_code": "import numpy as np\n\ndef stats(arr):\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Return tuple(mean, std)"}],
                            "difficulty": "medium",
                            "xp_reward": 150,
                        }
                    ],
                },
                {
                    "title": "Pandas + Matplotlib",
                    "objective": "Load tabular data and build clear visualizations.",
                    "content_md": "## Pandas\nGreat for tabular data manipulation.\n\n## Matplotlib\nCreate line, bar, and scatter charts.",
                    "quiz": [
                        {
                            "prompt": "Which pandas object stores tabular data?",
                            "options": ["Series", "DataFrame", "Array", "Tensor"],
                            "correct_option": 1,
                            "explanation": "A DataFrame is the main tabular structure.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Mini Sales Dashboard",
                            "prompt": "Load sample sales data into a DataFrame and plot monthly revenue.",
                            "starter_code": "import pandas as pd\nimport matplotlib.pyplot as plt\n\n# TODO\n",
                            "tests_json": [{"note": "MVP checks for code execution"}],
                            "difficulty": "hard",
                            "xp_reward": 160,
                        }
                    ],
                },
            ],
        },
        {
            "title": "AI and Machine Learning Intro",
            "description": "Core ML concepts, model training workflow, and practical Python tooling.",
            "xp_reward": 200,
            "lessons": [
                {
                    "title": "ML Workflow Basics",
                    "objective": "Understand train/test split, features, and labels.",
                    "content_md": "## ML workflow\nCollect data, split train/test, train model, evaluate performance.",
                    "quiz": [
                        {
                            "prompt": "Why use a test set?",
                            "options": [
                                "To train faster",
                                "To estimate generalization",
                                "To reduce RAM",
                                "To avoid labels",
                            ],
                            "correct_option": 1,
                            "explanation": "Test data measures performance on unseen samples.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Iris Classifier",
                            "prompt": "Train a simple classifier on iris dataset using scikit-learn.",
                            "starter_code": "from sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\n\n# TODO\n",
                            "tests_json": [{"note": "Target: at least 0.8 accuracy"}],
                            "difficulty": "hard",
                            "xp_reward": 170,
                        }
                    ],
                },
                {
                    "title": "Prompting and LLM Apps",
                    "objective": "Build Python scripts that call AI APIs responsibly.",
                    "content_md": "## LLM apps\nDesign system + user prompts, validate outputs, and enforce safety checks.",
                    "quiz": [
                        {
                            "prompt": "A good prompt usually includes?",
                            "options": ["Random words", "Clear task and constraints", "Only emojis", "No context"],
                            "correct_option": 1,
                            "explanation": "Clarity and constraints improve output quality.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Prompt Refiner",
                            "prompt": "Write a helper function that improves vague prompts using templates.",
                            "starter_code": "def refine_prompt(user_goal):\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Ensure prompt output includes context + constraints"}],
                            "difficulty": "hard",
                            "xp_reward": 180,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Real-World Projects",
            "description": "Ship portfolio-grade projects combining APIs, data, and clean architecture.",
            "xp_reward": 220,
            "lessons": [
                {
                    "title": "CLI Productivity Tool",
                    "objective": "Build a command-line task manager with persistent storage.",
                    "content_md": "## Project\nDesign commands, data model, and file persistence for CLI usage.",
                    "quiz": [
                        {
                            "prompt": "Best data format for simple local persistence?",
                            "options": ["HTML", "JSON", "GIF", "SVG"],
                            "correct_option": 1,
                            "explanation": "JSON is simple and human-readable.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Task CLI",
                            "prompt": "Implement add/list/complete commands for a task manager.",
                            "starter_code": "import json\n\n# TODO: implement CLI task manager\n",
                            "tests_json": [{"note": "Check CRUD behavior"}],
                            "difficulty": "hard",
                            "xp_reward": 190,
                        }
                    ],
                },
                {
                    "title": "Capstone: AI Study Assistant",
                    "objective": "Combine Python + AI APIs into a student productivity app.",
                    "content_md": "## Capstone\nPlan architecture, prompts, retries, and evaluation metrics.",
                    "quiz": [
                        {
                            "prompt": "A capstone launch checklist should include?",
                            "options": [
                                "Only UI colors",
                                "Tests, monitoring, and error handling",
                                "No deployment plan",
                                "No user feedback loop",
                            ],
                            "correct_option": 1,
                            "explanation": "Production reliability requires tests and monitoring.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Capstone Build",
                            "prompt": "Build an AI-powered study helper with revision quiz generation.",
                            "starter_code": "# Build your capstone here\n",
                            "tests_json": [{"note": "Manual review rubric for MVP"}],
                            "difficulty": "advanced",
                            "xp_reward": 250,
                        }
                    ],
                },
            ],
        },
    ],
}

CURRICULUM["modules"].extend(
    [
        {
            "title": "Functions and Modular Programming",
            "description": "Write reusable logic with functions and organize code with modules.",
            "xp_reward": 190,
            "lessons": [
                {
                    "title": "Functions, Parameters, and Return Values",
                    "objective": "Design reusable functions with clear inputs and outputs.",
                    "content_md": (
                        "## Why functions matter\n"
                        "Functions help avoid repeated code and improve readability.\n\n"
                        "## Example: reusable grading helper\n"
                        "```python\n"
                        "def grade(score):\n"
                        "    if score >= 90:\n"
                        "        return 'A'\n"
                        "    if score >= 75:\n"
                        "        return 'B'\n"
                        "    return 'C'\n"
                        "```\n\n"
                        "## Tips\n"
                        "- Keep one responsibility per function\n"
                        "- Use descriptive parameter names\n"
                        "- Return values instead of printing inside helper logic"
                    ),
                    "quiz": [
                        {
                            "prompt": "What is the main benefit of return values?",
                            "options": [
                                "They make functions reusable in other expressions",
                                "They stop Python from compiling",
                                "They create global variables",
                                "They are only for loops",
                            ],
                            "correct_option": 0,
                            "explanation": "Returned values can be reused by callers in any context.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Calculator Function Suite",
                            "prompt": "Implement add, subtract, multiply, and divide functions with safe division.",
                            "starter_code": (
                                "def add(a, b):\n    # TODO\n    pass\n\n"
                                "def divide(a, b):\n    # TODO: avoid division by zero\n    pass\n"
                            ),
                            "tests_json": [{"note": "Validate arithmetic and safe zero handling"}],
                            "difficulty": "medium",
                            "xp_reward": 150,
                        }
                    ],
                },
                {
                    "title": "Modules and Package Imports",
                    "objective": "Split code into modules and import functions cleanly.",
                    "content_md": (
                        "## Modular design\n"
                        "As projects grow, split features into separate files.\n\n"
                        "## Example\n"
                        "```python\n"
                        "# math_utils.py\n"
                        "def square(x):\n"
                        "    return x * x\n\n"
                        "# main.py\n"
                        "from math_utils import square\n"
                        "print(square(5))\n"
                        "```\n\n"
                        "## Good practices\n"
                        "- Keep related functions together\n"
                        "- Avoid circular imports\n"
                        "- Use explicit imports for readability"
                    ),
                    "quiz": [
                        {
                            "prompt": "Why create modules in Python projects?",
                            "options": [
                                "To organize code and improve maintainability",
                                "To make code slower",
                                "To remove all functions",
                                "To avoid imports entirely",
                            ],
                            "correct_option": 0,
                            "explanation": "Modules structure code and support cleaner maintenance.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Math Utility Module",
                            "prompt": "Create reusable utility functions and import them from a main script.",
                            "starter_code": (
                                "# utils.py\n"
                                "def is_even(n):\n    # TODO\n    pass\n\n"
                                "# app.py\n"
                                "from utils import is_even\n"
                                "print(is_even(10))\n"
                            ),
                            "tests_json": [{"note": "Check import usage and boolean outputs"}],
                            "difficulty": "medium",
                            "xp_reward": 150,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Error Handling and File I/O",
            "description": "Handle runtime errors and work with files safely.",
            "xp_reward": 200,
            "lessons": [
                {
                    "title": "Exceptions and Try/Except",
                    "objective": "Prevent crashes by handling predictable runtime errors.",
                    "content_md": (
                        "## Exceptions\n"
                        "Exceptions occur when runtime operations fail.\n\n"
                        "## Example\n"
                        "```python\n"
                        "try:\n"
                        "    value = int('abc')\n"
                        "except ValueError:\n"
                        "    value = 0\n"
                        "```\n\n"
                        "## Best practice\n"
                        "- Catch specific exceptions\n"
                        "- Keep try block small\n"
                        "- Use finally for cleanup"
                    ),
                    "quiz": [
                        {
                            "prompt": "Why catch specific exceptions?",
                            "options": [
                                "To handle expected failure cases safely",
                                "To hide all program bugs",
                                "To replace all if statements",
                                "To remove traceback forever",
                            ],
                            "correct_option": 0,
                            "explanation": "Specific handling prevents masking unrelated issues.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Safe Integer Parser",
                            "prompt": "Write `safe_int(text, default)` that returns default on invalid input.",
                            "starter_code": "def safe_int(text, default=0):\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Test valid integer and invalid string behavior"}],
                            "difficulty": "medium",
                            "xp_reward": 160,
                        }
                    ],
                },
                {
                    "title": "Working with Files, JSON, and CSV",
                    "objective": "Read and write structured data files for real applications.",
                    "content_md": (
                        "## File operations\n"
                        "Use `with open(...)` to ensure files close safely.\n\n"
                        "## JSON example\n"
                        "```python\n"
                        "import json\n"
                        "data = {'name': 'Ava', 'score': 92}\n"
                        "with open('student.json', 'w') as f:\n"
                        "    json.dump(data, f)\n"
                        "```\n\n"
                        "## CSV example\n"
                        "```python\n"
                        "import csv\n"
                        "with open('marks.csv') as f:\n"
                        "    for row in csv.reader(f):\n"
                        "        print(row)\n"
                        "```"
                    ),
                    "quiz": [
                        {
                            "prompt": "Why use `with open(...)`?",
                            "options": [
                                "It closes files automatically",
                                "It speeds up internet requests",
                                "It prevents JSON creation",
                                "It disables write operations",
                            ],
                            "correct_option": 0,
                            "explanation": "`with` handles cleanup automatically, even on errors.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Student File Reporter",
                            "prompt": "Read student marks from JSON and print average score.",
                            "starter_code": "import json\n\n# TODO: load file and compute average\n",
                            "tests_json": [{"note": "Validate parsing and average computation"}],
                            "difficulty": "medium",
                            "xp_reward": 165,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Advanced Python Patterns",
            "description": "Master concise Python syntax and advanced runtime patterns.",
            "xp_reward": 220,
            "lessons": [
                {
                    "title": "Comprehensions, Lambda, map/filter",
                    "objective": "Write concise transformations with comprehensions and functional helpers.",
                    "content_md": (
                        "## List comprehensions\n"
                        "```python\n"
                        "squares = [x * x for x in range(6)]\n"
                        "```\n\n"
                        "## Lambda with sorted\n"
                        "```python\n"
                        "students = [('Ava', 90), ('Noah', 75)]\n"
                        "ranked = sorted(students, key=lambda x: x[1], reverse=True)\n"
                        "```\n\n"
                        "Use these tools for concise data transformation."
                    ),
                    "quiz": [
                        {
                            "prompt": "When is comprehension preferred?",
                            "options": [
                                "For simple readable transformations",
                                "For writing all business logic",
                                "For file I/O",
                                "For database migrations only",
                            ],
                            "correct_option": 0,
                            "explanation": "Comprehensions are best for short, readable transformations.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Filter and Transform Scores",
                            "prompt": "Return squared values for all even numbers from an input list.",
                            "starter_code": "def even_squares(nums):\n    # TODO\n    pass\n",
                            "tests_json": [{"input": "even_squares([1,2,3,4])", "expected": [4, 16]}],
                            "difficulty": "hard",
                            "xp_reward": 170,
                        }
                    ],
                },
                {
                    "title": "Generators, Decorators, and Context Managers",
                    "objective": "Use lazy iteration and reusable wrappers for cleaner advanced code.",
                    "content_md": (
                        "## Generator example\n"
                        "```python\n"
                        "def countdown(n):\n"
                        "    while n > 0:\n"
                        "        yield n\n"
                        "        n -= 1\n"
                        "```\n\n"
                        "## Decorator example\n"
                        "```python\n"
                        "def log_call(fn):\n"
                        "    def wrapper(*args, **kwargs):\n"
                        "        print('calling', fn.__name__)\n"
                        "        return fn(*args, **kwargs)\n"
                        "    return wrapper\n"
                        "```\n\n"
                        "Generators save memory, decorators add reusable behavior."
                    ),
                    "quiz": [
                        {
                            "prompt": "Main benefit of generators?",
                            "options": [
                                "Lazy value generation and reduced memory usage",
                                "Automatic database indexing",
                                "Permanent variable storage",
                                "UI animation support",
                            ],
                            "correct_option": 0,
                            "explanation": "Generators produce values on demand instead of storing full sequences.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Custom Range Generator",
                            "prompt": "Implement generator `step_range(start, stop, step)` yielding values like range.",
                            "starter_code": "def step_range(start, stop, step):\n    # TODO\n    yield start\n",
                            "tests_json": [{"note": "Verify lazy iteration and step behavior"}],
                            "difficulty": "hard",
                            "xp_reward": 180,
                        }
                    ],
                },
                {
                    "title": "AsyncIO Event Loop and Concurrency Control",
                    "objective": "Understand async execution, task scheduling, and safe concurrency limits.",
                    "content_md": (
                        "## Mental model: one smart coordinator\n"
                        "The event loop is like a traffic controller. Tasks wait while I/O happens, then continue when ready.\n\n"
                        "## Why this matters\n"
                        "Async code improves throughput for network and file workloads.\n\n"
                        "## Example: bounded concurrency\n"
                        "```python\n"
                        "import asyncio\n"
                        "\n"
                        "sem = asyncio.Semaphore(3)\n"
                        "\n"
                        "async def fetch_one(i):\n"
                        "    async with sem:\n"
                        "        await asyncio.sleep(0.2)\n"
                        "        return i\n"
                        "\n"
                        "async def main():\n"
                        "    results = await asyncio.gather(*(fetch_one(i) for i in range(10)))\n"
                        "    print(results)\n"
                        "```\n\n"
                        "Semaphore controls backpressure so your service does not overload downstream systems."
                    ),
                    "quiz": [
                        {
                            "prompt": "What is the main role of the event loop?",
                            "options": [
                                "Schedule and resume awaitable tasks efficiently",
                                "Compile Python to C automatically",
                                "Replace unit tests",
                                "Encrypt every variable in memory",
                            ],
                            "correct_option": 0,
                            "explanation": "The event loop orchestrates coroutine execution and I/O waits.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Bounded Async Worker Pool",
                            "prompt": "Create `async def run_jobs(jobs, limit)` that runs async jobs with a semaphore limit.",
                            "starter_code": "import asyncio\n\nasync def run_jobs(jobs, limit):\n    # TODO: run all jobs with bounded concurrency\n    return []\n",
                            "tests_json": [{"note": "Validate bounded concurrency and full result collection"}],
                            "difficulty": "hard",
                            "xp_reward": 195,
                        }
                    ],
                },
                {
                    "title": "Python Data Model, Dunder Methods, and Descriptors",
                    "objective": "Customize object behavior with special methods and managed attributes.",
                    "content_md": (
                        "## Python data model\n"
                        "Dunder methods define how objects behave with operators and built-ins.\n\n"
                        "## Example\n"
                        "```python\n"
                        "class Vector:\n"
                        "    def __init__(self, x, y):\n"
                        "        self.x = x\n"
                        "        self.y = y\n"
                        "\n"
                        "    def __add__(self, other):\n"
                        "        return Vector(self.x + other.x, self.y + other.y)\n"
                        "\n"
                        "    def __repr__(self):\n"
                        "        return f'Vector({self.x}, {self.y})'\n"
                        "```\n\n"
                        "## Descriptor idea\n"
                        "Descriptors centralize validation logic so repeated field checks stay consistent."
                    ),
                    "quiz": [
                        {
                            "prompt": "What does `__repr__` usually provide?",
                            "options": [
                                "A developer-friendly object representation",
                                "GPU acceleration",
                                "HTTP response caching",
                                "Automatic database migration",
                            ],
                            "correct_option": 0,
                            "explanation": "`__repr__` is typically used for debugging-oriented object display.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Validated Descriptor Field",
                            "prompt": "Implement a descriptor that enforces non-negative numeric values for a model field.",
                            "starter_code": "class NonNegative:\n    # TODO: implement __get__ and __set__\n    pass\n\nclass Product:\n    price = NonNegative()\n",
                            "tests_json": [{"note": "Ensure invalid assignments raise and valid values persist"}],
                            "difficulty": "hard",
                            "xp_reward": 200,
                        }
                    ],
                },
                {
                    "title": "Metaclasses and Runtime Introspection",
                    "objective": "Learn when metaclasses are useful and inspect runtime objects confidently.",
                    "content_md": (
                        "## When to use metaclasses\n"
                        "Use metaclasses only when class creation itself needs rules or automation.\n\n"
                        "## Simple metaclass example\n"
                        "```python\n"
                        "class RequireRun(type):\n"
                        "    def __new__(mcls, name, bases, namespace):\n"
                        "        if 'run' not in namespace:\n"
                        "            raise TypeError('Class must define run()')\n"
                        "        return super().__new__(mcls, name, bases, namespace)\n"
                        "```\n\n"
                        "## Introspection tools\n"
                        "Use `inspect` and `getattr` to analyze call signatures and object capabilities safely."
                    ),
                    "quiz": [
                        {
                            "prompt": "Best use-case for metaclasses?",
                            "options": [
                                "Applying rules at class creation time",
                                "Replacing all function decorators",
                                "Rendering HTML templates",
                                "Parsing CSV files faster",
                            ],
                            "correct_option": 0,
                            "explanation": "Metaclasses are for class-level construction behavior.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Contract-Enforcing Metaclass",
                            "prompt": "Create a metaclass that requires subclasses to define `execute(self)`.",
                            "starter_code": "class RequireExecute(type):\n    # TODO: enforce execute method on class creation\n    pass\n",
                            "tests_json": [{"note": "Verify compliant classes succeed and invalid classes fail early"}],
                            "difficulty": "hard",
                            "xp_reward": 210,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Python APIs and Automation",
            "description": "Connect Python apps to real services and automate repeated tasks.",
            "xp_reward": 230,
            "lessons": [
                {
                    "title": "HTTP Requests and REST APIs",
                    "objective": "Call external APIs and parse JSON responses safely.",
                    "content_md": (
                        "## API calls with requests\n"
                        "```python\n"
                        "import requests\n"
                        "res = requests.get('https://api.github.com')\n"
                        "if res.ok:\n"
                        "    data = res.json()\n"
                        "```\n\n"
                        "## Important checks\n"
                        "- Handle timeouts\n"
                        "- Validate response status\n"
                        "- Guard against missing keys"
                    ),
                    "quiz": [
                        {
                            "prompt": "What should you check before reading API JSON?",
                            "options": [
                                "HTTP status and possible timeout errors",
                                "Only font settings",
                                "GPU temperature",
                                "Terminal color theme",
                            ],
                            "correct_option": 0,
                            "explanation": "Robust API code validates network and status conditions first.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "API Fetch Wrapper",
                            "prompt": "Write `fetch_json(url)` that returns parsed JSON or fallback dict on failure.",
                            "starter_code": "def fetch_json(url):\n    # TODO\n    return {}\n",
                            "tests_json": [{"note": "Test timeout/invalid-status fallback"}],
                            "difficulty": "hard",
                            "xp_reward": 180,
                        }
                    ],
                },
                {
                    "title": "Automation Scripts and Scheduling Basics",
                    "objective": "Build scripts that automate repetitive file and reporting tasks.",
                    "content_md": (
                        "## Automation mindset\n"
                        "Identify repetitive tasks and script them once.\n\n"
                        "## Example: file rename automation\n"
                        "```python\n"
                        "from pathlib import Path\n"
                        "for i, file in enumerate(Path('reports').glob('*.txt')):\n"
                        "    file.rename(Path('reports') / f'report_{i}.txt')\n"
                        "```\n\n"
                        "## Scheduling idea\n"
                        "Use cron/Task Scheduler in deployment to run scripts periodically."
                    ),
                    "quiz": [
                        {
                            "prompt": "Why write automation scripts?",
                            "options": [
                                "To reduce repetitive manual work and human errors",
                                "To avoid Python syntax",
                                "To replace all APIs",
                                "To remove logging",
                            ],
                            "correct_option": 0,
                            "explanation": "Automation improves consistency and saves time.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Mini Cleanup Script",
                            "prompt": "Write a function to move old log files into an archive folder.",
                            "starter_code": "from pathlib import Path\n\ndef archive_logs(path):\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Check folder creation and file movement logic"}],
                            "difficulty": "hard",
                            "xp_reward": 185,
                        }
                    ],
                },
            ],
        },
        {
            "title": "Testing, Debugging, and Code Quality",
            "description": "Ship reliable Python by writing tests, using logs, and refactoring cleanly.",
            "xp_reward": 240,
            "lessons": [
                {
                    "title": "Unit Testing with pytest",
                    "objective": "Write unit tests that verify behavior and prevent regressions.",
                    "content_md": (
                        "## Basic pytest structure\n"
                        "```python\n"
                        "def add(a, b):\n"
                        "    return a + b\n\n"
                        "def test_add():\n"
                        "    assert add(2, 3) == 5\n"
                        "```\n\n"
                        "Tests document expected behavior and catch future regressions."
                    ),
                    "quiz": [
                        {
                            "prompt": "Main goal of unit tests?",
                            "options": [
                                "Verify code behavior and catch regressions",
                                "Increase file size",
                                "Replace production monitoring",
                                "Disable exceptions",
                            ],
                            "correct_option": 0,
                            "explanation": "Unit tests protect behavior during changes.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Test a Utility Function",
                            "prompt": "Write tests for `is_palindrome(text)` covering edge cases.",
                            "starter_code": "def is_palindrome(text):\n    # TODO\n    pass\n",
                            "tests_json": [{"note": "Include mixed case and punctuation cases"}],
                            "difficulty": "hard",
                            "xp_reward": 190,
                        }
                    ],
                },
                {
                    "title": "Debugging, Logging, and Refactoring",
                    "objective": "Diagnose issues faster with logs and improve maintainability through refactoring.",
                    "content_md": (
                        "## Logging basics\n"
                        "```python\n"
                        "import logging\n"
                        "logging.basicConfig(level=logging.INFO)\n"
                        "logging.info('pipeline started')\n"
                        "```\n\n"
                        "## Refactor checklist\n"
                        "- Rename unclear variables\n"
                        "- Split long functions\n"
                        "- Remove duplication\n"
                        "- Keep behavior unchanged while improving structure"
                    ),
                    "quiz": [
                        {
                            "prompt": "Why prefer logging over many print statements in production?",
                            "options": [
                                "Logs support severity levels and structured debugging",
                                "Print is always faster and safer",
                                "Logging disables runtime errors",
                                "Print writes directly to database",
                            ],
                            "correct_option": 0,
                            "explanation": "Logging provides consistent, filterable runtime diagnostics.",
                        }
                    ],
                    "challenges": [
                        {
                            "title": "Refactor and Instrument",
                            "prompt": "Refactor a long function into small helpers and add useful logs.",
                            "starter_code": (
                                "import logging\n\n"
                                "def process_orders(orders):\n"
                                "    # TODO: split into helper functions and add logs\n"
                                "    pass\n"
                            ),
                            "tests_json": [{"note": "Focus on readability and tracing key flow steps"}],
                            "difficulty": "advanced",
                            "xp_reward": 200,
                        }
                    ],
                },
            ],
        },
    ]
)


ACHIEVEMENTS = [
    {
        "code": "first_steps",
        "name": "First Steps",
        "description": "Complete your first lesson.",
        "xp_bonus": 50,
        "icon": "spark",
    },
    {
        "code": "streak_7",
        "name": "7-Day Streak",
        "description": "Learn for seven days in a row.",
        "xp_bonus": 120,
        "icon": "flame",
    },
    {
        "code": "xp_500",
        "name": "XP Collector",
        "description": "Reach 500 XP.",
        "xp_bonus": 100,
        "icon": "bolt",
    },
    {
        "code": "project_finisher",
        "name": "Project Finisher",
        "description": "Complete 10 lessons and submit a project.",
        "xp_bonus": 150,
        "icon": "rocket",
    },
]


DAILY_MISSIONS = [
    {"title": "Complete One Lesson", "description": "Finish one lesson today.", "xp_reward": 20},
    {"title": "Fix One Bug", "description": "Debug one failing code snippet.", "xp_reward": 20},
    {"title": "Take Quiz", "description": "Score at least 70 on a quiz.", "xp_reward": 25},
]


TRACKS = [
    {
        "slug": "school-college-python",
        "name": "School/College Python",
        "description": "Structured Python mastery for academics and semester readiness.",
        "outcome": "Complete textbook-level Python curriculum with graded checkpoints and transcript.",
        "target_audience": "School and college students",
        "premium_only": False,
        "lessons": [
            "Variables and Data Types",
            "Control Flow and Loops",
            "Functions, Parameters, and Return Values",
            "Classes and Objects",
            "Working with Files, JSON, and CSV",
            "Unit Testing with pytest",
        ],
        "milestones": [
            {
                "title": "Fundamentals Checkpoint",
                "description": "Master variable, control flow, and function basics.",
                "required_lessons": 3,
                "required_avg_quiz_score": 70,
                "required_challenges_passed": 2,
                "reward_xp": 150,
            },
            {
                "title": "Semester Ready",
                "description": "Complete academic-level Python with testing and files.",
                "required_lessons": 6,
                "required_avg_quiz_score": 75,
                "required_challenges_passed": 4,
                "reward_xp": 220,
            },
        ],
    },
    {
        "slug": "data-ai-career-track",
        "name": "Data/AI Career Track",
        "description": "End-to-end path from Python foundations to AI and ML workflows.",
        "outcome": "Build portfolio-ready data and AI projects with practical API and model usage.",
        "target_audience": "Aspiring data and AI engineers",
        "premium_only": True,
        "lessons": [
            "NumPy and Arrays",
            "Pandas + Matplotlib",
            "ML Workflow Basics",
            "Prompting and LLM Apps",
            "HTTP Requests and REST APIs",
            "Capstone: AI Study Assistant",
        ],
        "milestones": [
            {
                "title": "Data Foundations",
                "description": "Complete numerical and tabular analytics basics.",
                "required_lessons": 2,
                "required_avg_quiz_score": 70,
                "required_challenges_passed": 2,
                "reward_xp": 180,
            },
            {
                "title": "AI Builder",
                "description": "Ship LLM and ML workflow project outcomes.",
                "required_lessons": 6,
                "required_avg_quiz_score": 78,
                "required_challenges_passed": 5,
                "reward_xp": 300,
            },
        ],
    },
    {
        "slug": "python-interview-prep",
        "name": "Interview Prep Track",
        "description": "Coding interview focused problem-solving, OOP, and optimization patterns.",
        "outcome": "Improve interview readiness with milestone-based algorithm and debugging practice.",
        "target_audience": "Internship and job candidates",
        "premium_only": True,
        "lessons": [
            "Lists, Tuples, Sets, Dicts",
            "Algorithmic Thinking",
            "Inheritance and Polymorphism",
            "Comprehensions, Lambda, map/filter",
            "Generators, Decorators, and Context Managers",
            "Debugging, Logging, and Refactoring",
        ],
        "milestones": [
            {
                "title": "Problem Solving Core",
                "description": "Clear arrays/hashmaps and complexity checkpoints.",
                "required_lessons": 3,
                "required_avg_quiz_score": 72,
                "required_challenges_passed": 3,
                "reward_xp": 170,
            },
            {
                "title": "Interview Simulation Ready",
                "description": "Complete advanced patterns and debugging readiness.",
                "required_lessons": 6,
                "required_avg_quiz_score": 80,
                "required_challenges_passed": 5,
                "reward_xp": 280,
            },
        ],
    },
]


PROMO_CODES = [
    {
        "code": "STUDENT50",
        "description": "50% off for verified students.",
        "discount_percent": 50,
        "student_only": True,
        "max_redemptions": 5000,
    },
    {
        "code": "ANNUAL20",
        "description": "20% off annual plan.",
        "discount_percent": 20,
        "student_only": False,
        "max_redemptions": 10000,
    },
]


def seed_database(db: Session) -> None:
    course = db.scalar(select(Course).where(Course.slug == CURRICULUM["slug"]))
    if not course:
        course = Course(
            slug=CURRICULUM["slug"],
            title=CURRICULUM["title"],
            description=CURRICULUM["description"],
            difficulty=CURRICULUM["difficulty"],
            order_index=1,
            is_published=True,
        )
        db.add(course)
        db.flush()
    else:
        course.title = CURRICULUM["title"]
        course.description = CURRICULUM["description"]
        course.difficulty = CURRICULUM["difficulty"]
        course.is_published = True

    for module_index, module_payload in enumerate(CURRICULUM["modules"], start=1):
        module = db.scalar(
            select(Module).where(
                Module.course_id == course.id,
                Module.title == module_payload["title"],
            )
        )
        if not module:
            module = Module(
                course_id=course.id,
                title=module_payload["title"],
                description=module_payload["description"],
                order_index=module_index,
                xp_reward=module_payload["xp_reward"],
            )
            db.add(module)
            db.flush()
        else:
            module.description = module_payload["description"]
            module.order_index = module_index
            module.xp_reward = module_payload["xp_reward"]

        for lesson_index, lesson_payload in enumerate(module_payload["lessons"], start=1):
            lesson = db.scalar(
                select(Lesson).where(
                    Lesson.module_id == module.id,
                    Lesson.title == lesson_payload["title"],
                )
            )
            if not lesson:
                lesson = Lesson(
                    module_id=module.id,
                    title=lesson_payload["title"],
                    objective=lesson_payload["objective"],
                    content_md=lesson_payload["content_md"],
                    order_index=lesson_index,
                    estimated_minutes=15,
                )
                db.add(lesson)
                db.flush()
            else:
                lesson.objective = lesson_payload["objective"]
                lesson.content_md = lesson_payload["content_md"]
                lesson.order_index = lesson_index
                lesson.estimated_minutes = 15

            existing_quizzes = {
                item.prompt: item
                for item in db.scalars(select(QuizQuestion).where(QuizQuestion.lesson_id == lesson.id)).all()
            }
            for q in lesson_payload["quiz"]:
                quiz = existing_quizzes.get(q["prompt"])
                if not quiz:
                    db.add(
                        QuizQuestion(
                            lesson_id=lesson.id,
                            prompt=q["prompt"],
                            options=q["options"],
                            correct_option=q["correct_option"],
                            explanation=q["explanation"],
                        )
                    )
                else:
                    quiz.options = q["options"]
                    quiz.correct_option = q["correct_option"]
                    quiz.explanation = q["explanation"]

            existing_challenges = {
                item.title: item
                for item in db.scalars(
                    select(CodingChallenge).where(CodingChallenge.lesson_id == lesson.id)
                ).all()
            }
            for challenge in lesson_payload["challenges"]:
                challenge_record = existing_challenges.get(challenge["title"])
                if not challenge_record:
                    db.add(
                        CodingChallenge(
                            lesson_id=lesson.id,
                            title=challenge["title"],
                            prompt=challenge["prompt"],
                            starter_code=challenge["starter_code"],
                            tests_json=challenge["tests_json"],
                            difficulty=challenge["difficulty"],
                            xp_reward=challenge["xp_reward"],
                        )
                    )
                else:
                    challenge_record.prompt = challenge["prompt"]
                    challenge_record.starter_code = challenge["starter_code"]
                    challenge_record.tests_json = challenge["tests_json"]
                    challenge_record.difficulty = challenge["difficulty"]
                    challenge_record.xp_reward = challenge["xp_reward"]

    for achievement in ACHIEVEMENTS:
        record = db.scalar(select(Achievement).where(Achievement.code == achievement["code"]))
        if not record:
            db.add(Achievement(**achievement))
        else:
            record.name = achievement["name"]
            record.description = achievement["description"]
            record.xp_bonus = achievement["xp_bonus"]
            record.icon = achievement["icon"]

    today = date.today()
    for mission in DAILY_MISSIONS:
        record = db.scalar(
            select(DailyMission).where(
                DailyMission.mission_date == today,
                DailyMission.title == mission["title"],
            )
        )
        if not record:
            db.add(DailyMission(mission_date=today, **mission))
        else:
            record.description = mission["description"]
            record.xp_reward = mission["xp_reward"]

    lesson_by_title = {
        item.title: item for item in db.scalars(select(Lesson).order_by(Lesson.id)).all()
    }

    for track_index, track_payload in enumerate(TRACKS, start=1):
        track = db.scalar(select(LearningTrack).where(LearningTrack.slug == track_payload["slug"]))
        if not track:
            track = LearningTrack(
                slug=track_payload["slug"],
                name=track_payload["name"],
                description=track_payload["description"],
                outcome=track_payload["outcome"],
                target_audience=track_payload["target_audience"],
                premium_only=track_payload["premium_only"],
                order_index=track_index,
            )
            db.add(track)
            db.flush()
        else:
            track.name = track_payload["name"]
            track.description = track_payload["description"]
            track.outcome = track_payload["outcome"]
            track.target_audience = track_payload["target_audience"]
            track.premium_only = track_payload["premium_only"]
            track.order_index = track_index

        for lesson_index, lesson_title in enumerate(track_payload["lessons"], start=1):
            lesson = lesson_by_title.get(lesson_title)
            if not lesson:
                continue
            relation = db.scalar(
                select(TrackLesson).where(
                    TrackLesson.track_id == track.id,
                    TrackLesson.lesson_id == lesson.id,
                )
            )
            if not relation:
                db.add(
                    TrackLesson(
                        track_id=track.id,
                        lesson_id=lesson.id,
                        order_index=lesson_index,
                    )
                )
            else:
                relation.order_index = lesson_index

        for milestone_index, milestone_payload in enumerate(track_payload["milestones"], start=1):
            milestone = db.scalar(
                select(TrackMilestone).where(
                    TrackMilestone.track_id == track.id,
                    TrackMilestone.title == milestone_payload["title"],
                )
            )
            if not milestone:
                db.add(
                    TrackMilestone(
                        track_id=track.id,
                        title=milestone_payload["title"],
                        description=milestone_payload["description"],
                        required_lessons=milestone_payload["required_lessons"],
                        required_avg_quiz_score=milestone_payload["required_avg_quiz_score"],
                        required_challenges_passed=milestone_payload["required_challenges_passed"],
                        reward_xp=milestone_payload["reward_xp"],
                        order_index=milestone_index,
                    )
                )
            else:
                milestone.description = milestone_payload["description"]
                milestone.required_lessons = milestone_payload["required_lessons"]
                milestone.required_avg_quiz_score = milestone_payload["required_avg_quiz_score"]
                milestone.required_challenges_passed = milestone_payload["required_challenges_passed"]
                milestone.reward_xp = milestone_payload["reward_xp"]
                milestone.order_index = milestone_index

    for promo in PROMO_CODES:
        record = db.scalar(select(PromoCode).where(PromoCode.code == promo["code"]))
        if not record:
            db.add(PromoCode(**promo))
        else:
            record.description = promo["description"]
            record.discount_percent = promo["discount_percent"]
            record.student_only = promo["student_only"]
            record.max_redemptions = promo["max_redemptions"]
            record.active = True

    db.commit()
