/* This is a regular JS file */
console.log("Start of the notification server SharedWorker");

// TCP server communication
var net = require('net');

notificationServer = net.createServer(function(socket) { // connection listener
    console.log('New connection from ' + socket.address().address + ':' + socket.address().port);

    socket.on('end', function() {
        console.log('Server disconnected');
    });

    socket.addListener('data', function(data) {
        console.log('Message ' + data.toString()); // + ' received from ' + socket.address());        
        
        var messageArray = data.toString().split("$");    
    	console.log( messageArray.length + 'messages to process' ); 
      	for (i = 0; i < messageArray.length; i++) {  
      		console.log("Processing " + messageArray[i]);
      		
        	var dataArray = messageArray[i].split(":");
        	var param2 = "";
        	var param3 = "";
      		var param4 = "";
      	
     		if (dataArray.length >= 3) {
       	 		param2 = dataArray[2];
      			if (dataArray.length >= 4) {
      				param3 = dataArray[3];
      		    	if (dataArray.length >= 5) {
      					param4 = dataArray[4];
      				}
      			}
      		}      	 	      		
      		processCommand(socket, dataArray[0], dataArray[1], param2, param3, param4);
      		}
	    });
	    
	socket.addListener('close', function() {
    	console.log('Socket disconnected');		
		removeSocketFromNotificationList(socket);   
	});	 
});

notificationServer.listen(8083, '127.0.0.1', function() {
	    console.log('server bound');
	    });	
var notificationList = {};	

var parentKey = 0;
var parentConnections = [];

function processCommand(socket, command, param1, param2, param3, param4) 
{
	switch(command) {
		case "starttyping": 			// param1 = sessionID, param2 = gameID
			processStartTyping(param1, param2);
			break; 	

		case "stoptyping": 			// param1 = sessionID, param2 = gameID
			processStopTyping(param1, param2);
			break; 	

		case "askquestion": 		// param1 = sessionID, param2 = gameID, param3 = question
			processQuestion(param1, param2, param3);
			break;        	
		
		case "answerquestion":		// param1 = sessionID param2 = gameID, param3= questionID param4 = answer
			processAnswer(param1, param2, param3, param4);
			break;        	
			
		case "endturn": 			// param1 = sessionID, gameID
			processEndTurn(param1, param2);
			break;
		
		case "submitcelebrity": 	// param1 = sessionID, param2 = gameID, param3 = celebrityName
			processSubmitCelebrity(param1, param2, param3);
			break;
					
		case "notifymeon": 			// param1 = sessionID	
        	addToNotificationList(socket, param1);
        	break;
        	
        case "getmygamesinprogress": 			// param1 = sessionID
 			processGetMyGamesInProgress(param1);
        	break;
        	
        case "getcelebritylist": 	// param1 = sessionID, param2 = lastCelebrityID received
        	processGetCelebrityList(param1, param2);
        	break;
        	
        case "pickupcelebrity": 	// param1 = sessionID, param2 = gameID, param3=celebrityName
        	processPickupCelebrity(param1, param2, param3);
        	break;

		case "gettopcelebritylist": 	// param1 = sessionID 
			processGetTopCelebrityList(param1);
			break;
			
		case "getavailablepackages": 	// param1 = sessionID
			processGetAvailablePackages(param1);
			break;
			
		case "updatepackage": 			// param1 = sessionID param2 = packageName param3 = enablePakage
			processUpdatePackage(param1, param2, param3);
			break;
			
 		case "getmygameshistory": 		// param1 = sessionID param2 = lastGameID received
			processGetMyGamesHistory(param1);
			break;
			
		case "quitgame": 				// param1 = sessionID param2 = gameID
			processQuitGame(param1, param2);
			break;
			
        default:
        	console.log("Unhandled command received <" + command + ">");
    }

}

function addToNotificationList(socket, sessionID)
{
	notificationList[sessionID] = socket;
	console.log('[addToNotificationList] ' + notificationList[sessionID].address().address); 
	socket.write('notifyack:ACK$');
}

function removeSocketFromNotificationList(socket) 
{
	for (sid in notificationList) {
		if (notificationList[sid] === socket) {			
			delete notificationList[sid];
			console.log('[removeSocketFromNotificationList] ' + socket.address().address); 
			NMIF.disconnected(sid);
			return;
		}
	}
}  

function processGetCelebrityList(sessionID, lastCelebrityID)
{
	console.log('[notificationServer] process get celebrity list from ID [' + lastCelebrityID +'] for session [' + sessionID + ']'); 
	NMIF.getCelebrityList(sessionID, lastCelebrityID);
}
        	
function processPickupCelebrity(sessionID, gameID, celebrityName) 
{
	console.log('[notificationServer] process pickup celebrity [' + celebrityName + '] from [' + sessionID + ' ]' + '[' + gameID + ']');
	NMIF.setCelebrityForOpponent(sessionID, gameID, celebrityName);
}

function processQuestion(sessionID, gameID, question)
{
	console.log('[notificationServer] process question [' + question + '] from [' + sessionID + ']' + '[' + gameID + ']');
	NMIF.askQuestion(sessionID, gameID, question);
}

function processAnswer(sessionID, gameID, questionID, answer)
{
	console.log('[notificationServer] process answer [' + answer + '] for question [' + questionID + '] from [' + sessionID +']' + '[' + gameID + ']');
	NMIF.answerQuestion(sessionID, gameID, questionID, answer);
}

function processSubmitCelebrity(sessionID, gameID, celebrityName)
{
	console.log('[notificationServer] process submit celebrity [' +  celebrityName + '] from [' + sessionID + ']' + '[' + gameID + ']');
	NMIF.submitCelebrity(sessionID, gameID, celebrityName);
}

function processEndTurn(sessionID, gameID)
{
	console.log('[notificationServer] process end turn from [' + sessionID + ']' + '[' + gameID + ']');
	NMIF.endTurn(sessionID, gameID);
}

function processStartTyping(sessionID, gameID)
{
	console.log('[notificationServer] process start typing from [' + sessionID + ']' + '[' + gameID + ']');
	NMIF.startTyping(sessionID, gameID);
}

function processStopTyping(sessionID, gameID)
{
	console.log('[notificationServer] process stop typing from [' + sessionID + ']' + '[' + gameID + ']');
	NMIF.stopTyping(sessionID, gameID);
}

function processGetTopCelebrityList(sessionID)
{
	console.log('[notificationServer] process getTopCelebrityList from [' + sessionID + ']');
	NMIF.getTopCelebrityList(sessionID);
}

function processGetAvailablePackages(sessionID)
{
	console.log('[notificationServer] process getAvailablePackages from [' + sessionID + ']');
	NMIF.getAvailablePackages(sessionID);
}
	
function processUpdatePackage(sessionID, packageName, enable)
{
	console.log('[notificationServer] process updatePackage from [' + sessionID + ']');
	NMIF.updatePackage(sessionID, packageName, enable);	
}
function processGetMyGamesInProgress(sessionID)
{
	console.log('[notificationServer] process getMyGamesInProgress from [' + sessionID + ']');
	NMIF.getMyGamesInProgress(sessionID);
}

function processGetMyGamesHistory(sessionID)
{
	console.log('[notificationServer] process getTopCelebrityList from [' + sessionID + ']');
	NMIF.getMyGamesHistory(sessionID);
}

function processQuitGame(sessionID, gameID)
{
	console.log('[notificationServer] process quitGame from [' + sessionID + ']' + '[' + gameID + ']');
	NMIF.quitGame(sessionID, gameID);
}

onconnect = function(msg) // called when a new SharedWorker is created
{
	console.log("NotificationServer::onconnect");

    var thePort = msg.ports[0];
    parentKey += 1;
    parentConnections[parentKey] = thePort;
    
    thePort.onmessage = function(event)
    {
        var msg = event.data;
        var fromPort = parentConnections[msg.ref];
        switch (msg.type)
        {
            case 'notify':
            	console.log("NotificationServer::notify " + msg.sessionID);

            	var theSocket = notificationList[msg.sessionID];
            	if (theSocket !== undefined) {
            		theSocket.write(msg.message);
				    fromPort.postMessage({type: 'notifyAck'});
            	} else {
 				    fromPort.postMessage({type: 'notifyError', error: 'Session not found'});
  	         	}
                //close();
                break;
 
            case 'disconnect':
            	console.log("NotificationServer::disconnect");
                parentConnections[msg.ref] = null;
                break;
        }
    }
    thePort.postMessage({type: 'connected', ref: parentKey});
} 

