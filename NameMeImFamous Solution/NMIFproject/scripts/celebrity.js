include("scripts/game.js")

var CELEBRITY = {};

CELEBRITY.activateFreebaseCheck = false;

CELEBRITY.createCelebrity = function(celebrityName)
{
	var celebrity = new ds.Celebrity();
	celebrity.Name = celebrityName;
	celebrity.save();
	return celebrity;
}
CELEBRITY.getCelebrityList = function(message)
{
	console.log('CELEBRITY.getCelebrityList');
// SELECT all available celebrityGroups for sessionID 
// only notify if the celebrityGroup is available for that sessionID
	var celebrity = ds.Celebrity.query('ID > ' + message.CelebrityID);
	var celebrities  = 0;
	if (celebrity != null && celebrity != undefined ) {
		celebrities = celebrity.length;
	}
	celebrity.forEach(function(c, i) { 
		if (c.group != null && c.group != 'undefined') {
			NMIF.notify(message.SessionID, 'newcelebrity:' + c.ID + ':' + c.Name + ':' + c.group.group); 
		}
		if (i == (celebrities - 1) ) {
			NMIF.notify(message.SessionID, 'celebritylistend:' + message.SessionID); 		
		}
	} );
	
	if (celebrities == 0) {
		NMIF.notify(message.SessionID, 'celebritylistend:' + message.SessionID); 		
	}
}

CELEBRITY.getTopCelebrityList = function(message)
{
	var sessionID = message.SessionID;
	ds.Celebrity.query("gameCount > 1 order by gameCount DESC").forEach(function(c, i) { 
		console.log (i + ' / ' + c.Name);
		NMIF.notify(sessionID, 'topcelebrity:' + i + ':' + c.Name + ':' + c.role);
	});
}

CELEBRITY.setCelebrityForOpponent = function(message) 
{    
	var sessionID = message.SessionID;
	var gameID = message.GameID;
	
	console.log("[setCelebrityForOpponent] [%s][%s] to set celebrity %s for opponent", sessionID, gameID, message.CelebrityName);
	
	var error = new Object();
	error.code = "0";
	error.message = "";	
	
	// check that the celebrity exist in the celebrity list
	var celebrityName = message.CelebrityName.toLowerCase().trim();
	var celebrity = ds.Celebrity({Name: celebrityName});			
	if (celebrity === null) {
		// if it doesn't exist in our local DB, query Freebase
		if ( CELEBRITY.activateFreebaseCheck == true && CELEBRITY.existInFreebase (celebrityName) == true) {
			celebrity = CELEBRITY.createCelebrity(celebrityName);
		} else {
			console.log('"Celebrity unknown " + celebrityName');
			error.code = "3001";
			error.message = "Celebrity unknown " + celebrityName;
		}
	} 	
	
	if (error.code === "0") {		
		console.log(celebrityName + ' found in celebrity list');
		var opponent = GAME.getOpponentForUpdate(sessionID, gameID, "started");		
	 	var pig = ds.PlayerInGame.query("player.ID == " + sessionID + " and game.ID == " + gameID + " and game.status == 'started'");
		var player = ds.PlayerInGame(String(pig.ID));
	 	
		var opponentHasToken = false;
		if (player != null && player != undefined) {
			if (player.celebrity != null && player.celebrity != undefined) {
				opponentHasToken = true;
			}
			player.hasToken = (!opponentHasToken);
			player.save();
		}

		// update the player's opponent with the choosen celebrity 
		if (opponent !== null ) {
			opponent.celebrity = celebrity;
			opponent.hasToken = opponentHasToken;
			opponent.save();		
			if (error.code !== "0") {
				console.log("setCelebrityForOpponentFailed: [" + error.code + "][" + error.message + "]");
				NMIF.notify(sessionID, "pickupcelebrityerror:" + gameID + ":" + error.message);
			} else {
				NMIF.notify(sessionID, "pickupcelebrityack:" + gameID + ":" + celebrityName);
				//CELEBRITY.notifyOfCelebritySet(opponent.ID, gameID, celebrity.Name);
			} 
		} else {
			console.log('Opponent not found');
			error.code = "3003";
			error.message = "Opponent not found";
		}
	}

	if (error.code != "0") {
		NMIF.notify(sessionID, "pickupcelebrityerror:" + gameID + ":" + error.message);
	}
	return error;
}

CELEBRITY.notifyOfCelebritySet = function(sessionID, gameID, celebrity) 
{
	// notify player that a celebrity got picked up for him by his opponent
	NMIF.notifyOfCelebritySet(sessionID, gameID, celebrity);
	
	// check if the other player already has a celebrity assigned
	// if so, the game can start. The first player that picked up a celebrity can start
	// if not, we need to wait for the other player to pick up a celebrity
	var opponent = GAME.getOpponentForUpdate(sessionID, gameID, "started");
	if ((opponent !== null && opponent !== undefined) && (opponent.celebrity !== null && opponent.celebrity !== undefined) ) {		
		/*var pig = ds.PlayerInGame.query("player.ID == " + sessionID + " and game.status == 'started'");
		if ( (pig !== null && pig !== undefined) && (pig.game !== null && pig.game !== undefined) ) {
			var g = ds.PlayerInGame(String(pig.ID)).game;
			g.status = 'started';
			g.save();				
		}*/
		error = PLAYERACCOUNT.updatePlayerStatus(sessionID, "starting game", "game started");
		if (error.code === "0") {
			error = PLAYERACCOUNT.updatePlayerStatus(opponent.player.ID, "starting game", "game started");
		}
		if (error.code === "0") {
			opponent.hasToken = true;
			opponent.save();
				
			NMIF.notify(opponent.player.ID, 'gamestarted:' + gameID + ':0');
			NMIF.notify(sessionID, 'gamestarted:' + gameID + ':1');			// will start the game
		}
	} else {
		// notify of game error
	}
}


/**
  * @function;  submitCelebrity
  * @description: 
  * 	This function will check if the celebrity submitted is the one is looking for
  *		It will update the datastore accordingly
  * @param: sessionID: user unique session ID
  * @param: celebrityName: the celebrity the user is submitting
  */
CELEBRITY.submitCelebrity = function(message)
{
	var sessionID = message.SessionID;
	var gameID = message.GameID;
	var celebrityName = message.CelebrityName;
	
	var game = ds.PlayerInGame.query("player.ID == " + sessionID + " and game.ID == " + gameID + " and game.status == 'started'");
	var celebrityFound = 'failed';
	
	if (game !== null && game !== undefined && game.length > 0) {
		celebrityName = celebrityName.toLowerCase().trim();
		var pig = ds.PlayerInGame.query("game.ID == " + game.game.ID + " and player.ID == " + sessionID);
		if (pig !== null && pig !== undefined) {
			if (pig.celebrity.Name == celebrityName) {
				celebrityFound = 'success';
				GAME.gameOver(game.game.ID, sessionID);
			} else {
				var player = ds.PlayerInGame(String(pig.ID));	
				player.skipNextTurn = true;
				player.save();
				var opponent = GAME.getOpponentForUpdate(sessionID, gameID, 'started');
				if (opponent !== null && opponent !== undefined && opponent.skipNextTurn == true) {
					opponent.skipNextTurn = false;
					opponent.save();
				}
			}	
		}
	}

	NMIF.notify(sessionID, 'celebritysubmitted:' + gameID + ":" + celebrityName + ":" + celebrityFound);		

	var opponent = GAME.getOpponent(sessionID, gameID, 'started');
	if (opponent !== null) {
		NMIF.notify(opponent.player.ID, 'celebritysubmittedbyopponent:' + gameID + ':' + celebrityName + ":" + celebrityFound);		
	}
}

/**
  * @function: queryFreebase
  * @description: 
  * 	This function will query Freebase to check that the celebrity exists
  * @param: celebrityName: the celebrity the user is submitting
  * @return: true if the celebrity exists in Freebase
  *			 false otherwise
  */
  CELEBRITY.existInFreebase = function(celebrityName)
  {
  	var ret = false;
  	
  	console.log('Querying Freebase for ' + celebrityName);
	var query = {'id': null, 'name': celebrityName, 'type': '/people/person', 'limit': 1};
  	var query_enveloppe = 'query=' +  JSON.stringify(query);
  	var service_url = 'https://www.googleapis.com/freebase/v1/mqlread';
	var freebaseApiKey = 'AIzaSyByT5UNeL7fKygsJq-U1yi-ZFPvC08F3BA';

	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", service_url + '?' + query_enveloppe + '&key=' + freebaseApiKey, false );
    xmlHttp.send( null );
    
    if (xmlHttp.status === 200) {  
    	var queryResult = JSON.parse(xmlHttp.responseText);
    	console.log(queryResult);
    	ret = (queryResult.result !== null);
    } else {
    	ret = false;
    	console.log('Freebase query failed :' + xmlHttp.status);    	
    	console.log(service_url + '?' + query_enveloppe + '&key=' + freebaseApiKey);    	
    }
    return ret;
    
  }