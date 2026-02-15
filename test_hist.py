import requests, json, sys
base = 'http://localhost:8000'

session = requests.Session()

def signup(email, name):
    payload = {'email': email, 'password': 'TestPass123!', 'full_name': name}
    r = session.post(f'{base}/auth/signup', json=payload)
    print('\n== SIGNUP', email, 'status', r.status_code)
    print(r.text)
    try:
        return r.json().get('access_token')
    except Exception:
        return None

try:
    tokenA = signup('usera+test@example.com', 'User A')
    tokenB = signup('userb+test@example.com', 'User B')

    if not tokenA or not tokenB:
        print('Failed to get tokens; aborting')
        sys.exit(1)

    headersA = {'Authorization': f'Bearer {tokenA}'}
    headersB = {'Authorization': f'Bearer {tokenB}'}

    # Send chat as User A
    r = session.post(f'{base}/ai-tutor/chat', json={'message': 'Hello from User A (test)', 'mode': 'general'}, headers=headersA)
    print('\n== CHAT_A', r.status_code)
    print(r.text)

    # Fetch history as User B
    r = session.get(f'{base}/ai-tutor/history', headers=headersB)
    print('\n== HISTORY_B', r.status_code)
    print(r.text)

    # Fetch history as User A
    r = session.get(f'{base}/ai-tutor/history', headers=headersA)
    print('\n== HISTORY_A', r.status_code)
    print(r.text)

except Exception as e:
    print('ERROR', e)
    sys.exit(1)
