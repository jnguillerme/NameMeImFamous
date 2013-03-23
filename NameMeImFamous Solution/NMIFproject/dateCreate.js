// new game
ds.Game.all(); 
try {
//	ds.startTransaction();
	var theCelebrity = ds.Celebrity.query("Name = 'madonna'");
	var theGame = new ds.Game();
	var thePlayer  = ds.PlayerAccount(15);
	theGame.status = "started";
	theGame.save();
	// new playerInGame
	//GAME.addPlayerInGame(ds.PlayerAccount(15), theGame);	
	thePlayer.status = "starting game";
	thePlayer.save();
	
	new ds.PlayerInGame({game:theGame, player:thePlayer, skipNextTurn:false}).save();
	new ds.PlayerInGame({game:theGame, player:ds.PlayerAccount(19), celebrity:theCelebrity, skipNextTurn:false}).save();
 	
	// update playeraccount
//	ds.commit();
} catch(error) {
//	ds.rollBack();
	error;	
}


