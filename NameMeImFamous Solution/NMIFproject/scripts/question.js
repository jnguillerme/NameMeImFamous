include("scripts/game.js")

var QUESTION = {}

QUESTION.askQuestion = function(message) 
{
	var sessionID = message.SessionID;
	var gameID = message.GameID;
	var questionAsked = message.Question;
	
	try {
		var question = new ds.Question();
		var pig = ds.PlayerInGame.query('player.ID = ' + sessionID + ' and game.ID = ' + gameID);
		if (pig !== null) {
			question.questionAsked = questionAsked;
			question.playerInGame = ds.PlayerInGame(String(pig.ID));
			question.save();
			NMIF.notify(sessionID, 'askquestionack:' + gameID + ':' + question.ID + ':' + questionAsked);
		} else {
			NMIF.notify(sessionID, 'askquestionerror:' + gameID + ':' + 'Opponent not found');
		}	
	} catch(errorMessage) {
		NMIF.notify(sessionID, 'askquestionerror:' + gameID + ':'+ errorMessage);
	}
}

QUESTION.notifyOfNewQuestion = function(fromSessionID, gameID, questionID, question) 
{
	var opponent = GAME.getOpponent(fromSessionID, gameID, 'started');
	if (opponent !== null) {
		NMIF.notify(opponent.player.ID, 'questionasked:' + gameID + ':' + questionID + ':' + question);		
	}
}

QUESTION.answerQuestion = function(message) 
{
	var question = ds.Question(String(message.QuestionID));
	question.answer = message.Answer;
	question.save();
	NMIF.notify(message.SessionID, 'questionansweredack:' + message.GameID);			
}

QUESTION.notifyOfNewAnswer = function(sessionID, gameID, questionID, answer) 
{
	NMIF.notify(sessionID, 'questionanswered:' + gameID + ':' + questionID + ':' + answer);		
}
