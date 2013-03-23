var HTTP_REQUEST= {};

HTTP_REQUEST.checkRequestIsValid = function(request, expectedSize) 
{	
	var error = new Object();
	error.code = 0;
	error.message = "";
	
	if (request.parts.length != expectedSize) {
		error.code = "1001";
		error.message = "Invalid number of parameters in request. Expected " + expectedSize + " - Received " + request.length;
	}
	
	return error;	
}

HTTP_REQUEST.getRequestParam = function(request, paramPos, defaultValue) 
{
	if (defaultValue === undefined || defaultValue === null) {
		defaultValue = "";
	}
	
	var paramValue = defaultValue;
	if (request.parts.length > paramPos) {
		paramValue = request.parts[paramPos].asText;
	}
	
	return paramValue;
}	


