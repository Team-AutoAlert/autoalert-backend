# Order Service - SOS Alerts API

This service handles SOS alerts for vehicle breakdowns, connecting drivers with available mechanics.

## SOS Alerts Routes

### Create SOS Alert
```http
POST /api/sos-alerts
```
Creates a new SOS alert when a driver needs assistance.

**Request Body:**
```json
{
    "driverId": "string",
    "vehicleId": "string",
    "communicationMode": "audio|video",
    "breakdownDetails": "string"
}
```

### Get Active SOS Alerts
```http
GET /api/sos-alerts/active
```
Retrieves all active SOS alerts with driver and vehicle details.

### Get Active SOS Alerts for Mechanic
```http
GET /api/sos-alerts/:mechanicId/active
```
Retrieves active SOS alerts that were matched with a specific mechanic.

### Accept SOS Alert
```http
POST /api/sos-alerts/:alertId/accept
```
Allows a mechanic to accept an SOS alert.

**Request Body:**
```json
{
    "mechanicId": "string"
}
```

### Complete SOS Alert
```http
POST /api/sos-alerts/:alertId/complete
```
Marks an SOS alert as completed and generates a bill.

**Request Body:**
```json
{
    "callDuration": number
}
```

### Get All SOS Alerts
```http
GET /api/sos-alerts
```
Retrieves all SOS alerts with optional filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (active, in_progress, completed, cancelled)
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

## Response Format

All responses follow this format:
```json
{
    "success": boolean,
    "data": object|array,
    "message": "string"
}
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## Authentication

All routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Notes

- SOS alerts are automatically matched with available mechanics based on:
  - Specialization requirements
  - Working hours
  - Current availability
- When an alert is created, matching mechanics are notified
- Only mechanics who were matched with an alert can see and accept it
- Completed alerts generate bills through the payment service 