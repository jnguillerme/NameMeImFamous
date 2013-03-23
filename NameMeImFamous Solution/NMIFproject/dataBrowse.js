/**

* @author admin

*/
include("scripts/NMIF.js")

/*var hasToken = false;

if (p[0].hasToken != null && p[0].hasToken != undefined) {
	hasToken = (p[0].hasToken == false);				
}

hasToken;
*/

ds.CompletedGame(71).playerInCompletedGameCollection.player; //.celebrity;
//ds.Question.query('playerInGame.ID >= 1520');

/*ds.PlayerAccount.all().forEach(function(p) { p.status = "not connected"; } );
ds.Game.all().remove();
ds.Notification.all().remove();
*/



//ds.Notification.all();
/*function addGroup() {
	var g = ds.CelebrityGroup.query("group = 'divers'");

	ds.Celebrity.query("role = 'divers'").forEach(function(c) { 
		c.group = g[0];
		c.save();
		} );
}

addGroup();
ds.Celebrity.query("role =% 'divers'");
*/
/*ds.startTransaction();
try {
	ds.commit();
} catch(e) {
	ds.rollback();
}
	
*/
/*var m = new ds.Notification();
m.sessionID = 15;
m.message = "questionasked:556:320:est ce un homme?";
m.save();
*/
//ds.PlayerInGame.query("player.ID = 15 and game.status =% 'start'").game.ID;
//GAME.getOpponent(15, 550, 'start');	
/*	
ds.PlayerAccount.all().forEach(function(p) { p.status = "not connected"; } );
ds.Game.all().remove();
*/

//ds.Notification.all().remove();

//ds.Game.query('players.player.ID = 15' );

/*

var g = ds.Game.query('players.player.ID = 15');
g.players.query('player.ID!=15');

var sessionID = 15;
ds.Game.query('players.player.ID = ' + sessionID).forEach(function(g) { 
	console.log(g.ID);
	var opponent = g.players.query('player.ID!=' + sessionID).forEach(function(p) {
		console.log(p.player.login + '/' + p.hasToken + '/' + p.celebrity);
	} );
});
	
//.all(); //query('players.ID = 15');

ds.PlayerInGame.all();
*//*
var p = ds.PlayerInGame(1139);
p.skipNextTurn = true;
p.save();
*/

