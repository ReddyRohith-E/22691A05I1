# HTTP URL Shortener Microservice

A comprehensive full-stack URL shortener application demonstrating robust microservice architecture with React frontend, Node.js/Express.js backend, and custom logging middleware.

## 🏗️ Project Structure

```
project/
├── LoggingMiddleware/          
│   ├── index.js               
│   ├── package.json                      
├── BackendTestSubmission/      
│   ├── controllers/          
│   ├── services/             
│   ├── routes/               
│   ├── server.js             
│   ├── package.json                      
├── FrontendTestSubmission/     
│   ├── src/                  
│   │   ├── components/       
│   │   ├── pages/            
│   │   ├── context/          
│   │   ├── services/         
│   │   └── utils/            
│   ├── public/               
│   ├── package.json                      
└── README.md                 
```

## ✨ Features

### Core Functionality
- **URL Shortening**: Convert long URLs into short, manageable links
- **Custom Shortcodes**: Optional user-defined shortcodes (4-10 alphanumeric characters)
- **Configurable Expiry**: Set validity period (1-43200 minutes, default: 30 minutes)
- **Click Analytics**: Comprehensive tracking with geographic and referrer data
- **Redirect Service**: Fast redirection to original URLs

### Technical Features
- **Microservice Architecture**: Standalone backend service
- **RESTful API**: Well-designed API endpoints
- **Custom Logging**: Extensive logging with Winston
- **Input Validation**: Both client-side and server-side validation
- **Error Handling**: Robust error handling with appropriate HTTP status codes
- **Security Features**: Rate limiting, CORS, input sanitization

### Frontend Features
- **Responsive Design**: Mobile-first Material-UI interface
- **Batch Processing**: Shorten up to 5 URLs simultaneously
- **Real-time Analytics**: Detailed statistics and visualizations
- **Copy to Clipboard**: Easy sharing functionality
- **Search History**: Quick access to previous searches

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install Logging Middleware**
   ```bash
   cd LoggingMiddleware
   npm install
   cd ..
   ```

3. **Setup Backend**
   ```bash
   cd BackendTestSubmission
   npm install
   cd ..
   ```

4. **Setup Frontend**
   ```bash
   cd FrontendTestSubmission
   npm install
   cd ..
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd BackendTestSubmission
   npm start
   # Server runs on http://localhost:3100
   ```

2. **Start the Frontend Application** (in a new terminal)
   ```bash
   cd FrontendTestSubmission
   npm start
   # Application runs on http://localhost:3000
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3100
   - Health Check: http://localhost:3100/health

## 📡 API Endpoints

### Create Short URL
```http
POST /shorturls
Content-Type: application/json

{
  "url": "https://example.com/very-long-url",
  "validity": 30,
  "shortcode": "custom123"
}
```

**Response (201 Created):**
```json
{
  "shortLink": "http://localhost:3100/custom123",
  "expiry": "2025-07-11T12:30:00.000Z"
}
```

### Get URL Statistics
```http
GET /shorturls/{shortcode}
```

**Response (200 OK):**
```json
{
  "shortcode": "custom123",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2025-07-11T12:00:00.000Z",
```http
GET /shorturls/{shortcode}
```

**Response (200 OK):**
```json
```json
{
  "shortcode": "custom123",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2025-07-11T12:00:00.000Z",
```http
GET /shorturls/{shortcode}
```

**Response (200 OK):**
```json
{
  "shortcode": "custom123",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2025-07-11T12:00:00.000Z",
  "expiresAt": "2025-07-11T12:30:00.000Z",
  "totalClicks": 5,
  "clicks": [
    {
      "timestamp": "2025-07-11T12:05:00.000Z",
      "referrer": "google.com",
      "location": "New York, US",
      "userAgent": "Chrome 91"
    }
  ]
}
```

### Redirect to Original URL
```http
GET /{shortcode}
```

**Response:** 302 Redirect to original URL

## 🎯 Validation Rules

### URL Requirements
- Must be a valid URL format
- Must include http:// or https:// protocol
- Cannot be empty

### Shortcode Requirements
- Optional (auto-generated if not provided)
- 4-10 characters long
- Alphanumeric characters only (a-z, A-Z, 0-9)
- Globally unique
- Cannot use reserved words

### Validity Requirements
- Optional (defaults to 30 minutes)
- Integer between 1 and 43200 minutes (30 days)

## 📊 Analytics Features

### Click Tracking
- Timestamp of each click
- Referrer information
- Geographic location (city, country)
- User agent details

### Statistics Dashboard
- Total click count
- Top referrers analysis
- Geographic distribution
- Recent activity timeline
- Detailed click history

## 🛡️ Security & Performance

### Security Features
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet.js security headers
- Input validation and sanitization
- CORS configuration
- XSS prevention

### Performance Optimizations
- Efficient in-memory storage
- Response caching
- Optimized bundle size
- Lazy loading
- Debounced validation

## 📝 Logging

The application uses a comprehensive custom logging middleware that provides:

- **Multiple Log Levels**: error, warn, info, http, debug
- **Daily Rotating Files**: Automatic log rotation
- **Structured Logging**: JSON formatted logs with metadata
- **HTTP Request Tracking**: Request/response logging
- **URL-Specific Events**: Specialized logging for URL operations

### Log Files
- `logs/application-YYYY-MM-DD.log` - All application logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/http-YYYY-MM-DD.log` - HTTP request/response logs

## 🧪 Testing

### Manual Testing with API Clients

Use tools like Postman or Insomnia to test the API endpoints:

1. **Health Check**
   ```bash
   GET http://localhost:3100/health
   ```

2. **Create Short URL**
   ```bash
   POST http://localhost:3100/shorturls
   Body: {
     "url": "https://github.com",
     "validity": 60,
     "shortcode": "github"
   }
   ```

3. **Test Redirect**
   ```bash
   GET http://localhost:3100/github
   ```

4. **Get Statistics**
   ```bash
   GET http://localhost:3100/shorturls/github
   ```

## 🚧 Development Guidelines

### Code Standards
- Use ES6+ features
- Follow REST API conventions
- Implement proper error handling
- Add comprehensive logging
- Use descriptive variable names
- Include JSDoc comments for functions

### Git Workflow
- Commit frequently with descriptive messages
- Use feature branches for development
- Follow conventional commit format
- Keep commits atomic and focused

## 📄 License

This project is for educational and demonstration purposes.

## 🙋‍♂️ Support

For any issues or questions:
1. Check the individual README files in each component folder
2. Review the API documentation above
3. Examine the log files for debugging information
4. Test individual components separately
