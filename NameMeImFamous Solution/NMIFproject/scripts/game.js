/**

* @author Jino

* Handle all the events related to the Game management

*/
include('scripts/NMIF.js')
include("scripts/playerAccount.js")


var GAME = {};


function newRandomGameRequest(request, response) 
{
    // get parts from the request object
    var sessionID = request.parts[0].asText;
	console.log("[newRandomGame] New random game initiated [%s]", sessionID);

	NMIF.processRequest({type: 'newRandomGame', SessionID: sessionID, ProcessFunc: 'GAME.NewRandomGame'});		

	return '{"success":"1"}';
}
GAME.NewRandomGame = function (message) {
	console.log("[newRandomGame] New random game");
	var sessionID = message.SessionID;
    // check user status
    var error = PLAYERACCOUNT.updatePlayerStatus(sessionID, "connected", "random game request");
	
	if (error.code === "0") {
		GAME.checkNewRandomGames();	
	}
}

GAME.checkNewRandomGames = function() 
{
	var playerInGameList = [];
	var randomGameRequests = ds.PlayerAccount.query('status = "random game request"').forEach(function(p) {
		if ( playerInGameList.indexOf(p.ID) == -1 ) {
			var gIDs = 	p.availablePackagesCollection.query('enabled = true').celebrityGroup.toArray("ID");
			var gIDArray = [];
			for (i = 0; i < gIDs.length; i++) {
				gIDArray.push(gIDs[i].ID);	
			}
			var p2 = ds.PlayerAccount.query('status = "random game request" and ID != ' + p.ID).availablePackagesCollection.query('enabled = :1 and celebrityGroup.ID in :2  and ! (player.ID in :3)', true, gIDArray, playerInGameList); 
			if (p2.length >0) {
				playerInGameList.push(p2[0].player.ID);
				playerInGameList.push(p.ID);
				var packagesInCommon = p2.query('player.ID = ' + p2[0].player.ID).celebrityGroup.group;
				GAME.createNewRandomGame(p, p2[0].player, packagesInCommon);			
			}
		}
		
	});	
}

GAME.createNewRandomGame = function(player1, player2, packages) 
{
	// new game
	//ds.startTransaction();
	//try {
		var theGame = new ds.Game();
		theGame.status = "started";
		theGame.save();

		// new playerInGame
		GAME.addPlayerInGame(ds.PlayerAccount({ID:player1.ID}), theGame);	
		GAME.addPlayerInGame(ds.PlayerAccount({ID:player2.ID}), theGame);	
		
		// notify the player a new game has been found
	 	NMIF.notifyPlayerOfNewRandomGame(player1.ID, theGame.ID, player2.login, packages);
	 	NMIF.notifyPlayerOfNewRandomGame(player2.ID, theGame.ID, player1.login, packages);
	 	
		// update playeraccount
		/*ds.commit();
	} catch(error) {
		ds.rollBack();	
	}*/
}

GAME.addPlayerInGame = function(thePlayer, theGame)
{
	thePlayer.status = "starting game";
	thePlayer.save();

	new ds.PlayerInGame({game:theGame, player:thePlayer, skipNextTurn:false}).save();
} 

GAME.getOpponent = function(sessionID, gameID, gameStatus, forUpdate) 
{
	var game = ds.PlayerInGame.query("player.ID == " + sessionID + " and game.ID == " + gameID + " and game.status =% " + gameStatus);
	var opponent = null;
	
	if (game !== null && game.length == 1) {
		opponent = 	ds.PlayerInGame.query("game.ID == " + game[0].game.ID + " and player.ID !== " + sessionID);
	}
	
	if (opponent !== null && opponent.length == 1) { 
		if (forUpdate == true) {
			return opponent[0];
		} else {
			return ds.PlayerInGame(String(opponent[0].ID));
		}
	} else {
		return null;
	}
}
GAME.getOpponentForUpdate = function(sessionID, gameID, gameStatus) 
{
	return GAME.getOpponent(sessionID, gameID, gameStatus, true);
}
  
/**
  * @function: endTurn
  * @description:
  *		This function will end the turn in progress and start a new one
  * 	Users will be notified that a new turn has started
  *	@param: sessionID of the user initiating the end of turn
  */
  GAME.endTurn =  function(message)
  {
  	var sessionID = message.SessionID;
  	var gameID = message.GameID;
  	
 	ds.startTransaction();
	try {
	 	// 1 - update token in database
	 	var pig = ds.PlayerInGame.query("player.ID == " + sessionID + " and game.ID == " + gameID + " and game.status == 'started'");
		var player = ds.PlayerInGame(String(pig.ID));
	 	var opponent = GAME.getOpponent(sessionID, gameID, 'started');
  		var sessionIDWithoutToken;
  		var sessionIDWithToken;
  		
  		if (opponent !== null && opponent !== undefined) {
  			if (opponent.skipNextTurn === true) {	
  				opponent.skipNextTurn = false;
  				opponent.save();
  				// opponent should skip its turn, so token doesn't change
  				sessionIDWithToken = sessionID;
  				sessionIDWithoutToken = opponent.player.ID;
  				
			} else {
	 			player.hasToken = false;
	  			player.save();
	  	  		opponent.hasToken = true;
	  			opponent.save();

  				sessionIDWithToken = opponent.player.ID;
  				sessionIDWithoutToken = sessionID;
	  		}	
		  	// 2- notify players of newTurn
			NMIF.notify(sessionIDWithoutToken, 'newturn:' + gameID + ':0'); 				// hastoken = false
			NMIF.notify(sessionIDWithToken, 'newturn:' + gameID + ':1'); 		// hastoken = true
					 
	  		ds.commit();
  		}
  	} catch(error) {
  		ds.rollBack();
		NMIF.notify(sessionID, 'newturnerror:' + gameID); 				// hastoken = false
		NMIF.notify(opponent.player.ID, 'newturnerror:'+ gameID); 		// hastoken = true
  	}
  }
  
 GAME.typingDidStart = function(message)
 {
 	PLAYERACCOUNT.notifyOpponentOfStatusChange(message.SessionID, message.GameID, 'typing:' + message.GameID);
 }
 
  GAME.typingDidStop = function(message)
 {
 	PLAYERACCOUNT.notifyOpponentOfStatusChange(message.SessionID, message.GameID, 'typingstopped:' + message.GameID);
 }
 
/**
  * @function:  gameOver
  * @description: 
  * 	This function will update the datastore as the game is over
  * @param: gameID: unique ID of the game that is over 
  * @param: winnerID: unique ID of the user that won the game
  */
GAME.gameOver= function(gameID, winnerID)
{
	var opponent = GAME.getOpponent(winnerID, gameID, 'started');
	var opponentID = opponent.player.ID;
	var opponentCelebrity = opponent.celebrity;
 	
 	ds.startTransaction();
	try {
		// update player status -> connected
		PLAYERACCOUNT.updatePlayerStatus(winnerID, 'game started', 'connected');
		PLAYERACCOUNT.updatePlayerStatus(opponentID,'game started', 'connected');
		
		// move game to GameCompleted
		
		// 1 - create new completed game
		var today = new Date();
		var gameCompleted = new ds.CompletedGame({gameDate:today});
		gameCompleted.save();
		
		// 2 - create new PlayerInCompletedGame
	 	var pig = ds.PlayerInGame.query("player.ID == " + winnerID + " and game.ID == " + gameID + " and game.status == 'started'");
	 
		 if (pig !== null && pig !== undefined) {
			var winner = ds.PlayerInGame(String(pig.ID));
	 	
			GAME.createPlayerInCompletedGame(gameCompleted, winner, true);
			GAME.createPlayerInCompletedGame(gameCompleted, opponent, false);			
	
			// 3 - delete PlayerInGame to refer to completedGame?	
		/*	if (winner !== null && winner !== undefined) {
				winner.remove();
			}
			if (opponent !== null && opponent !== undefined) {
				opponent.remove();
			}*/
		}
		
		// 4 - delete game --> will delete corresponding PlayerInGame records
		var game = ds.Game(String(gameID));
		game.remove();
		
		ds.commit();
		
	} catch(error) {
		console.log("Game over database update failed (" + error + ")");
		ds.rollback();
	}
	
	NMIF.notify(winnerID, 'gameover:' + gameID + ':youwon');			
	if (opponent !== null) {
		NMIF.notify(opponentID, 'gameover:' + gameID + ':youlost:' + opponentCelebrity.Name);		
	}
}
/**
  * @function: createPlayerInCompletedGame
  * @description: create a new PlayerInCompletedGame record based on the PlayerInGame record received
  *
  * @param: gameCompleted  
  * @param: ID: PlayerInGame record that needs to be moved to PlayerInCompletedGame
  * @param: isWinner: true if the player won the game. False otherwise
  *
  */
  
GAME.createPlayerInCompletedGame = function(gameCompleted, pig, isWinner)
{
	var picg = null;
	if (pig !== null && pig !== undefined) {
		picg = new ds.PlayerInCompletedGame();
		picg.player = pig.player;
		picg.celebrity = pig.celebrity;
		picg.numberOfQuestionsAsked = pig.numberOfQuestionsAsked;
		picg.isWinner = isWinner;
		picg.game = gameCompleted;
		picg.save();
	}
	
	return picg;
}
GAME.getMyGamesInProgress = function(message) 
{
	var sessionID = message.SessionID;
	ds.Game.query('players.player.ID = ' + sessionID).forEach(function(g) { 
		g.players.query('player.ID!=' + sessionID).forEach(function(p) {
			var hasToken = '';
			var celebrityName = '';
			var celebrityPickedUpByOpponent = false;

			if (p.hasToken != null && p.hasToken != undefined) {
				hasToken = p.hasToken;				
			}
			if (p.celebrity != null && p.celebrity != undefined) {
				celebrityName = p.celebrity.Name;			
			}
			
			var myPlayer = g.players.query('player.ID=' + sessionID);
			if (myPlayer[0].celebrity != null && myPlayer[0].celebrity != undefined) {
				celebrityPickedUpByOpponent = true;
			}
			
			var gIDs = ds.PlayerAccount(sessionID).availablePackagesCollection.query('enabled = :1', true).celebrityGroup.toArray("ID");
			var gIDArray = [];
			for (i = 0; i < gIDs.length; i++) {
				gIDArray.push(gIDs[i].ID);	
			}
			var packagesInCommon = ds.PlayerAccount(p.player.ID).availablePackagesCollection.query('enabled = :1 and celebrityGroup.ID in :2 )', true, gIDArray).celebrityGroup.group; 

			NMIF.notify(message.SessionID, 'newgameinprogress:' + g.ID + ':' + p.player.login + ':' + hasToken + ':' + celebrityName + ':' + celebrityPickedUpByOpponent + ':' + packagesInCommon); 
			// replay any message 
			NMIF.notifyFromDatastoreRequest(sessionID);
		} );
		ds.Question.query('playerInGame.player.ID = ' + sessionID + ' and playerInGame.game.ID = ' + g.ID).forEach(function(q) { 
			NMIF.notify(message.SessionID, 'newgameinprogressquestion:' + g.ID + ':' + q.ID + ':' + q.questionAsked + ':' + q.answer);
		});
	});
	NMIF.notify(message.SessionID, 'newgameinprogressend:' + sessionID); 
}		
GAME.getMyGamesHistory = function(message)
{
	var sessionID = message.SessionID;
	// ALL games for player SessionID
	var games = ds.PlayerAccount.query("ID = " + sessionID + " and playerInCompletedGameCollection.game.gameDate != null").forEach( function(games) { 
		// all players in that game
		games.playerInCompletedGameCollection.game.query("gameDate != null").forEach( function(g) {
			g.playerInCompletedGameCollection;
			var me = g.playerInCompletedGameCollection.query("player.ID = " + sessionID ); 
			var opponent = g.playerInCompletedGameCollection.query("player.ID != " + sessionID ); 
	
			var gameDate = me[0].game.gameDate;
			var gameDay = gameDate.getDate();
			if (gameDay < 10) {
				gameDay = "0" + gameDay;	
			}
			var gameMonth = gameDate.getMonth() + 1;
			if (gameMonth < 10) {
				gameMonth = "0" + gameMonth;	
			}

			var formattedGameDate = gameDay + "-" + gameMonth + "-" + gameDate.getFullYear();
			NMIF.notify(sessionID, 'newhistoricalgame:' + formattedGameDate + ":" + opponent.player.login + " :" + me.isWinner + ":" + me.celebrity.Name + ":" + opponent.celebrity.Name);
	});
 });
}

GAME.quitGame = function(message)
{
	var sessionID = message.SessionID;
	var gameID = message.GameID;
	//  If any opponent exists, there's a game in progress -> notify the opponent that the player is not connected anymore
	var opponent = GAME.getOpponent(sessionID, gameID, 'start');	
	if (opponent !== undefined && opponent != null) {
		// 	delete game
		var gameToRemove = ds.Game.query("ID == " + gameID);
		if (gameToRemove !== null && gameToRemove !== undefined) {
			gameToRemove.remove();
		}
			
		NMIF.notify(opponent.ID, 'gameover:opponentquit:' + gameID);		
	}
}

GAME.disconnect = function(message) 
{
	// update player status -> connected
	PLAYERACCOUNT.updatePlayerStatus(message.SessionID, null, 'not connected');

}