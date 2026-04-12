import requests
import json

# Test signup
print('=== SIGNUP ===')
r = requests.post('http://127.0.0.1:8001/api/auth/signup', json={'name': 'Ada Lovelace', 'email': 'ada@qantyx.com', 'password': 'test123'})
print(r.status_code, json.dumps(r.json(), indent=2))

# Test login
print('\n=== LOGIN ===')
r = requests.post('http://127.0.0.1:8001/api/auth/login', json={'email': 'ada@qantyx.com', 'password': 'test123'})
data = r.json()
print(r.status_code, json.dumps(data, indent=2))

# Test /me
print('\n=== GET /me ===')
r = requests.get('http://127.0.0.1:8001/api/auth/me', headers={'Authorization': f'Bearer {data["token"]}'})
print(r.status_code, json.dumps(r.json(), indent=2))

# Test simulation
print('\n=== SIMULATE ===')
verilog = 'module counter(input clk, input reset, output reg [3:0] count); always @(posedge clk) begin if (reset) count <= 0; else count <= count + 1; end endmodule'
r = requests.post('http://127.0.0.1:8003/simulate', json={'verilog': verilog})
print(r.status_code, json.dumps(r.json(), indent=2))

# Test optimize
print('\n=== OPTIMIZE ===')
r = requests.post('http://127.0.0.1:8003/optimize', json={'verilog': verilog})
print(r.status_code, json.dumps(r.json(), indent=2))
