class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400; // true for 2xx and 3xx
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;