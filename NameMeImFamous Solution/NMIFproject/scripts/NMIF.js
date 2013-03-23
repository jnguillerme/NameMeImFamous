/* This is a regular JS file */
include("scripts/celebrity.js")
include("scripts/question.js")
include("scripts/game.js")
include("scripts/playerAccount.js")

var NMIF = {};


NMIF.createNotificationServerThread = function(ws) 
{	
	NMIF["nsThread"] = ws;
	console.log("Notification server thread created");
}

NMIF.getNotificationServerThread = function() 
{	
	return NMIF["nsThread"];
}

//////////////////////
/// Notifications handling
////
NMIF.notifyPlayerOfNewRandomGame = function(sessionID, gameID, opponentLogin, packages)
{
	NMIF.notify(sessionID, 'newgame:' + gameID + ':' + opponentLogin + ':' + packages);
}

NMIF.notifyOfCelebritySet = function(sessionID, gameID, celebrity) 
{
	NMIF.notify(sessionID, 'celebritypickupbyopponent:' + gameID + ':' + celebrity);
}

NMIF.notify = function(sessionID, message)
{
	console.log("notify [" + sessionID + "][" + message + "]");
	
	// check if session is connected
	var player = ds.PlayerAccount({ID:sessionID});
	
	if (player != null && player != undefined) {
		if (player.status === 'not connected') { 
			NMIF.storeNotification(sessionID, message);
		} else {	
			message = message + '$';
			var nsWkr = new SharedWorker("sharedWorkers/notificationServer.js", "NotificationServer")
			var thePort = nsWkr.port;
			
			thePort.onmessage = function(event) {
		    	var msg = event.data;
		    	
		    	switch (msg.type) {
		        case 'connected':
		            parentRef = msg.ref;
		            thePort.postMessage({type: 'notify', ref: parentRef, sessionID: sessionID, message: message});
		            break;
		  
		        case 'notifyAck':
		            exitWait();
		            break;

		        case 'notifyError':
		            exitWait();
		            break;
		        }
		    }
    		wait();
    	}
    }
}

NMIF.storeNotification = function(sessionID, message)
{
	// store message in notification table
	var notification = new ds.Notification();
	notification.sessionID = sessionID;
	notification.message = message;
	notification.save();
}
NMIF.notifyFromDatastore = function(message)
{
	var notifications = ds.Notification.query("sessionID = " + message.SessionID).forEach(function(notif) {
		NMIF.notify(notif.sessionID, notif.message);
		notif.remove();
	});
}

/////////////////////
// REQUEST processing handling
////////
NMIF.processRequest = function(message) 
{
	console.log('NMIF.processRequest');
	var worker = new Worker("workers/gameWorker.js");
	worker.postMessage(message);	
}

NMIF.notifyFromDatastoreRequest = function(sessionID)
{
	console.log('NMIF.notifyFromDatastoreRequest');
	NMIF.processRequest({type: 'notifyfromdatastore', SessionID: sessionID, ProcessFunc: 'NMIF.notifyFromDatastore'});		
}

NMIF.getCelebrityList = function(sessionID, lastCelebrityID) 
{
	console.log('NMIF.getCelebrityList');
	NMIF.processRequest({type: 'getCelebrityList', SessionID: sessionID, CelebrityID: lastCelebrityID, ProcessFunc: 'CELEBRITY.getCelebrityList'});
}

NMIF.setCelebrityForOpponent = function(sessionID, gameID, celebrityName)
{
	NMIF.processRequest({type: 'newCelebritySet', SessionID: sessionID, GameID: gameID, CelebrityName: celebrityName, ProcessFunc: 'CELEBRITY.setCelebrityForOpponent'});
}

NMIF.submitCelebrity = function(sessionID, gameID, celebrityName)
{
	NMIF.processRequest({type: 'celebritySubmitted', SessionID: sessionID, GameID: gameID, CelebrityName: celebrityName, ProcessFunc: 'CELEBRITY.submitCelebrity'});
}

NMIF.askQuestion = function(sessionID, gameID, question)
{
	NMIF.processRequest({type: 'newQuestionAsked', SessionID: sessionID, GameID: gameID, Question: question, ProcessFunc: 'QUESTION.askQuestion'});
}

NMIF.answerQuestion = function(sessionID, gameID, questionID, answer)
{
	NMIF.processRequest({type: 'newAnswer', SessionID: sessionID, GameID: gameID, QuestionID: questionID, Answer: answer, ProcessFunc: 'QUESTION.answerQuestion'});
}

NMIF.endTurn = function(sessionID, gameID)
{
	NMIF.processRequest({type: 'turnEnded', SessionID: sessionID, GameID: gameID, ProcessFunc: 'GAME.endTurn'});
}

NMIF.startTyping = function(sessionID, gameID)
{
	NMIF.processRequest({type: 'typingStarted', SessionID: sessionID, GameID: gameID, ProcessFunc: 'GAME.typingDidStart'});
}

NMIF.stopTyping = function(sessionID, gameID)
{
	NMIF.processRequest({type: 'typingStopped', SessionID: sessionID, GameID: gameID, ProcessFunc: 'GAME.typingDidStop'});
}

NMIF.disconnected = function(sessionID)
{
	NMIF.processRequest({type: 'disconnected', SessionID: sessionID, ProcessFunc: 'GAME.disconnect'});
}

NMIF.getAvailablePackages = function(sessionID)
{
	NMIF.processRequest({type: 'getAvailablePackages', SessionID: sessionID, ProcessFunc: 'PLAYERACCOUNT.getAvailablePackages'});
}

NMIF.updatePackage = function(sessionID, packageName, enable)
{
	NMIF.processRequest({type: 'updatePackage', SessionID: sessionID, Group:packageName, Enabled:enable, ProcessFunc: 'PLAYERACCOUNT.updatePackage'});
}

NMIF.getTopCelebrityList = function(sessionID)
{
	NMIF.processRequest({type: 'getTopCelebrities', SessionID: sessionID, ProcessFunc: 'CELEBRITY.getTopCelebrityList'});
}
NMIF.getMyGamesInProgress = function(sessionID) 
{
	NMIF.processRequest({type: 'getMyGamesInProgress', SessionID: sessionID, ProcessFunc: 'GAME.getMyGamesInProgress'});
}

NMIF.getMyGamesHistory = function(sessionID, gameID)
{
	NMIF.processRequest({type: 'mygameshistory', SessionID: sessionID, GameID: gameID, ProcessFunc: 'GAME.getMyGamesHistory'});
}

NMIF.quitGame = function(sessionID, gameID)
{
	NMIF.processRequest({type: 'quitGame', SessionID: sessionID, GameID: gameID, ProcessFunc: 'GAME.quitGame'});
}