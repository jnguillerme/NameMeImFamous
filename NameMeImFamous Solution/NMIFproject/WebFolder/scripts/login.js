
WAF.onAfterInit = function onAfterInit() {// @lock

var sessionID = 0;
var period = 300;
var elapse = 0;

var pingInterval;

$("#tfCelebrityName").hide();

// @region namespaceDeclaration// @startlock
	var btnStartReceivngNotif = {};	// @button
	var btnChooseCelebrity = {};	// @button
	var btnStartRandomGame = {};	// @button
	var btnCreateAccount = {};	// @button
	var btnLogout = {};	// @button
	var documentEvent = {};	// @document
	var btnLogin = {};	// @button
// @endregion// @endlock

// eventHandlers// @lock

	btnStartReceivngNotif.click = function btnStartReceivngNotif_click (event)// @startlock
	{// @endlock
		if ('WebSocket' in window){
			var connection = new WebSocket('ws://Jino-TOSH:8083');
			connection.onopen = function(){
 			  alert('Connection open!');
			}			
			/*connection.onerror = function(error){
 				  alert('Error detected: ' + error);
			}*/
			connection.send('hi mate, how is it doing?');
			connection.onmessage = function(e) { var msg = e.data; alert(msg);};
		} else {
			alert('aaarg.. not websocket support!');
		}
	};// @lock

	btnChooseCelebrity.click = function btnChooseCelebrity_click (event)// @startlock
	{// @endlock
		var celebrityName = $("#tfCelebrityName").val();
		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		
		formData.append('ID', sessionID);
		formData.append('CelebrityName', celebrityName);
		
		xhr.addEventListener("load", function(evt) {
			alert(evt.target.responseText); 
			var retChooseCelebrityName = JSON.parse(evt.target.responseText);
				
			if (retChooseCelebrityName.success === "0" ) {
				alert(retChooseCelebrityName.errorMessage);	
			} else {
				// Will need to find out whether we ask the question first 
				}
			}, false);

		xhr.open('POST', '/newRandomGame', true);
		xhr.send(formData);

	};// @lock

	btnStartRandomGame.click = function btnStartRandomGame_click (event)// @startlock
	{// @endlock
		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		formData.append('ID', sessionID);

		xhr.addEventListener("load", function(evt) {
			alert(evt.target.responseText); 
			var retStartRandomGame = JSON.parse(evt.target.responseText);
				
			if (retStartRandomGame.success === "0" ) {
				alert(retStartRandomGame.errorMessage);	
			} else {
				if (retStartRandomGame.opponentName === 'none') {
					setTimeout( function() { checkRandomGame(); }, 3000);
				} else {
					alert("play against " + retStartRandomGame.opponentName);
					$("#tfCelebrityName").show();										
				}
			}
			}, false);

		xhr.open('POST', '/newRandomGame', true);
		xhr.send(formData);
	};// @lock

	function checkRandomGame()
	{
		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		formData.append('ID', sessionID);

		xhr.addEventListener("load", function(evt) {
			alert(evt.target.responseText); 
			var retStartRandomGame = JSON.parse(evt.target.responseText);
				
			if (retStartRandomGame.success === "0" ) {
				alert(retStartRandomGame.errorMessage);	
			} 
			}, false);

		xhr.open('POST', '/checkRandomGame', true);
		xhr.send(formData);
	};

	btnCreateAccount.click = function btnCreateAccount_click (event)// @startlock
	{// @endlock
		var loginName = $("#tfName").val();
		var email = $("#tfEmail").val();
		var password = $("#tfEnterPassword").val();
		var fullName = $("#tfFullName").val();

		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		
		formData.append('login', loginName);
		formData.append('password', password);
		formData.append('email', email);
		formData.append('fullName', fullName);
		
		xhr.addEventListener("load", function(evt) { 
			var retCreate = JSON.parse(evt.target.responseText);
			
			if (retCreate.success === "0" ) {
				alert(retCreate.error);	
			} else {
				alert('Account ' + loginName + ' successfully created');
				$("#tfName").val("");
				$("#tfEmail").val("");
				$("#tfEnterPassword").val("");
				$("#tfFullName").val("")
			}
		}, false);

		xhr.open('POST', '/createPlayerAccount', true);
		xhr.send(formData);		
	};// @lock

	btnLogout.click = function btnLogout_click (event)// @startlock
	{// @endlock
	
	clearInterval(pingInterval);
		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		formData.append('ID', sessionID);

//		formData.append('login', loginName);
		//formData.append('password', password);
		
		xhr.addEventListener("load", function(evt) { 
			var retLogout = JSON.parse(evt.target.responseText);
			
			if (retLogout.success === "0" ) {
				alert(retLogout.errorMessage);	
			} else {
				//$("#lblLogin").html(WAF.directory.currentUser().fullName);
				$("#lblLogin").hide();
				$("#btnLogout").hide();	
				alert('Bye bye ' + retLogout.login);
			}
			}, false);

		xhr.open('POST', '/logoutPlayerAccount', true);
		xhr.send(formData);
	
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		$("#lblLogin").hide();
		$("#btnLogout").hide();
	};// @lock

	btnLogin.click = function btnLogin_click (event)// @startlock
	{// @endlock
		var loginName = $("#tfLogin").val();
		var password = $("#tfPassword").val();

		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		
		formData.append('login', loginName);
		formData.append('password', password);
		
		xhr.addEventListener("load", function(evt) { 
			var retLogin = JSON.parse(evt.target.responseText);
			
			if (retLogin.success === "0" ) {
				alert(retLogin.errorMessage);	
			} else {
				//$("#lblLogin").html(WAF.directory.currentUser().fullName);
				sessionID = retLogin.ID;
				$("#lblLogin").show();
				$("#btnLogout").show();
				$("#btnStardRandomGame").show();
				alert('Welcome ' + retLogin.login);
				pingInterval = setInterval(pingSession, 5000);
			}
			}, false);

		xhr.open('POST', '/loginPlayerAccount', true);
		xhr.send(formData);
	};// @lock
	
	/**
	  * pingSession
	  * Send a ping message so the session does not time out
	  */
	function pingSession() {
		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		
		formData.append('ID', sessionID);
		
		xhr.addEventListener("load", function(evt) { 
			var retLogin = JSON.parse(evt.target.responseText);
			
			if (retLogin.success === "0" ) {
				alert(retLogin.errorMessage);	
			} 
		}, false);

		xhr.open('POST', '/pingPlayerAccount', true);
		xhr.send(formData);		
	}

	
// @region eventManager// @startlock
	WAF.addListener("btnStartReceivngNotif", "click", btnStartReceivngNotif.click, "WAF");
	WAF.addListener("btnChooseCelebrity", "click", btnChooseCelebrity.click, "WAF");
	WAF.addListener("btnStartRandomGame", "click", btnStartRandomGame.click, "WAF");
	WAF.addListener("btnCreateAccount", "click", btnCreateAccount.click, "WAF");
	WAF.addListener("btnLogout", "click", btnLogout.click, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("btnLogin", "click", btnLogin.click, "WAF");
// @endregion
};// @endlock
