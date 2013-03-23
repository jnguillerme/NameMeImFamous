/**

* @author Jino
  
* Handle all the events related to player accounts management

*/
include("scripts/httpRequest.js")

var PLAYERACCOUNT = {};

/**

playerExists
returns "" if the player login or the email doesn't exists in the datastore
*/

PLAYERACCOUNT.playerExists = function(login, email, accountType) 
{
	var error = new Object();
	error.code = 0;
	error.message = "";
	
	if (ds.PlayerAccount.find("login = :1", login) !== null) {
		error.code = 2001;
		error.message = "Login " + login + " already exists";
	} else if ( accountType === "internal" && ds.PlayerAccount.find("email = :1", email)) {
		error.code = 2002;
		error.message = "email " + email + " already registered";
	}
	return error;
}

/**
checkPlayerStatus
Check that the user status is the expected one
*/
	
PLAYERACCOUNT.checkUserStatusBySessionID = function(sessionID, expectedStatus) 
{
	var player = ds.PlayerAccount({ID:sessionID});	
 	return ( (player !== null) && (player.status === expectedStatus));    
}
/**
checkLogin

*/

PLAYERACCOUNT.checkLogin = function(login, password, accountType) 
{
	var player = ds.PlayerAccount({login:login});	

	if ( (player !== null) && (player.validatePassword(password) === true) ) {
		var groups = [];
		switch (player.accessType) {
			case 1: groups=['admin']; break;
			case 2: groups=['player'];break;	
		}
		return player;
	} else {
		// If Player does not exist and is not an internal account, then we create the account
		if (accountType !== 'internal') {
			var error = PLAYERACCOUNT.createAccount(login, password, "", login, accountType);
			if (error.code === 0) {
				return ds.PlayerAccount({login:login});
			}
		}
		return null;
	}
}

PLAYERACCOUNT.createAccount = function(login, password, email, fullName, accountType)
{
	var error = PLAYERACCOUNT.playerExists(login, email, accountType);
		
	if (error.code === 0) {
		try {
			var player = new ds.PlayerAccount();

			player.login = login;
			player.email = email;
			player.password = password;
			player.fullName = fullName;
			
			var pat = ds.PlayerAccountType({accountType: accountType});
			var patID = 1;
			if (pat !== null && pat !== undefined) {
				patID = pat.ID;
			}
			player.accountType = ds.PlayerAccountType(String(patID));
			
			player.status = "not connected";
			player.gameInProgress = null;

			player.accessType = 2; 		// player access
			player.lastSessionCheckTime = 0;
			
			player.save();
			
			PLAYERACCOUNT.createCelebrityGroups(player);
		} catch (e) {
			error.code = 2003;
			error.message = e;
		}
	}
	
	return error;
}

PLAYERACCOUNT.createCelebrityGroups = function(thePlayer)
{
	ds.CelebrityGroup.all().forEach(function(g) { 
		var p = new ds.AvailablePackages({player: thePlayer, celebrityGroup: g, enabled:true});
		p.save();
	});
}

PLAYERACCOUNT.resetPassword = function(login)
{
	var error = new Object();
	error.code = 0;
	error.message = "";
	var player = ds.PlayerAccount({login:login});	
	
	if ( player != null ) { 
		ds.startTransaction;
		try {
			// 1 - Generate a new password
			// generate passsword length from 6 to 10 characters
			var pwdLength = (Math.floor(Math.random() * 10)%6) + 6;
			var newPassword = Math.random().toString(36).slice(-pwdLength);
		
			// 2 - update the database
			player.password = newPassword;
			player.save();
			
			// 3 - send the email
			/// TO DO - get GMAIL smtp / pop details
			require('waf-mail/mail').send(/*smtp*/ 'smtp.live.com', 
    									/*port*/ 587, 
    									/*ssl*/ false, 
    									/*login*/ 'nmif@gmail.com', 
									    /*password*/ 'jigaka#1', 
									    /*from*/ 'admin@nmif.net', 
									    /*to*/ player.email, 
									    /*subject*/ "[Name me I'm famous] Your password has been reset", 
									    /*message*/ 'Your new password is ' + newPassword
									);
			
			error.message = player.email;
			ds.commit();
			
		} catch (e) { 
			error.code = 2005;
			error.message = e;
		}
	} else {
		error.code = 2004;
		error.message = 'No user found for login ' + login + ". Can't reset password";
	}
	
	return error;
}
/**
createPlayerAccount
*/
	
function createPlayerAccount(request, response) 
{
	var error = HTTP_REQUEST.checkRequestIsValid(request, 4);
	var ret = '{"success":"0"}';
 
 	if (error.code !== 0) {
		ret =  '{"success":"0","error":"' + error.code  + '", "errorMessage": "' + error.message + '"}';		
	} else {
	    // get parts from the request object
	    var login = HTTP_REQUEST.getRequestParam(request, 0);
	    var password = HTTP_REQUEST.getRequestParam(request, 1);
	    var email = HTTP_REQUEST.getRequestParam(request, 2);
	    var fullName = HTTP_REQUEST.getRequestParam(request, 3);

		var error = PLAYERACCOUNT.createAccount(login, password, email, fullName, 'internal');
		if (error.code !== 0) {
			ret = '{"success":"' + error.code + '","error":"' + error.message + '"}';
		} else {
			ret = '{"success":"1"}';
		}
	}
	return ret;
}


function loginPlayerAccount(request, response) 
{
	var error = HTTP_REQUEST.checkRequestIsValid(request, 3);
	var retLogin = '{"success":"0"}';
 
 	if (error.code !== 0) {
		retLogin =  '{"success":"0","error":"' + error.code  + '", "errorMessage": "' + error.message + '"}';		
	} else {
	   // get parts from the request object
	    var login = HTTP_REQUEST.getRequestParam(request, 0);
	    var password = HTTP_REQUEST.getRequestParam(request, 1);
		var accountType = HTTP_REQUEST.getRequestParam(request, 2, 'internal');

		console.log("[loginPlayerAccount] New login request from [%s]", login);
		var player = PLAYERACCOUNT.checkLogin(login, password, accountType);
		
		if ( player !== null ) { 
	  	  	// successfull login: check user status
	   	 	if (player.status === "connected") {
				retLogin =  '{"success":"0","error":"1025", "errorMessage": "' + player.login + ' is already connected"}';
	    	} else {
				//update the user status + login audit table
	 			player.status = "connected";
				player.save();
				retLogin = '{"success":"1","ID":' + '"' + player.ID + '","login":"'+player.login+'","fullName":"' + player.fullName+'"}';			
			}
		} else {
			retLogin =  '{"success":"0","error":"1024", "errorMessage": "invalid login"}';
		}
	}
	//response.sendChunkedData(retLogin);
	return retLogin;
}

function logoutPlayerAccount(request, response) 
{
	var error = HTTP_REQUEST.checkRequestIsValid(request, 1);
	var retLogout = '{"success":"0"}';
 
 	if (error.code !== 0) {
		retLogout =  '{"success":"0","error":"' + error.code  + '", "errorMessage": "' + error.message + '"}';		
	} else {
	    // get parts from the request object
	    var sessionID = HTTP_REQUEST.getRequestParam(request, 0);
		console.log("[logoutPlayerAccount] logout request from [%s]", sessionID);

		var player = ds.PlayerAccount({ID:sessionID});	

		var retLogout = '{"success":"0"}';
		
		if ( player != null ) { 
	  	  	// successfull login: check user status
	   	 	if (player.status == "not connected") {
					retLogout =  '{"success":"0","error":"1026", "errorMessage": "' + player.login + ' is not connected"}';
	    	} else {
				//update the user status + login audit table
				GAME.disconnect(sessionID);
				retLogout = '{"success":"1", "login":"' + player.login + '"}';
			}
		} else {
				retLogout =  '{"success":"0","error":"1024", "errorMessage": "invalid ID"}';
		}
	}
	return retLogout;
}


function forgotPassword(request, response) 
{
	var error = HTTP_REQUEST.checkRequestIsValid(request, 1);
	var retForgotPassword = '{"success":"0"}';
 
 	if (error.code !== 0) {
		retForgotPassword =  '{"success":"0","error":"' + error.code  + '", "errorMessage": "' + error.message + '"}';		
	} else {
	    // get parts from the request object
	    var login = HTTP_REQUEST.getRequestParam(request, 0);
		console.log("[forgotPassword] reset password request from [%s]", login);

		var error = PLAYERACCOUNT.resetPassword(login);
		if (error.code !== 0) {
			retForgotPassword = '{"success":"' + error.code + '","error":"' + error.message + '"}';
		} else {
			retForgotPassword  = '{"success":"1", "email":"' + error.message + '"}';
		}
	}
	
	return retForgotPassword;
}

function pingPlayerAccount(request, response) 
{
	var sessionID = request.parts[0].asText;
	var p = ds.PlayerAccount({ID: sessionID});
	if (p !== null) {
		p.lastSessionCheckTime = 300;
	try {
			p.save()	;
		}
	catch(error) {
		console.log("pingPlayerAccount failed for " + sessionID + ". " + error);
		}
	}
	return '{"success":"1"}';
}

PLAYERACCOUNT.updatePlayerStatus = function(sessionID, expectedStatus, updatedStatus)
{
	var player = ds.PlayerAccount({ID:sessionID});
	var error = new Object();	
		
 	if (player == null) {
 		error.code  = "2001";
 		error.message = "Invalid session ID";
 	} else if (expectedStatus !== null && player.status !== expectedStatus) {
 		error.code = "2002";
 		error.message = "Invalid status (" + player.status + ")";
 	} else {
	// user exists and is in the expected status - update its status to 'random game request'
	 	try {
	 		player.status = updatedStatus;
			player.save();				
			error.code = "0";
			error.message = "";
		} catch(e) {
			error.code = "2003";
			error.message= e;	
		}
	}
	
	return error;
}

PLAYERACCOUNT.notifyOpponentOfStatusChange = function(sessionID, gameID, status)
{
	var opponent = GAME.getOpponent(sessionID, gameID, 'start');	
	if (opponent !== undefined && opponent != null) {
		NMIF.notify(opponent.player.ID, 'opponentstatusupdated:' + gameID + ':' + status);
	}
}
PLAYERACCOUNT.notifyAllOpponentsOfStatusChange = function(sessionID, status)
{
	var pigs = ds.PlayerInGame.query("player.ID = " + sessionID + " and game.status =% 'start'").forEach(function(p) { 
		PLAYERACCOUNT.notifyOpponentOfStatusChange(sessionID, p.game.ID, status);
	});
}

PLAYERACCOUNT.getAvailablePackages = function(message)
{
	var sessionID = message.SessionID;
	console.log("[getAvailablePackages] Get available packages for " + sessionID);
	
	ds.AvailablePackages.query("player.ID = " + sessionID).forEach(function(p) {
		NMIF.notify(sessionID, 'newpackage:' + p.celebrityGroup.group + ':' + p.enabled); 
		});
}

PLAYERACCOUNT.updatePackage = function(message)
{
	var sessionID = message.SessionID;
	var groupName = message.Group;
	var enabled = message.Enabled;
	
	console.log("[updatePackage] update package " + group + " to " + enabled + " for " + sessionID);

	var group = ds.AvailablePackages.query('player.ID = ' + sessionID + ' and celebrityGroup.group = "' + groupName + '"')[0];

	if (group != null && group != 'undefined') {
		group.enabled = (enabled == "1");
		group.save();
	}
	
 }