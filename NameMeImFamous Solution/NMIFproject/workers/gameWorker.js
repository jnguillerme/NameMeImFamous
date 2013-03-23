/* This is a regular JS file */
include("scripts/NMIF.js")

onmessage = function(event) {
	console.log('sharedWorker - onMessage');
	var message = event.data;	
	console.log('[gameWorker:' + message.type + '] [' + message.SessionID + '][' +  message.ProcessFunc + ']');
	// call the function to process the work
	try {
		Function("message", message.ProcessFunc+"(message)")(message);	
	} catch(err) {
		console.log('Call to function ' + message.ProcessFunc + ' failed. ' + err.message);
	}
}
