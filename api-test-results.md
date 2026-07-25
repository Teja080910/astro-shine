# Astro-Shine API Test Results

Generated: $(date)

## Summary

| All Endpoints | 116 | 18 | 134 |
| All Endpoints | 116 | 18 | 134 |

### POST `/auth/send-email-otp`
**Description:** Send email OTP  
**Auth:** No  
**Request:**
```json
{"email":"testuser@example.com"}
```
**Response (201):**
```json
{
  "message": "OTP sent to email"
}
```
**Status:** PASS


### POST `/auth/check-phone`
**Description:** Check phone  
**Auth:** No  
**Request:**
```json
{"phone":"9999999901"}
```
**Response (201):**
```json
{
  "exists": true
}
```
**Status:** PASS


### POST `/auth/send-phone-otp`
**Description:** Send phone OTP  
**Auth:** No  
**Request:**
```json
{"phone":"9999999901"}
```
**Response (201):**
```json
{
  "message": "OTP sent to phone"
}
```
**Status:** PASS


### POST `/auth/logout`
**Description:** Logout  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
**Status:** PASS


### GET `/users/profile`
**Description:** Get profile  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "role": "user",
  "name": "Admin Updated",
  "email": "testuser@example.com",
  "phone": "9999999901",
  "avatar": null,
  "gender": null,
  "dateOfBirth": null,
  "authProvider": "email",
  "authProviderId": null,
  "fcmToken": null,
  "isActive": true,
  "lastLoginAt": null,
  "onboardingCompleted": false,
  "createdAt": "2026-07-25T12:11:18.631Z",
  "updatedAt": "2026-07-25T06:57:10.666Z",
  "deletedAt": null
}
```
**Status:** PASS


### PUT `/users/profile`
**Description:** Update profile  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"name":"Updated User"}
```
**Response (200):**
```json
{
  "id": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "role": "user",
  "name": "Updated User",
  "email": "testuser@example.com",
  "phone": "9999999901",
  "avatar": null,
  "gender": null,
  "dateOfBirth": null,
  "authProvider": "email",
  "authProviderId": null,
  "fcmToken": null,
  "isActive": true,
  "lastLoginAt": null,
  "onboardingCompleted": false,
  "createdAt": "2026-07-25T12:11:18.631Z",
  "updatedAt": "2026-07-25T06:58:14.412Z",
  "deletedAt": null
}
```
**Status:** PASS


### POST `/users/change-password`
**Description:** Change pw  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"currentPassword":"Test@123","newPassword":"Test@1234"}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```
**Status:** PASS


### POST `/users/change-password`
**Description:** Revert pw  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"currentPassword":"Test@1234","newPassword":"Test@123"}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```
**Status:** PASS


### GET `/users`
**Description:** List users (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "f0caf01f-d792-4cca-8d42-dc7e99a24cd3",
    "role": "astrologer",
    "name": "Aarav Sharma",
    "email": "aarav@astroshine.com",
    "phone": "9812345670",
    "avatar": null,
    "gender": "male",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.208Z",
    "updatedAt": "2026-07-24T02:05:40.208Z",
    "deletedAt": null
  },
  {
    "id": "3b3f1aac-efac-46ef-8537-4e17f26b790a",
    "role": "astrologer",
    "name": "Priya Patel",
    "email": "priya@astroshine.com",
    "phone": "9876543210",
    "avatar": null,
    "gender": "female",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.271Z",
    "updatedAt": "2026-07-24T02:05:40.271Z",
    "deletedAt": null
  },
  {
    "id": "ac97c628-5d26-42a3-9e1d-8e23d1101bcc",
    "role": "astrologer",
    "name": "Rahul Verma",
    "email": "rahul@astroshine.com",
    "phone": "9988776655",
    "avatar": null,
    "gender": "male",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.326Z",
    "updatedAt": "2026-07-24T02:05:40.326Z",
    "deletedAt": null
  },
  {
    "id": "c7a04f8a-4064-49ed-859b-4ef8465df083",
    "role": "astrologer",
    "name": "Ananya Gupta",
    "email": "ananya@astroshine.com",
    "phone": "9765432109",
    "avatar": null,
    "gender": "female",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.379Z",
    "updatedAt": "2026-07-24T02:05:40.379Z",
    "deletedAt": null
  },
  {
    "id": "1fb0dc47-edc5-4fb9-bf9d-a92766582b08",
    "role": "astrologer",
    "name": "Vikram Singh",
    "email": "vikram@astroshine.com",
    "phone": "9654321098",
    "avatar": null,
    "gender": "male",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.434Z",
    "updatedAt": "2026-07-24T02:05:40.434Z",
    "deletedAt": null
  },
  {
    "id": "0b784bae-9be0-411e-9296-739043537e2f",
    "role": "astrologer",
    "name": "Neha Kapoor",
    "email": "neha@astroshine.com",
    "phone": "9543210987",
    "avatar": null,
    "gender": "female",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.488Z",
    "updatedAt": "2026-07-24T02:05:40.488Z",
    "deletedAt": null
  },
  {
    "id": "5bcf77c8-5186-435d-8f88-7f75a7a1ca43",
    "role": "astrologer",
    "name": "Arjun Nair",
    "email": "arjun@astroshine.com",
    "phone": "9432109876",
    "avatar": null,
    "gender": "male",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.541Z",
    "updatedAt": "2026-07-24T02:05:40.541Z",
    "deletedAt": null
  },
  {
    "id": "fda2c7dd-bd5c-4cf0-a221-620b51129bf1",
    "role": "astrologer",
    "name": "Kavita Reddy",
    "email": "kavita@astroshine.com",
    "phone": "9321098765",
    "avatar": null,
    "gender": "female",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.594Z",
    "updatedAt": "2026-07-24T02:05:40.594Z",
    "deletedAt": null
  },
  {
    "id": "2d2f46e7-4d65-43a4-a5c5-1e5bdfbca74b",
    "role": "astrologer",
    "name": "Rohit Joshi",
    "email": "rohit@astroshine.com",
    "phone": "9210987654",
    "avatar": null,
    "gender": "male",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.645Z",
    "updatedAt": "2026-07-24T02:05:40.645Z",
    "deletedAt": null
  },
  {
    "id": "d7cbef9a-c0c2-44b6-81bc-7157e000a04a",
    "role": "astrologer",
    "name": "Sneha Iyer",
    "email": "sneha@astroshine.com",
    "phone": "9109876543",
    "avatar": null,
    "gender": "female",
    "dateOfBirth": "1985-06-15",
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:05:40.695Z",
    "updatedAt": "2026-07-24T02:05:40.695Z",
    "deletedAt": null
  },
  {
    "id": "98be529b-66e9-49b9-b85d-c2cc0d2e8342",
    "role": "astrologer",
    "name": "Teja",
    "email": "tejaastrologer@yopmail.com",
    "phone": "1234567890",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:15:07.754Z",
    "updatedAt": "2026-07-24T02:15:07.754Z",
    "deletedAt": null
  },
  {
    "id": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "role": "user",
    "name": "Updated User",
    "email": "testuser@example.com",
    "phone": "9999999901",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-25T12:11:18.631Z",
    "updatedAt": "2026-07-25T06:58:14.610Z",
    "deletedAt": null
  },
  {
    "id": "c2995424-95a3-4b19-a0d0-463df82ec4fb",
    "role": "admin",
    "name": "Admin",
    "email": "admin@astroshine.com",
    "phone": null,
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:02:12.904Z",
    "updatedAt": "2026-07-24T02:02:12.904Z",
    "deletedAt": null
  },
  {
    "id": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "role": "astrologer",
    "name": "Test Astrologer",
    "email": "astro@astroshine.com",
    "phone": "+919999999999",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:02:22.910Z",
    "updatedAt": "2026-07-24T02:02:22.910Z",
    "deletedAt": null
  },
  {
    "id": "3bfdc14e-34b5-4d14-a188-e6ad61740704",
    "role": "user",
    "name": "Teja user",
    "email": "tejasimma@yopmail.com",
    "phone": "1245486494",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:16:51.063Z",
    "updatedAt": "2026-07-24T02:16:51.063Z",
    "deletedAt": null
  },
  {
    "id": "7af7f994-5500-4290-93eb-cf0739eaf8ce",
    "role": "user",
    "name": "Test User",
    "email": "user@astroshine.com",
    "phone": "+918888888888",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-24T02:02:27.309Z",
    "updatedAt": "2026-07-24T02:02:27.309Z",
    "deletedAt": null
  },
  {
    "id": "eddbd187-163b-4776-a986-c406d152a75f",
    "role": "astrologer",
    "name": "Test Astrologer",
    "email": "testastro@example.com",
    "phone": "9999999902",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-25T12:11:22.906Z",
    "updatedAt": "2026-07-25T12:11:22.906Z",
    "deletedAt": null
  },
  {
    "id": "aaf50893-eddc-433d-816f-c8a27973f024",
    "role": "admin",
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": null,
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-25T12:11:22.958Z",
    "updatedAt": "2026-07-25T12:11:22.958Z",
    "deletedAt": null
  },
  {
    "id": "a1f6c92d-dbe3-4e6c-a5b1-678ad554b8f3",
    "role": "user",
    "name": "Test User",
    "email": "testuser2@example.com",
    "phone": "9999999911",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-25T12:11:29.981Z",
    "updatedAt": "2026-07-25T12:11:29.981Z",
    "deletedAt": null
  },
  {
    "id": "07d2c33a-52bf-4d1d-94b2-34f969ce2a0f",
    "role": "astrologer",
    "name": "Test Astrologer",
    "email": "testastro2@example.com",
    "phone": "9999999912",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-25T12:11:34.965Z",
    "updatedAt": "2026-07-25T12:11:34.965Z",
    "deletedAt": null
  },
  {
    "id": "7421d688-36d6-453c-84dc-8456bf3e28c8",
    "role": "astrologer",
    "name": "Test Astro",
    "email": "testastro3@example.com",
    "phone": "9999999913",
    "avatar": null,
    "gender": null,
    "dateOfBirth": null,
    "authProvider": "email",
    "authProviderId": null,
    "fcmToken": null,
    "isActive": true,
    "lastLoginAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-07-25T12:11:46.136Z",
    "updatedAt": "2026-07-25T12:11:46.136Z",
    "deletedAt": null
  }
]
```
**Status:** PASS


### GET `/users/23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** Get user by ID  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "role": "user",
  "name": "Updated User",
  "email": "testuser@example.com",
  "phone": "9999999901",
  "avatar": null,
  "gender": null,
  "dateOfBirth": null,
  "authProvider": "email",
  "authProviderId": null,
  "fcmToken": null,
  "isActive": true,
  "lastLoginAt": null,
  "onboardingCompleted": false,
  "createdAt": "2026-07-25T12:11:18.631Z",
  "updatedAt": "2026-07-25T06:58:14.610Z",
  "deletedAt": null
}
```
**Status:** PASS


### PUT `/users/23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** Admin update user  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"Admin Updated"}
```
**Response (200):**
```json
{
  "id": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "role": "user",
  "name": "Admin Updated",
  "email": "testuser@example.com",
  "phone": "9999999901",
  "avatar": null,
  "gender": null,
  "dateOfBirth": null,
  "authProvider": "email",
  "authProviderId": null,
  "fcmToken": null,
  "isActive": true,
  "lastLoginAt": null,
  "onboardingCompleted": false,
  "createdAt": "2026-07-25T12:11:18.631Z",
  "updatedAt": "2026-07-25T06:58:14.663Z",
  "deletedAt": null
}
```
**Status:** PASS


### GET `/astrologers`
**Description:** List astrologers  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "userId": "f0caf01f-d792-4cca-8d42-dc7e99a24cd3",
    "bio": "Vedic astrologer with 15+ years of experience in birth chart analysis and predictions.",
    "experience": 15,
    "specialization": [
      "Vedic",
      "Kundli"
    ],
    "languages": [
      "Hindi",
      "English"
    ],
    "skills": [
      "Birth Chart",
      "Predictions",
      "Remedies"
    ],
    "pricePerMin": "15.00",
    "rating": "4.80",
    "totalReviews": 234,
    "chatPricePerMin": "15.00",
    "audioCallPricePerMin": "22.50",
    "videoCallPricePerMin": "30.00",
    "totalChats": 1800,
    "totalAudioCalls": 720,
    "totalVideoCalls": 480,
    "totalCalls": 1200,
    "totalEarnings": "450000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.215Z",
    "updatedAt": "2026-07-24T02:05:40.215Z",
    "name": "Aarav Sharma",
    "isActive": true
  },
  {
    "userId": "3b3f1aac-efac-46ef-8537-4e17f26b790a",
    "bio": "Tarot card reader and numerology expert. Helping people find clarity through cards.",
    "experience": 8,
    "specialization": [
      "Tarot",
      "Numerology"
    ],
    "languages": [
      "Hindi",
      "English",
      "Gujarati"
    ],
    "skills": [
      "Tarot Reading",
      "Numerology",
      "Career Guidance"
    ],
    "pricePerMin": "12.00",
    "rating": "4.60",
    "totalReviews": 189,
    "chatPricePerMin": "12.00",
    "audioCallPricePerMin": "18.00",
    "videoCallPricePerMin": "24.00",
    "totalChats": 1335,
    "totalAudioCalls": 534,
    "totalVideoCalls": 356,
    "totalCalls": 890,
    "totalEarnings": "320000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.275Z",
    "updatedAt": "2026-07-24T02:05:40.275Z",
    "name": "Priya Patel",
    "isActive": true
  },
  {
    "userId": "ac97c628-5d26-42a3-9e1d-8e23d1101bcc",
    "bio": "Palmist and face reader. I can read your life lines and predict your future.",
    "experience": 12,
    "specialization": [
      "Palmistry",
      "Face Reading"
    ],
    "languages": [
      "Hindi",
      "English"
    ],
    "skills": [
      "Palm Reading",
      "Face Reading",
      "Relationship Advice"
    ],
    "pricePerMin": "10.00",
    "rating": "4.50",
    "totalReviews": 156,
    "chatPricePerMin": "10.00",
    "audioCallPricePerMin": "15.00",
    "videoCallPricePerMin": "20.00",
    "totalChats": 1125,
    "totalAudioCalls": 450,
    "totalVideoCalls": 300,
    "totalCalls": 750,
    "totalEarnings": "280000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "offline",
    "createdAt": "2026-07-24T02:05:40.329Z",
    "updatedAt": "2026-07-24T02:05:40.329Z",
    "name": "Rahul Verma",
    "isActive": true
  },
  {
    "userId": "c7a04f8a-4064-49ed-859b-4ef8465df083",
    "bio": "Specialist in love and relationship astrology. Helping couples find harmony.",
    "experience": 6,
    "specialization": [
      "Love Astrology",
      "Relationship"
    ],
    "languages": [
      "Hindi",
      "English",
      "Marathi"
    ],
    "skills": [
      "Love Predictions",
      "Compatibility",
      "Marriage Guidance"
    ],
    "pricePerMin": "8.00",
    "rating": "4.30",
    "totalReviews": 98,
    "chatPricePerMin": "8.00",
    "audioCallPricePerMin": "12.00",
    "videoCallPricePerMin": "16.00",
    "totalChats": 780,
    "totalAudioCalls": 312,
    "totalVideoCalls": 208,
    "totalCalls": 520,
    "totalEarnings": "150000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.382Z",
    "updatedAt": "2026-07-24T02:05:40.382Z",
    "name": "Ananya Gupta",
    "isActive": true
  },
  {
    "userId": "1fb0dc47-edc5-4fb9-bf9d-a92766582b08",
    "bio": "Expert in Vastu and gemstone recommendations. Transform your living spaces.",
    "experience": 20,
    "specialization": [
      "Vastu",
      "Gemology"
    ],
    "languages": [
      "Hindi",
      "English",
      "Punjabi"
    ],
    "skills": [
      "Vastu Correction",
      "Gemstone Advice",
      "Business Astrology"
    ],
    "pricePerMin": "20.00",
    "rating": "4.90",
    "totalReviews": 312,
    "chatPricePerMin": "20.00",
    "audioCallPricePerMin": "30.00",
    "videoCallPricePerMin": "40.00",
    "totalChats": 2250,
    "totalAudioCalls": 900,
    "totalVideoCalls": 600,
    "totalCalls": 1500,
    "totalEarnings": "680000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.437Z",
    "updatedAt": "2026-07-24T02:05:40.437Z",
    "name": "Vikram Singh",
    "isActive": true
  },
  {
    "userId": "0b784bae-9be0-411e-9296-739043537e2f",
    "bio": "Muhurat specialist and spiritual healer. Find the perfect time for your events.",
    "experience": 10,
    "specialization": [
      "Muhurat",
      "Spiritual Healing"
    ],
    "languages": [
      "Hindi",
      "English"
    ],
    "skills": [
      "Muhurat Fixing",
      "Energy Healing",
      "Meditation"
    ],
    "pricePerMin": "12.00",
    "rating": "4.70",
    "totalReviews": 178,
    "chatPricePerMin": "12.00",
    "audioCallPricePerMin": "18.00",
    "videoCallPricePerMin": "24.00",
    "totalChats": 1380,
    "totalAudioCalls": 552,
    "totalVideoCalls": 368,
    "totalCalls": 920,
    "totalEarnings": "380000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "offline",
    "createdAt": "2026-07-24T02:05:40.490Z",
    "updatedAt": "2026-07-24T02:05:40.490Z",
    "name": "Neha Kapoor",
    "isActive": true
  },
  {
    "userId": "5bcf77c8-5186-435d-8f88-7f75a7a1ca43",
    "bio": "Nadi astrologer and past life regression therapist.",
    "experience": 18,
    "specialization": [
      "Nadi Astrology",
      "Past Life"
    ],
    "languages": [
      "Malayalam",
      "Hindi",
      "English",
      "Tamil"
    ],
    "skills": [
      "Nadi Reading",
      "Past Life Regression",
      "Karma Analysis"
    ],
    "pricePerMin": "25.00",
    "rating": "4.90",
    "totalReviews": 267,
    "chatPricePerMin": "25.00",
    "audioCallPricePerMin": "37.50",
    "videoCallPricePerMin": "50.00",
    "totalChats": 1650,
    "totalAudioCalls": 660,
    "totalVideoCalls": 440,
    "totalCalls": 1100,
    "totalEarnings": "720000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.543Z",
    "updatedAt": "2026-07-24T02:05:40.543Z",
    "name": "Arjun Nair",
    "isActive": true
  },
  {
    "userId": "fda2c7dd-bd5c-4cf0-a221-620b51129bf1",
    "bio": "Astro-psychologist combining astrology with modern psychology.",
    "experience": 7,
    "specialization": [
      "Astro-Psychology",
      "Career Astrology"
    ],
    "languages": [
      "Telugu",
      "Hindi",
      "English"
    ],
    "skills": [
      "Psychological Astrology",
      "Career Guidance",
      "Personal Growth"
    ],
    "pricePerMin": "10.00",
    "rating": "4.40",
    "totalReviews": 134,
    "chatPricePerMin": "10.00",
    "audioCallPricePerMin": "15.00",
    "videoCallPricePerMin": "20.00",
    "totalChats": 1020,
    "totalAudioCalls": 408,
    "totalVideoCalls": 272,
    "totalCalls": 680,
    "totalEarnings": "210000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.596Z",
    "updatedAt": "2026-07-24T02:05:40.596Z",
    "name": "Kavita Reddy",
    "isActive": true
  },
  {
    "userId": "2d2f46e7-4d65-43a4-a5c5-1e5bdfbca74b",
    "bio": "KP and horary astrologer. Quick and accurate predictions.",
    "experience": 14,
    "specialization": [
      "KP Astrology",
      "Horary"
    ],
    "languages": [
      "Hindi",
      "English",
      "Marathi"
    ],
    "skills": [
      "KP System",
      "Horary Predictions",
      "Stock Market Astrology"
    ],
    "pricePerMin": "18.00",
    "rating": "4.70",
    "totalReviews": 201,
    "chatPricePerMin": "18.00",
    "audioCallPricePerMin": "27.00",
    "videoCallPricePerMin": "36.00",
    "totalChats": 1470,
    "totalAudioCalls": 588,
    "totalVideoCalls": 392,
    "totalCalls": 980,
    "totalEarnings": "510000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "offline",
    "createdAt": "2026-07-24T02:05:40.647Z",
    "updatedAt": "2026-07-24T02:05:40.647Z",
    "name": "Rohit Joshi",
    "isActive": true
  },
  {
    "userId": "d7cbef9a-c0c2-44b6-81bc-7157e000a04a",
    "bio": "New age astrologer specializing in crystal healing and cosmic guidance.",
    "experience": 5,
    "specialization": [
      "Crystal Healing",
      "Cosmic Guidance"
    ],
    "languages": [
      "Tamil",
      "English",
      "Hindi"
    ],
    "skills": [
      "Crystal Therapy",
      "Chakra Balancing",
      "Intuitive Reading"
    ],
    "pricePerMin": "7.00",
    "rating": "4.20",
    "totalReviews": 76,
    "chatPricePerMin": "7.00",
    "audioCallPricePerMin": "10.50",
    "videoCallPricePerMin": "14.00",
    "totalChats": 615,
    "totalAudioCalls": 246,
    "totalVideoCalls": 164,
    "totalCalls": 410,
    "totalEarnings": "95000.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "online",
    "createdAt": "2026-07-24T02:05:40.698Z",
    "updatedAt": "2026-07-24T02:05:40.698Z",
    "name": "Sneha Iyer",
    "isActive": true
  },
  {
    "userId": "98be529b-66e9-49b9-b85d-c2cc0d2e8342",
    "bio": null,
    "experience": 0,
    "specialization": [],
    "languages": [],
    "skills": [],
    "pricePerMin": "0.00",
    "rating": "0.00",
    "totalReviews": 0,
    "chatPricePerMin": "0.00",
    "audioCallPricePerMin": "0.00",
    "videoCallPricePerMin": "0.00",
    "totalChats": 0,
    "totalAudioCalls": 14,
    "totalVideoCalls": 4,
    "totalCalls": 18,
    "totalEarnings": "0.00",
    "verificationStatus": "approved",
    "verificationDoc": null,
    "verificationNote": "",
    "onlineStatus": "offline",
    "createdAt": "2026-07-24T02:15:07.757Z",
    "updatedAt": "2026-07-24T19:35:33.547Z",
    "name": "Teja",
    "isActive": true
  },
  {
    "userId": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "bio": null,
    "experience": 5,
    "specialization": [
      "Vedic"
    ],
    "languages": [
      "Hindi",
      "English"
    ],
    "skills": [
      "Birth Chart",
      "Predictions"
    ],
    "pricePerMin": "10.00",
    "rating": "0.00",
    "totalReviews": 0,
    "chatPricePerMin": "8.00",
    "audioCallPricePerMin": "12.00",
    "videoCallPricePerMin": "15.00",
    "totalChats": 0,
    "totalAudioCalls": 0,
    "totalVideoCalls": 0,
    "totalCalls": 0,
    "totalEarnings": "0.00",
    "verificationStatus": "pending",
    "verificationDoc": null,
    "verificationNote": null,
    "onlineStatus": "offline",
    "createdAt": "2026-07-24T02:02:22.916Z",
    "updatedAt": "2026-07-24T02:02:22.916Z",
    "name": "Test Astrologer",
    "isActive": true
  }
]
```
**Status:** PASS


### GET `/astrologers/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** Get astrologer  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json

```
**Status:** PASS


### PUT `/astrologers/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** Update astrologer  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
{"bio":"Updated bio"}
```
**Response (200):**
```json

```
**Status:** PASS


### PUT `/astrologers/eddbd187-163b-4776-a986-c406d152a75f/online-status`
**Description:** Online status  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
{"isOnline":true}
```
**Response (200):**
```json

```
**Status:** PASS


### POST `/astrologers/eddbd187-163b-4776-a986-c406d152a75f/verify`
**Description:** Verify (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"verified":true}
```
**Response (201):**
```json

```
**Status:** PASS


### POST `/astrologers/eddbd187-163b-4776-a986-c406d152a75f/feedback`
**Description:** Submit feedback  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"ratings":5,"comment":"Great!"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:14.767Z",
  "path": "/api/v1/astrologers/eddbd187-163b-4776-a986-c406d152a75f/feedback"
}
```
**Status:** FAIL


### GET `/astrologers/eddbd187-163b-4776-a986-c406d152a75f/feedback`
**Description:** Get feedback  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/admins`
**Description:** List admins  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "userId": "c2995424-95a3-4b19-a0d0-463df82ec4fb",
    "role": "admin",
    "createdAt": "2026-07-24T02:02:12.910Z",
    "updatedAt": "2026-07-24T02:02:12.910Z"
  },
  {
    "userId": "aaf50893-eddc-433d-816f-c8a27973f024",
    "role": "admin",
    "createdAt": "2026-07-25T12:11:22.960Z",
    "updatedAt": "2026-07-25T12:11:22.960Z"
  }
]
```
**Status:** PASS


### GET `/admins/dashboard-stats`
**Description:** Dashboard stats  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "totalUsers": 21,
  "totalAstrologers": 12,
  "totalDeposits": 0,
  "platformRevenue": 0,
  "processedWithdrawals": 0,
  "pendingWithdrawalsCount": 0,
  "pendingWithdrawalsAmount": 0,
  "activeCalls": 3,
  "recentTransactions": [],
  "pendingWithdrawals": [],
  "pendingAstrologers": [
    {
      "userId": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
      "bio": null,
      "experience": 5,
      "specialization": [
        "Vedic"
      ],
      "languages": [
        "Hindi",
        "English"
      ],
      "skills": [
        "Birth Chart",
        "Predictions"
      ],
      "pricePerMin": "10.00",
      "rating": "0.00",
      "totalReviews": 0,
      "chatPricePerMin": "8.00",
      "audioCallPricePerMin": "12.00",
      "videoCallPricePerMin": "15.00",
      "totalChats": 0,
      "totalAudioCalls": 0,
      "totalVideoCalls": 0,
      "totalCalls": 0,
      "totalEarnings": "0.00",
      "verificationStatus": "pending",
      "verificationDoc": null,
      "verificationNote": null,
      "onlineStatus": "offline",
      "createdAt": "2026-07-24T02:02:22.916Z",
      "updatedAt": "2026-07-24T02:02:22.916Z"
    }
  ]
}
```
**Status:** PASS


### GET `/admins/revenue-chart`
**Description:** Revenue chart  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "deposits": [],
  "platformFees": []
}
```
**Status:** PASS


### GET `/admins/revenue/transactions`
**Description:** Revenue transactions  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```
**Status:** PASS


### GET `/admins/revenue/summary`
**Description:** Revenue summary  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "totalDeposits": 0,
  "totalCallCharges": 0,
  "totalChatCharges": 0,
  "totalPlatformFees": 0,
  "totalCommissionsPaid": 0,
  "netRevenue": 0
}
```
**Status:** PASS


### GET `/admins/aaf50893-eddc-433d-816f-c8a27973f024`
**Description:** Get admin  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "userId": "aaf50893-eddc-433d-816f-c8a27973f024",
  "role": "admin",
  "createdAt": "2026-07-25T12:11:22.960Z",
  "updatedAt": "2026-07-25T12:11:22.960Z"
}
```
**Status:** PASS


### GET `/wallet`
**Description:** Get wallet  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "a36b7603-2dee-4281-9a6a-2f4e8d14d8fc",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "astrologerId": null,
  "adminId": null,
  "balance": "0.00",
  "totalAdded": "0.00",
  "totalDeducted": "0.00",
  "currency": "INR",
  "createdAt": "2026-07-25T12:11:18.634Z",
  "updatedAt": "2026-07-25T12:11:18.634Z"
}
```
**Status:** PASS


### POST `/wallet/add-funds`
**Description:** Add funds  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"amount":1000}
```
**Response (201):**
```json

```
**Status:** PASS


### GET `/wallet/all`
**Description:** All wallets (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "b8914346-ce2f-4feb-b41b-d5183fb5efa0",
    "userId": "a1f6c92d-dbe3-4e6c-a5b1-678ad554b8f3",
    "astrologerId": null,
    "adminId": null,
    "balance": "0.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-25T12:11:30.004Z",
    "updatedAt": "2026-07-25T12:11:30.004Z"
  },
  {
    "id": "18a89cde-bdec-49f4-9b0b-638db003ca34",
    "userId": "aaf50893-eddc-433d-816f-c8a27973f024",
    "astrologerId": null,
    "adminId": "aaf50893-eddc-433d-816f-c8a27973f024",
    "balance": "0.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-25T12:11:22.962Z",
    "updatedAt": "2026-07-25T12:11:22.962Z"
  },
  {
    "id": "a36b7603-2dee-4281-9a6a-2f4e8d14d8fc",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "adminId": null,
    "balance": "0.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-25T12:11:18.634Z",
    "updatedAt": "2026-07-25T12:11:18.634Z"
  },
  {
    "id": "19ce0903-99e0-42bf-98f1-c34f36112050",
    "userId": "3bfdc14e-34b5-4d14-a188-e6ad61740704",
    "astrologerId": null,
    "adminId": null,
    "balance": "1000.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:16:51.066Z",
    "updatedAt": "2026-07-24T02:16:51.066Z"
  },
  {
    "id": "dbb9c4ad-26ae-4666-af58-cf53ec10d523",
    "userId": "98be529b-66e9-49b9-b85d-c2cc0d2e8342",
    "astrologerId": "98be529b-66e9-49b9-b85d-c2cc0d2e8342",
    "adminId": null,
    "balance": "0.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:15:07.759Z",
    "updatedAt": "2026-07-24T02:15:07.759Z"
  },
  {
    "id": "0f99e805-0253-4fb9-a899-ca69ff3294d0",
    "userId": null,
    "astrologerId": "d7cbef9a-c0c2-44b6-81bc-7157e000a04a",
    "adminId": null,
    "balance": "1964.00",
    "totalAdded": "205532.00",
    "totalDeducted": "123068.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.738Z",
    "updatedAt": "2026-07-24T02:05:40.738Z"
  },
  {
    "id": "e2a6e740-918f-457e-98c4-85c5b61ee8f4",
    "userId": null,
    "astrologerId": "2d2f46e7-4d65-43a4-a5c5-1e5bdfbca74b",
    "adminId": null,
    "balance": "9548.00",
    "totalAdded": "78183.00",
    "totalDeducted": "96605.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.737Z",
    "updatedAt": "2026-07-24T02:05:40.737Z"
  },
  {
    "id": "227f6d9d-08d7-4700-95b9-d4731d51fc26",
    "userId": null,
    "astrologerId": "fda2c7dd-bd5c-4cf0-a221-620b51129bf1",
    "adminId": null,
    "balance": "38242.00",
    "totalAdded": "127051.00",
    "totalDeducted": "131785.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.736Z",
    "updatedAt": "2026-07-24T02:05:40.736Z"
  },
  {
    "id": "19d3b329-ea3e-4c57-8c48-66b0fc86f88a",
    "userId": null,
    "astrologerId": "5bcf77c8-5186-435d-8f88-7f75a7a1ca43",
    "adminId": null,
    "balance": "1116.00",
    "totalAdded": "112387.00",
    "totalDeducted": "100463.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.735Z",
    "updatedAt": "2026-07-24T02:05:40.735Z"
  },
  {
    "id": "7dc98e3a-7a84-4816-acda-69bbdfe3a2b4",
    "userId": null,
    "astrologerId": "0b784bae-9be0-411e-9296-739043537e2f",
    "adminId": null,
    "balance": "38516.00",
    "totalAdded": "229243.00",
    "totalDeducted": "72462.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.734Z",
    "updatedAt": "2026-07-24T02:05:40.734Z"
  },
  {
    "id": "0c0d0693-6304-43b8-9b1d-9f96b2777c94",
    "userId": null,
    "astrologerId": "1fb0dc47-edc5-4fb9-bf9d-a92766582b08",
    "adminId": null,
    "balance": "1552.00",
    "totalAdded": "72674.00",
    "totalDeducted": "113819.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.733Z",
    "updatedAt": "2026-07-24T02:05:40.733Z"
  },
  {
    "id": "233df735-c4e3-4893-8503-16bbb91fc6ad",
    "userId": null,
    "astrologerId": "c7a04f8a-4064-49ed-859b-4ef8465df083",
    "adminId": null,
    "balance": "49091.00",
    "totalAdded": "172472.00",
    "totalDeducted": "73243.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.732Z",
    "updatedAt": "2026-07-24T02:05:40.732Z"
  },
  {
    "id": "96a712a7-46b2-4a3b-8177-273952d262a2",
    "userId": null,
    "astrologerId": "ac97c628-5d26-42a3-9e1d-8e23d1101bcc",
    "adminId": null,
    "balance": "36717.00",
    "totalAdded": "220844.00",
    "totalDeducted": "152458.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.731Z",
    "updatedAt": "2026-07-24T02:05:40.731Z"
  },
  {
    "id": "90f0461a-260f-461b-b2d4-0e11ea439f3d",
    "userId": null,
    "astrologerId": "3b3f1aac-efac-46ef-8537-4e17f26b790a",
    "adminId": null,
    "balance": "21077.00",
    "totalAdded": "174071.00",
    "totalDeducted": "43553.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.729Z",
    "updatedAt": "2026-07-24T02:05:40.729Z"
  },
  {
    "id": "1849f669-26e0-4ec0-99e2-242ce9dce04e",
    "userId": null,
    "astrologerId": "f0caf01f-d792-4cca-8d42-dc7e99a24cd3",
    "adminId": null,
    "balance": "50392.00",
    "totalAdded": "248830.00",
    "totalDeducted": "124750.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:05:40.727Z",
    "updatedAt": "2026-07-24T02:05:40.727Z"
  },
  {
    "id": "dc7dd03d-2fd9-4aba-996c-8e6d097f8bf0",
    "userId": "7af7f994-5500-4290-93eb-cf0739eaf8ce",
    "astrologerId": null,
    "adminId": null,
    "balance": "1000.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:02:27.317Z",
    "updatedAt": "2026-07-24T02:02:27.317Z"
  },
  {
    "id": "4325ad95-cea9-40bd-9b0d-526e2d40072d",
    "userId": null,
    "astrologerId": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "adminId": null,
    "balance": "0.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:02:22.919Z",
    "updatedAt": "2026-07-24T02:02:22.919Z"
  },
  {
    "id": "b493ff04-c3bc-4411-8194-75e839a6a40b",
    "userId": "c2995424-95a3-4b19-a0d0-463df82ec4fb",
    "astrologerId": null,
    "adminId": "c2995424-95a3-4b19-a0d0-463df82ec4fb",
    "balance": "0.00",
    "totalAdded": "0.00",
    "totalDeducted": "0.00",
    "currency": "INR",
    "createdAt": "2026-07-24T02:02:12.912Z",
    "updatedAt": "2026-07-24T02:02:12.912Z"
  }
]
```
**Status:** PASS


### GET `/transactions/my`
**Description:** My transactions  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/transactions`
**Description:** All transactions (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/kundli?userId=23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** Get kundli  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "5a39aaec-b722-4fd0-975f-5fd757468bb0",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "name": "Test",
    "gender": "male",
    "dateOfBirth": "1990-01-15",
    "timeOfBirth": "10:30:00",
    "placeOfBirth": "Mumbai",
    "latitude": null,
    "longitude": null,
    "timezone": null,
    "chartData": null,
    "planetaryPositions": null,
    "createdAt": "2026-07-25T12:27:11.083Z"
  }
]
```
**Status:** PASS


### POST `/kundli`
**Description:** Create kundli  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"name":"Test","gender":"male","dateOfBirth":"1990-01-15","timeOfBirth":"10:30","placeOfBirth":"Mumbai"}
```
**Response (201):**
```json
{
  "id": "dbd47a9b-3ed9-49ee-9485-b1d46ace27cd",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "name": "Test",
  "gender": "male",
  "dateOfBirth": "1990-01-15",
  "timeOfBirth": "10:30:00",
  "placeOfBirth": "Mumbai",
  "latitude": null,
  "longitude": null,
  "timezone": null,
  "chartData": null,
  "planetaryPositions": null,
  "createdAt": "2026-07-25T12:28:15.023Z"
}
```
**Status:** PASS


### GET `/matchmaking?userId=23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** Get matchmaking  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/matchmaking`
**Description:** Create matchmaking  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266","person1Name":"A","person1Dob":"1990-01-15","person1Tob":"10:30","person1Pob":"Mumbai","person2Name":"B","person2Dob":"1992-06-20","person2Tob":"14:00","person2Pob":"Delhi"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.057Z",
  "path": "/api/v1/matchmaking"
}
```
**Status:** FAIL


### GET `/horoscope`
**Description:** List horoscopes  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "3a332a29-f29d-4708-a371-30efcac79783",
    "zodiacSign": "Aries",
    "date": "2026-07-23",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 17,
    "luckyColor": "Orange",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.748Z"
  },
  {
    "id": "5248b274-5392-4519-bbff-f6ef7eb3c75f",
    "zodiacSign": "Taurus",
    "date": "2026-07-23",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 24,
    "luckyColor": "Purple",
    "mood": "Reflective",
    "createdAt": "2026-07-24T02:05:40.752Z"
  },
  {
    "id": "3ab3c60c-42a5-4067-b916-e5dd8f4add29",
    "zodiacSign": "Gemini",
    "date": "2026-07-23",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 39,
    "luckyColor": "White",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.753Z"
  },
  {
    "id": "c3536b35-0ecc-4932-888d-9a1c835b3f03",
    "zodiacSign": "Cancer",
    "date": "2026-07-23",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 19,
    "luckyColor": "Green",
    "mood": "Ambitious",
    "createdAt": "2026-07-24T02:05:40.755Z"
  },
  {
    "id": "853c75ed-6ebb-4892-acf7-bdbcf8ab16e3",
    "zodiacSign": "Leo",
    "date": "2026-07-23",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 71,
    "luckyColor": "Purple",
    "mood": "Reflective",
    "createdAt": "2026-07-24T02:05:40.756Z"
  },
  {
    "id": "c6ee16ea-2d70-4618-a342-5b90a3bda344",
    "zodiacSign": "Virgo",
    "date": "2026-07-23",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 58,
    "luckyColor": "White",
    "mood": "Ambitious",
    "createdAt": "2026-07-24T02:05:40.757Z"
  },
  {
    "id": "d5286897-cbcb-4057-a6e2-1441b797a06e",
    "zodiacSign": "Libra",
    "date": "2026-07-23",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 58,
    "luckyColor": "Pink",
    "mood": "Focused",
    "createdAt": "2026-07-24T02:05:40.759Z"
  },
  {
    "id": "eaac9fab-d915-4c8f-93ad-2b9c772d87eb",
    "zodiacSign": "Scorpio",
    "date": "2026-07-23",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 86,
    "luckyColor": "Purple",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.763Z"
  },
  {
    "id": "d920c10d-70fa-4385-808f-1701809f8b58",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-23",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 65,
    "luckyColor": "Orange",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.765Z"
  },
  {
    "id": "c2e5d14c-ce91-476a-9c68-077be0f6194a",
    "zodiacSign": "Capricorn",
    "date": "2026-07-23",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 29,
    "luckyColor": "Green",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.767Z"
  },
  {
    "id": "53a7233c-e4a5-41c3-bd41-09cdcb120a9f",
    "zodiacSign": "Aquarius",
    "date": "2026-07-23",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 54,
    "luckyColor": "Red",
    "mood": "Ambitious",
    "createdAt": "2026-07-24T02:05:40.768Z"
  },
  {
    "id": "e355b74d-c3a7-4949-b177-3ece6f0df62a",
    "zodiacSign": "Pisces",
    "date": "2026-07-23",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 39,
    "luckyColor": "Green",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.769Z"
  },
  {
    "id": "e1990e9e-30c3-4e88-b068-c19e471c8b5f",
    "zodiacSign": "Aries",
    "date": "2026-07-24",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 91,
    "luckyColor": "White",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.771Z"
  },
  {
    "id": "c0062e28-03c6-41c6-bef2-8ae7503ef5c2",
    "zodiacSign": "Taurus",
    "date": "2026-07-24",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 2,
    "luckyColor": "White",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.772Z"
  },
  {
    "id": "244b5d4c-8203-4c22-b3ab-d8438f770bf9",
    "zodiacSign": "Gemini",
    "date": "2026-07-24",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 60,
    "luckyColor": "Silver",
    "mood": "Curious",
    "createdAt": "2026-07-24T02:05:40.775Z"
  },
  {
    "id": "329c091a-e1c1-4025-bde0-295dfa941b9f",
    "zodiacSign": "Cancer",
    "date": "2026-07-24",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 2,
    "luckyColor": "Orange",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.776Z"
  },
  {
    "id": "7a37da05-8eef-4c35-8895-cc222fa6a791",
    "zodiacSign": "Leo",
    "date": "2026-07-24",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 22,
    "luckyColor": "Orange",
    "mood": "Ambitious",
    "createdAt": "2026-07-24T02:05:40.777Z"
  },
  {
    "id": "f57d4a8d-c1c6-45a8-92f1-dc8432635482",
    "zodiacSign": "Virgo",
    "date": "2026-07-24",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 4,
    "luckyColor": "Yellow",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.778Z"
  },
  {
    "id": "72e079b4-6188-4024-92c8-a2777ddd4e36",
    "zodiacSign": "Libra",
    "date": "2026-07-24",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 13,
    "luckyColor": "Black",
    "mood": "Reflective",
    "createdAt": "2026-07-24T02:05:40.780Z"
  },
  {
    "id": "aa491f66-d319-4969-b171-2b0feb530d2d",
    "zodiacSign": "Scorpio",
    "date": "2026-07-24",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 30,
    "luckyColor": "Pink",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.781Z"
  },
  {
    "id": "a03cfc96-1d5c-44f4-952c-3ee7ad0d64c2",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-24",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 62,
    "luckyColor": "Pink",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.783Z"
  },
  {
    "id": "60220389-e168-4bdb-82d5-83effd40f8ee",
    "zodiacSign": "Capricorn",
    "date": "2026-07-24",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 39,
    "luckyColor": "Black",
    "mood": "Focused",
    "createdAt": "2026-07-24T02:05:40.784Z"
  },
  {
    "id": "c8260334-1d85-452d-8582-6d36b872f4e3",
    "zodiacSign": "Aquarius",
    "date": "2026-07-24",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 100,
    "luckyColor": "Red",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.785Z"
  },
  {
    "id": "6efe9065-659f-402a-9c0e-6494384d390a",
    "zodiacSign": "Pisces",
    "date": "2026-07-24",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 16,
    "luckyColor": "Purple",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.786Z"
  },
  {
    "id": "5449add8-d5c1-454c-87e1-7b611c98ee6b",
    "zodiacSign": "Aries",
    "date": "2026-07-25",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 33,
    "luckyColor": "Red",
    "mood": "Reflective",
    "createdAt": "2026-07-24T02:05:40.787Z"
  },
  {
    "id": "d56b6d81-381d-4a8f-890f-0748c710b88c",
    "zodiacSign": "Taurus",
    "date": "2026-07-25",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 2,
    "luckyColor": "Black",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.790Z"
  },
  {
    "id": "32da2ac4-8ce2-4088-8210-04971360c0c8",
    "zodiacSign": "Gemini",
    "date": "2026-07-25",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 62,
    "luckyColor": "Green",
    "mood": "Reflective",
    "createdAt": "2026-07-24T02:05:40.791Z"
  },
  {
    "id": "e4e0e580-79b8-4e28-9456-7d5cb806b3c6",
    "zodiacSign": "Cancer",
    "date": "2026-07-25",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 36,
    "luckyColor": "Black",
    "mood": "Curious",
    "createdAt": "2026-07-24T02:05:40.792Z"
  },
  {
    "id": "51a0e3e2-ca30-465a-a525-be01c8c09afa",
    "zodiacSign": "Leo",
    "date": "2026-07-25",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 44,
    "luckyColor": "Orange",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.793Z"
  },
  {
    "id": "3608fcfb-dff7-4718-80af-066f79f65da1",
    "zodiacSign": "Virgo",
    "date": "2026-07-25",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 80,
    "luckyColor": "White",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.794Z"
  },
  {
    "id": "e480af58-7c8b-4e94-96f8-1afd06df6322",
    "zodiacSign": "Libra",
    "date": "2026-07-25",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 25,
    "luckyColor": "Gold",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.795Z"
  },
  {
    "id": "a1994c42-446d-487b-aec1-34a9883e0cf3",
    "zodiacSign": "Scorpio",
    "date": "2026-07-25",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 94,
    "luckyColor": "Blue",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.796Z"
  },
  {
    "id": "35ae6d16-de4e-4cec-b9e3-7605a3924224",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-25",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 9,
    "luckyColor": "Black",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.798Z"
  },
  {
    "id": "676659f7-38e9-4c65-a659-427e48e22092",
    "zodiacSign": "Capricorn",
    "date": "2026-07-25",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 59,
    "luckyColor": "Green",
    "mood": "Ambitious",
    "createdAt": "2026-07-24T02:05:40.800Z"
  },
  {
    "id": "6ef2c755-cddd-48f6-b95e-30e8c1674a81",
    "zodiacSign": "Aquarius",
    "date": "2026-07-25",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 61,
    "luckyColor": "Black",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.801Z"
  },
  {
    "id": "b07ebc86-0d18-4d89-a5a0-1e7fc43a42c4",
    "zodiacSign": "Pisces",
    "date": "2026-07-25",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 38,
    "luckyColor": "Gold",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.802Z"
  },
  {
    "id": "eeeebb87-8ac3-4254-825e-b7ee1449def4",
    "zodiacSign": "Aries",
    "date": "2026-07-26",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 67,
    "luckyColor": "Gold",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.803Z"
  },
  {
    "id": "35975b9c-31dd-4513-bf67-70ad92545f0b",
    "zodiacSign": "Taurus",
    "date": "2026-07-26",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 31,
    "luckyColor": "Gold",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.804Z"
  },
  {
    "id": "4e3ccc36-78c4-4584-8b34-6787c8e65e91",
    "zodiacSign": "Gemini",
    "date": "2026-07-26",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 16,
    "luckyColor": "Orange",
    "mood": "Focused",
    "createdAt": "2026-07-24T02:05:40.805Z"
  },
  {
    "id": "0dc3037a-5cce-49e4-b1cd-ce5716a64dbd",
    "zodiacSign": "Cancer",
    "date": "2026-07-26",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 45,
    "luckyColor": "White",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.808Z"
  },
  {
    "id": "cd910e7f-4e61-42ff-8fe3-bd264ccec912",
    "zodiacSign": "Leo",
    "date": "2026-07-26",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 17,
    "luckyColor": "Orange",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.809Z"
  },
  {
    "id": "1682db40-5f66-4bef-9930-73705576ad25",
    "zodiacSign": "Virgo",
    "date": "2026-07-26",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 57,
    "luckyColor": "Black",
    "mood": "Curious",
    "createdAt": "2026-07-24T02:05:40.810Z"
  },
  {
    "id": "b02f889b-e12f-430c-aee4-657b7c6f8ad3",
    "zodiacSign": "Libra",
    "date": "2026-07-26",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 55,
    "luckyColor": "Purple",
    "mood": "Focused",
    "createdAt": "2026-07-24T02:05:40.811Z"
  },
  {
    "id": "804fc24b-be03-4c6c-af24-4f5fa2d52cc0",
    "zodiacSign": "Scorpio",
    "date": "2026-07-26",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 91,
    "luckyColor": "Gold",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.812Z"
  },
  {
    "id": "889b05a4-4320-41b3-abd8-10a310ee6707",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-26",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 71,
    "luckyColor": "Purple",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.813Z"
  },
  {
    "id": "abac7561-749a-4b39-a67c-96e0eb2a9331",
    "zodiacSign": "Capricorn",
    "date": "2026-07-26",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 9,
    "luckyColor": "Orange",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.814Z"
  },
  {
    "id": "89def160-afa9-43cb-b863-033097a5d7f4",
    "zodiacSign": "Aquarius",
    "date": "2026-07-26",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 99,
    "luckyColor": "Pink",
    "mood": "Curious",
    "createdAt": "2026-07-24T02:05:40.815Z"
  },
  {
    "id": "d1038eef-180f-452a-8aef-d385c2077e3b",
    "zodiacSign": "Pisces",
    "date": "2026-07-26",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 28,
    "luckyColor": "Orange",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.816Z"
  },
  {
    "id": "9025f51c-6e75-41c1-9f23-b859a3f0db6a",
    "zodiacSign": "Aries",
    "date": "2026-07-27",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 25,
    "luckyColor": "White",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.819Z"
  },
  {
    "id": "79bf6e9d-cec4-4340-bb59-42f52f83e5ac",
    "zodiacSign": "Taurus",
    "date": "2026-07-27",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 45,
    "luckyColor": "Gold",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.821Z"
  },
  {
    "id": "8cc29e52-733a-4ed3-846b-71ff47775e8d",
    "zodiacSign": "Gemini",
    "date": "2026-07-27",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 45,
    "luckyColor": "Yellow",
    "mood": "Curious",
    "createdAt": "2026-07-24T02:05:40.822Z"
  },
  {
    "id": "7aee2330-b738-46b2-89ef-9e20436d9678",
    "zodiacSign": "Cancer",
    "date": "2026-07-27",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 13,
    "luckyColor": "Purple",
    "mood": "Reflective",
    "createdAt": "2026-07-24T02:05:40.823Z"
  },
  {
    "id": "43cad109-9d90-4398-8045-8244242883fd",
    "zodiacSign": "Leo",
    "date": "2026-07-27",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 27,
    "luckyColor": "White",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.831Z"
  },
  {
    "id": "6b108d3a-ef76-45ac-9692-a513d7589b93",
    "zodiacSign": "Virgo",
    "date": "2026-07-27",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 17,
    "luckyColor": "Orange",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.834Z"
  },
  {
    "id": "fcd8547b-da5c-4fae-8163-382fa50548ac",
    "zodiacSign": "Libra",
    "date": "2026-07-27",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 23,
    "luckyColor": "Silver",
    "mood": "Ambitious",
    "createdAt": "2026-07-24T02:05:40.835Z"
  },
  {
    "id": "c38d965b-da7a-457f-8c21-c66318333adb",
    "zodiacSign": "Scorpio",
    "date": "2026-07-27",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 71,
    "luckyColor": "White",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.839Z"
  },
  {
    "id": "d243eaab-f854-4422-959a-e0c75c513f66",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-27",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 52,
    "luckyColor": "Purple",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.840Z"
  },
  {
    "id": "692a7421-9fc5-4aed-975d-3558b6e2191d",
    "zodiacSign": "Capricorn",
    "date": "2026-07-27",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 9,
    "luckyColor": "Silver",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.842Z"
  },
  {
    "id": "47f01819-f30d-4efe-9c0b-1cba11f514d2",
    "zodiacSign": "Aquarius",
    "date": "2026-07-27",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 47,
    "luckyColor": "Red",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.845Z"
  },
  {
    "id": "50d46325-b856-4533-801f-45ebed49a7d6",
    "zodiacSign": "Pisces",
    "date": "2026-07-27",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 93,
    "luckyColor": "Blue",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.850Z"
  },
  {
    "id": "7eab6e1e-8c4e-447f-b496-7cb0b9de3196",
    "zodiacSign": "Aries",
    "date": "2026-07-28",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 76,
    "luckyColor": "Yellow",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.852Z"
  },
  {
    "id": "bcea0c93-660d-497b-ad0a-51ffc8f73ad1",
    "zodiacSign": "Taurus",
    "date": "2026-07-28",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 44,
    "luckyColor": "Gold",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.855Z"
  },
  {
    "id": "a4062b34-df17-4996-b8c8-b9ecd06853ef",
    "zodiacSign": "Gemini",
    "date": "2026-07-28",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 6,
    "luckyColor": "Gold",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.859Z"
  },
  {
    "id": "cb2438d0-346e-43cd-abb0-b9a7ae44a440",
    "zodiacSign": "Cancer",
    "date": "2026-07-28",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 9,
    "luckyColor": "Silver",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.861Z"
  },
  {
    "id": "08d6c005-8f57-4884-849a-27a3d58c2c4f",
    "zodiacSign": "Leo",
    "date": "2026-07-28",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 67,
    "luckyColor": "Green",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.863Z"
  },
  {
    "id": "3cdd5566-ba14-45cb-b140-83a840422e63",
    "zodiacSign": "Virgo",
    "date": "2026-07-28",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 19,
    "luckyColor": "Silver",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.865Z"
  },
  {
    "id": "572cd2c1-a285-4c96-97e8-a2373d24aee8",
    "zodiacSign": "Libra",
    "date": "2026-07-28",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 23,
    "luckyColor": "Black",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.871Z"
  },
  {
    "id": "d30fdc58-462f-4c5f-8528-20f2a070b1d7",
    "zodiacSign": "Scorpio",
    "date": "2026-07-28",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 87,
    "luckyColor": "Blue",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.872Z"
  },
  {
    "id": "751db637-68b1-4e10-a83c-1474afe43114",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-28",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 4,
    "luckyColor": "Purple",
    "mood": "Curious",
    "createdAt": "2026-07-24T02:05:40.874Z"
  },
  {
    "id": "b530f107-97dd-4a8d-8ccc-fc041745f89b",
    "zodiacSign": "Capricorn",
    "date": "2026-07-28",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 14,
    "luckyColor": "Pink",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.876Z"
  },
  {
    "id": "5241f15b-aed7-4657-af30-ef5e4130af01",
    "zodiacSign": "Aquarius",
    "date": "2026-07-28",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 92,
    "luckyColor": "Green",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.878Z"
  },
  {
    "id": "a33a7e4b-054c-4df1-b482-7a1bfadab42f",
    "zodiacSign": "Pisces",
    "date": "2026-07-28",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 94,
    "luckyColor": "Purple",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.882Z"
  },
  {
    "id": "9891da7e-1650-49a4-b625-f7a660dfa9cb",
    "zodiacSign": "Aries",
    "date": "2026-07-29",
    "prediction": "Today brings new opportunities in your career. Stay open to unexpected changes.",
    "luckyNumber": 35,
    "luckyColor": "Silver",
    "mood": "Peaceful",
    "createdAt": "2026-07-24T02:05:40.886Z"
  },
  {
    "id": "f44abe78-8e76-49b3-b4a7-375c51bc5d40",
    "zodiacSign": "Taurus",
    "date": "2026-07-29",
    "prediction": "Focus on your relationships today. A heartfelt conversation will bring clarity.",
    "luckyNumber": 84,
    "luckyColor": "Red",
    "mood": "Focused",
    "createdAt": "2026-07-24T02:05:40.889Z"
  },
  {
    "id": "b468f6f4-2e26-4c84-8dea-1d700386316c",
    "zodiacSign": "Gemini",
    "date": "2026-07-29",
    "prediction": "Financial gains are indicated. Review your investments for long-term growth.",
    "luckyNumber": 89,
    "luckyColor": "Green",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.890Z"
  },
  {
    "id": "0003b9fc-b362-4924-81b0-6178bd11cec2",
    "zodiacSign": "Cancer",
    "date": "2026-07-29",
    "prediction": "Your creative energy is at its peak. Channel it into a passion project.",
    "luckyNumber": 2,
    "luckyColor": "Green",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.896Z"
  },
  {
    "id": "b369f1ba-eb17-4bb1-84a9-533ce7a64791",
    "zodiacSign": "Leo",
    "date": "2026-07-29",
    "prediction": "Take time for self-care today. A short break will recharge your spirits.",
    "luckyNumber": 30,
    "luckyColor": "Green",
    "mood": "Energetic",
    "createdAt": "2026-07-24T02:05:40.898Z"
  },
  {
    "id": "40d48c90-af0c-4b46-b760-442087bc9754",
    "zodiacSign": "Virgo",
    "date": "2026-07-29",
    "prediction": "Communication flows smoothly. Perfect day for important discussions.",
    "luckyNumber": 26,
    "luckyColor": "Black",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.903Z"
  },
  {
    "id": "88c73021-be24-4cfe-95d5-0a11851f0434",
    "zodiacSign": "Libra",
    "date": "2026-07-29",
    "prediction": "Trust your intuition today. It will guide you toward the right decision.",
    "luckyNumber": 22,
    "luckyColor": "Silver",
    "mood": "Focused",
    "createdAt": "2026-07-24T02:05:40.906Z"
  },
  {
    "id": "0fa2f170-8d3b-4d70-ad53-0ec094db1764",
    "zodiacSign": "Scorpio",
    "date": "2026-07-29",
    "prediction": "A pleasant surprise awaits you in the evening. Stay positive.",
    "luckyNumber": 90,
    "luckyColor": "Black",
    "mood": "Grateful",
    "createdAt": "2026-07-24T02:05:40.913Z"
  },
  {
    "id": "ac1d6537-df3b-4c9c-b06b-56c012e167ef",
    "zodiacSign": "Sagittarius",
    "date": "2026-07-29",
    "prediction": "Health needs attention. Incorporate some physical activity into your routine.",
    "luckyNumber": 27,
    "luckyColor": "Red",
    "mood": "Calm",
    "createdAt": "2026-07-24T02:05:40.916Z"
  },
  {
    "id": "bd4cf169-15c0-49c4-85c5-30c2ba9482da",
    "zodiacSign": "Capricorn",
    "date": "2026-07-29",
    "prediction": "Family matters come to the forefront. Your wisdom will resolve conflicts.",
    "luckyNumber": 40,
    "luckyColor": "Orange",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.918Z"
  },
  {
    "id": "9c75e0a3-e057-4b1c-803f-b509254edb30",
    "zodiacSign": "Aquarius",
    "date": "2026-07-29",
    "prediction": "Travel plans may materialize sooner than expected. Be prepared.",
    "luckyNumber": 33,
    "luckyColor": "Pink",
    "mood": "Determined",
    "createdAt": "2026-07-24T02:05:40.920Z"
  },
  {
    "id": "23a50ebe-51af-409b-8f68-0887380f3126",
    "zodiacSign": "Pisces",
    "date": "2026-07-29",
    "prediction": "Spiritual growth is highlighted. Meditation will bring inner peace.",
    "luckyNumber": 13,
    "luckyColor": "Pink",
    "mood": "Joyful",
    "createdAt": "2026-07-24T02:05:40.924Z"
  },
  {
    "id": "8c5d05e2-e974-4004-b71d-2a5bede8778f",
    "zodiacSign": "Aries",
    "date": "2026-07-25",
    "prediction": "Great things ahead",
    "luckyNumber": 7,
    "luckyColor": "Red",
    "mood": "Energetic",
    "createdAt": "2026-07-25T12:11:24.182Z"
  },
  {
    "id": "bbd04c61-b86a-4318-adc9-dd6db9ed8ac4",
    "zodiacSign": "Aries",
    "date": "2026-07-25",
    "prediction": "Great day",
    "luckyNumber": 7,
    "luckyColor": "Red",
    "mood": "Energetic",
    "createdAt": "2026-07-25T12:12:41.509Z"
  },
  {
    "id": "d7ea920a-62aa-4551-8dcc-c563a1ea4b98",
    "zodiacSign": "Aries",
    "date": "2026-07-25",
    "prediction": "Great day",
    "luckyNumber": 7,
    "luckyColor": "Red",
    "mood": "Energetic",
    "createdAt": "2026-07-25T12:13:55.927Z"
  },
  {
    "id": "ae8428eb-300d-43ac-bf9b-ca1a729db7b9",
    "zodiacSign": "Aries",
    "date": "2026-07-25",
    "prediction": "Great day",
    "luckyNumber": 7,
    "luckyColor": "Red",
    "mood": "Energetic",
    "createdAt": "2026-07-25T12:27:11.172Z"
  }
]
```
**Status:** PASS


### POST `/horoscope`
**Description:** Create horoscope  
**Auth:** No  
**Request:**
```json
{"zodiacSign":"Aries","date":"2026-07-25","prediction":"Great day","luckyNumber":7,"luckyColor":"Red","mood":"Energetic"}
```
**Response (201):**
```json
{
  "id": "28d4dd92-15f1-44a5-bb5e-c9d20a19b3e0",
  "zodiacSign": "Aries",
  "date": "2026-07-25",
  "prediction": "Great day",
  "luckyNumber": 7,
  "luckyColor": "Red",
  "mood": "Energetic",
  "createdAt": "2026-07-25T12:28:15.091Z"
}
```
**Status:** PASS


### GET `/panchang`
**Description:** List panchang  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "1d34b6e8-22b7-4ec8-82ad-b85398649bf5",
    "date": "2026-07-23",
    "tithi": "Pratipada",
    "nakshatra": "Ashwini",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.926Z"
  },
  {
    "id": "240a8e7b-9f08-40ff-9236-180344c54d5e",
    "date": "2026-07-24",
    "tithi": "Dwitiya",
    "nakshatra": "Bharani",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.931Z"
  },
  {
    "id": "4f73caa0-ab28-4ac1-9fc5-0b5c7725cf6a",
    "date": "2026-07-25",
    "tithi": "Tritiya",
    "nakshatra": "Krittika",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.933Z"
  },
  {
    "id": "f851201c-1ab2-49ff-8d07-e0e2a395f097",
    "date": "2026-07-26",
    "tithi": "Chaturthi",
    "nakshatra": "Rohini",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.935Z"
  },
  {
    "id": "02434b7d-ff33-4af8-b419-3fb32ac41651",
    "date": "2026-07-27",
    "tithi": "Panchami",
    "nakshatra": "Mrigashira",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.936Z"
  },
  {
    "id": "c346345e-b7e0-43de-b9a2-2057aff7fbec",
    "date": "2026-07-28",
    "tithi": "Shashthi",
    "nakshatra": "Ardra",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.939Z"
  },
  {
    "id": "6b38cefc-cba3-4303-8589-a9b4843bcf41",
    "date": "2026-07-29",
    "tithi": "Saptami",
    "nakshatra": "Punarvasu",
    "yoga": "Vishkumbha",
    "karana": "Bava",
    "sunrise": "06:00:00",
    "sunset": "18:30:00",
    "moonrise": "19:00:00",
    "moonset": "05:30:00",
    "rahuKaal": {
      "end": "09:00",
      "start": "07:30"
    },
    "data": null,
    "createdAt": "2026-07-24T02:05:40.944Z"
  }
]
```
**Status:** PASS


### POST `/panchang`
**Description:** Create panchang  
**Auth:** No  
**Request:**
```json
{"date":"2026-07-25","tithi":"Shukla","nakshatra":"Ashwini","yoga":"Vishkumbha","karana":"Bava","sunrise":"06:00","sunset":"18:30","rahuKaal":"07:30-09:00"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.125Z",
  "path": "/api/v1/panchang"
}
```
**Status:** FAIL


### GET `/blogs`
**Description:** List blogs  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "b3a54332-c91c-4784-b824-1d661153301a",
    "title": "Test Blog",
    "slug": "test-blog",
    "content": "Test content",
    "excerpt": null,
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "draft",
    "tags": [
      "test"
    ],
    "viewCount": 0,
    "publishedAt": null,
    "createdAt": "2026-07-25T12:27:11.264Z",
    "updatedAt": "2026-07-25T12:27:11.264Z"
  },
  {
    "id": "bc03bf3d-7852-4281-9f18-b8818df8d2f3",
    "title": "Planetary Periods: Understanding Dasha",
    "slug": "planetary-periods-dasha",
    "content": "The Vimshottari Dasha system is a powerful predictive tool in Vedic astrology. Each planet rules a specific period in your life, bringing its unique influences. Learn how to navigate your current dasha.",
    "excerpt": "Navigate life transitions by understanding your current planetary period.",
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "published",
    "tags": [
      "dasha",
      "predictions",
      "vedic"
    ],
    "viewCount": 0,
    "publishedAt": "2026-07-23T20:35:40.961Z",
    "createdAt": "2026-07-24T02:05:40.961Z",
    "updatedAt": "2026-07-24T02:05:40.961Z"
  },
  {
    "id": "51590b77-08a3-47a6-8f62-216925265e72",
    "title": "Meditation Techniques for Beginners",
    "slug": "meditation-beginners",
    "content": "Starting a meditation practice can be daunting. This guide covers simple techniques including breath awareness, mantra meditation, and guided visualization to help you begin your spiritual journey.",
    "excerpt": "Simple meditation techniques to start your spiritual practice today.",
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "published",
    "tags": [
      "meditation",
      "spiritual",
      "wellness"
    ],
    "viewCount": 0,
    "publishedAt": "2026-07-23T20:35:40.959Z",
    "createdAt": "2026-07-24T02:05:40.960Z",
    "updatedAt": "2026-07-24T02:05:40.960Z"
  },
  {
    "id": "4b426a3f-3209-4945-85df-f06e042a0fe5",
    "title": "Vastu Tips for Your Home",
    "slug": "vastu-tips-home",
    "content": "Vastu Shastra, the ancient Indian science of architecture, can transform your living space into a haven of positive energy. Simple changes in room placement, colors, and directions can bring harmony and prosperity.",
    "excerpt": "Simple Vastu corrections to bring positive energy into your living space.",
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "published",
    "tags": [
      "vastu",
      "home",
      "feng-shui"
    ],
    "viewCount": 0,
    "publishedAt": "2026-07-23T20:35:40.957Z",
    "createdAt": "2026-07-24T02:05:40.958Z",
    "updatedAt": "2026-07-24T02:05:40.958Z"
  },
  {
    "id": "fb5e4521-6a15-4c64-9e5f-523fcb4f7f05",
    "title": "Love Compatibility: Beyond Sun Signs",
    "slug": "love-compatibility",
    "content": "While sun sign compatibility gives a general idea, true relationship analysis requires examining the Moon, Venus, Mars, and the 7th house. Learn what makes a relationship work from an astrological perspective.",
    "excerpt": "Deep dive into astrological compatibility factors for lasting relationships.",
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "published",
    "tags": [
      "love",
      "compatibility",
      "relationships"
    ],
    "viewCount": 0,
    "publishedAt": "2026-07-23T20:35:40.956Z",
    "createdAt": "2026-07-24T02:05:40.956Z",
    "updatedAt": "2026-07-24T02:05:40.956Z"
  },
  {
    "id": "0e125042-80c8-4a90-8a67-78107ff6a6f9",
    "title": "The Power of Gemstones in Astrology",
    "slug": "power-of-gemstones",
    "content": "Gemstones have been used for centuries to harness planetary energies. Each gemstone corresponds to a specific planet and can help balance its influence in your life. Discover which gemstone is right for you based on your birth chart.",
    "excerpt": "Discover how gemstones can balance planetary energies in your life.",
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "published",
    "tags": [
      "gemstones",
      "remedies",
      "planets"
    ],
    "viewCount": 0,
    "publishedAt": "2026-07-23T20:35:40.954Z",
    "createdAt": "2026-07-24T02:05:40.954Z",
    "updatedAt": "2026-07-24T02:05:40.954Z"
  },
  {
    "id": "c13da255-c363-4731-a50b-97329ce18036",
    "title": "Understanding Your Birth Chart",
    "slug": "understanding-birth-chart",
    "content": "A birth chart is a snapshot of the sky at the moment of your birth. It reveals your strengths, challenges, and life path. In this comprehensive guide, we explore the 12 houses, planets, and zodiac signs that make up your unique cosmic blueprint.",
    "excerpt": "Learn how to read and interpret your birth chart for deeper self-awareness.",
    "coverImage": null,
    "authorId": null,
    "authorRole": null,
    "status": "published",
    "tags": [
      "kundli",
      "birth-chart",
      "astrology-basics"
    ],
    "viewCount": 0,
    "publishedAt": "2026-07-23T20:35:40.945Z",
    "createdAt": "2026-07-24T02:05:40.946Z",
    "updatedAt": "2026-07-24T02:05:40.946Z"
  }
]
```
**Status:** PASS


### POST `/blogs`
**Description:** Create blog  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"title":"Test Blog","slug":"test-blog","content":"Test content","author":"Admin","tags":["test"],"image":"https://example.com/img.jpg"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.166Z",
  "path": "/api/v1/blogs"
}
```
**Status:** FAIL


### GET `/news`
**Description:** List news  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "712617f5-52c0-425f-af7d-90dbf627f8d0",
    "title": "Astro Shine Launches New Kundli Feature",
    "content": "We are excited to announce our enhanced Kundli analysis tool with detailed planet positions and personalized predictions.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "c5266568-58d5-4a11-ae3e-2eedd8a3a5da",
    "title": "Guru Purnima Special: Free Consultations",
    "content": "Celebrate Guru Purnima with free 5-minute consultations from our top astrologers. Offer valid this weekend only.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "704f1b75-0996-4777-9a0c-b197df31bae6",
    "title": "New Astrologers Join Our Platform",
    "content": "Welcome our newest verified astrologers specializing in Tarot, Numerology, and Vastu Shastra.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "fb46c65f-ebbd-4ccc-ab17-0a178234326c",
    "title": "Diwali Special Pooja Services",
    "content": "Book special Diwali pooja services including Lakshmi Pooja and Kuber Yantra installation at your home.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "7b4e455a-66c2-4685-987d-83056542566d",
    "title": "Test News",
    "content": "Test news content",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:11:24.322Z",
    "updatedAt": "2026-07-25T12:11:24.322Z"
  },
  {
    "id": "1797188b-0017-4fcf-b4b2-0abdaa4e1147",
    "title": "Test News",
    "content": "Test",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:12:41.616Z",
    "updatedAt": "2026-07-25T12:12:41.616Z"
  },
  {
    "id": "eceed506-b470-425b-a9ab-f32c34988503",
    "title": "Test News",
    "content": "Test",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.034Z",
    "updatedAt": "2026-07-25T12:13:56.034Z"
  },
  {
    "id": "c09fbf92-5d01-4394-b701-f99300975684",
    "title": "Test News",
    "content": "Test",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:27:11.312Z",
    "updatedAt": "2026-07-25T12:27:11.312Z"
  }
]
```
**Status:** PASS


### GET `/news/admin`
**Description:** List news admin  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "712617f5-52c0-425f-af7d-90dbf627f8d0",
    "title": "Astro Shine Launches New Kundli Feature",
    "content": "We are excited to announce our enhanced Kundli analysis tool with detailed planet positions and personalized predictions.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "c5266568-58d5-4a11-ae3e-2eedd8a3a5da",
    "title": "Guru Purnima Special: Free Consultations",
    "content": "Celebrate Guru Purnima with free 5-minute consultations from our top astrologers. Offer valid this weekend only.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "704f1b75-0996-4777-9a0c-b197df31bae6",
    "title": "New Astrologers Join Our Platform",
    "content": "Welcome our newest verified astrologers specializing in Tarot, Numerology, and Vastu Shastra.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "fb46c65f-ebbd-4ccc-ab17-0a178234326c",
    "title": "Diwali Special Pooja Services",
    "content": "Book special Diwali pooja services including Lakshmi Pooja and Kuber Yantra installation at your home.",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.964Z",
    "updatedAt": "2026-07-24T02:05:40.964Z"
  },
  {
    "id": "7b4e455a-66c2-4685-987d-83056542566d",
    "title": "Test News",
    "content": "Test news content",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:11:24.322Z",
    "updatedAt": "2026-07-25T12:11:24.322Z"
  },
  {
    "id": "1797188b-0017-4fcf-b4b2-0abdaa4e1147",
    "title": "Test News",
    "content": "Test",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:12:41.616Z",
    "updatedAt": "2026-07-25T12:12:41.616Z"
  },
  {
    "id": "eceed506-b470-425b-a9ab-f32c34988503",
    "title": "Test News",
    "content": "Test",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.034Z",
    "updatedAt": "2026-07-25T12:13:56.034Z"
  },
  {
    "id": "c09fbf92-5d01-4394-b701-f99300975684",
    "title": "Test News",
    "content": "Test",
    "image": null,
    "isActive": true,
    "createdAt": "2026-07-25T12:27:11.312Z",
    "updatedAt": "2026-07-25T12:27:11.312Z"
  }
]
```
**Status:** PASS


### POST `/news`
**Description:** Create news  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"title":"Test News","content":"Test","category":"General"}
```
**Response (201):**
```json
{
  "id": "3e3be3db-44c7-469f-beba-df0c6ff29202",
  "title": "Test News",
  "content": "Test",
  "image": null,
  "isActive": true,
  "createdAt": "2026-07-25T12:28:15.220Z",
  "updatedAt": "2026-07-25T12:28:15.220Z"
}
```
**Status:** PASS


### GET `/reviews?astrologerId=eddbd187-163b-4776-a986-c406d152a75f`
**Description:** List reviews  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/reviews`
**Description:** Create review  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"astrologerId":"eddbd187-163b-4776-a986-c406d152a75f","rating":4,"comment":"Good"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.256Z",
  "path": "/api/v1/reviews"
}
```
**Status:** FAIL


### GET `/reports`
**Description:** List reports  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/reports`
**Description:** Create report  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"targetType":"astrologer","targetId":"eddbd187-163b-4776-a986-c406d152a75f","reason":"Test","description":"Test report"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.296Z",
  "path": "/api/v1/reports"
}
```
**Status:** FAIL


### GET `/notifications?userId=23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** List notifications  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/notifications`
**Description:** Create notification  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266","title":"Test","message":"Test","type":"general"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.335Z",
  "path": "/api/v1/notifications"
}
```
**Status:** FAIL


### POST `/notifications/read-all`
**Description:** Mark all read  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266"}
```
**Response (204):**
```json

```
**Status:** PASS


### GET `/settings`
**Description:** List settings  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "efb8e996-1367-4487-a553-1be11f7ca744",
    "key": "app_version",
    "value": "1.0.0",
    "description": "Current app version",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.974Z",
    "updatedAt": "2026-07-24T02:05:40.974Z"
  },
  {
    "id": "45a71ebe-c1f6-4f71-96df-310bf72f0cb7",
    "key": "min_android_version",
    "value": "1.0.0",
    "description": "Minimum supported Android version",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.976Z",
    "updatedAt": "2026-07-24T02:05:40.976Z"
  },
  {
    "id": "f936cac6-5d42-4575-ac48-b633bea9c1ac",
    "key": "min_ios_version",
    "value": "1.0.0",
    "description": "Minimum supported iOS version",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.977Z",
    "updatedAt": "2026-07-24T02:05:40.977Z"
  },
  {
    "id": "73bd08cd-7adc-4472-a44f-676308284dd0",
    "key": "default_currency",
    "value": "INR",
    "description": "Default currency for transactions",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.979Z",
    "updatedAt": "2026-07-24T02:05:40.979Z"
  },
  {
    "id": "3be30a30-9e72-40aa-b27c-db54f9d5a020",
    "key": "platform_fee_percentage",
    "value": "20",
    "description": "Platform commission percentage",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.983Z",
    "updatedAt": "2026-07-24T02:05:40.983Z"
  },
  {
    "id": "eeb60b3b-c7cb-4ff9-81ec-21c1c98663db",
    "key": "min_withdrawal_amount",
    "value": "100",
    "description": "Minimum withdrawal amount",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.985Z",
    "updatedAt": "2026-07-24T02:05:40.985Z"
  },
  {
    "id": "669eddad-7461-4e89-b14c-0f27bc7fa3c7",
    "key": "max_withdrawal_amount",
    "value": "50000",
    "description": "Maximum withdrawal amount",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.986Z",
    "updatedAt": "2026-07-24T02:05:40.986Z"
  },
  {
    "id": "55577673-2d6c-472d-b7a0-4f4a4157bb4c",
    "key": "support_email",
    "value": "support@astroshine.com",
    "description": "Customer support email",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.987Z",
    "updatedAt": "2026-07-24T02:05:40.987Z"
  },
  {
    "id": "275aeb42-9dcf-47df-bac1-82a9b763dae6",
    "key": "about_app",
    "value": "Astro Shine is your gateway to cosmic wisdom. Connect with expert astrologers, get daily horoscopes, and explore spiritual products.",
    "description": "About app description",
    "updatedBy": null,
    "createdAt": "2026-07-24T02:05:40.988Z",
    "updatedAt": "2026-07-24T02:05:40.988Z"
  },
  {
    "id": "1537a951-e1ed-49ca-9c2c-a2d81a15c0d6",
    "key": "app_name",
    "value": "Astro Shine Pro",
    "description": "Application display name",
    "updatedBy": "aaf50893-eddc-433d-816f-c8a27973f024",
    "createdAt": "2026-07-24T02:05:40.972Z",
    "updatedAt": "2026-07-25T06:57:11.492Z"
  }
]
```
**Status:** PASS


### GET `/settings/app_name`
**Description:** Get setting  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "1537a951-e1ed-49ca-9c2c-a2d81a15c0d6",
  "key": "app_name",
  "value": "Astro Shine Pro",
  "description": "Application display name",
  "updatedBy": "aaf50893-eddc-433d-816f-c8a27973f024",
  "createdAt": "2026-07-24T02:05:40.972Z",
  "updatedAt": "2026-07-25T06:57:11.492Z"
}
```
**Status:** PASS


### POST `/settings/app_name`
**Description:** Set setting  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"value":"Astro Shine Pro"}
```
**Response (201):**
```json
{
  "id": "1537a951-e1ed-49ca-9c2c-a2d81a15c0d6",
  "key": "app_name",
  "value": "Astro Shine Pro",
  "description": "Application display name",
  "updatedBy": "aaf50893-eddc-433d-816f-c8a27973f024",
  "createdAt": "2026-07-24T02:05:40.972Z",
  "updatedAt": "2026-07-25T06:58:15.408Z"
}
```
**Status:** PASS


### GET `/api-keys`
**Description:** List API keys  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/api-keys`
**Description:** Create API key  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"provider":"razorpay","key":"test_key","value":"test_value"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.442Z",
  "path": "/api/v1/api-keys"
}
```
**Status:** FAIL


### GET `/dynamic-links`
**Description:** List (public)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "ad636232-2087-4528-95b3-6b263f86bc08",
    "pageName": "home",
    "url": "https://example.com",
    "isActive": true,
    "updatedBy": null,
    "createdAt": "2026-07-25T12:11:24.598Z",
    "updatedAt": "2026-07-25T12:11:24.598Z"
  }
]
```
**Status:** PASS


### GET `/dynamic-links/admin`
**Description:** List (admin)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "ad636232-2087-4528-95b3-6b263f86bc08",
    "pageName": "home",
    "url": "https://example.com",
    "isActive": true,
    "updatedBy": null,
    "createdAt": "2026-07-25T12:11:24.598Z",
    "updatedAt": "2026-07-25T12:11:24.598Z"
  }
]
```
**Status:** PASS


### GET `/dynamic-links/page/home`
**Description:** By page  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "ad636232-2087-4528-95b3-6b263f86bc08",
  "pageName": "home",
  "url": "https://example.com",
  "isActive": true,
  "updatedBy": null,
  "createdAt": "2026-07-25T12:11:24.598Z",
  "updatedAt": "2026-07-25T12:11:24.598Z"
}
```
**Status:** PASS


### POST `/dynamic-links`
**Description:** Create  
**Auth:** No  
**Request:**
```json
{"pageName":"home","title":"Home","url":"https://example.com","order":1}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.513Z",
  "path": "/api/v1/dynamic-links"
}
```
**Status:** FAIL


### GET `/website-content`
**Description:** List (public)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "3fe7bbbc-4e2a-4e6b-bc9e-bd795f282b01",
    "section": "hero",
    "content": "Best platform",
    "isActive": true,
    "updatedBy": null,
    "createdAt": "2026-07-25T12:11:24.672Z",
    "updatedAt": "2026-07-25T06:57:11.664Z"
  }
]
```
**Status:** PASS


### GET `/website-content/admin`
**Description:** List (admin)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "3fe7bbbc-4e2a-4e6b-bc9e-bd795f282b01",
    "section": "hero",
    "content": "Best platform",
    "isActive": true,
    "updatedBy": null,
    "createdAt": "2026-07-25T12:11:24.672Z",
    "updatedAt": "2026-07-25T06:57:11.664Z"
  }
]
```
**Status:** PASS


### GET `/website-content/section/hero`
**Description:** By section  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "3fe7bbbc-4e2a-4e6b-bc9e-bd795f282b01",
  "section": "hero",
  "content": "Best platform",
  "isActive": true,
  "updatedBy": null,
  "createdAt": "2026-07-25T12:11:24.672Z",
  "updatedAt": "2026-07-25T06:57:11.664Z"
}
```
**Status:** PASS


### POST `/website-content/section/hero`
**Description:** Upsert  
**Auth:** No  
**Request:**
```json
{"title":"Welcome","subtitle":"To Astro Shine","content":"Best platform"}
```
**Response (201):**
```json
{
  "id": "3fe7bbbc-4e2a-4e6b-bc9e-bd795f282b01",
  "section": "hero",
  "content": "Best platform",
  "isActive": true,
  "updatedBy": null,
  "createdAt": "2026-07-25T12:11:24.672Z",
  "updatedAt": "2026-07-25T06:58:15.580Z"
}
```
**Status:** PASS


### GET `/commissions`
**Description:** List commissions  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "477a471a-f0bb-41a2-a4e6-cdfa89f4f9af",
    "astrologerId": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "astrologerName": "Test Astrologer",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:02:22.921Z",
    "updatedAt": "2026-07-24T02:02:22.921Z"
  },
  {
    "id": "9dc75494-ffae-4c23-bfd5-2cd3d18d6cc0",
    "astrologerId": "f0caf01f-d792-4cca-8d42-dc7e99a24cd3",
    "astrologerName": "Aarav Sharma",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.712Z",
    "updatedAt": "2026-07-24T02:05:40.712Z"
  },
  {
    "id": "6f7e2ca8-26cc-496f-b2ec-e9a632e6faee",
    "astrologerId": "3b3f1aac-efac-46ef-8537-4e17f26b790a",
    "astrologerName": "Priya Patel",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.715Z",
    "updatedAt": "2026-07-24T02:05:40.715Z"
  },
  {
    "id": "e7e435a8-c93f-4568-a2b8-b3928c4df42e",
    "astrologerId": "ac97c628-5d26-42a3-9e1d-8e23d1101bcc",
    "astrologerName": "Rahul Verma",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.718Z",
    "updatedAt": "2026-07-24T02:05:40.718Z"
  },
  {
    "id": "f1e0c0ff-874f-49d0-828f-b7d287fe79c2",
    "astrologerId": "c7a04f8a-4064-49ed-859b-4ef8465df083",
    "astrologerName": "Ananya Gupta",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.720Z",
    "updatedAt": "2026-07-24T02:05:40.720Z"
  },
  {
    "id": "ea049896-9ae6-4266-8f11-4dcbbd7a0bf5",
    "astrologerId": "1fb0dc47-edc5-4fb9-bf9d-a92766582b08",
    "astrologerName": "Vikram Singh",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.721Z",
    "updatedAt": "2026-07-24T02:05:40.721Z"
  },
  {
    "id": "ce4bfc3c-19ee-4cab-ba12-cb9d5e2b934b",
    "astrologerId": "0b784bae-9be0-411e-9296-739043537e2f",
    "astrologerName": "Neha Kapoor",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.722Z",
    "updatedAt": "2026-07-24T02:05:40.722Z"
  },
  {
    "id": "23929f3c-8663-4421-9a08-4c279f7241d2",
    "astrologerId": "5bcf77c8-5186-435d-8f88-7f75a7a1ca43",
    "astrologerName": "Arjun Nair",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.723Z",
    "updatedAt": "2026-07-24T02:05:40.723Z"
  },
  {
    "id": "930a8d4f-4540-4498-8169-7f79e895249a",
    "astrologerId": "fda2c7dd-bd5c-4cf0-a221-620b51129bf1",
    "astrologerName": "Kavita Reddy",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.724Z",
    "updatedAt": "2026-07-24T02:05:40.724Z"
  },
  {
    "id": "6fe1dd1e-5c56-4f11-b4b9-bc83667831c9",
    "astrologerId": "2d2f46e7-4d65-43a4-a5c5-1e5bdfbca74b",
    "astrologerName": "Rohit Joshi",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.725Z",
    "updatedAt": "2026-07-24T02:05:40.725Z"
  },
  {
    "id": "b5d92237-da93-444c-bcf5-24e1f5b898d2",
    "astrologerId": "d7cbef9a-c0c2-44b6-81bc-7157e000a04a",
    "astrologerName": "Sneha Iyer",
    "type": "percentage",
    "value": "20.00",
    "minAmount": "10.00",
    "maxCap": "500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.726Z",
    "updatedAt": "2026-07-24T02:05:40.726Z"
  }
]
```
**Status:** PASS


### GET `/commissions/logs?astrologerId=eddbd187-163b-4776-a986-c406d152a75f`
**Description:** Commission logs  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```
**Status:** PASS


### GET `/commissions/stats/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** Astrologer stats  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "totalEarnings": 0,
  "totalPlatformFee": 0,
  "totalCalls": 0,
  "commissionPercentage": 10
}
```
**Status:** PASS


### GET `/commissions/by-astrologer/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** By astrologer  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json

```
**Status:** PASS


### GET `/calls?userId=23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** List calls  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/gifts`
**Description:** List gifts  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "f3d5e5fe-c295-4874-8282-08bdcad4ae59",
    "name": "Gemstone Bracelet",
    "image": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200",
    "price": "799.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "2bd90177-b135-4a5e-9bc4-35d9879dec86",
    "name": "Premium Pooja Kit",
    "image": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=200",
    "price": "999.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "805e99fb-657a-413b-b047-213f00d9b969",
    "name": "Gold Plated Idol",
    "image": "https://images.unsplash.com/photo-1577083288073-40892c0860a4?w=200",
    "price": "1499.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "e4119073-100b-44a0-909d-072fb3fcbbaf",
    "name": "Sandalwood Mala",
    "image": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200",
    "price": "599.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "8879c218-965b-4e84-bb0b-d90f30c890f6",
    "name": "Test Gift",
    "image": "https://example.com/gift.jpg",
    "price": "99.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:11:24.859Z",
    "updatedAt": "2026-07-25T12:11:24.859Z"
  },
  {
    "id": "611a5ea9-f9e5-439d-ae41-476cf0eb1c15",
    "name": "Updated Gift",
    "image": "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=200",
    "price": "149.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "4798a3fc-2e97-450e-8333-822d58df3c13",
    "name": "Test Gift",
    "image": "https://example.com/gift.jpg",
    "price": "99.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:12:42.061Z",
    "updatedAt": "2026-07-25T12:12:42.061Z"
  },
  {
    "id": "176ea02f-d960-4a03-b649-dac3010ecf73",
    "name": "Updated Gift",
    "image": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200",
    "price": "149.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "a34f5bb3-1330-43c0-889d-9e6f3bfcd70c",
    "name": "Test Gift",
    "image": "https://example.com/gift.jpg",
    "price": "99.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.471Z",
    "updatedAt": "2026-07-25T12:13:56.471Z"
  },
  {
    "id": "13652287-7d03-4ada-a2e2-73d14bd7221e",
    "name": "Updated Gift",
    "image": "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=200",
    "price": "149.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  },
  {
    "id": "ad2b8172-8e91-4029-b589-bf8753fcb388",
    "name": "Test Gift",
    "image": "https://example.com/gift.jpg",
    "price": "99.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:27:11.804Z",
    "updatedAt": "2026-07-25T12:27:11.804Z"
  },
  {
    "id": "06b4a81d-9faf-4bb6-9f2e-a9518105755b",
    "name": "Updated Gift",
    "image": "https://images.unsplash.com/photo-1602868464286-2f0e7e6a7c7a?w=200",
    "price": "149.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.739Z",
    "updatedAt": "2026-07-24T02:05:40.739Z"
  }
]
```
**Status:** PASS


### POST `/gifts`
**Description:** Create gift  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"Test Gift","price":99,"image":"https://example.com/gift.jpg","isActive":true}
```
**Response (201):**
```json
{
  "id": "298f819c-e2ce-4910-bb62-8a358bf83422",
  "name": "Test Gift",
  "image": "https://example.com/gift.jpg",
  "price": "99.00",
  "isActive": true,
  "createdAt": "2026-07-25T12:28:15.723Z",
  "updatedAt": "2026-07-25T12:28:15.723Z"
}
```
**Status:** PASS


### GET `/gifts/f3d5e5fe-c295-4874-8282-08bdcad4ae59`
**Description:** Get gift  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "f3d5e5fe-c295-4874-8282-08bdcad4ae59",
  "name": "Gemstone Bracelet",
  "image": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200",
  "price": "799.00",
  "isActive": true,
  "createdAt": "2026-07-24T02:05:40.739Z",
  "updatedAt": "2026-07-24T02:05:40.739Z"
}
```
**Status:** PASS


### PUT `/gifts/f3d5e5fe-c295-4874-8282-08bdcad4ae59`
**Description:** Update gift  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"Updated Gift","price":149}
```
**Response (200):**
```json
{
  "id": "f3d5e5fe-c295-4874-8282-08bdcad4ae59",
  "name": "Updated Gift",
  "image": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200",
  "price": "149.00",
  "isActive": true,
  "createdAt": "2026-07-24T02:05:40.739Z",
  "updatedAt": "2026-07-24T02:05:40.739Z"
}
```
**Status:** PASS


### POST `/gifts/send`
**Description:** Send gift  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"giftId":"f3d5e5fe-c295-4874-8282-08bdcad4ae59","receiverId":"eddbd187-163b-4776-a986-c406d152a75f"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:15.788Z",
  "path": "/api/v1/gifts/send"
}
```
**Status:** FAIL


### GET `/gifts/transactions`
**Description:** Transactions  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/donations?userId=23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** List donations  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "cc63f0a1-fe1e-4c30-a36b-e3da89ef2876",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "amount": "500.00",
    "transactionId": null,
    "message": null,
    "createdAt": "2026-07-25T12:27:11.916Z"
  },
  {
    "id": "e307b91d-f246-4f6e-85db-3adbbca1ca82",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "amount": "500.00",
    "transactionId": null,
    "message": null,
    "createdAt": "2026-07-25T12:13:56.568Z"
  },
  {
    "id": "b1ebd844-f45b-451e-8049-235e013bf973",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "amount": "500.00",
    "transactionId": null,
    "message": null,
    "createdAt": "2026-07-25T12:12:42.166Z"
  },
  {
    "id": "77d2d4b7-ed96-4296-8410-6296c324fba5",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "amount": "500.00",
    "transactionId": null,
    "message": null,
    "createdAt": "2026-07-25T12:11:24.998Z"
  }
]
```
**Status:** PASS


### POST `/donations`
**Description:** Create donation  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"amount":500,"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266"}
```
**Response (201):**
```json
{
  "id": "ac4b0ee8-0b30-4319-b68e-d534d807b5e2",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "amount": "500.00",
  "transactionId": null,
  "message": null,
  "createdAt": "2026-07-25T12:28:15.840Z"
}
```
**Status:** PASS


### GET `/donations/stats`
**Description:** Stats (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "totalReceived": 2500,
  "totalWithdrawn": 0,
  "pending": 2500
}
```
**Status:** PASS


### GET `/donations/logs`
**Description:** Logs (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "f1710d0c-8c98-4111-bd8d-af399f797edf",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "adminId": null,
    "type": "received",
    "amount": "500.00",
    "status": "completed",
    "note": null,
    "createdAt": "2026-07-25T12:28:15.842Z"
  },
  {
    "id": "2a85d82d-4213-4ca2-8be6-94418a42d45c",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "adminId": null,
    "type": "received",
    "amount": "500.00",
    "status": "completed",
    "note": null,
    "createdAt": "2026-07-25T12:27:11.918Z"
  },
  {
    "id": "66ffa7d3-7ca6-44a6-bb64-1ded989d2f90",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "adminId": null,
    "type": "received",
    "amount": "500.00",
    "status": "completed",
    "note": null,
    "createdAt": "2026-07-25T12:13:56.569Z"
  },
  {
    "id": "f7b8ff88-0cb1-4e65-81d5-4022b4805684",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "adminId": null,
    "type": "received",
    "amount": "500.00",
    "status": "completed",
    "note": null,
    "createdAt": "2026-07-25T12:12:42.168Z"
  },
  {
    "id": "743ab87b-c559-481d-acdd-59de10d9c034",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "adminId": null,
    "type": "received",
    "amount": "500.00",
    "status": "completed",
    "note": null,
    "createdAt": "2026-07-25T12:11:25.000Z"
  }
]
```
**Status:** PASS


### GET `/shop`
**Description:** List products  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "d64c0ead-b5fd-45aa-a2ae-168e50166bbc",
    "name": "Meditation Cushion",
    "description": "Comfortable floor cushion for meditation",
    "price": "899.00",
    "comparePrice": "1199.00",
    "images": [],
    "category": "Meditation",
    "stock": 25,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.742Z",
    "updatedAt": "2026-07-24T02:05:40.742Z"
  },
  {
    "id": "7b71f53c-c995-4ac6-b606-33b510e3a9ca",
    "name": "Tibetan Singing Bowl",
    "description": "Handmade singing bowl for sound healing",
    "price": "2499.00",
    "comparePrice": "2999.00",
    "images": [],
    "category": "Meditation",
    "stock": 15,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.742Z",
    "updatedAt": "2026-07-24T02:05:40.742Z"
  },
  {
    "id": "086963c0-66ef-4515-a59d-7d7473037977",
    "name": "Agarbatti Pack (12)",
    "description": "Premium sandalwood incense sticks",
    "price": "99.00",
    "comparePrice": "149.00",
    "images": [],
    "category": "Incense",
    "stock": 100,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.742Z",
    "updatedAt": "2026-07-24T02:05:40.742Z"
  },
  {
    "id": "23579761-9d52-48b6-aff2-6cc848e60de5",
    "name": "Camphor Tablets",
    "description": "Pure camphor for aarti",
    "price": "49.00",
    "comparePrice": "79.00",
    "images": [],
    "category": "Pooja Items",
    "stock": 200,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.742Z",
    "updatedAt": "2026-07-24T02:05:40.742Z"
  },
  {
    "id": "0548735b-e2bc-4a15-a0ee-a33712df1d1e",
    "name": "Rudraksha Mala",
    "description": "108 bead rudraksha mala",
    "price": "1999.00",
    "comparePrice": "2499.00",
    "images": [],
    "category": "Mala",
    "stock": 10,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.742Z",
    "updatedAt": "2026-07-24T02:05:40.742Z"
  },
  {
    "id": "90612e23-4f72-44b4-8cbc-f8505d1a8438",
    "name": "Sphatik Mala",
    "description": "Clear quartz crystal mala",
    "price": "1499.00",
    "comparePrice": "1799.00",
    "images": [],
    "category": "Mala",
    "stock": 15,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.742Z",
    "updatedAt": "2026-07-24T02:05:40.742Z"
  },
  {
    "id": "455ed242-13fd-4757-b62a-8f24d739f738",
    "name": "Test Product",
    "description": "Test description",
    "price": "299.00",
    "comparePrice": null,
    "images": [],
    "category": "Books",
    "stock": 10,
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.079Z",
    "updatedAt": "2026-07-25T12:11:25.079Z"
  },
  {
    "id": "71843820-8c33-4f22-b8c6-367481a28d59",
    "name": "Test Product",
    "description": "Test",
    "price": "299.00",
    "comparePrice": null,
    "images": [],
    "category": "Books",
    "stock": 10,
    "isActive": true,
    "createdAt": "2026-07-25T12:12:42.224Z",
    "updatedAt": "2026-07-25T12:12:42.224Z"
  },
  {
    "id": "58bf9229-35fd-4aa2-a87a-217aa67be2e0",
    "name": "Test Product",
    "description": "Test",
    "price": "299.00",
    "comparePrice": null,
    "images": [],
    "category": "Books",
    "stock": 10,
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.624Z",
    "updatedAt": "2026-07-25T12:13:56.624Z"
  },
  {
    "id": "e5a7c514-dbc0-4551-b4c4-09b8c0815454",
    "name": "Test Product",
    "description": "Test",
    "price": "299.00",
    "comparePrice": null,
    "images": [],
    "category": "Books",
    "stock": 10,
    "isActive": true,
    "createdAt": "2026-07-25T12:27:11.988Z",
    "updatedAt": "2026-07-25T12:27:11.988Z"
  }
]
```
**Status:** PASS


### POST `/shop`
**Description:** Create product  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"Test Product","description":"Test","price":299,"category":"Books","stock":10,"image":"https://example.com/p.jpg"}
```
**Response (201):**
```json
{
  "id": "981872c6-175a-4426-86f6-2b258a2404e9",
  "name": "Test Product",
  "description": "Test",
  "price": "299.00",
  "comparePrice": null,
  "images": [],
  "category": "Books",
  "stock": 10,
  "isActive": true,
  "createdAt": "2026-07-25T12:28:15.908Z",
  "updatedAt": "2026-07-25T12:28:15.908Z"
}
```
**Status:** PASS


### GET `/shop/d64c0ead-b5fd-45aa-a2ae-168e50166bbc`
**Description:** Get product  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "d64c0ead-b5fd-45aa-a2ae-168e50166bbc",
  "name": "Meditation Cushion",
  "description": "Comfortable floor cushion for meditation",
  "price": "899.00",
  "comparePrice": "1199.00",
  "images": [],
  "category": "Meditation",
  "stock": 25,
  "isActive": true,
  "createdAt": "2026-07-24T02:05:40.742Z",
  "updatedAt": "2026-07-24T02:05:40.742Z"
}
```
**Status:** PASS


### PUT `/shop/d64c0ead-b5fd-45aa-a2ae-168e50166bbc`
**Description:** Update product  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"price":249}
```
**Response (200):**
```json
{
  "id": "d64c0ead-b5fd-45aa-a2ae-168e50166bbc",
  "name": "Meditation Cushion",
  "description": "Comfortable floor cushion for meditation",
  "price": "249.00",
  "comparePrice": "1199.00",
  "images": [],
  "category": "Meditation",
  "stock": 25,
  "isActive": true,
  "createdAt": "2026-07-24T02:05:40.742Z",
  "updatedAt": "2026-07-25T06:58:15.949Z"
}
```
**Status:** PASS


### DELETE `/shop/d64c0ead-b5fd-45aa-a2ae-168e50166bbc`
**Description:** Delete product  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (204):**
```json

```
**Status:** PASS


### GET `/orders/my`
**Description:** My orders  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "041eff49-0c61-4fdb-bdfb-faa3230c0665",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "totalAmount": "299.00",
    "status": "pending",
    "shippingAddress": null,
    "transactionId": null,
    "createdAt": "2026-07-25T12:13:56.713Z",
    "updatedAt": "2026-07-25T12:13:56.713Z"
  },
  {
    "id": "3bc862ae-460c-4701-b879-e0d08b8ea56f",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "totalAmount": "299.00",
    "status": "confirmed",
    "shippingAddress": null,
    "transactionId": null,
    "createdAt": "2026-07-25T12:12:42.323Z",
    "updatedAt": "2026-07-25T06:43:56.776Z"
  },
  {
    "id": "fe5355f1-b60d-4bbf-876c-b2e2122254de",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "totalAmount": "299.00",
    "status": "pending",
    "shippingAddress": null,
    "transactionId": null,
    "createdAt": "2026-07-25T12:27:12.141Z",
    "updatedAt": "2026-07-25T12:27:12.141Z"
  },
  {
    "id": "5227db2a-ba0d-4e10-9953-d4fa26dbbef7",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "totalAmount": "299.00",
    "status": "confirmed",
    "shippingAddress": null,
    "transactionId": null,
    "createdAt": "2026-07-25T12:11:25.202Z",
    "updatedAt": "2026-07-25T06:57:12.241Z"
  }
]
```
**Status:** PASS


### GET `/orders`
**Description:** All orders  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "041eff49-0c61-4fdb-bdfb-faa3230c0665",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "userName": "Admin Updated",
    "totalAmount": "299.00",
    "status": "pending",
    "shippingAddress": null,
    "createdAt": "2026-07-25T12:13:56.713Z",
    "updatedAt": "2026-07-25T12:13:56.713Z"
  },
  {
    "id": "3bc862ae-460c-4701-b879-e0d08b8ea56f",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "userName": "Admin Updated",
    "totalAmount": "299.00",
    "status": "confirmed",
    "shippingAddress": null,
    "createdAt": "2026-07-25T12:12:42.323Z",
    "updatedAt": "2026-07-25T06:43:56.776Z"
  },
  {
    "id": "fe5355f1-b60d-4bbf-876c-b2e2122254de",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "userName": "Admin Updated",
    "totalAmount": "299.00",
    "status": "pending",
    "shippingAddress": null,
    "createdAt": "2026-07-25T12:27:12.141Z",
    "updatedAt": "2026-07-25T12:27:12.141Z"
  },
  {
    "id": "5227db2a-ba0d-4e10-9953-d4fa26dbbef7",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "userName": "Admin Updated",
    "totalAmount": "299.00",
    "status": "confirmed",
    "shippingAddress": null,
    "createdAt": "2026-07-25T12:11:25.202Z",
    "updatedAt": "2026-07-25T06:57:12.241Z"
  }
]
```
**Status:** PASS


### POST `/orders`
**Description:** Create order  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266","totalAmount":299,"status":"pending"}
```
**Response (201):**
```json
{
  "id": "4736483b-6cfe-465f-9d65-7d51d3ef1456",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "totalAmount": "299.00",
  "status": "pending",
  "shippingAddress": null,
  "transactionId": null,
  "createdAt": "2026-07-25T12:28:16.017Z",
  "updatedAt": "2026-07-25T12:28:16.017Z"
}
```
**Status:** PASS


### GET `/orders/041eff49-0c61-4fdb-bdfb-faa3230c0665`
**Description:** Get order  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "041eff49-0c61-4fdb-bdfb-faa3230c0665",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "totalAmount": "299.00",
  "status": "pending",
  "shippingAddress": null,
  "transactionId": null,
  "createdAt": "2026-07-25T12:13:56.713Z",
  "updatedAt": "2026-07-25T12:13:56.713Z"
}
```
**Status:** PASS


### GET `/orders/041eff49-0c61-4fdb-bdfb-faa3230c0665/items`
**Description:** Get items  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/orders/041eff49-0c61-4fdb-bdfb-faa3230c0665/items`
**Description:** Add item  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"productId":"d64c0ead-b5fd-45aa-a2ae-168e50166bbc","quantity":1,"price":299}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:16.078Z",
  "path": "/api/v1/orders/041eff49-0c61-4fdb-bdfb-faa3230c0665/items"
}
```
**Status:** FAIL


### PUT `/orders/041eff49-0c61-4fdb-bdfb-faa3230c0665/status`
**Description:** Update status  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"status":"confirmed"}
```
**Response (200):**
```json
{
  "id": "041eff49-0c61-4fdb-bdfb-faa3230c0665",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "totalAmount": "299.00",
  "status": "confirmed",
  "shippingAddress": null,
  "transactionId": null,
  "createdAt": "2026-07-25T12:13:56.713Z",
  "updatedAt": "2026-07-25T06:58:16.095Z"
}
```
**Status:** PASS


### GET `/videos`
**Description:** List videos  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "c5c67556-23d9-438a-a411-b7e0efcb939f",
    "title": "Introduction to Vedic Astrology",
    "description": "A beginner-friendly overview of Vedic astrology fundamentals.",
    "url": "https://www.youtube.com/watch?v=example1",
    "thumbnail": null,
    "category": "Education",
    "duration": 600,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "f0fe6e76-2b5e-4a8a-9281-26eb7840ac04",
    "title": "Daily Horoscope Predictions",
    "description": "Today's horoscope predictions for all 12 zodiac signs.",
    "url": "https://www.youtube.com/watch?v=example2",
    "thumbnail": null,
    "category": "Horoscope",
    "duration": 900,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "77b9b9f7-e390-4427-8db8-4a1ae43e0366",
    "title": "Meditation for Beginners",
    "description": "Guided meditation session for stress relief.",
    "url": "https://www.youtube.com/watch?v=example3",
    "thumbnail": null,
    "category": "Meditation",
    "duration": 1200,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "bf4dbe98-7c83-443f-8f0d-191dd35dea0b",
    "title": "Understanding Tarot Cards",
    "description": "Learn the meaning of major arcana tarot cards.",
    "url": "https://www.youtube.com/watch?v=example4",
    "thumbnail": null,
    "category": "Tarot",
    "duration": 1500,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "2f8352f6-f345-4ae7-a641-3307a3cce461",
    "title": "Vastu Tips for Wealth",
    "description": "Vastu corrections to attract wealth and prosperity.",
    "url": "https://www.youtube.com/watch?v=example5",
    "thumbnail": null,
    "category": "Vastu",
    "duration": 800,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "bac456e1-f754-4637-b064-ea2990768974",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/video.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.346Z",
    "updatedAt": "2026-07-25T12:11:25.346Z"
  },
  {
    "id": "93a71460-4c37-4ede-b4f8-7b9ddd8a90fe",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/v.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:12:42.434Z",
    "updatedAt": "2026-07-25T12:12:42.434Z"
  },
  {
    "id": "f987d2b4-a8b0-45dd-97cf-c7f72e0ab7b0",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/v.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.820Z",
    "updatedAt": "2026-07-25T12:13:56.820Z"
  },
  {
    "id": "17397da0-16a8-4764-a67e-d920fccbcbdd",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/v.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:27:12.313Z",
    "updatedAt": "2026-07-25T12:27:12.313Z"
  }
]
```
**Status:** PASS


### GET `/videos/admin`
**Description:** List admin  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "c5c67556-23d9-438a-a411-b7e0efcb939f",
    "title": "Introduction to Vedic Astrology",
    "description": "A beginner-friendly overview of Vedic astrology fundamentals.",
    "url": "https://www.youtube.com/watch?v=example1",
    "thumbnail": null,
    "category": "Education",
    "duration": 600,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "f0fe6e76-2b5e-4a8a-9281-26eb7840ac04",
    "title": "Daily Horoscope Predictions",
    "description": "Today's horoscope predictions for all 12 zodiac signs.",
    "url": "https://www.youtube.com/watch?v=example2",
    "thumbnail": null,
    "category": "Horoscope",
    "duration": 900,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "77b9b9f7-e390-4427-8db8-4a1ae43e0366",
    "title": "Meditation for Beginners",
    "description": "Guided meditation session for stress relief.",
    "url": "https://www.youtube.com/watch?v=example3",
    "thumbnail": null,
    "category": "Meditation",
    "duration": 1200,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "bf4dbe98-7c83-443f-8f0d-191dd35dea0b",
    "title": "Understanding Tarot Cards",
    "description": "Learn the meaning of major arcana tarot cards.",
    "url": "https://www.youtube.com/watch?v=example4",
    "thumbnail": null,
    "category": "Tarot",
    "duration": 1500,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "2f8352f6-f345-4ae7-a641-3307a3cce461",
    "title": "Vastu Tips for Wealth",
    "description": "Vastu corrections to attract wealth and prosperity.",
    "url": "https://www.youtube.com/watch?v=example5",
    "thumbnail": null,
    "category": "Vastu",
    "duration": 800,
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.970Z",
    "updatedAt": "2026-07-24T02:05:40.970Z"
  },
  {
    "id": "bac456e1-f754-4637-b064-ea2990768974",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/video.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.346Z",
    "updatedAt": "2026-07-25T12:11:25.346Z"
  },
  {
    "id": "93a71460-4c37-4ede-b4f8-7b9ddd8a90fe",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/v.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:12:42.434Z",
    "updatedAt": "2026-07-25T12:12:42.434Z"
  },
  {
    "id": "f987d2b4-a8b0-45dd-97cf-c7f72e0ab7b0",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/v.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.820Z",
    "updatedAt": "2026-07-25T12:13:56.820Z"
  },
  {
    "id": "17397da0-16a8-4764-a67e-d920fccbcbdd",
    "title": "Test Video",
    "description": null,
    "url": "https://example.com/v.mp4",
    "thumbnail": null,
    "category": "Educational",
    "duration": 300,
    "isActive": true,
    "createdAt": "2026-07-25T12:27:12.313Z",
    "updatedAt": "2026-07-25T12:27:12.313Z"
  }
]
```
**Status:** PASS


### POST `/videos`
**Description:** Create video  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"title":"Test Video","url":"https://example.com/v.mp4","category":"Educational","duration":300}
```
**Response (201):**
```json
{
  "id": "d9e28981-ee5e-4e10-8a4d-9d6ee253407a",
  "title": "Test Video",
  "description": null,
  "url": "https://example.com/v.mp4",
  "thumbnail": null,
  "category": "Educational",
  "duration": 300,
  "isActive": true,
  "createdAt": "2026-07-25T12:28:16.148Z",
  "updatedAt": "2026-07-25T12:28:16.148Z"
}
```
**Status:** PASS


### GET `/live-sessions`
**Description:** List (public)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/live-sessions/live`
**Description:** Live now  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### GET `/live-sessions/astrologer/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** By astrologer  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/live-sessions`
**Description:** Create session  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
{"title":"Test Live","description":"Test"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:16.214Z",
  "path": "/api/v1/live-sessions"
}
```
**Status:** FAIL


### GET `/mandir-pooja`
**Description:** List poojas  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "5d22b2bc-cd83-4d45-8498-417f9abb90a2",
    "name": "Saraswati Pooja",
    "description": "Blessings for knowledge and wisdom",
    "image": null,
    "price": "751.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "ae2db01b-a4b1-40c6-916e-b64176622a85",
    "name": "Rudra Abhishekam",
    "description": "Powerful Shiva pooja for spiritual growth",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "a1c9c0ab-3905-4889-9e46-5711cd4a9fae",
    "name": "Satyanarayan Katha",
    "description": "Complete pooja for peace and happiness",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "bb3068be-584b-4326-8a17-fc40d6d8f4af",
    "name": "Hanuman Chalisa Path",
    "description": "Recitation for strength and protection",
    "image": null,
    "price": "501.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "714da5d3-b61a-4acc-8e36-20c0dcc13818",
    "name": "Satyanarayan Pooja",
    "description": "Sacred pooja",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.504Z",
    "updatedAt": "2026-07-25T12:11:25.504Z"
  },
  {
    "id": "a5212ad4-6671-4c6b-b0ae-ee04fb8135f3",
    "name": "Maha Mrityunjaya Jaap",
    "description": "Powerful vedic chant for health and longevity",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:41:25.539Z"
  },
  {
    "id": "00bade74-2577-4348-a4a0-ffc8fd4a558d",
    "name": "Satyanarayan Pooja",
    "description": "Sacred",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:12:42.554Z",
    "updatedAt": "2026-07-25T12:12:42.554Z"
  },
  {
    "id": "e2c5231f-9213-429a-8b0f-3c3cf8d9eb5c",
    "name": "Ganesh Abhishekam",
    "description": "Special abhishekam for removing obstacles",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:42:42.591Z"
  },
  {
    "id": "7f3ddfcc-1627-4dff-aaeb-8c85491e9cc1",
    "name": "Satyanarayan Pooja",
    "description": "Sacred",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.932Z",
    "updatedAt": "2026-07-25T12:13:56.932Z"
  },
  {
    "id": "fd2a04cb-6321-4ad3-ba10-a8e325d855b0",
    "name": "Lakshmi Pooja",
    "description": "Pooja for wealth and prosperity",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:43:56.966Z"
  },
  {
    "id": "1993bc04-74da-407d-9740-b908bb2ed4cc",
    "name": "Satyanarayan Pooja",
    "description": "Sacred",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:27:12.473Z",
    "updatedAt": "2026-07-25T12:27:12.473Z"
  },
  {
    "id": "cb6f5fa3-602d-462f-971d-c4ff9b1f1ad1",
    "name": "Navagraha Shanti",
    "description": "Pacifying the nine planets for harmony",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:57:12.521Z"
  }
]
```
**Status:** PASS


### GET `/mandir-pooja/admin`
**Description:** List admin  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "5d22b2bc-cd83-4d45-8498-417f9abb90a2",
    "name": "Saraswati Pooja",
    "description": "Blessings for knowledge and wisdom",
    "image": null,
    "price": "751.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "ae2db01b-a4b1-40c6-916e-b64176622a85",
    "name": "Rudra Abhishekam",
    "description": "Powerful Shiva pooja for spiritual growth",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "a1c9c0ab-3905-4889-9e46-5711cd4a9fae",
    "name": "Satyanarayan Katha",
    "description": "Complete pooja for peace and happiness",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "bb3068be-584b-4326-8a17-fc40d6d8f4af",
    "name": "Hanuman Chalisa Path",
    "description": "Recitation for strength and protection",
    "image": null,
    "price": "501.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-24T02:05:40.745Z"
  },
  {
    "id": "714da5d3-b61a-4acc-8e36-20c0dcc13818",
    "name": "Satyanarayan Pooja",
    "description": "Sacred pooja",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.504Z",
    "updatedAt": "2026-07-25T12:11:25.504Z"
  },
  {
    "id": "a5212ad4-6671-4c6b-b0ae-ee04fb8135f3",
    "name": "Maha Mrityunjaya Jaap",
    "description": "Powerful vedic chant for health and longevity",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:41:25.539Z"
  },
  {
    "id": "00bade74-2577-4348-a4a0-ffc8fd4a558d",
    "name": "Satyanarayan Pooja",
    "description": "Sacred",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:12:42.554Z",
    "updatedAt": "2026-07-25T12:12:42.554Z"
  },
  {
    "id": "e2c5231f-9213-429a-8b0f-3c3cf8d9eb5c",
    "name": "Ganesh Abhishekam",
    "description": "Special abhishekam for removing obstacles",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:42:42.591Z"
  },
  {
    "id": "7f3ddfcc-1627-4dff-aaeb-8c85491e9cc1",
    "name": "Satyanarayan Pooja",
    "description": "Sacred",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:13:56.932Z",
    "updatedAt": "2026-07-25T12:13:56.932Z"
  },
  {
    "id": "fd2a04cb-6321-4ad3-ba10-a8e325d855b0",
    "name": "Lakshmi Pooja",
    "description": "Pooja for wealth and prosperity",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:43:56.966Z"
  },
  {
    "id": "1993bc04-74da-407d-9740-b908bb2ed4cc",
    "name": "Satyanarayan Pooja",
    "description": "Sacred",
    "image": null,
    "price": "1100.00",
    "isActive": true,
    "createdAt": "2026-07-25T12:27:12.473Z",
    "updatedAt": "2026-07-25T12:27:12.473Z"
  },
  {
    "id": "cb6f5fa3-602d-462f-971d-c4ff9b1f1ad1",
    "name": "Navagraha Shanti",
    "description": "Pacifying the nine planets for harmony",
    "image": null,
    "price": "1500.00",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:40.745Z",
    "updatedAt": "2026-07-25T06:57:12.521Z"
  }
]
```
**Status:** PASS


### POST `/mandir-pooja`
**Description:** Create pooja  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"Satyanarayan Pooja","description":"Sacred","price":1100,"category":"General","duration":120}
```
**Response (201):**
```json
{
  "id": "d413ce9d-2143-4115-9622-43b8bd441a79",
  "name": "Satyanarayan Pooja",
  "description": "Sacred",
  "image": null,
  "price": "1100.00",
  "isActive": true,
  "createdAt": "2026-07-25T12:28:16.289Z",
  "updatedAt": "2026-07-25T12:28:16.289Z"
}
```
**Status:** PASS


### GET `/mandir-pooja/5d22b2bc-cd83-4d45-8498-417f9abb90a2`
**Description:** Get pooja  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "5d22b2bc-cd83-4d45-8498-417f9abb90a2",
  "name": "Saraswati Pooja",
  "description": "Blessings for knowledge and wisdom",
  "image": null,
  "price": "751.00",
  "isActive": true,
  "createdAt": "2026-07-24T02:05:40.745Z",
  "updatedAt": "2026-07-24T02:05:40.745Z"
}
```
**Status:** PASS


### PUT `/mandir-pooja/5d22b2bc-cd83-4d45-8498-417f9abb90a2`
**Description:** Update pooja  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"price":1500}
```
**Response (200):**
```json
{
  "id": "5d22b2bc-cd83-4d45-8498-417f9abb90a2",
  "name": "Saraswati Pooja",
  "description": "Blessings for knowledge and wisdom",
  "image": null,
  "price": "1500.00",
  "isActive": true,
  "createdAt": "2026-07-24T02:05:40.745Z",
  "updatedAt": "2026-07-25T06:58:16.334Z"
}
```
**Status:** PASS


### POST `/mandir-pooja/bookings`
**Description:** Create booking  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"poojaId":"5d22b2bc-cd83-4d45-8498-417f9abb90a2","bookingDate":"2026-08-01","amount":1500}
```
**Response (201):**
```json
{
  "id": "8f35bde2-e630-4a61-803d-c08cb257f4b6",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "poojaId": "5d22b2bc-cd83-4d45-8498-417f9abb90a2",
  "bookingDate": "2026-08-01",
  "amount": "1500.00",
  "transactionId": null,
  "status": "pending",
  "notes": null,
  "createdAt": "2026-07-25T12:28:16.352Z",
  "updatedAt": "2026-07-25T12:28:16.352Z"
}
```
**Status:** PASS


### GET `/mandir-pooja/bookings/list`
**Description:** List bookings  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "9d397cf2-ed66-466c-b0b1-b3a4b6541b5b",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "poojaId": "cb6f5fa3-602d-462f-971d-c4ff9b1f1ad1",
    "bookingDate": "2026-08-01",
    "amount": "1500.00",
    "transactionId": null,
    "status": "pending",
    "notes": null,
    "createdAt": "2026-07-25T12:27:12.542Z",
    "updatedAt": "2026-07-25T12:27:12.542Z"
  },
  {
    "id": "8f35bde2-e630-4a61-803d-c08cb257f4b6",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "poojaId": "5d22b2bc-cd83-4d45-8498-417f9abb90a2",
    "bookingDate": "2026-08-01",
    "amount": "1500.00",
    "transactionId": null,
    "status": "pending",
    "notes": null,
    "createdAt": "2026-07-25T12:28:16.352Z",
    "updatedAt": "2026-07-25T12:28:16.352Z"
  }
]
```
**Status:** PASS


### GET `/support/tickets?userId=23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266`
**Description:** List tickets  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "84eccbfc-790a-4f72-98fc-017f092e04c1",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "open",
    "priority": "medium",
    "assignedTo": null,
    "resolvedAt": null,
    "createdAt": "2026-07-25T12:11:25.609Z",
    "updatedAt": "2026-07-25T12:11:25.609Z"
  },
  {
    "id": "efa8bc24-cf58-45ad-b393-37b78a72e7a5",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "resolved",
    "priority": "medium",
    "assignedTo": "aaf50893-eddc-433d-816f-c8a27973f024",
    "resolvedAt": "2026-07-25T06:41:25.670Z",
    "createdAt": "2026-07-25T12:11:25.626Z",
    "updatedAt": "2026-07-25T06:41:25.670Z"
  },
  {
    "id": "74352a21-17dd-46d7-9208-ba8bf6c3cf38",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "open",
    "priority": "medium",
    "assignedTo": null,
    "resolvedAt": null,
    "createdAt": "2026-07-25T12:12:42.660Z",
    "updatedAt": "2026-07-25T12:12:42.660Z"
  },
  {
    "id": "16819d1e-7a9c-4afd-8fdd-3397a0f869dd",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "resolved",
    "priority": "medium",
    "assignedTo": "aaf50893-eddc-433d-816f-c8a27973f024",
    "resolvedAt": "2026-07-25T06:42:42.722Z",
    "createdAt": "2026-07-25T12:12:42.679Z",
    "updatedAt": "2026-07-25T06:42:42.722Z"
  },
  {
    "id": "fe072e8c-f44e-402e-a2a0-5064d3ff92bd",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "open",
    "priority": "medium",
    "assignedTo": null,
    "resolvedAt": null,
    "createdAt": "2026-07-25T12:13:57.026Z",
    "updatedAt": "2026-07-25T12:13:57.026Z"
  },
  {
    "id": "8d4165de-3fc3-4d92-88d1-6844e590b1b0",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "resolved",
    "priority": "medium",
    "assignedTo": "aaf50893-eddc-433d-816f-c8a27973f024",
    "resolvedAt": "2026-07-25T06:43:57.077Z",
    "createdAt": "2026-07-25T12:13:57.041Z",
    "updatedAt": "2026-07-25T06:43:57.077Z"
  },
  {
    "id": "a13cfe35-740e-4cc2-a4dc-0b8559c157db",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "open",
    "priority": "medium",
    "assignedTo": null,
    "resolvedAt": null,
    "createdAt": "2026-07-25T12:27:12.602Z",
    "updatedAt": "2026-07-25T12:27:12.602Z"
  },
  {
    "id": "188a8ef7-a555-4159-abe1-c72656963e43",
    "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
    "astrologerId": null,
    "subject": "Test Issue",
    "message": "Having a problem",
    "status": "resolved",
    "priority": "medium",
    "assignedTo": "aaf50893-eddc-433d-816f-c8a27973f024",
    "resolvedAt": "2026-07-25T06:57:12.668Z",
    "createdAt": "2026-07-25T12:27:12.621Z",
    "updatedAt": "2026-07-25T06:57:12.668Z"
  }
]
```
**Status:** PASS


### POST `/support/tickets`
**Description:** Create ticket  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266","subject":"Test Issue","message":"Having a problem","priority":"medium"}
```
**Response (201):**
```json
{
  "id": "1c04e615-7d0a-4d41-b5bd-ef49b7c2f047",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "astrologerId": null,
  "subject": "Test Issue",
  "message": "Having a problem",
  "status": "open",
  "priority": "medium",
  "assignedTo": null,
  "resolvedAt": null,
  "createdAt": "2026-07-25T12:28:16.405Z",
  "updatedAt": "2026-07-25T12:28:16.405Z"
}
```
**Status:** PASS


### GET `/support/tickets/cff843d3-0440-45c6-8811-906ae04ba908`
**Description:** Get ticket  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "cff843d3-0440-45c6-8811-906ae04ba908",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "astrologerId": null,
  "subject": "Test Issue",
  "message": "Having a problem",
  "status": "open",
  "priority": "medium",
  "assignedTo": null,
  "resolvedAt": null,
  "createdAt": "2026-07-25T12:28:16.423Z",
  "updatedAt": "2026-07-25T12:28:16.423Z"
}
```
**Status:** PASS


### PUT `/support/tickets/cff843d3-0440-45c6-8811-906ae04ba908/assign`
**Description:** Assign  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"assignedTo":"aaf50893-eddc-433d-816f-c8a27973f024"}
```
**Response (200):**
```json
{
  "id": "cff843d3-0440-45c6-8811-906ae04ba908",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "astrologerId": null,
  "subject": "Test Issue",
  "message": "Having a problem",
  "status": "in_progress",
  "priority": "medium",
  "assignedTo": "aaf50893-eddc-433d-816f-c8a27973f024",
  "resolvedAt": null,
  "createdAt": "2026-07-25T12:28:16.423Z",
  "updatedAt": "2026-07-25T06:58:16.450Z"
}
```
**Status:** PASS


### PUT `/support/tickets/cff843d3-0440-45c6-8811-906ae04ba908/resolve`
**Description:** Resolve  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{}
```
**Response (200):**
```json
{
  "id": "cff843d3-0440-45c6-8811-906ae04ba908",
  "userId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "astrologerId": null,
  "subject": "Test Issue",
  "message": "Having a problem",
  "status": "resolved",
  "priority": "medium",
  "assignedTo": "aaf50893-eddc-433d-816f-c8a27973f024",
  "resolvedAt": "2026-07-25T06:58:16.468Z",
  "createdAt": "2026-07-25T12:28:16.423Z",
  "updatedAt": "2026-07-25T06:58:16.468Z"
}
```
**Status:** PASS


### GET `/support/tickets/cff843d3-0440-45c6-8811-906ae04ba908/replies`
**Description:** Get replies  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/support/tickets/cff843d3-0440-45c6-8811-906ae04ba908/replies`
**Description:** Add reply  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"message":"Working on it"}
```
**Response (201):**
```json
{
  "id": "aff2156b-f271-44fd-98c6-6a87ee10be87",
  "ticketId": "cff843d3-0440-45c6-8811-906ae04ba908",
  "senderId": "aaf50893-eddc-433d-816f-c8a27973f024",
  "senderRole": "admin",
  "message": "Working on it",
  "attachments": null,
  "createdAt": "2026-07-25T12:28:16.503Z"
}
```
**Status:** PASS


### GET `/releases`
**Description:** List releases  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "5a63ec35-73f6-40d7-9adc-cb598c6a30b7",
    "appName": "astro-shine",
    "platform": "android",
    "version": "1.0.0",
    "buildNumber": 1,
    "releaseNotes": "Initial release",
    "downloadUrl": "https://example.com/app.apk",
    "isMandatory": false,
    "isActive": true,
    "releasedAt": null,
    "createdAt": "2026-07-25T12:11:25.733Z",
    "updatedAt": "2026-07-25T12:11:25.733Z"
  },
  {
    "id": "8e8aee9c-1ea4-4ffd-8425-7137b882b060",
    "appName": "astro-shine",
    "platform": "android",
    "version": "1.0.0",
    "buildNumber": 1,
    "releaseNotes": "Initial",
    "downloadUrl": "https://example.com/app.apk",
    "isMandatory": false,
    "isActive": true,
    "releasedAt": null,
    "createdAt": "2026-07-25T12:12:42.796Z",
    "updatedAt": "2026-07-25T12:12:42.796Z"
  },
  {
    "id": "a4c31189-63c4-4f79-b300-0795d8b40c04",
    "appName": "astro-shine",
    "platform": "android",
    "version": "1.0.0",
    "buildNumber": 1,
    "releaseNotes": "Initial",
    "downloadUrl": "https://example.com/app.apk",
    "isMandatory": false,
    "isActive": true,
    "releasedAt": null,
    "createdAt": "2026-07-25T12:13:57.136Z",
    "updatedAt": "2026-07-25T12:13:57.136Z"
  },
  {
    "id": "ed24b406-3ba5-4f03-90e9-b5be892acc12",
    "appName": "astro-shine",
    "platform": "android",
    "version": "1.0.0",
    "buildNumber": 1,
    "releaseNotes": "Initial",
    "downloadUrl": "https://example.com/app.apk",
    "isMandatory": false,
    "isActive": true,
    "releasedAt": null,
    "createdAt": "2026-07-25T12:27:12.741Z",
    "updatedAt": "2026-07-25T12:27:12.741Z"
  }
]
```
**Status:** PASS


### POST `/releases`
**Description:** Create release  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"appName":"astro-shine","platform":"android","version":"1.0.0","buildNumber":1,"releaseNotes":"Initial","downloadUrl":"https://example.com/app.apk","isMandatory":false}
```
**Response (201):**
```json
{
  "id": "25babc57-4988-4f57-acae-f5bca31e496e",
  "appName": "astro-shine",
  "platform": "android",
  "version": "1.0.0",
  "buildNumber": 1,
  "releaseNotes": "Initial",
  "downloadUrl": "https://example.com/app.apk",
  "isMandatory": false,
  "isActive": true,
  "releasedAt": null,
  "createdAt": "2026-07-25T12:28:16.538Z",
  "updatedAt": "2026-07-25T12:28:16.538Z"
}
```
**Status:** PASS


### GET `/schedule/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** Get schedule  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/schedule/eddbd187-163b-4776-a986-c406d152a75f`
**Description:** Upsert slot  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
{"dayOfWeek":1,"startTime":"09:00","endTime":"17:00","isAvailable":true}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:16.575Z",
  "path": "/api/v1/schedule/eddbd187-163b-4776-a986-c406d152a75f"
}
```
**Status:** FAIL


### PUT `/schedule/eddbd187-163b-4776-a986-c406d152a75f/bulk`
**Description:** Bulk upsert  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
{"slots":[{"dayOfWeek":1,"startTime":"09:00","endTime":"13:00","isAvailable":true},{"dayOfWeek":2,"startTime":"10:00","endTime":"14:00","isAvailable":true}]}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:16.592Z",
  "path": "/api/v1/schedule/eddbd187-163b-4776-a986-c406d152a75f/bulk"
}
```
**Status:** FAIL


### GET `/conversations`
**Description:** List conversations  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "data": [
    {
      "id": "1ccc60eb-39d2-4384-abc4-34cc1dc40750",
      "participantOneId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
      "participantOneRole": "user",
      "participantTwoId": "eddbd187-163b-4776-a986-c406d152a75f",
      "participantTwoRole": "astrologer",
      "lastMessageAt": "2026-07-25T06:57:12.911Z",
      "lastMessagePreview": "Hello!",
      "createdAt": "2026-07-25T12:27:12.840Z",
      "updatedAt": "2026-07-25T06:57:12.911Z",
      "participantId": "eddbd187-163b-4776-a986-c406d152a75f",
      "participantRole": "astrologer",
      "participantName": "Test Astrologer",
      "unreadCount": 0
    }
  ]
}
```
**Status:** PASS


### POST `/conversations`
**Description:** Create conversation  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"participantId":"eddbd187-163b-4776-a986-c406d152a75f","participantRole":"astrologer"}
```
**Response (201):**
```json
{
  "id": "1ccc60eb-39d2-4384-abc4-34cc1dc40750",
  "participantOneId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "participantOneRole": "user",
  "participantTwoId": "eddbd187-163b-4776-a986-c406d152a75f",
  "participantTwoRole": "astrologer",
  "lastMessageAt": "2026-07-25T06:57:12.911Z",
  "lastMessagePreview": "Hello!",
  "createdAt": "2026-07-25T12:27:12.840Z",
  "updatedAt": "2026-07-25T06:57:12.911Z"
}
```
**Status:** PASS


### GET `/conversations/1ccc60eb-39d2-4384-abc4-34cc1dc40750`
**Description:** Get conversation  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "1ccc60eb-39d2-4384-abc4-34cc1dc40750",
  "participantOneId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "participantOneRole": "user",
  "participantTwoId": "eddbd187-163b-4776-a986-c406d152a75f",
  "participantTwoRole": "astrologer",
  "lastMessageAt": "2026-07-25T06:57:12.911Z",
  "lastMessagePreview": "Hello!",
  "createdAt": "2026-07-25T12:27:12.840Z",
  "updatedAt": "2026-07-25T06:57:12.911Z",
  "participantId": "eddbd187-163b-4776-a986-c406d152a75f",
  "participantRole": "astrologer",
  "participantName": "Test Astrologer",
  "unreadCount": 0
}
```
**Status:** PASS


### GET `/conversations/1ccc60eb-39d2-4384-abc4-34cc1dc40750/messages`
**Description:** Get messages  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "data": [
    {
      "id": "53ecd1e2-b8e5-43e0-9d6d-f986f3b69d83",
      "conversationId": "1ccc60eb-39d2-4384-abc4-34cc1dc40750",
      "senderId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
      "senderRole": "user",
      "type": "text",
      "content": "Hello!",
      "mediaUrl": null,
      "isDelivered": false,
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-07-25T12:27:12.908Z"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```
**Status:** PASS


### POST `/conversations/1ccc60eb-39d2-4384-abc4-34cc1dc40750/messages`
**Description:** Send message  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"content":"Hello!"}
```
**Response (201):**
```json
{
  "id": "db1b9d26-9a55-47e3-bd37-38459e7c1f79",
  "conversationId": "1ccc60eb-39d2-4384-abc4-34cc1dc40750",
  "senderId": "23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266",
  "senderRole": "user",
  "type": "text",
  "content": "Hello!",
  "mediaUrl": null,
  "isDelivered": false,
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-07-25T12:28:16.698Z"
}
```
**Status:** PASS


### PUT `/conversations/1ccc60eb-39d2-4384-abc4-34cc1dc40750/read`
**Description:** Mark read  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"userId":"23a6e8d2-99a5-4ccd-b3ca-c9b2a0270266"}
```
**Response (200):**
```json
{
  "unreadCount": 0
}
```
**Status:** PASS


### GET `/muhurat-categories`
**Description:** List (public)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
    "name": "Housewarming Muhurat",
    "description": "Auspicious timing for Griha Pravesh",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.148Z",
    "updatedAt": "2026-07-24T02:05:54.148Z"
  },
  {
    "id": "a06d9ecd-626c-4016-9afb-259f082d415c",
    "name": "Bhoomi Pujan Muhurat",
    "description": "Auspicious timing for ground-breaking / land worship",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.152Z",
    "updatedAt": "2026-07-24T02:05:54.152Z"
  },
  {
    "id": "ece601a4-f2ff-4aee-b38c-de5ca37377f3",
    "name": "Naming Ceremony Muhurat",
    "description": "Auspicious timing for Naamkaran",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.156Z",
    "updatedAt": "2026-07-24T02:05:54.156Z"
  },
  {
    "id": "f0ba3a73-a6b7-4cdd-a2f4-ebecd7996d9b",
    "name": "Mundan Muhurat",
    "description": "Auspicious timing for first haircut ceremony",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.162Z",
    "updatedAt": "2026-07-24T02:05:54.162Z"
  },
  {
    "id": "93c30586-d595-41e5-8ee2-dbfae95a4217",
    "name": "Wedding",
    "description": "Auspicious wedding timings",
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.870Z",
    "updatedAt": "2026-07-25T12:11:25.870Z"
  },
  {
    "id": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Marriage",
    "description": "Auspicious dates/times for weddings",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.140Z",
    "updatedAt": "2026-07-25T06:41:25.907Z"
  },
  {
    "id": "61627965-a7c3-47af-bcba-c0479deb0e1b",
    "name": "TestCat7380",
    "description": "Auspicious",
    "isActive": true,
    "createdAt": "2026-07-25T12:27:12.981Z",
    "updatedAt": "2026-07-25T12:27:12.981Z"
  }
]
```
**Status:** PASS


### GET `/muhurat-categories/admin`
**Description:** List (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
    "name": "Housewarming Muhurat",
    "description": "Auspicious timing for Griha Pravesh",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.148Z",
    "updatedAt": "2026-07-24T02:05:54.148Z"
  },
  {
    "id": "a06d9ecd-626c-4016-9afb-259f082d415c",
    "name": "Bhoomi Pujan Muhurat",
    "description": "Auspicious timing for ground-breaking / land worship",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.152Z",
    "updatedAt": "2026-07-24T02:05:54.152Z"
  },
  {
    "id": "ece601a4-f2ff-4aee-b38c-de5ca37377f3",
    "name": "Naming Ceremony Muhurat",
    "description": "Auspicious timing for Naamkaran",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.156Z",
    "updatedAt": "2026-07-24T02:05:54.156Z"
  },
  {
    "id": "f0ba3a73-a6b7-4cdd-a2f4-ebecd7996d9b",
    "name": "Mundan Muhurat",
    "description": "Auspicious timing for first haircut ceremony",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.162Z",
    "updatedAt": "2026-07-24T02:05:54.162Z"
  },
  {
    "id": "93c30586-d595-41e5-8ee2-dbfae95a4217",
    "name": "Wedding",
    "description": "Auspicious wedding timings",
    "isActive": true,
    "createdAt": "2026-07-25T12:11:25.870Z",
    "updatedAt": "2026-07-25T12:11:25.870Z"
  },
  {
    "id": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Marriage",
    "description": "Auspicious dates/times for weddings",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.140Z",
    "updatedAt": "2026-07-25T06:41:25.907Z"
  },
  {
    "id": "61627965-a7c3-47af-bcba-c0479deb0e1b",
    "name": "TestCat7380",
    "description": "Auspicious",
    "isActive": true,
    "createdAt": "2026-07-25T12:27:12.981Z",
    "updatedAt": "2026-07-25T12:27:12.981Z"
  }
]
```
**Status:** PASS


### POST `/muhurat-categories`
**Description:** Create category  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"TestCat21711","description":"Auspicious","icon":"heart"}
```
**Response (201):**
```json
{
  "id": "4fd0a5c0-32e8-4e76-a7ce-326111b76f01",
  "name": "TestCat21711",
  "description": "Auspicious",
  "isActive": true,
  "createdAt": "2026-07-25T12:28:16.769Z",
  "updatedAt": "2026-07-25T12:28:16.769Z"
}
```
**Status:** PASS


### GET `/muhurat-categories/20fee2a1-ba2c-4df7-9f8c-29d4391e867a`
**Description:** Get category  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
{
  "id": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
  "name": "Housewarming Muhurat",
  "description": "Auspicious timing for Griha Pravesh",
  "isActive": true,
  "createdAt": "2026-07-24T02:05:54.148Z",
  "updatedAt": "2026-07-24T02:05:54.148Z"
}
```
**Status:** PASS


### PUT `/muhurat-categories/20fee2a1-ba2c-4df7-9f8c-29d4391e867a`
**Description:** Update category  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"name":"Marriage"}
```
**Response (500):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-25T06:58:16.812Z",
  "path": "/api/v1/muhurat-categories/20fee2a1-ba2c-4df7-9f8c-29d4391e867a"
}
```
**Status:** FAIL


### GET `/muhurat`
**Description:** List (public)  
**Auth:** No  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "53b9edc2-64eb-4ff0-a1c2-efc04f24cbd6",
    "categoryId": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
    "name": "Griha Pravesh Muhurat (Tomorrow)",
    "date": "2026-07-25",
    "time": "09:30:00",
    "description": "Auspicious morning timing for housewarming tomorrow.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.181Z",
    "updatedAt": "2026-07-24T02:05:59.181Z",
    "categoryName": "Housewarming Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "8f07662d-9718-4abc-a91b-105a86f475e4",
    "categoryId": "f0ba3a73-a6b7-4cdd-a2f4-ebecd7996d9b",
    "name": "Mundan Sanskar Shubh Muhurat (Tomorrow)",
    "date": "2026-07-25",
    "time": "11:00:00",
    "description": "Auspicious mundan timing tomorrow.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.185Z",
    "updatedAt": "2026-07-24T02:05:59.185Z",
    "categoryName": "Mundan Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "f84a5996-c87c-419b-8387-10c1204e73a7",
    "categoryId": "a06d9ecd-626c-4016-9afb-259f082d415c",
    "name": "Bhoomi Pujan (Day 2)",
    "date": "2026-07-26",
    "time": "14:45:00",
    "description": "Groundbreaking timing recommended by astrologers.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.188Z",
    "updatedAt": "2026-07-24T02:05:59.188Z",
    "categoryName": "Bhoomi Pujan Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "43730060-6f5a-4b25-8cee-b123deef52fe",
    "categoryId": "ece601a4-f2ff-4aee-b38c-de5ca37377f3",
    "name": "Namkaran Sanskar (Day 2)",
    "date": "2026-07-26",
    "time": "16:00:00",
    "description": "Auspicious naming ceremony timing.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.191Z",
    "updatedAt": "2026-07-24T02:05:59.191Z",
    "categoryName": "Naming Ceremony Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "6218ae08-166e-446e-938b-76a97a52c8e3",
    "categoryId": "ece601a4-f2ff-4aee-b38c-de5ca37377f3",
    "name": "Namkaran Sanskar (Day 3)",
    "date": "2026-07-27",
    "time": "10:00:00",
    "description": "Beautiful timing for naming ceremony.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.193Z",
    "updatedAt": "2026-07-24T02:05:59.193Z",
    "categoryName": "Naming Ceremony Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "98332197-7c1a-44a3-9fd7-d9991869f8cf",
    "categoryId": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Vivah Shubh Muhurat (Day 3)",
    "date": "2026-07-27",
    "time": "19:15:00",
    "description": "Evening marriage timing.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.196Z",
    "updatedAt": "2026-07-24T02:05:59.196Z",
    "categoryName": "Marriage",
    "createdByName": "Test Astrologer"
  }
]
```
**Status:** PASS


### GET `/muhurat/admin`
**Description:** List (admin)  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[
  {
    "id": "1b9cafae-f06f-405e-8291-a507385e914e",
    "categoryId": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Anand Vivah Muhurat",
    "date": "2026-11-23",
    "time": "10:30:00",
    "description": "Highly auspicious timing for marriage under Rohini Nakshatra.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.171Z",
    "updatedAt": "2026-07-24T02:05:54.171Z",
    "categoryName": "Marriage",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "f8ead96a-3d5c-46b5-ab65-bf48989b7d72",
    "categoryId": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
    "name": "Griha Pravesh Muhurat",
    "date": "2026-12-05",
    "time": "08:15:00",
    "description": "Auspicious time for moving into a new home.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.175Z",
    "updatedAt": "2026-07-24T02:05:54.175Z",
    "categoryName": "Housewarming Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "b8de76f8-9b5e-427d-a895-45c24449b396",
    "categoryId": "a06d9ecd-626c-4016-9afb-259f082d415c",
    "name": "New Office Bhoomi Pujan",
    "date": "2026-10-18",
    "time": "09:45:00",
    "description": "Worship for business success and peace.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:54.178Z",
    "updatedAt": "2026-07-24T02:05:54.178Z",
    "categoryName": "Bhoomi Pujan Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "ec41cf81-655e-42a1-b2fe-18935ef58257",
    "categoryId": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Vivah Shubh Muhurat (Today)",
    "date": "2026-07-24",
    "time": "11:15:00",
    "description": "Highly auspicious timing for weddings today.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.174Z",
    "updatedAt": "2026-07-24T02:05:59.174Z",
    "categoryName": "Marriage",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "9d2cdfcd-e425-4d1f-bc84-ff0ad0e7493a",
    "categoryId": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Sandhya Vivah Muhurat (Today)",
    "date": "2026-07-24",
    "time": "18:30:00",
    "description": "Auspicious evening wedding mahuratha.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.177Z",
    "updatedAt": "2026-07-24T02:05:59.177Z",
    "categoryName": "Marriage",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "53b9edc2-64eb-4ff0-a1c2-efc04f24cbd6",
    "categoryId": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
    "name": "Griha Pravesh Muhurat (Tomorrow)",
    "date": "2026-07-25",
    "time": "09:30:00",
    "description": "Auspicious morning timing for housewarming tomorrow.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.181Z",
    "updatedAt": "2026-07-24T02:05:59.181Z",
    "categoryName": "Housewarming Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "8f07662d-9718-4abc-a91b-105a86f475e4",
    "categoryId": "f0ba3a73-a6b7-4cdd-a2f4-ebecd7996d9b",
    "name": "Mundan Sanskar Shubh Muhurat (Tomorrow)",
    "date": "2026-07-25",
    "time": "11:00:00",
    "description": "Auspicious mundan timing tomorrow.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.185Z",
    "updatedAt": "2026-07-24T02:05:59.185Z",
    "categoryName": "Mundan Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "f84a5996-c87c-419b-8387-10c1204e73a7",
    "categoryId": "a06d9ecd-626c-4016-9afb-259f082d415c",
    "name": "Bhoomi Pujan (Day 2)",
    "date": "2026-07-26",
    "time": "14:45:00",
    "description": "Groundbreaking timing recommended by astrologers.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.188Z",
    "updatedAt": "2026-07-24T02:05:59.188Z",
    "categoryName": "Bhoomi Pujan Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "43730060-6f5a-4b25-8cee-b123deef52fe",
    "categoryId": "ece601a4-f2ff-4aee-b38c-de5ca37377f3",
    "name": "Namkaran Sanskar (Day 2)",
    "date": "2026-07-26",
    "time": "16:00:00",
    "description": "Auspicious naming ceremony timing.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.191Z",
    "updatedAt": "2026-07-24T02:05:59.191Z",
    "categoryName": "Naming Ceremony Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "6218ae08-166e-446e-938b-76a97a52c8e3",
    "categoryId": "ece601a4-f2ff-4aee-b38c-de5ca37377f3",
    "name": "Namkaran Sanskar (Day 3)",
    "date": "2026-07-27",
    "time": "10:00:00",
    "description": "Beautiful timing for naming ceremony.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.193Z",
    "updatedAt": "2026-07-24T02:05:59.193Z",
    "categoryName": "Naming Ceremony Muhurat",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "98332197-7c1a-44a3-9fd7-d9991869f8cf",
    "categoryId": "a70a680a-1b71-43e9-b49d-20bffe046bfb",
    "name": "Vivah Shubh Muhurat (Day 3)",
    "date": "2026-07-27",
    "time": "19:15:00",
    "description": "Evening marriage timing.",
    "createdBy": "d8dbc97e-cb24-45ed-b945-e78255dfb316",
    "isActive": true,
    "createdAt": "2026-07-24T02:05:59.196Z",
    "updatedAt": "2026-07-24T02:05:59.196Z",
    "categoryName": "Marriage",
    "createdByName": "Test Astrologer"
  },
  {
    "id": "0f457f18-fe18-468b-ac2d-60357ada8931",
    "categoryId": "20fee2a1-ba2c-4df7-9f8c-29d4391e867a",
    "name": "Auspicious Time",
    "date": "2026-08-15",
    "time": "06:00:00",
    "description": "Good time",
    "createdBy": "aaf50893-eddc-433d-816f-c8a27973f024",
    "isActive": true,
    "createdAt": "2026-07-25T12:27:13.152Z",
    "updatedAt": "2026-07-25T12:27:13.152Z",
    "categoryName": "Housewarming Muhurat",
    "createdByName": "Admin User"
  }
]
```
**Status:** PASS


### POST `/muhurat`
**Description:** Create muhurat  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
{"categoryId":"20fee2a1-ba2c-4df7-9f8c-29d4391e867a","name":"Auspicious Time","date":"2026-08-15","time":"06:00","description":"Good time"}
```
**Response (409):**
```json
{
  "statusCode": 409,
  "message": "This time slot is already registered by Admin User",
  "timestamp": "2026-07-25T06:58:16.932Z",
  "path": "/api/v1/muhurat"
}
```
**Status:** FAIL


### POST `/payments/create-order`
**Description:** Create order  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyM2E2ZThkMi05OWE1LTRjY2QtYjNjYS1jOWIyYTAyNzAyNjYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.YaZgveM6OOBTiuSRGh3WPzaa1Vre2SN5whoQsUv-IMo  
**Request:**
```json
{"amount":500,"purpose":"wallet_recharge","receipt":"test-receipt-1"}
```
**Response (201):**
```json
{
  "id": "fbb539be-afee-45db-b03b-7254e26fcb1a",
  "razorpayOrderId": "order_THe2TuRxT4beI6",
  "amount": 50000,
  "currency": "INR",
  "key": "rzp_test_Rp0PAsDOKB05GU",
  "purpose": "wallet_recharge",
  "status": "created"
}
```
**Status:** PASS


### GET `/withdrawals`
**Description:** List withdrawals  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWY1MDg5My1lZGRjLTQzM2QtODE2Zi1jOGEyNzk3M2YwMjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ5NjI2OTMsImV4cCI6MTc4NTU2NzQ5M30.k2zPCiddp0BHFubiZOw3WndW3ym-9fwXOmYStM5tgU0  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


### POST `/withdrawals`
**Description:** Create withdrawal  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
{"amount":1,"accountDetails":"UPI: test@upi"}
```
**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Insufficient wallet balance for withdrawal",
  "timestamp": "2026-07-25T06:58:17.197Z",
  "path": "/api/v1/withdrawals"
}
```
**Status:** FAIL


### GET `/muhurat/my`
**Description:** My muhurat entries  
**Auth:** YeseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGRiZDE4Ny0xNjNiLTQ3NzYtYTk4Ni1jNDA2ZDE1MmE3NWYiLCJyb2xlIjoiYXN0cm9sb2dlciIsImlhdCI6MTc4NDk2MjY5MywiZXhwIjoxNzg1NTY3NDkzfQ.s0sBRLxaJ9IuIhUxxUMXPESiaxh_eVkRfl8HbLZ7vjM  
**Request:**
```json
<no body>
```
**Response (200):**
```json
[]
```
**Status:** PASS


**Total: 116 passed, 18 failed, 134 endpoints tested**
