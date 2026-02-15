import asyncio
import os
from openai import AsyncOpenAI

# Try different API configurations
configs = [
    # Config 1: Standard Poe API
    {
        "api_key": "A__c0aKjBgQBDLQf4_NqiGhvUNdsAhILIFM69MrzGR0",
        "base_url": "https://api.poe.com/bot/",
        "model": "chat5-2-pro"
    },
    # Config 2: Alternative Poe endpoint
    {
        "api_key": "A__c0aKjBgQBDLQf4_NqiGhvUNdsAhILIFM69MrzGR0",
        "base_url": "https://api.poe.com/",
        "model": "chat5-2-pro"
    },
    # Config 3: Generic API format
    {
        "api_key": "A__c0aKjBgQBDLQf4_NqiGhvUNdsAhILIFM69MrzGR0",
        "base_url": "https://api.poe.com/v1/",
        "model": "chat5-2-pro"
    }
]

async def test_poe_api():
    print("Testing Poe API connection with multiple configurations...")
    
    for i, config in enumerate(configs, 1):
        print(f"\nTrying configuration {i}:")
        print(f"  Base URL: {config['base_url']}")
        print(f"  Model: {config['model']}")
        
        try:
            # Set up client with current config
            client = AsyncOpenAI(
                api_key=config["api_key"],
                base_url=config["base_url"]
            )
            
            # Test the API with a simple request
            response = await client.chat.completions.create(
                model=config["model"],
                messages=[
                    {"role": "user", "content": "Create a simple Python function that adds two numbers. Just provide the code."}
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            if response.choices and len(response.choices) > 0:
                result = response.choices[0].message.content
                print("✅ Poe API is working with this configuration!")
                print("Response:")
                print(result)
                return True, config  # Return successful config
            else:
                print("❌ No response received from Poe API")
                
        except Exception as e:
            print(f"❌ Error with configuration {i}: {e}")
            continue
    
    print("\n❌ All configurations failed")
    return False, None

async def test_practice_generation():
    try:
        print("\nTesting practice problem generation...")
        
        # Test practice problem generation
        response = await client.chat.completions.create(
            model="chat5-2-pro",
            messages=[
                {"role": "user", "content": """Create a Python practice exercise:

Topic: functions
Difficulty: easy

Format your response exactly like this:

**Title:** [Exercise name]

**Problem:** [What the student should do]

**Starter Code:**
```python
[Code template]
```

**Hint:** [Helpful hint without spoiling the solution]

**Learning Goal:** [What they'll learn]"""}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        if response.choices and len(response.choices) > 0:
            result = response.choices[0].message.content
            print("✅ Practice generation successful!")
            print("Generated Practice Problem:")
            print("-" * 50)
            print(result)
            print("-" * 50)
            return True
        else:
            print("❌ No practice problem generated")
            return False
            
    except Exception as e:
        print(f"❌ Error generating practice problem: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("PyPilot Poe API Integration Test")
    print("=" * 60)
    
    # Run tests
    async def run_tests():
        api_works, working_config = await test_poe_api()
        if api_works:
            print(f"\n✅ Working configuration found:")
            print(f"   Base URL: {working_config['base_url']}")
            print(f"   Model: {working_config['model']}")
            await test_practice_generation()
        else:
            print("\n❌ Cannot proceed with practice generation test due to API connection issues.")
            print("\n💡 Troubleshooting suggestions:")
            print("   1. Verify the API key is correct")
            print("   2. Check if the model name 'chat5-2-pro' is correct")
            print("   3. Confirm the base URL 'https://api.poe.com/bot/' is correct")
            print("   4. Ensure you have internet connectivity")
    
    asyncio.run(run_tests())
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)