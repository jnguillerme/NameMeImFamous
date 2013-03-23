
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var btnNewGame = {};	// @button
	var documentEvent = {};	// @document
// @endregion// @endlock

// eventHandlers// @lock

	btnNewGame.click = function btnNewGame_click (event)// @startlock
	{// @endlock
		var newGame = ds.game.create();
		newGame.status = "pending";
		
		var currentUser = ds.Player.query("name=:1", 
		ds.game.save();
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		btnNewGame.hidden = true;
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("btnNewGame", "click", btnNewGame.click, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
// @endregion
};// @endlock
