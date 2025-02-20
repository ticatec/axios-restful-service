# RestService - A lightweight REST client for JavaScript

RestService is a lightweight and flexible REST client for JavaScript, built with flexibility and simplicity in mind. With it, you can perform HTTP GET, POST, PUT, and DELETE requests with ease.

## Installation
To use RestService, you can install it via npm or include it directly in your code.

Via npm:
```shell
npm install @ticatec/rest-service
```

## Usage
### Import
To use RestService, simply import it into your project.
```javascript
import RestService from "@ticatec/rest-service";
```

## Initialization
Once you have imported the RestService class, you can create a new instance of the client with the following code:
```typescript
const rest = new RestService("http://your-api.com");
```

You can also provide a custom error handler, pre-interceptor, and post-interceptor to the RestService constructor:
```typescript
const rest = new RestService(
    "http://your-api.com",
    (ex) => console.error(ex), // custom error handler
    (headers, method, url) => console.log(`Requesting ${method} ${url}`), // pre-interceptor
    (data) => { console.log(data); return data; } // post-interceptor
);
```

## Methods
The RestService class provides four methods for making HTTP requests: get(), post(), put(), and del(). Each of these methods takes the following parameters:  
**url**: The URL to which the request will be sent.  
**data**: The data to be sent with the request. This can be any JavaScript object or primitive value.  
**params**: Optional parameters to be appended to the URL.  
**dataProcessor**: An optional function to be applied to the response data before it is returned.  

### get()
```typescript
rest.get("/users", { page: 1, limit: 10 }).then((data) => {
    console.log(data);
});
```

### post()
```typescript
const user = { name: "John Doe", email: "johndoe@example.com" };

rest.post("/users", user).then((data) => {
    console.log(data);
});
```

### put()
```typescript
const user = { name: "John Doe", email: "johndoe@example.com" };

rest.put("/users/1", user).then((data) => {
    console.log(data);
});
```

### del()
```typescript
rest.del("/users/1").then((data) => {
    console.log(data);
});
```

**Debugging**
You can enable debugging mode by calling the setDebug() method of the RestService class:
```typescript
RestService.setDebug(true);
```
When debugging mode is enabled, the client will output helpful log messages to the console, including the HTTP method, URL, parameters, and response data.

## Customization
The RestService class provides several options for customizing its behavior:

**preInvoke**: A function that is called before each request is made. This can be used to modify the request headers or perform other custom operations. 
**postInvoke**: A function that is called after each request is made. This can be used to modify the response data or perform other custom operations.
