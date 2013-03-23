include("scripts/game.js")

guidedModel =// @startlock
{
	Celebrity :
	{
		gameCount :
		{
			onGet:function()
			{// @endlock
				// Add your code here
				return this.playerInCompletedGameCollection.count();
			}// @startlock
		}
	},
	Game :
	{
		entityMethods :
		{// @endlock
			addPlayer:function(player)
			{// @lock
				ds.startTransaction();
				try {
					/*player.status = "starting game";
					player.save();*/
					new ds.PlayerInGame({game:this, player:null, celebrity:null, skipNextTurn:false}).save();
					this.save();
					ds.commit();
				} catch(e) {
					ds.rollBack();	
					throw e;
				}
			}// @startlock
		},
		events :
		{
			onRemove:function()
			{// @endlock
				if (this.players.length > 0) {
					try {
						ds.startTransaction();
						this.players.remove();
						ds.commit();
					} catch(e) {
						var theError = {
							error:5001,
							errorMessage: 'Related players cannot be deleted. ' + e};
						ds.rollback();
						return theError;
					}
				}
			}// @startlock
		}
	},
	PlayerAccountType :
	{
		requiredAuthentication :
		{
			onGet:function()
			{// @endlock
				return (this.accountType === 'internal');
			}// @startlock
		}
	},
	Question :
	{
		answer :
		{
			events :
			{
				onSave:function(attributeName)
				{// @endlock
					if (this.answer !== undefined && this.answer !== null) {
						QUESTION.notifyOfNewAnswer(this.playerInGame.player.ID, this.playerInGame.game.ID, this.ID, this.answer);
					}

				}// @startlock
			}
		},
		events :
		{
			onSave:function()
			{// @endlock
				if (this.playerInGame.player.ID !== undefined && this.playerInGame.player.ID !== null && this.questionAsked!== undefined && this.questionAsked !== null) {
					QUESTION.notifyOfNewQuestion(this.playerInGame.player.ID, this.playerInGame.game.ID, this.ID, this.questionAsked);
				}
			}// @startlock
		}
	},
	PlayerInGame :
	{
		numberOfQuestionsAsked :
		{
			onGet:function()
			{// @endlock
				return  ds.Question.query("playerInGame.ID = " + this.ID).count();
			}// @startlock
		},
		celebrity :
		{
			events :
			{
				onSave:function(attributeName)
				{// @endlock
					if (this.celebrity !== undefined && this.celebrity !== null) {						
						CELEBRITY.notifyOfCelebritySet(this.player.ID, this.game.ID, this.celebrity.Name);
					}
				}// @startlock
			}
		}
	},
	PlayerAccount :
	{
		status :
		{
			events :
			{
				onSet:function(attributeName)
				{// @endlock
/*					paa = new ds.PlayerAccountAudit();
					paa.dbStamp = new Date();
					paa.playerID = this.ID;
					paa.status = this.status;
					paa.playerAccount = this;
					paa.save();
					this.statusAudit.add(paa);	
*/					
					if (this.status === 'connected') {
						this.lastSessionCheckTime = 300;
					} else {
						this.lastSessionCheckTime = 0;
					}					
					PLAYERACCOUNT.notifyAllOpponentsOfStatusChange(this.ID, this.status);
				}// @startlock
			}
		},
		password :
		{
			onGet:function()
			{// @endlock
				return '****';
			},// @startlock
			onSet:function(value)
			{// @endlock
				this.HA1Key = directory.computeHA1(this.ID, value);
			}// @startlock
		},
		entityMethods :
		{// @endlock
			isSessionActive:function()
			{// @lock
				return (this.status === 'connected' && this.lastSessionCheckTime > 0);
			},// @lock
			validatePassword:function(value)
			{// @lock
				return ( (this.accountType !== undefined && this.accountType !== null && this.accountType.requiredAuthentication === false) || this.HA1Key === directory.computeHA1(this.ID, value) );
			}// @startlock
		}
	}
};// @endlock
